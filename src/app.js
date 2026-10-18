import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from "./routes/auth.routes.js";
import errorHander from './middlewares/error.middleware.js';
import vendorRoutes from "./routes/vendor.routes.js";
import vendorDocumentRoutes from "./routes/vendorDocument.routes.js";
import workRequirementRoutes from "./routes/workRequirement.routes.js";
import { requestIdMiddleware } from "./middlewares/requestId.middleware.js";
import { generalLimiter } from "./middlewares/rateLimiter.middleware.js";

const app = express();

app.use(requestIdMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(generalLimiter);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/vendor", vendorRoutes);
app.use("/api/v1/vendorDocument", vendorDocumentRoutes);
app.use("/api/v1/workRequirement", workRequirementRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Vendor recommendation system",
        requestId: req.id
    });
});

// Catch-all for undefined routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

app.use(errorHander);

export default app;
