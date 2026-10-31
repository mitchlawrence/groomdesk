import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const failureLimiter = () =>
  rateLimit({
    windowMs: env.AUTH_RATE_LIMIT_WINDOW_MINUTES * 60_000,
    limit: env.AUTH_RATE_LIMIT_MAX,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      error: { message: "Too many attempts, please try again later" },
    },
  });
