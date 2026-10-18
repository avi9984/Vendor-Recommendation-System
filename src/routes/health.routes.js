import { Router } from "express";
import prisma from "../config/prisma.js";

const router = Router();

/**
 * Liveness Probe: Confirms that the Node.js process is active and responding.
 */
router.get("/health", (req, res) => {
    const memory = process.memoryUsage();

    res.status(200).json({
        status: "healthy",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        memoryUsage: {
            rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
            heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100
        }
    });
});

/**
 * Readiness Probe: Confirms database connectivity via Prisma.
 */
router.get("/ready", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({
            status: "ready",
            database: "connected",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: "unhealthy",
            database: "disconnected",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
