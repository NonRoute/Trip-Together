import { createRoute } from "@hono/zod-openapi";
import { authMiddleware } from "../../middleware/auth";
import { authSchemas } from "./auth";

const tags = ["auth"];

export const register = createRoute({
  method: "post",
  path: "/register",
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: authSchemas.register.openapi({
            type: "object",
            description: "User registration data",
            example: {
              name: "John Doe",
              email: "john@example.com",
              password: "password123",
            },
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: authSchemas.user.openapi({
            type: "object",
            description: "User object",
            example: {
              id: 1,
              name: "John Doe",
              email: "john@example.com",
              createdAt: "2024-01-01T12:00:00Z",
            },
          }),
        },
      },
      description: "User registered successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: authSchemas.error,
        },
      },
      description: "Invalid request data",
    },
    409: {
      content: {
        "application/json": {
          schema: authSchemas.error,
        },
      },
      description: "Email already registered",
    },
    500: {
      content: {
        "application/json": {
          schema: authSchemas.error,
        },
      },
      description: "Internal server error",
    },
  },
});

export const login = createRoute({
  method: "post",
  path: "/login",
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: authSchemas.login,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: authSchemas.tokenResponse,
        },
      },
      description: "Login successful",
    },
    400: {
      content: {
        "application/json": {
          schema: authSchemas.error,
        },
      },
      description: "Invalid request data",
    },
    401: {
      content: {
        "application/json": {
          schema: authSchemas.error,
        },
      },
      description: "Invalid credentials",
    },
  },
});

export const refresh = createRoute({
  method: "post",
  path: "/refresh",
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: authSchemas.refreshToken,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: authSchemas.accessTokenResponse,
        },
      },
      description: "Token refreshed successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: authSchemas.error,
        },
      },
      description: "Invalid request data",
    },
    401: {
      content: {
        "application/json": {
          schema: authSchemas.error,
        },
      },
      description: "Invalid or expired refresh token",
    },
    404: {
      content: {
        "application/json": {
          schema: authSchemas.error,
        },
      },
      description: "User not found",
    },
  },
});

export const logout = createRoute({
  method: "post",
  path: "/logout",
  middleware: [authMiddleware],
  tags,
  security: [
    {
      BearerAuth: [],
    },
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: authSchemas.refreshToken,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: authSchemas.success,
        },
      },
      description: "Logged out successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: authSchemas.error,
        },
      },
      description: "Invalid request data",
    },
  },
});

export const me = createRoute({
  method: "get",
  path: "/me",
  middleware: [authMiddleware],
  tags,
  security: [
    {
      BearerAuth: [],
    },
  ],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: authSchemas.user,
        },
      },
      description: "Current user information",
    },
    401: {
      content: {
        "application/json": {
          schema: authSchemas.error,
        },
      },
      description: "Unauthorized",
    },
    404: {
      content: {
        "application/json": {
          schema: authSchemas.error,
        },
      },
      description: "User not found",
    },
  },
});
