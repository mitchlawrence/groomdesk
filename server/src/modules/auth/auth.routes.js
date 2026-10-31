import { Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../../config/env.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireCsrfHeader } from "../../middleware/require-csrf-header.js";
import { loginSchema } from "./auth.validation.js";
import * as controller from "./auth.controller.js";

// only failed attempts count, so normal use is never blocked
const loginLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MINUTES * 60_000,
  limit: env.AUTH_RATE_LIMIT_MAX,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { message: "Too many attempts, please try again later" } },
});

const router = Router();

router.post(
  "/login",
  requireCsrfHeader,
  loginLimiter,
  validate(loginSchema),
  controller.login,
);
router.post("/refresh", requireCsrfHeader, controller.refresh);
router.post("/logout", requireCsrfHeader, controller.logout);
router.get("/me", authenticate, controller.me);

export default router;
