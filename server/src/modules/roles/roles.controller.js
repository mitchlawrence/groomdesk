import { pool } from "../../db/pool.js";
import * as repo from "./roles.repository.js";

export async function list(req, res) {
  const rows = await repo.listRoles(pool);
  res.json({
    roles: rows.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isLocked: role.is_locked,
      permissionCount: role.permission_count,
    })),
  });
}
