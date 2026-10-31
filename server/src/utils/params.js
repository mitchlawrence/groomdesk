import { HttpError } from "./http-error.js";

export function parseId(value) {
  if (!/^\d{1,9}$/.test(value)) throw new HttpError(404, "Not found");
  const id = Number(value);
  if (id < 1) throw new HttpError(404, "Not found");
  return id;
}
