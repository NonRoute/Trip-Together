import { createMiddleware } from "hono/factory";
import { verifyAccessToken } from "../lib/jwt";

// Extend Hono context with custom variables
export type Variables = {
  userId: number;
};

// Authentication middleware
export const authMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Access token required" }, 401);
    }

    const token = authHeader.substring(7);
    try {
      const payload = verifyAccessToken(token) as any;
      c.set("userId", payload.userId);
      await next();
    } catch {
      return c.json({ error: "Invalid access token" }, 401);
    }
  },
);
