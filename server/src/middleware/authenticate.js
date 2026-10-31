import { HttpError } from "../utils/http-error.js";
import { verifyAccessToken } from "../modules/auth/tokens.js";
import { findUserById } from "../modules/auth/auth.repository.js";

export async function authenticate(req, res, next) {
  const [scheme, token] = (req.get("Authorization") ?? "").split(" ");
  if (scheme !== "Bearer" || !token)
    throw new HttpError(401, "Authentication required");

  let userId;
  try {
    userId = await verifyAccessToken(token);
  } catch {
    throw new HttpError(401, "Authentication required");
  }

  // checked on every request so deactivation and role changes apply immediately
  const user = await findUserById(userId);
  if (!user || !user.is_active)
    throw new HttpError(401, "Authentication required");

  req.user = {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    role: user.role,
    permissions: user.permissions,
  };
  next();
}
