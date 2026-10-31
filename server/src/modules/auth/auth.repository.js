import { pool } from "../../db/pool.js";

function selectUser(extraColumns, where) {
  return `
    SELECT u.id, u.username, u.full_name, u.is_active, r.name AS role, ${extraColumns}
           COALESCE(array_agg(p.code ORDER BY p.code) FILTER (WHERE p.code IS NOT NULL), '{}') AS permissions
    FROM users u
    JOIN roles r ON r.id = u.role_id
    LEFT JOIN role_permissions rp ON rp.role_id = r.id
    LEFT JOIN permissions p ON p.id = rp.permission_id
    WHERE ${where}
    GROUP BY u.id, r.id`;
}

export async function findUserByUsername(username) {
  const { rows } = await pool.query(
    selectUser("u.password_hash,", "lower(u.username) = lower($1)"),
    [username],
  );
  return rows[0] ?? null;
}

export async function findUserById(id, db = pool) {
  const { rows } = await db.query(selectUser("", "u.id = $1"), [id]);
  return rows[0] ?? null;
}

export function insertRefreshToken(
  db,
  { userId, familyId, tokenHash, expiresAt },
) {
  return db.query(
    `INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, familyId, tokenHash, expiresAt],
  );
}

export async function consumeRefreshToken(db, tokenHash) {
  const { rows } = await db.query(
    `UPDATE refresh_tokens SET used_at = now()
     WHERE token_hash = $1 AND used_at IS NULL AND revoked_at IS NULL AND expires_at > now()
     RETURNING user_id, family_id`,
    [tokenHash],
  );
  return rows[0] ?? null;
}

export async function findRefreshToken(db, tokenHash) {
  const { rows } = await db.query(
    "SELECT family_id, used_at FROM refresh_tokens WHERE token_hash = $1",
    [tokenHash],
  );
  return rows[0] ?? null;
}

export function revokeFamily(db, familyId) {
  return db.query(
    "UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL",
    [familyId],
  );
}
