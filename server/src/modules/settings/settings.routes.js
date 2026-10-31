import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requirePermission } from "../../middleware/require-permission.js";
import { updateSettingsSchema } from "./settings.validation.js";
import * as controller from "./settings.controller.js";

const router = Router();

router.use(authenticate);
router.get("/", requirePermission("settings.read"), controller.get);
router.patch(
  "/",
  requirePermission("settings.manage"),
  validate(updateSettingsSchema),
  controller.update,
);

export default router;
