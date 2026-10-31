import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const PARAMS = { N: 2 ** 16, r: 8, p: 2 };
const KEY_LENGTH = 64;
const MAX_MEMORY = 256 * 1024 * 1024;

function derive(password, salt, keyLength, { N, r, p }) {
  return scrypt(password.normalize("NFKC"), salt, keyLength, {
    N,
    r,
    p,
    maxmem: MAX_MEMORY,
  });
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, KEY_LENGTH, PARAMS);
  const { N, r, p } = PARAMS;
  return [
    "scrypt",
    N,
    r,
    p,
    salt.toString("base64"),
    key.toString("base64"),
  ].join("$");
}

export async function verifyPassword(password, stored) {
  const [scheme, N, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "base64");
  const actual = await derive(
    password,
    Buffer.from(salt, "base64"),
    expected.length,
    {
      N: Number(N),
      r: Number(r),
      p: Number(p),
    },
  );

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
