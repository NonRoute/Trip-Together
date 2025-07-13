import { createRoute } from "@hono/zod-openapi";
import { authMiddleware } from "../../middleware/auth";
import { authSchemas } from "./auth.schemas";

const tags = ["auth"];

// Register route definition
export const registerRoute = createRoute({
  method: "post",
  path: "/register",
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: authSchemas.register,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: authSchemas.user,
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
  },
});

// Login route definition
export const loginRoute = createRoute({
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

// Refresh route definition
export const refreshRoute = createRoute({
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
  },
});

// Logout route definition
export const logoutRoute = createRoute({
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

// Me route definition (protected)
export const meRoute = createRoute({
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
