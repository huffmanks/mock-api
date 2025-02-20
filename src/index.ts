import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";

import { generator } from "@/generator";
import type { EntityField } from "@/types";

const app = new Hono();

app.get("/assets/*", serveStatic({ root: "./src" }));

app.get("/api/:entity", (c) => {
  const { entity } = c.req.param();

  const generatedEntity = generator(entity);

  if (!generatedEntity) {
    return c.json({ error: "Entity not found" }, 404);
  }

  let { fields, count = 10, idType = "uuid" } = c.req.query();

  if (count === undefined) {
    count = Math.min(generatedEntity.length, 10);
  } else {
    count = Math.min(Math.max(Number(count), 1), generatedEntity.length);
  }

  const items = Array.from({ length: count }, (_, i) => {
    const data = generatedEntity[i % generatedEntity.length];
    const item: EntityField = {};

    if (fields) {
      fields.split(",").forEach((field) => {
        if (field === "id" && idType === "serial") {
          item.id = i + 1;
        } else if (data[field] !== undefined) {
          item[field] = data[field];
        }
      });
    } else {
      Object.assign(item, data);
      if (idType === "serial") {
        item.id = i + 1;
      }
    }

    return item;
  });

  return c.json(items);
});

serve({ fetch: app.fetch, port: 5001 }, (info) => {
  const address = info.address === "::" ? `http://localhost:${info.port}` : info.address;
  console.log(`Server is running on ${address}`);
});
