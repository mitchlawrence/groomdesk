import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../../config/env.js";

const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const ISSUER = "groomdesk";

export function signAccessToken(userId) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, secret, {
    issuer: ISSUER,
    algorithms: ["HS256"],
  });
  const userId = Number(payload.sub);
  if (!Number.isInteger(userId)) throw new Error("invalid subject");
  return userId;
}

export const generateRefreshToken = () => randomBytes(32).toString("base64url");

export const hashRefreshToken = (token) =>
  createHash("sha256").update(token).digest("hex");
