import { Router } from "express";
import * as controller from "../controllers/workRequirement.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createWorkRequirementSchema, updateWorkRequirementSchema } from "../validators/workRequirement.validator.js";
import authMiddleware from "../middlewares/auth.middlewares.js";
import { authorizeRoles } from "../middlewares/authorization.middlewares.js";
import { UserRoles } from "../config/constants.js";

const router = Router();

router.use(authMiddleware);
router.post("/", authorizeRoles(UserRoles.USER, UserRoles.ADMIN), validate(createWorkRequirementSchema), controller.createWorkRequirement)

router.get("/", controller.getAllWorkRequirements)

router.get("/:id", controller.getWorkRequirementById)

router.put("/:id", authorizeRoles(UserRoles.USER, UserRoles.ADMIN), validate(updateWorkRequirementSchema), controller.updateWorkRequirement)

router.delete("/:id", authorizeRoles(UserRoles.USER, UserRoles.ADMIN), controller.deleteWorkRequirement)

router.get("/:id/recommendations", controller.getRecommendedVendor)

export default router