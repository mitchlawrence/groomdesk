import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requirePermission } from "../../middleware/require-permission.js";
import * as schemas from "./size-categories.validation.js";
import * as controller from "./size-categories.controller.js";

const manage = requirePermission("services.manage");

const router = Router();

router.use(authenticate);
router.get("/", requirePermission("services.read"), controller.list);
router.post("/", manage, validate(schemas.createSizeSchema), controller.create);
router.patch(
  "/:id",
  manage,
  validate(schemas.updateSizeSchema),
  controller.update,
);

export default router;
