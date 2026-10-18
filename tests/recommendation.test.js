import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getDistance } from "../src/services/recommendation.service.js";

describe("Recommendation Service - Distance Calculations", () => {
    test("should return 0 when locations are identical strings (case-insensitive)", () => {
        const distance = getDistance("New York, USA", "new york, usa");
        assert.equal(distance, 0);
    });

    test("should return 0 when locations have leading/trailing whitespace", () => {
        const distance = getDistance("  Chicago  ", "Chicago");
        assert.equal(distance, 0);
    });

    test("should calculate accurate Haversine distance between two coordinates", () => {
        // New York (40.7128, -74.0060) to Boston (42.3601, -71.0589) ~ 306 km
        const locNY = "40.7128, -74.0060";
        const locBoston = "42.3601, -71.0589";
        const distance = getDistance(locNY, locBoston);

        assert.ok(distance > 300 && distance < 320, `Expected distance ~306km, got ${distance}km`);
    });

    test("should return fallback distance 120km when locations are non-coordinate distinct text", () => {
        const distance = getDistance("San Francisco, CA", "Seattle, WA");
        assert.equal(distance, 120);
    });

    test("should return 999 when either location is null, undefined, or empty", () => {
        assert.equal(getDistance(null, "Boston"), 999);
        assert.equal(getDistance("Boston", undefined), 999);
        assert.equal(getDistance("", ""), 999);
    });
});
