import { env } from "../../config/env.js";
import { HttpError } from "../../utils/http-error.js";
import * as authService from "./auth.service.js";

const COOKIE_NAME = "refresh_token";

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "strict",
  path: "/api/auth",
});

function setRefreshCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400_000,
  });
}

export async function login(req, res) {
  const { username, password } = req.body;
  const { accessToken, refreshToken, user } = await authService.login(
    username,
    password,
  );
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
}

export async function refresh(req, res) {
  const presented = req.cookies[COOKIE_NAME];
  if (!presented) throw new HttpError(401, "Session expired");

  try {
    const { accessToken, refreshToken, user } =
      await authService.refresh(presented);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user });
  } catch (err) {
    if (err instanceof HttpError) res.clearCookie(COOKIE_NAME, cookieOptions());
    throw err;
  }
}

export async function logout(req, res) {
  const presented = req.cookies[COOKIE_NAME];
  if (presented) await authService.logout(presented);
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.status(204).end();
}

export function me(req, res) {
  res.json({ user: req.user });
}
