import crypto from "crypto";

/**
 * Middleware that attaches a unique X-Request-Id to the incoming request and response headers.
 * Facilitates distributed tracing and structured log correlation.
 */
export const requestIdMiddleware = (req, res, next) => {
    const incomingId = req.headers["x-request-id"];
    const requestId = incomingId && typeof incomingId === "string" ? incomingId : crypto.randomUUID();

    req.id = requestId;
    res.setHeader("X-Request-Id", requestId);

    next();
};

export default requestIdMiddleware;
