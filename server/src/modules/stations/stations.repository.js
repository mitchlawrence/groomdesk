import { updateById } from "../../db/update-by-id.js";

const columnFor = { name: "name", isActive: "is_active" };

export async function listStations(db) {
  const { rows } = await db.query(
    "SELECT id, name, is_active FROM stations ORDER BY id",
  );
  return rows;
}

export async function findStation(db, id) {
  const { rows } = await db.query(
    "SELECT id, name, is_active FROM stations WHERE id = $1",
    [id],
  );
  return rows[0] ?? null;
}

export async function insertStation(db, name) {
  const { rows } = await db.query(
    "INSERT INTO stations (name) VALUES ($1) RETURNING id",
    [name],
  );
  return rows[0].id;
}

export const updateStation = (db, id, fields) =>
  updateById(db, "stations", columnFor, id, fields, false);

export async function hasUpcomingAppointments(db, id) {
  const { rows } = await db.query(
    `SELECT EXISTS (
       SELECT 1 FROM appointments
       WHERE station_id = $1 AND status IN ('scheduled', 'in_progress') AND end_at > now()
     ) AS busy`,
    [id],
  );
  return rows[0].busy;
}
