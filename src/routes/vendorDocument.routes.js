import { Router } from "express";
import * as vendorDocumentCont from "../controllers/vendorDocument.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createVendorDocumentSchema, updateVendorDocumentSchema } from "../validators/vendorDocument.validator.js";
import authMiddleware from "../middlewares/auth.middlewares.js";
import { authorizeRoles, checkDocumentOwnership } from "../middlewares/authorization.middlewares.js";
import { UserRoles } from "../config/constants.js";

const router = Router();

router.use(authMiddleware);
router.post("/", checkDocumentOwnership, validate(createVendorDocumentSchema), vendorDocumentCont.createDocument);
router.get("/:vendorId", checkDocumentOwnership, vendorDocumentCont.getDocument);
router.put("/:id", checkDocumentOwnership, validate(updateVendorDocumentSchema), vendorDocumentCont.updateDocument);
router.delete("/:id", checkDocumentOwnership, vendorDocumentCont.deleteDocument);
router.get("/expired", authorizeRoles(UserRoles.ADMIN), vendorDocumentCont.getExpiredDocuments);

export default router;