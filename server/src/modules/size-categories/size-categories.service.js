import { pool } from "../../db/pool.js";
import { isUniqueViolation } from "../../db/errors.js";
import { HttpError } from "../../utils/http-error.js";
import * as repo from "./size-categories.repository.js";

const NAME_INDEX = "size_categories_name_unique";

const toPublicSize = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  sortOrder: row.sort_order,
  isActive: row.is_active,
});

function rethrowConflict(err) {
  if (isUniqueViolation(err, NAME_INDEX)) {
    throw new HttpError(409, "A size with this name already exists");
  }
  throw err;
}

export async function listSizes() {
  return (await repo.listSizes(pool)).map(toPublicSize);
}

export async function createSize(input) {
  try {
    const id = await repo.insertSize(pool, input);
    return toPublicSize(await repo.findSize(pool, id));
  } catch (err) {
    return rethrowConflict(err);
  }
}

export async function updateSize(id, fields) {
  if (!(await repo.findSize(pool, id)))
    throw new HttpError(404, "Size not found");
  try {
    await repo.updateSize(pool, id, fields);
  } catch (err) {
    rethrowConflict(err);
  }
  return toPublicSize(await repo.findSize(pool, id));
}
