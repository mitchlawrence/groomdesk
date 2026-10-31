export async function listRoles(db) {
  const { rows } = await db.query(
    `SELECT r.id, r.name, r.description, r.is_locked,
            count(rp.permission_id)::int AS permission_count
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     GROUP BY r.id
     ORDER BY r.id`,
  );
  return rows;
}
