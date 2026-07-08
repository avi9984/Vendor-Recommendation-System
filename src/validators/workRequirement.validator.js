import { z } from "zod";


export const createWorkRequirementSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    estimatedValue: z.number(),
    location: z.string(),
    category: z.string(),
    priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
    expectedStartDate: z.string().datetime().optional()
});

export const updateWorkRequirementSchema = createWorkRequirementSchema.partial();
