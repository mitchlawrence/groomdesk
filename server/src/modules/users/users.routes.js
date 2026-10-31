import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requirePermission } from "../../middleware/require-permission.js";
import { failureLimiter } from "../../middleware/failure-limiter.js";
import * as schemas from "./users.validation.js";
import * as controller from "./users.controller.js";

const passwordLimiter = failureLimiter();
const manage = requirePermission("users.manage");

const router = Router();

router.use(authenticate);

router.patch("/me", validate(schemas.updateProfileSchema), controller.updateMe);
router.post(
  "/me/password",
  passwordLimiter,
  validate(schemas.changePasswordSchema),
  controller.changeMyPassword,
);

router.get("/", requirePermission("users.read"), controller.list);
router.post("/", manage, validate(schemas.createUserSchema), controller.create);
router.patch(
  "/:id",
  manage,
  validate(schemas.updateUserSchema),
  controller.update,
);
router.post("/:id/activate", manage, controller.activate);
router.post(
  "/:id/deactivate",
  manage,
  validate(schemas.confirmSchema),
  controller.deactivate,
);
router.post(
  "/:id/reset-password",
  manage,
  validate(schemas.resetPasswordSchema),
  controller.resetPassword,
);

export default router;
