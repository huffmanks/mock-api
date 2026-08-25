import * as fs from "fs";
import * as path from "path";

export type User = {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  userAgent?: string;
  birthDate?: string;
  birthdate?: string;
  ssn?: string;
  role?: string;
  gender: string;
  race: string;
  hairColor: string;
  eyeColor?: string;
  height?: number;
  weight?: number;
  image?: string;
  shirtSize?: string;
  university?: string;
  creditCard?: { number: string; type: string; expire: string; cvv: number };
  address?: { street: string; city: string; state: string; zipCode: string; country: string };
  job?: { company: string; department: string; title: string };
};

export type UserWithHairStyle = User & {
  hairStyle: string;
};

type StyleResult = {
  id: string;
  hairStyle: string;
  hairColor?: string;
};

const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const MODEL_NAME = "gemma4:e4b";
const BATCH_SIZE = 15;

function calculateAge(birthDateStr?: string): number {
  if (!birthDateStr) return 30;
  const birth = new Date(birthDateStr);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return isNaN(age) ? 30 : age;
}

function assembleEnrichedUser(user: User, hairStyle: string, newHairColor?: string): UserWithHairStyle {
  const result: Record<string, any> = {};
  const finalHairColor = newHairColor && newHairColor.trim() !== "" ? newHairColor : user.hairColor;

  for (const key of Object.keys(user)) {
    if (key === "hairColor") {
      result["hairColor"] = finalHairColor;
      result["hairStyle"] = hairStyle.replace(/\.$/, "").trim();
    } else {
      result[key] = (user as Record<string, any>)[key];
    }
  }

  if (!("hairStyle" in result)) {
    result["hairStyle"] = hairStyle.replace(/\.$/, "").trim();
  }

  return result as UserWithHairStyle;
}

function insertHairStyleInOrder(user: User, hairStyle: string): UserWithHairStyle {
  const result: Record<string, any> = {};
  for (const key of Object.keys(user)) {
    result[key] = (user as Record<string, any>)[key];
    if (key === "hairColor") {
      result["hairStyle"] = hairStyle;
    }
  }
  if (!("hairStyle" in result)) {
    result["hairStyle"] = hairStyle;
  }
  return result as UserWithHairStyle;
}

async function getHairStylesFromOllama(usersBatch: User[]): Promise<Record<string, StyleResult>> {
  const batchPromptData = usersBatch.map((u) => ({
    id: u.id,
    gender: u.gender,
    race: u.race,
    hairColor: u.hairColor,
    age: calculateAge(u.birthDate || u.birthdate),
    jobTitle: u.job?.title || "Unknown",
  }));

  const systemPrompt = `You are a realistic hair stylist and demographic consultant.
Analyze each user profile and perform two actions:
1. Generate a realistic "hairStyle" description (under 8 words). Do NOT end the description with a period.
2. Evaluate "hairColor". If the provided color is realistic for the demographic (age, race, gender), keep "hairColor" identical. If unrealistic, provide a corrected natural hair color.

STRICT RULES FOR hairStyle:
- Describe ONLY the cut, length, texture, or arrangement.
- NEVER include color terms in the hairStyle string.`;

  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL_NAME,
      keep_alive: "10m",
      format: {
        type: "object",
        properties: {
          profiles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                hairStyle: { type: "string" },
                hairColor: { type: "string" },
              },
              required: ["id", "hairStyle", "hairColor"],
            },
          },
        },
        required: ["profiles"],
      },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Profiles:\n${JSON.stringify(batchPromptData, null, 2)}`,
        },
      ],
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 2048,
        num_thread: 8,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  const rawText = data.message?.content?.trim() || "";

  const parsed = JSON.parse(rawText);
  const resultsArray: StyleResult[] = parsed.profiles || [];

  const styleMap: Record<string, StyleResult> = {};
  for (const item of resultsArray) {
    if (item?.id && item?.hairStyle) {
      styleMap[item.id] = item;
    }
  }

  return styleMap;
}

// async function processUsers() {
//   console.log(`🚀 Enriching dataset using local model: ${MODEL_NAME}\n`);

//   const inputFile = path.resolve(process.cwd(), "users.json");
//   const outputFile = path.resolve(process.cwd(), "users_enriched.json");

//   if (!fs.existsSync(inputFile)) {
//     console.error(`❌ Input file not found: ${inputFile}`);
//     process.exit(1);
//   }

//   const users: User[] = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
//   console.log(`📂 Loaded ${users.length} users. Processing in batches of ${BATCH_SIZE}...\n`);

//   const enrichedUsers: UserWithHairStyle[] = [];
//   const totalBatches = Math.ceil(users.length / BATCH_SIZE);

//   for (let i = 0; i < users.length; i += BATCH_SIZE) {
//     const batchNum = Math.floor(i / BATCH_SIZE) + 1;
//     const chunk = users.slice(i, i + BATCH_SIZE);

//     console.log(`⏳ Processing batch ${batchNum}/${totalBatches}...`);

//     try {
//       const hairStyleMap = await getHairStylesFromOllama(chunk);

//       for (const user of chunk) {
//         const assignedStyle = hairStyleMap[user.id] || "short neatly parted";
//         enrichedUsers.push(insertHairStyleInOrder(user, assignedStyle));
//         console.log(`   └─ [${user.id}] ${user.gender} | ${user.race} | ${user.hairColor} -> "${assignedStyle}"`);
//       }
//     } catch (err: any) {
//       console.error(`❌ Batch ${batchNum} error: ${err.message}`);
//       for (const user of chunk) {
//         enrichedUsers.push(insertHairStyleInOrder(user, "short neatly parted"));
//       }
//     }
//   }

//   fs.writeFileSync(outputFile, JSON.stringify(enrichedUsers, null, 2));
//   console.log(`\n🎉 Done! Saved enriched output copy to: ${outputFile}`);
// }

async function processUsers() {
  console.log(`🚀 Enriching dataset using local model: ${MODEL_NAME}\n`);

  const inputFile = path.resolve(process.cwd(), "users.json");
  const outputFile = path.resolve(process.cwd(), "users_enriched.json");

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }

  const users: User[] = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
  console.log(`📂 Loaded ${users.length} users. Processing in batches of ${BATCH_SIZE}...\n`);

  const enrichedUsers: UserWithHairStyle[] = [];
  const totalBatches = Math.ceil(users.length / BATCH_SIZE);

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const chunk = users.slice(i, i + BATCH_SIZE);

    console.log(`⏳ Processing batch ${batchNum}/${totalBatches}...`);

    try {
      const resultMap = await getHairStylesFromOllama(chunk);

      for (const user of chunk) {
        const result = resultMap[user.id];
        const assignedStyle = result?.hairStyle || "short neatly parted";
        const assignedColor = result?.hairColor || user.hairColor;

        enrichedUsers.push(assembleEnrichedUser(user, assignedStyle, assignedColor));
        console.log(
          `   └─ [${user.id}] ${user.gender} | ${user.race} | Color: "${assignedColor}" | Style: "${assignedStyle}"`,
        );
      }
    } catch (err: any) {
      console.error(`❌ Batch ${batchNum} error: ${err.message}`);
      for (const user of chunk) {
        enrichedUsers.push(assembleEnrichedUser(user, "short neatly parted", user.hairColor));
      }
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(enrichedUsers, null, 2));
  console.log(`\n🎉 Done! Saved enriched output copy to: ${outputFile}`);
}

processUsers().catch((err) => {
  console.error("\n❌ Fatal Execution Error:", err);
  process.exit(1);
});
