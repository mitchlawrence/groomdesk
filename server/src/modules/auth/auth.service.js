import { randomUUID } from "node:crypto";
import { pool } from "../../db/pool.js";
import { env } from "../../config/env.js";
import { HttpError } from "../../utils/http-error.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import * as repo from "./auth.repository.js";
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "./tokens.js";

const DUMMY_HASH = await hashPassword(randomUUID());

const REUSE_GRACE_MS = 10_000;

const refreshExpiry = () =>
  new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);

const toPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.full_name,
  role: user.role,
  permissions: user.permissions,
});

export async function login(username, password) {
  const user = await repo.findUserByUsername(username);
  const valid = await verifyPassword(
    password,
    user ? user.password_hash : DUMMY_HASH,
  );
  if (!user || !user.is_active || !valid) {
    throw new HttpError(401, "Invalid username or password");
  }

  const refreshToken = generateRefreshToken();
  await repo.insertRefreshToken(pool, {
    userId: user.id,
    familyId: randomUUID(),
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: refreshExpiry(),
  });

  return {
    accessToken: await signAccessToken(user.id),
    refreshToken,
    user: toPublicUser(user),
  };
}

export async function refresh(refreshToken) {
  const tokenHash = hashRefreshToken(refreshToken);
  const client = await pool.connect();
  let rotated = null;

  try {
    await client.query("BEGIN");
    const consumed = await repo.consumeRefreshToken(client, tokenHash);
    const user = consumed
      ? await repo.findUserById(consumed.user_id, client)
      : null;

    if (consumed && user?.is_active) {
      const next = generateRefreshToken();
      await repo.insertRefreshToken(client, {
        userId: user.id,
        familyId: consumed.family_id,
        tokenHash: hashRefreshToken(next),
        expiresAt: refreshExpiry(),
      });
      await client.query("COMMIT");
      rotated = { next, user };
    } else {
      await client.query("ROLLBACK");
      // a valid token for a deactivated user ends the whole session chain
      if (consumed) await repo.revokeFamily(pool, consumed.family_id);
    }
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  if (!rotated) {
    await revokeIfReplayed(tokenHash);
    throw new HttpError(401, "Session expired");
  }

  return {
    accessToken: await signAccessToken(rotated.user.id),
    refreshToken: rotated.next,
    user: toPublicUser(rotated.user),
  };
}

export async function logout(refreshToken) {
  const token = await repo.findRefreshToken(
    pool,
    hashRefreshToken(refreshToken),
  );
  if (token) await repo.revokeFamily(pool, token.family_id);
}

async function revokeIfReplayed(tokenHash) {
  const token = await repo.findRefreshToken(pool, tokenHash);
  if (token?.used_at && Date.now() - token.used_at.getTime() > REUSE_GRACE_MS) {
    await repo.revokeFamily(pool, token.family_id);
  }
}
