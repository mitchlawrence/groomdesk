export function updateById(
  db,
  table,
  columnFor,
  id,
  fields,
  touchUpdatedAt = true,
) {
  const entries = Object.entries(fields).filter(
    ([key, value]) => Object.hasOwn(columnFor, key) && value !== undefined,
  );
  if (entries.length === 0) return Promise.resolve();

  const assignments = entries.map(
    ([key], i) => `${columnFor[key]} = $${i + 2}`,
  );
  if (touchUpdatedAt) assignments.push("updated_at = now()");

  return db.query(
    `UPDATE ${table} SET ${assignments.join(", ")} WHERE id = $1`,
    [id, ...entries.map(([, value]) => value)],
  );
}
