import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { registerSchema, loginSchema } from "../src/validators/auth.validator.js";

describe("Auth Validators", () => {
    test("loginSchema should validate valid email and non-empty password", () => {
        const validPayload = {
            email: "user@example.com",
            password: "ValidPassword123!"
        };
        const parsed = loginSchema.safeParse(validPayload);
        assert.equal(parsed.success, true);
    });

    test("loginSchema should reject invalid email format", () => {
        const invalidPayload = {
            email: "not-an-email",
            password: "ValidPassword123!"
        };
        const parsed = loginSchema.safeParse(invalidPayload);
        assert.equal(parsed.success, false);
    });

    test("registerSchema should reject passwords shorter than 6 characters", () => {
        const payload = {
            name: "John Doe",
            email: "john@example.com",
            password: "123"
        };
        const parsed = registerSchema.safeParse(payload);
        assert.equal(parsed.success, false);
    });
});
