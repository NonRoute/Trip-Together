import { sign, verify } from "jsonwebtoken";
import type { StringValue } from "ms";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access_secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "refresh_secret";

export function generateAccessToken(
  payload: object,
  expiresIn: StringValue = "15m",
) {
  return sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: expiresIn,
  });
}

export function generateRefreshToken(
  payload: object,
  expiresIn: StringValue = "7d",
) {
  return sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: expiresIn });
}

export function verifyAccessToken(token: string) {
  return verify(token, ACCESS_TOKEN_SECRET);
}

export function verifyRefreshToken(token: string) {
  return verify(token, REFRESH_TOKEN_SECRET);
}
