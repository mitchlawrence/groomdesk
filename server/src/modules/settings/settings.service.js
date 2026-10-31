import { pool } from "../../db/pool.js";
import { HttpError } from "../../utils/http-error.js";
import * as repo from "./settings.repository.js";

const toClock = (value) => value.slice(0, 5);

const toPublicSettings = (row) => ({
  shopName: row.shop_name,
  openingTime: toClock(row.opening_time),
  closingTime: toClock(row.closing_time),
  slotMinutes: row.slot_minutes,
  timezone: row.timezone,
  currency: row.currency,
});

export async function getSettings() {
  return toPublicSettings(await repo.getSettings(pool));
}

export async function updateSettings(fields) {
  const current = await repo.getSettings(pool);
  const opening = fields.openingTime ?? toClock(current.opening_time);
  const closing = fields.closingTime ?? toClock(current.closing_time);

  if (closing <= opening)
    throw new HttpError(400, "Closing time must be after opening time");

  await repo.updateSettings(pool, fields);
  return toPublicSettings(await repo.getSettings(pool));
}
