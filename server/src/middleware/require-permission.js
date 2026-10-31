import { HttpError } from "../utils/http-error.js";

export const requirePermission = (code) => (req, res, next) => {
  if (!req.user.permissions.includes(code)) {
    return next(new HttpError(403, "You do not have permission to do this"));
  }
  next();
};
