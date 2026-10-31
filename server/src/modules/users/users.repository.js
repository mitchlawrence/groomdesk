const columns = `u.id, u.username, u.full_name, u.phone, u.is_active, u.role_id,
                 r.name AS role, u.created_at`;
const from = "FROM users u JOIN roles r ON r.id = u.role_id";

const columnFor = {
  username: "username",
  fullName: "full_name",
  phone: "phone",
  roleId: "role_id",
};

export async function listUsers(db) {
  const { rows } = await db.query(
    `SELECT ${columns} ${from} ORDER BY u.is_active DESC, lower(u.username)`,
  );
  return rows;
}

export async function findUser(db, id) {
  const { rows } = await db.query(`SELECT ${columns} ${from} WHERE u.id = $1`, [
    id,
  ]);
  return rows[0] ?? null;
}

export async function findRole(db, id) {
  const { rows } = await db.query("SELECT id, name FROM roles WHERE id = $1", [
    id,
  ]);
  return rows[0] ?? null;
}

export async function findPasswordHash(db, id) {
  const { rows } = await db.query(
    "SELECT password_hash FROM users WHERE id = $1",
    [id],
  );
  return rows[0]?.password_hash ?? null;
}

// locks every active admin row until the surrounding transaction ends
export async function lockActiveAdmins(db) {
  const { rows } = await db.query(
    `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
     WHERE r.name = 'admin' AND u.is_active
     ORDER BY u.id FOR UPDATE OF u`,
  );
  return rows.map((row) => row.id);
}

export async function insertUser(
  db,
  { username, fullName, phone, passwordHash, roleId },
) {
  const { rows } = await db.query(
    `INSERT INTO users (username, full_name, phone, password_hash, role_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [username, fullName, phone ?? null, passwordHash, roleId],
  );
  return rows[0].id;
}

export async function updateUser(db, id, fields) {
  const entries = Object.entries(fields).filter(([key]) => key in columnFor);
  if (entries.length === 0) return;
  const assignments = entries.map(
    ([key], i) => `${columnFor[key]} = $${i + 2}`,
  );
  await db.query(
    `UPDATE users SET ${assignments.join(", ")}, updated_at = now() WHERE id = $1`,
    [id, ...entries.map(([, value]) => value)],
  );
}

export function setActive(db, id, isActive) {
  return db.query(
    "UPDATE users SET is_active = $2, updated_at = now() WHERE id = $1",
    [id, isActive],
  );
}

export function setPasswordHash(db, id, passwordHash) {
  return db.query(
    "UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1",
    [id, passwordHash],
  );
}

export function revokeAllTokens(db, userId) {
  return db.query(
    "UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL",
    [userId],
  );
}
