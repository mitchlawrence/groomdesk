import { updateById } from "../../db/update-by-id.js";

const columnFor = {
  name: "name",
  description: "description",
  sortOrder: "sort_order",
  isActive: "is_active",
};

export async function listSizes(db) {
  const { rows } = await db.query(
    "SELECT id, name, description, sort_order, is_active FROM size_categories ORDER BY sort_order, id",
  );
  return rows;
}

export async function findSize(db, id) {
  const { rows } = await db.query(
    "SELECT id, name, description, sort_order, is_active FROM size_categories WHERE id = $1",
    [id],
  );
  return rows[0] ?? null;
}

export async function insertSize(db, { name, description, sortOrder }) {
  const { rows } = await db.query(
    "INSERT INTO size_categories (name, description, sort_order) VALUES ($1, $2, $3) RETURNING id",
    [name, description ?? "", sortOrder ?? 0],
  );
  return rows[0].id;
}

export const updateSize = (db, id, fields) =>
  updateById(db, "size_categories", columnFor, id, fields, false);
