import { z } from "@hono/zod-openapi";

// User schema
export const userSchema = z
  .object({
    id: z.number().openapi({
      type: "number",
      description: "User ID",
      example: 1,
    }),
    name: z.string().openapi({
      type: "string",
      description: "User's full name",
      example: "John Doe",
    }),
    email: z.email().openapi({
      type: "string",
      format: "email",
      description: "User's email address",
      example: "john@example.com",
    }),
    createdAt: z.string().optional().openapi({
      type: "string",
      format: "date-time",
      description: "User creation timestamp",
      example: "2024-01-01T12:00:00Z",
    }),
  })
  .openapi({
    type: "object",
    description: "User object",
    example: {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      createdAt: "2024-01-01T12:00:00Z",
    },
  });

// Registration schema
export const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required").openapi({
      type: "string",
      description: "User's full name",
      example: "John Doe",
    }),
    email: z.email("Invalid email format").openapi({
      type: "string",
      format: "email",
      description: "User's email address",
      example: "john@example.com",
    }),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .openapi({
        type: "string",
        minLength: 6,
        description: "User's password (minimum 6 characters)",
        example: "password123",
      }),
  })
  .openapi({
    type: "object",
    description: "User registration data",
    example: {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    },
  });

// Login schema
export const loginSchema = z
  .object({
    email: z.email("Invalid email format").openapi({
      type: "string",
      format: "email",
      description: "User's email address",
      example: "john@example.com",
    }),
    password: z.string().min(1, "Password is required").openapi({
      type: "string",
      description: "User's password",
      example: "password123",
    }),
  })
  .openapi({
    type: "object",
    description: "User login credentials",
    example: {
      email: "john@example.com",
      password: "password123",
    },
  });

// Token response schema
export const tokenResponseSchema = z
  .object({
    accessToken: z.string().openapi({
      type: "string",
      description: "JWT access token",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    }),
    refreshToken: z.string().openapi({
      type: "string",
      description: "JWT refresh token",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    }),
  })
  .openapi({
    type: "object",
    description: "Authentication tokens",
    example: {
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
  });

// Refresh token schema
export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1, "Refresh token is required").openapi({
      type: "string",
      description: "JWT refresh token",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    }),
  })
  .openapi({
    type: "object",
    description: "Refresh token request",
    example: {
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
  });

// Access token response schema
export const accessTokenResponseSchema = z
  .object({
    accessToken: z.string().openapi({
      type: "string",
      description: "New JWT access token",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    }),
  })
  .openapi({
    type: "object",
    description: "New access token response",
    example: {
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
  });

// Common response schemas
export const errorSchema = z
  .object({
    error: z.string().openapi({
      type: "string",
      description: "Error message",
      example: "Invalid credentials",
    }),
  })
  .openapi({
    type: "object",
    description: "Error response",
    example: {
      error: "Invalid credentials",
    },
  });

export const successSchema = z
  .object({
    message: z.string().openapi({
      type: "string",
      description: "Success message",
      example: "Operation completed successfully",
    }),
  })
  .openapi({
    type: "object",
    description: "Success response",
    example: {
      message: "Operation completed successfully",
    },
  });

export const authSchemas = {
  user: userSchema,
  register: registerSchema,
  login: loginSchema,
  tokenResponse: tokenResponseSchema,
  refreshToken: refreshTokenSchema,
  accessTokenResponse: accessTokenResponseSchema,
  error: errorSchema,
  success: successSchema,
};
