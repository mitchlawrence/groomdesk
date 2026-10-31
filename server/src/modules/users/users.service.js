import { pool } from "../../db/pool.js";
import { withTransaction } from "../../db/transaction.js";
import { isUniqueViolation } from "../../db/errors.js";
import { HttpError } from "../../utils/http-error.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import * as repo from "./users.repository.js";

const USERNAME_INDEX = "users_username_unique";

const toPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.full_name,
  phone: user.phone,
  roleId: user.role_id,
  role: user.role,
  isActive: user.is_active,
  createdAt: user.created_at,
});

const confirmationRequired = (message) =>
  new HttpError(409, message, { code: "CONFIRMATION_REQUIRED" });

const lastAdminError = () =>
  new HttpError(409, "The system must keep at least one active admin");

const withoutUndefined = (object) =>
  Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined),
  );

async function getUser(db, id) {
  const user = await repo.findUser(db, id);
  if (!user) throw new HttpError(404, "User not found");
  return user;
}

function rethrowUsernameConflict(err) {
  if (isUniqueViolation(err, USERNAME_INDEX)) {
    throw new HttpError(409, "Username is already taken");
  }
  throw err;
}

export async function listUsers() {
  return (await repo.listUsers(pool)).map(toPublicUser);
}

export async function createUser({
  username,
  fullName,
  phone,
  password,
  roleId,
}) {
  if (!(await repo.findRole(pool, roleId)))
    throw new HttpError(400, "Role does not exist");
  const passwordHash = await hashPassword(password);
  try {
    const id = await repo.insertUser(pool, {
      username,
      fullName,
      phone,
      passwordHash,
      roleId,
    });
    return toPublicUser(await repo.findUser(pool, id));
  } catch (err) {
    return rethrowUsernameConflict(err);
  }
}

export function updateUser(
  actorId,
  targetId,
  { fullName, phone, roleId, confirm },
) {
  return withTransaction(async (db) => {
    const admins = await repo.lockActiveAdmins(db);
    const target = await getUser(db, targetId);

    if (roleId !== undefined && roleId !== target.role_id) {
      const newRole = await repo.findRole(db, roleId);
      if (!newRole) throw new HttpError(400, "Role does not exist");

      const losesAdmin = target.role === "admin" && newRole.name !== "admin";
      if (losesAdmin) {
        if (targetId === actorId)
          throw new HttpError(409, "You cannot change your own role");
        if (target.is_active && admins.length <= 1) throw lastAdminError();
        if (!confirm) {
          throw confirmationRequired(
            "This user is an admin. Confirm to remove their admin role.",
          );
        }
      }
    }

    await repo.updateUser(
      db,
      targetId,
      withoutUndefined({ fullName, phone, roleId }),
    );
    return toPublicUser(await repo.findUser(db, targetId));
  });
}

export async function activateUser(targetId) {
  await getUser(pool, targetId);
  await repo.setActive(pool, targetId, true);
  return toPublicUser(await repo.findUser(pool, targetId));
}

export function deactivateUser(actorId, targetId, confirm) {
  return withTransaction(async (db) => {
    const admins = await repo.lockActiveAdmins(db);
    const target = await getUser(db, targetId);
    if (!target.is_active) return toPublicUser(target);

    if (targetId === actorId)
      throw new HttpError(409, "You cannot deactivate your own account");
    if (target.role === "admin") {
      if (admins.length <= 1) throw lastAdminError();
      if (!confirm) {
        throw confirmationRequired(
          "This user is an admin. Confirm to deactivate their account.",
        );
      }
    }

    await repo.setActive(db, targetId, false);
    await repo.revokeAllTokens(db, targetId);
    return toPublicUser(await repo.findUser(db, targetId));
  });
}

export async function resetPassword(actorId, targetId, password) {
  if (targetId === actorId) {
    throw new HttpError(
      400,
      "Use the change password option for your own account",
    );
  }
  await getUser(pool, targetId);
  const passwordHash = await hashPassword(password);
  await withTransaction(async (db) => {
    await repo.setPasswordHash(db, targetId, passwordHash);
    await repo.revokeAllTokens(db, targetId);
  });
}

export async function updateOwnProfile(userId, { username, phone }) {
  try {
    await repo.updateUser(pool, userId, withoutUndefined({ username, phone }));
  } catch (err) {
    rethrowUsernameConflict(err);
  }
  return toPublicUser(await getUser(pool, userId));
}

export async function changeOwnPassword(
  userId,
  { currentPassword, newPassword },
) {
  const stored = await repo.findPasswordHash(pool, userId);
  if (!stored || !(await verifyPassword(currentPassword, stored))) {
    throw new HttpError(400, "Current password is incorrect");
  }
  const passwordHash = await hashPassword(newPassword);
  await withTransaction(async (db) => {
    await repo.setPasswordHash(db, userId, passwordHash);
    await repo.revokeAllTokens(db, userId);
  });
}
