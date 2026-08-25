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
};

const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const MODEL_NAME = "qwen3.5:4b";
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

async function getHairStylesFromOllama(usersBatch: User[]): Promise<Record<string, string>> {
  const batchPromptData = usersBatch.map((u) => ({
    id: u.id,
    gender: u.gender,
    race: u.race,
    hairColor: u.hairColor,
    age: calculateAge(u.birthDate || u.birthdate),
    jobTitle: u.job?.title || "Unknown",
  }));

  const systemPrompt = `You are a realistic hair stylist and demographic consultant.
Analyze each user profile and generate a realistic hairStyle description under 8 words.
CRITICAL: Describe ONLY the cut, length, texture, or arrangement. NEVER include any hair color words (e.g., brown, blonde, black, red, gray, salt-and-pepper).

Return a JSON object containing a "styles" array with objects having "id" and "hairStyle" properties.`;

  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Profiles:\n${JSON.stringify(batchPromptData, null, 2)}`,
        },
      ],
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 4096,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  let rawText = data.message?.content?.trim() || "";

  rawText = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  const arrayMatch = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (!arrayMatch) {
    console.error("\n⚠️ [DEBUG] Raw output from model:\n", data.message?.content);
    throw new Error("Could not locate a valid JSON array in model output.");
  }

  const parsedResults: StyleResult[] = JSON.parse(arrayMatch[0]);
  const styleMap: Record<string, string> = {};

  if (Array.isArray(parsedResults)) {
    for (const item of parsedResults) {
      if (item?.id && item?.hairStyle) {
        styleMap[item.id] = item.hairStyle;
      }
    }
  }

  return styleMap;
}

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
      const hairStyleMap = await getHairStylesFromOllama(chunk);

      for (const user of chunk) {
        const assignedStyle = hairStyleMap[user.id] || "short neatly parted";
        enrichedUsers.push(insertHairStyleInOrder(user, assignedStyle));
        console.log(`   └─ [${user.id}] ${user.gender} | ${user.race} | ${user.hairColor} -> "${assignedStyle}"`);
      }
    } catch (err: any) {
      console.error(`❌ Batch ${batchNum} error: ${err.message}`);
      for (const user of chunk) {
        enrichedUsers.push(insertHairStyleInOrder(user, "short neatly parted"));
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
