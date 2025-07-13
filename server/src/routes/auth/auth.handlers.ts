import { eq } from "drizzle-orm";
import { db } from "../../db/connection";
import { refreshTokensTable, usersTable } from "../../db/schema";
import {
  findUserByEmail,
  findUserById,
  hashPassword,
  verifyPassword,
} from "../../lib/auth";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt";

// Handler for user registration
export const registerHandler = async (c: any) => {
  const { name, email, password } = c.req.valid("json");

  const existing = await findUserByEmail(email);
  if (existing) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const hashed = hashPassword(password);
  const [user] = await db
    .insert(usersTable)
    .values({ name, email, password: hashed })
    .returning();

  if (!user) {
    return c.json({ error: "Failed to register" }, 500);
  }

  return c.json(
    {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    201,
  );
};

// Handler for user login
export const loginHandler = async (c: any) => {
  const { email, password } = c.req.valid("json");

  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user.password)) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const accessToken = generateAccessToken({ userId: user.id });
  const refreshToken = generateRefreshToken({ userId: user.id });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(refreshTokensTable).values({
    userId: user.id,
    token: refreshToken,
    expiresAt,
  });

  return c.json({ accessToken, refreshToken });
};

// Handler for token refresh
export const refreshHandler = async (c: any) => {
  const { refreshToken } = c.req.valid("json");

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken) as any;
  } catch {
    return c.json({ error: "Invalid refresh token" }, 401);
  }

  const tokenRow = await db
    .select()
    .from(refreshTokensTable)
    .where(eq(refreshTokensTable.token, refreshToken))
    .limit(1);

  if (!tokenRow.length || !tokenRow[0] || tokenRow[0].expiresAt < new Date()) {
    return c.json({ error: "Refresh token expired or not found" }, 401);
  }

  const user = await findUserById(payload.userId);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const newAccessToken = generateAccessToken({ userId: user.id });
  return c.json({ accessToken: newAccessToken });
};

// Handler for user logout
export const logoutHandler = async (c: any) => {
  const { refreshToken } = c.req.valid("json");

  await db
    .delete(refreshTokensTable)
    .where(eq(refreshTokensTable.token, refreshToken));
  return c.json({ message: "Logged out" });
};

// Handler for getting current user
export const meHandler = async (c: any) => {
  const userId = c.var.userId;
  const user = await findUserById(userId);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  });
};

// Export all handlers as a group
export const authHandlers = {
  register: registerHandler,
  login: loginHandler,
  refresh: refreshHandler,
  logout: logoutHandler,
  me: meHandler,
};
