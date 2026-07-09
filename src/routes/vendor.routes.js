import { application, Router } from "express";
import * as vendorController from "../controllers/vendor.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createVendorSchema, updateVendorSchema } from "../validators/vendor.validator.js";
import authMiddleware from "../middlewares/auth.middlewares.js";
import { authorizeRoles } from "../middlewares/authorization.middlewares.js";
import { UserRoles } from "../config/constants.js";

const router = Router();

router.use(authMiddleware);
router.post("/", authorizeRoles(UserRoles.ADMIN), validate(createVendorSchema), vendorController.createVendor);
router.get("/:id", vendorController.getVendorById);
router.put("/:id", validate(updateVendorSchema), vendorController.updateVendor);
router.delete("/:id", authorizeRoles(UserRoles.ADMIN), vendorController.deleteVendor);
router.get("/", vendorController.getAllVendors);

export default router;