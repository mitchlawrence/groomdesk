import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requirePermission } from "../../middleware/require-permission.js";
import * as controller from "./roles.controller.js";

const router = Router();

router.get("/", authenticate, requirePermission("users.read"), controller.list);

export default router;
