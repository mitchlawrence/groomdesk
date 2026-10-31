import { HttpError } from "../utils/http-error.js";

export function requireCsrfHeader(req, res, next) {
  if (req.get("X-Requested-With") !== "groomdesk") {
    return next(new HttpError(403, "Forbidden"));
  }
  next();
}
