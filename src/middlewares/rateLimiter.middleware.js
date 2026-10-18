/**
 * In-memory sliding window rate limiter middleware.
 * Protects against brute-force attacks and denial-of-service abuse without external store dependencies.
 */

class RateLimiterStore {
    constructor(cleanupIntervalMs = 60000) {
        this.hits = new Map();
        // Periodic garbage collection to prevent memory leaks from stale IP keys
        this.cleanupTimer = setInterval(() => this.cleanup(), cleanupIntervalMs);
        if (this.cleanupTimer.unref) {
            this.cleanupTimer.unref();
        }
    }

    increment(key, windowMs) {
        const now = Date.now();
        const record = this.hits.get(key) || { count: 0, resetTime: now + windowMs };

        if (now > record.resetTime) {
            record.count = 1;
            record.resetTime = now + windowMs;
        } else {
            record.count += 1;
        }

        this.hits.set(key, record);
        return {
            current: record.count,
            resetTime: record.resetTime
        };
    }

    cleanup() {
        const now = Date.now();
        for (const [key, record] of this.hits.entries()) {
            if (now > record.resetTime) {
                this.hits.delete(key);
            }
        }
    }
}

const defaultStore = new RateLimiterStore();

export const createRateLimiter = ({
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100, // Max requests allowed within window
    message = "Too many requests from this IP, please try again later.",
    store = defaultStore
} = {}) => {
    return (req, res, next) => {
        // Fallback safely to remoteAddress if req.ip is not populated
        const clientIp = req.ip || req.connection?.remoteAddress || "unknown_ip";
        const key = `${req.baseUrl || ""}:${clientIp}`;

        const { current, resetTime } = store.increment(key, windowMs);
        const remaining = Math.max(0, max - current);
        const resetSeconds = Math.ceil((resetTime - Date.now()) / 1000);

        res.setHeader("X-RateLimit-Limit", max);
        res.setHeader("X-RateLimit-Remaining", remaining);
        res.setHeader("X-RateLimit-Reset", resetSeconds);

        if (current > max) {
            res.setHeader("Retry-After", resetSeconds);
            return res.status(429).json({
                success: false,
                statusCode: 429,
                message,
                retryAfterSeconds: resetSeconds
            });
        }

        next();
    };
};

// Strict limiter for authentication endpoints (prevent brute-force password guessing)
export const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: "Too many authentication attempts. Please wait 15 minutes before trying again."
});

// Standard API limiter for general endpoints
export const generalLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: "Too many requests to this endpoint. Please slow down."
});
