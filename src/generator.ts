import { productsData } from "@/entities/products";
import { usersData } from "@/entities/users";
import type { Entity } from "@/types";

export function generator(entity: string) {
  const entities = {
    users: () => usersData,
    products: () => productsData,
  };

  if (entity in entities) {
    return entities[entity as Entity]();
  }

  return null;
}
