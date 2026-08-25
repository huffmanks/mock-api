import type { Context } from "hono";

import { productsData } from "@/entities/products";
import { usersData } from "@/entities/users";
import type { Entity, EntityField, Product, User } from "@/types";

const entities: Record<Entity, Array<User> | Array<Product>> = {
  users: usersData,
  products: productsData,
};

function generator(entity: Entity) {
  return entities[entity] ?? null;
}

export function handleEntityRequest(c: Context, entity: Entity) {
  const generatedEntity = generator(entity);

  if (!generatedEntity) {
    return c.json({ error: "Not Found", message: `Entity '${entity}' does not exist` }, 404);
  }

  const query = c.req.query();
  let validQuery: Record<string, unknown> = {};
  try {
    validQuery = c.req.valid("query" as never) ?? {};
  } catch {
    validQuery = query;
  }

  const fieldsParam = (validQuery.fields ?? query.fields) as string | string[] | undefined;
  const idTypeParam = (validQuery.idType ?? query.idType ?? query.idtype ?? "uuid") as string;
  const rawCount = (validQuery.count ?? query.count) as string | number | undefined;

  let count: number;
  if (rawCount === undefined) {
    count = Math.min(generatedEntity.length, 10);
  } else {
    const parsedCount = Number(rawCount);
    if (Number.isNaN(parsedCount)) {
      return c.json({ error: "Bad Request", message: "'count' parameter must be a valid number" }, 400);
    }
    count = Math.min(Math.max(parsedCount, 1), generatedEntity.length);
  }

  const requestedFields: string[] = fieldsParam
    ? Array.isArray(fieldsParam)
      ? fieldsParam
      : fieldsParam.split(",").map((f) => f.trim())
    : [];

  const items: EntityField[] = Array.from({ length: count }, (_, i) => {
    const data = generatedEntity[i % generatedEntity.length] as EntityField;
    const item: EntityField = {};

    if (requestedFields.length > 0) {
      requestedFields.forEach((field) => {
        if (field === "id") {
          item.id = idTypeParam === "serial" ? i + 1 : data.id;
        } else if (field in data) {
          item[field] = data[field];
        }
      });
    } else {
      Object.assign(item, data);
      if (idTypeParam === "serial") {
        item.id = i + 1;
      }
    }

    return item;
  });

  return c.json(items, 200);
}
