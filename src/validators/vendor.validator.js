import { email, z } from "zod";

export const createVendorSchema = z.object({
    vendorname: z.string().min(3),
    vendorType: z.string().min(2),

    category: z.string().min(2),
    email: z.string().email(),
    location: z.string().min(2),
    rating: z.number().min(0).max(5).optional(),

    status: z.enum([
        "ACTIVE",
        "INACTIVE",
        "SUSPENDED"
    ]).optional()
})

export const updateVendorSchema = createVendorSchema.partial();