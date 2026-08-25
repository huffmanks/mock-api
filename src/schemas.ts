import { z } from "@hono/zod-openapi";

import { PRODUCT_FIELDS, USER_FIELDS } from "@/constants";

export const UserRoleSchema = z.enum(["admin", "manager", "member", "guest"]);

export const UserSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    firstName: z.string(),
    lastName: z.string(),
    username: z.string(),
    email: z.email(),
    phoneNumber: z.string(),
    userAgent: z.string(),
    birthDate: z.string(),
    ssn: z.string(),
    role: UserRoleSchema,
    gender: z.string(),
    race: z.string(),
    hairColor: z.string(),
    hairStyle: z.string(),
    eyeColor: z.string(),
    height: z.number(),
    weight: z.number(),
    image: z.string().url(),
    shirtSize: z.string(),
    university: z.string(),
    creditCard: z.object({
      number: z.string(),
      type: z.string(),
      expire: z.string(),
      cvv: z.number(),
    }),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      country: z.string(),
    }),
    job: z.object({
      company: z.string(),
      department: z.string(),
      title: z.string(),
    }),
  })
  .openapi("User");

export const ProductSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    category: z.enum(["desktop", "headphone", "laptop", "phone", "speaker", "tablet", "tv", "watch"]),
    price: z.number(),
    quantity: z.number(),
    brand: z.string(),
    sku: z.string(),
    macAddress: z.string(),
    serialNumber: z.string(),
    weight: z.number(),
    dimensions: z.object({
      width: z.number(),
      height: z.number(),
      depth: z.number(),
    }),
    releaseDate: z.string(),
    warranty: z.number().nullable(),
    barcode: z.string(),
    images: z.object({
      landscape: z.object({ png: z.string(), webp: z.string() }),
      square: z.object({ png: z.string(), webp: z.string() }),
    }),
  })
  .openapi("Product");

export const ErrorSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
    details: z.array(z.any()).optional(),
  })
  .openapi("ErrorResponse");

export const CommonQuerySchema = {
  count: z
    .string()
    .optional()
    .openapi({
      param: { name: "count", in: "query" },
      type: "integer",
      default: 10,
      description: "Number of items to return",
      example: "5",
    }),
  idType: z
    .enum(["uuid", "serial"])
    .optional()
    .openapi({
      param: { name: "idType", in: "query" },
      default: "uuid",
      description: "Format of the returned ID ('uuid' or incremental integer 'serial')",
      example: "serial",
    }),
};

export const UsersQuerySchema = z.object({
  ...CommonQuerySchema,
  fields: z
    .preprocess(
      (val) => {
        if (typeof val === "string") return val.split(",").map((s) => s.trim());
        return val;
      },
      z.array(z.enum(USER_FIELDS)),
    )
    .optional()
    .openapi({
      param: {
        name: "fields",
        in: "query",
        style: "form",
        explode: false,
      },
      description: "Select User properties to return.",
      uniqueItems: true,
    }),
});

export const ProductsQuerySchema = z.object({
  ...CommonQuerySchema,
  fields: z
    .preprocess(
      (val) => {
        if (typeof val === "string") return val.split(",").map((s) => s.trim());
        return val;
      },
      z.array(z.enum(PRODUCT_FIELDS)),
    )
    .optional()
    .openapi({
      param: {
        name: "fields",
        in: "query",
        style: "form",
        explode: false,
      },
      description: "Select Product properties to return.",
      uniqueItems: true,
    }),
});
