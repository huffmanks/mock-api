import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";

import { ErrorSchema, ProductSchema, ProductsQuerySchema, UserSchema, UsersQuerySchema } from "@/schemas";
import { handleEntityRequest } from "@/utils";

const app = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "Bad Request",
          message: "Validation failed",
          details: result.error.issues,
        },
        400,
      );
    }
  },
});

app.onError((err, c) => {
  console.error("Server Error:", err);
  return c.json(
    {
      error: "Internal Server Error",
      message: err.message || "An unexpected error occurred",
    },
    500,
  );
});

app.get("/assets/*", serveStatic({ root: "./src" }));

const getUsersRoute = createRoute({
  method: "get",
  path: "/api/users",
  request: { query: UsersQuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: z.array(UserSchema) } },
      description: "List of generated users",
    },
    400: { content: { "application/json": { schema: ErrorSchema } }, description: "Bad Request" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not Found" },
    500: { content: { "application/json": { schema: ErrorSchema } }, description: "Internal Server Error" },
  },
});

const getProductsRoute = createRoute({
  method: "get",
  path: "/api/products",
  request: { query: ProductsQuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: z.array(ProductSchema) } },
      description: "List of generated products",
    },
    400: { content: { "application/json": { schema: ErrorSchema } }, description: "Bad Request" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not Found" },
    500: { content: { "application/json": { schema: ErrorSchema } }, description: "Internal Server Error" },
  },
});

app.openapi(getUsersRoute, (c) => handleEntityRequest(c, "users"));
app.openapi(getProductsRoute, (c) => handleEntityRequest(c, "products"));

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "Mock API",
    version: "1.0.0",
    description: "Dynamic Mock API with custom field filtering and ID generation.",
  },
});

app.get(
  "/docs",
  Scalar({
    url: "/doc",
    pageTitle: "Mock API Reference",
    theme: "alternate",
    customCss: `
      .scalar-app-download,
      .scalar-footer-author,
      a[href*="scalar.com"] {
        display: none !important;
      }
    `,
  }),
);

serve({ fetch: app.fetch, port: 5001 }, (info) => {
  const address = info.address === "::" ? `http://localhost:${info.port}` : info.address;
  console.log(`Server is running on ${address}`);
  console.log(`Docs available at ${address}/docs`);
});
