import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireCsrfHeader } from "../../middleware/require-csrf-header.js";
import { failureLimiter } from "../../middleware/failure-limiter.js";
import { loginSchema } from "./auth.validation.js";
import * as controller from "./auth.controller.js";

const loginLimiter = failureLimiter();

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
