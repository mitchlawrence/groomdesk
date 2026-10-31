import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requirePermission } from "../../middleware/require-permission.js";
import * as schemas from "./stations.validation.js";
import * as controller from "./stations.controller.js";

const manage = requirePermission("stations.manage");

const router = Router();

router.use(authenticate);
router.get("/", requirePermission("settings.read"), controller.list);
router.post(
  "/",
  manage,
  validate(schemas.createStationSchema),
  controller.create,
);
router.patch(
  "/:id",
  manage,
  validate(schemas.updateStationSchema),
  controller.update,
);

export default router;
