import { email, z } from "zod";

export const registerSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6).max(20),
    role: z.enum(["USER", "VENDOR", "ADMIN"]).default("USER")
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
})