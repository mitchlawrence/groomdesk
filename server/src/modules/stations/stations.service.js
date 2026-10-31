import { pool } from "../../db/pool.js";
import { isUniqueViolation } from "../../db/errors.js";
import { HttpError } from "../../utils/http-error.js";
import * as repo from "./stations.repository.js";

const NAME_INDEX = "stations_name_unique";

const toPublicStation = (row) => ({
  id: row.id,
  name: row.name,
  isActive: row.is_active,
});

function rethrowConflict(err) {
  if (isUniqueViolation(err, NAME_INDEX)) {
    throw new HttpError(409, "A station with this name already exists");
  }
  throw err;
}

export async function listStations() {
  return (await repo.listStations(pool)).map(toPublicStation);
}

export async function createStation({ name }) {
  try {
    const id = await repo.insertStation(pool, name);
    return toPublicStation(await repo.findStation(pool, id));
  } catch (err) {
    return rethrowConflict(err);
  }
}

export async function updateStation(id, fields) {
  const station = await repo.findStation(pool, id);
  if (!station) throw new HttpError(404, "Station not found");

  if (
    fields.isActive === false &&
    station.is_active &&
    (await repo.hasUpcomingAppointments(pool, id))
  ) {
    throw new HttpError(
      409,
      "This station has upcoming appointments. Move or cancel them first.",
    );
  }

  try {
    await repo.updateStation(pool, id, fields);
  } catch (err) {
    rethrowConflict(err);
  }
  return toPublicStation(await repo.findStation(pool, id));
}
