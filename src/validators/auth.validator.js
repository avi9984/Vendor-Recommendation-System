import { z } from "zod";

// Password regex requiring uppercase, lowercase, digit, and special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;

export const registerSchema = z.object({
    name: z.string()
        .trim()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name must not exceed 100 characters"),
    email: z.string()
        .trim()
        .toLowerCase()
        .email("Invalid email format"),
    password: z.string()
        .min(8, "Password must be at least 8 characters long")
        .max(32, "Password must not exceed 32 characters")
        .regex(
            passwordRegex,
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
    role: z.enum(["USER", "VENDOR", "ADMIN"]).default("USER")
});

export const loginSchema = z.object({
    email: z.string()
        .trim()
        .toLowerCase()
        .email("Invalid email format"),
    password: z.string().min(1, "Password is required")
});