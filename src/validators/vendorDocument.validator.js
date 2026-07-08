import { z } from "zod";

export const createVendorDocumentSchema = z.object({
    vendorId: z.string().min(1),
    documentType: z.enum([
        "TAX_REGISTRATION",
        "INSURANCE",
        "TRADE_LICENSE",
        "SAFETY_CERTIFICATE",
        "AGREEMENT"
    ]),
    documentName: z.string(),
    expiryDate: z.string().optional(),
    verified: z.boolean().optional(),
})

export const updateVendorDocumentSchema = createVendorDocumentSchema.partial();