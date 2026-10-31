import { pool } from "../../db/pool.js";
import { withTransaction } from "../../db/transaction.js";
import { isUniqueViolation } from "../../db/errors.js";
import { HttpError } from "../../utils/http-error.js";
import * as repo from "./services.repository.js";

const NAME_INDEX = "services_name_unique";
const FOREIGN_KEY_VIOLATION = "23503";

const toPublicService = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  category: row.category,
  appliesTo: row.applies_to,
  isActive: row.is_active,
  prices: row.prices,
});

function rethrowKnown(err) {
  if (isUniqueViolation(err, NAME_INDEX)) {
    throw new HttpError(409, "A service with this name already exists");
  }
  if (err.code === FOREIGN_KEY_VIOLATION)
    throw new HttpError(400, "Unknown size category");
  throw err;
}

async function getService(db, id) {
  const [row] = await repo.listServices(db, id);
  if (!row) throw new HttpError(404, "Service not found");
  return row;
}

export async function listServices() {
  return (await repo.listServices(pool)).map(toPublicService);
}

export function createService({ prices, ...fields }) {
  return withTransaction(async (db) => {
    try {
      const id = await repo.insertService(db, fields);
      await repo.replacePrices(db, id, prices);
      return toPublicService(await getService(db, id));
    } catch (err) {
      return rethrowKnown(err);
    }
  });
}

export async function updateService(id, fields) {
  await getService(pool, id);
  try {
    await repo.updateService(pool, id, fields);
  } catch (err) {
    rethrowKnown(err);
  }
  return toPublicService(await getService(pool, id));
}

export function setPrices(id, prices) {
  return withTransaction(async (db) => {
    await getService(db, id);
    try {
      await repo.replacePrices(db, id, prices);
    } catch (err) {
      rethrowKnown(err);
    }
    return toPublicService(await getService(db, id));
  });
}
