import { Router } from "express";
import * as vendorDocumentCont from "../controllers/vendorDocument.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createVendorDocumentSchema, updateVendorDocumentSchema } from "../validators/vendorDocument.validator.js";
import authMiddleware from "../middlewares/auth.middlewares.js";

const router = Router();

router.use(authMiddleware);
router.post("/", validate(createVendorDocumentSchema), vendorDocumentCont.createDocument);
router.get("/", vendorDocumentCont.getDocument);
router.put("/:id", validate(updateVendorDocumentSchema), vendorDocumentCont.updateDocument);
router.put("/", validate(updateVendorDocumentSchema), vendorDocumentCont.updateDocument);
router.delete("/:id", vendorDocumentCont.deleteDocument);
router.get("/expired", vendorDocumentCont.getExpiredDocuments);

export default router;