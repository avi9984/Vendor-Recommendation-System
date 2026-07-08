import { Router } from "express";
import * as controller from "../controllers/workRequirement.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createWorkRequirementSchema, updateWorkRequirementSchema } from "../validators/workRequirement.validator.js";

const router = Router();

router.post("/", validate(createWorkRequirementSchema), controller.createWorkRequirement)

router.get("/", controller.getAllWorkRequirements)

router.get("/:id", controller.getWorkRequirementById)

router.put("/:id", validate(updateWorkRequirementSchema), controller.updateWorkRequirement)

router.delete("/:id", controller.deleteWorkRequirement)

router.get("/:id/recommendations", controller.getRecommendedVendor)

export default router