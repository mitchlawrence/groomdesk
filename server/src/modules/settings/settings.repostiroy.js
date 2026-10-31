import { updateById } from "../../db/update-by-id.js";

const columnFor = {
  shopName: "shop_name",
  openingTime: "opening_time",
  closingTime: "closing_time",
  slotMinutes: "slot_minutes",
};

export async function getSettings(db) {
  const { rows } = await db.query(
    `SELECT shop_name, opening_time, closing_time, slot_minutes, timezone, currency
     FROM shop_settings WHERE id = 1`,
  );
  return rows[0];
}

export const updateSettings = (db, fields) =>
  updateById(db, "shop_settings", columnFor, 1, fields);
