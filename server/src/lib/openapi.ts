import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

// Create OpenAPI-enabled Hono app
export const createOpenAPIApp = () => {
  const app = new OpenAPIHono();

  // Register security schemes
  app.openAPIRegistry.registerComponent("securitySchemes", "BearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Enter your JWT token in the format: Bearer <token>",
  });

  // Add OpenAPI documentation endpoint
  app.doc("/openapi", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Trip Together API",
      description: "API documentation for Trip Together application",
    },
    servers: [
      {
        url: "http://localhost:8000",
        description: "Development server",
      },
    ],
  });

  // Add Swagger UI
  app.get("/docs", swaggerUI({ url: "/openapi" }));

  return app;
};

// Common response schemas
export const errorSchema = z.object({
  error: z.string(),
});

export const successSchema = z.object({
  message: z.string(),
});

// Security schemes
export const bearerAuth = {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
} as const;
