import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requirePermission } from "../../middleware/require-permission.js";
import * as schemas from "./services.validation.js";
import * as controller from "./services.controller.js";

const manage = requirePermission("services.manage");

const router = Router();

router.use(authenticate);
router.get("/", requirePermission("services.read"), controller.list);
router.post(
  "/",
  manage,
  validate(schemas.createServiceSchema),
  controller.create,
);
router.patch(
  "/:id",
  manage,
  validate(schemas.updateServiceSchema),
  controller.update,
);
router.put(
  "/:id/prices",
  manage,
  validate(schemas.setPricesSchema),
  controller.setPrices,
);

export default router;
