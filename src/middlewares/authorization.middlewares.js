import ApiError from "../utils/ApiErros.js";
import prisma from "../config/prisma.js";

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No user profile found"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: Role '${req.user.role}' does not have permission to access this resource`
            });
        }

        next();
    };
};

export const checkVendorOwnership = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No user profile found"
            });
        }

        console.log("Logged-in User ID:", req.user.id);
        console.log("Requested Param ID:", req.params.id);

        if (req.user.role === "ADMIN") {
            return next();
        }

        if (req.user.role !== "VENDOR") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to modify this vendor"
            });
        }

        const id = req.params.id;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Bad Request: Vendor ID or User ID is required"
            });
        }

        // Look up vendor by either their primary key ID or their associated userId
        const vendor = await prisma.vendor.findFirst({
            where: {
                OR: [
                    { id: id },
                    { userId: id }
                ]
            }
        });

        console.log("Found vendor profile:", vendor);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }

        if (vendor.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You are not authorized to manage this vendor profile"
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const checkDocumentOwnership = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No user profile found"
            });
        }

        if (req.user.role === "ADMIN") {
            return next();
        }

        if (req.user.role !== "VENDOR") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to manage these documents"
            });
        }

        // 1. If it's a create, list, or fetch-by-vendorId operation
        const vendorId = req.body?.vendorId || req.query?.vendorId || req.params?.vendorId;
        if (vendorId) {
            const vendor = await prisma.vendor.findFirst({
                where: {
                    OR: [
                        { id: vendorId },
                        { userId: vendorId }
                    ]
                }
            });

            if (!vendor) {
                return res.status(404).json({
                    success: false,
                    message: "Vendor not found"
                });
            }

            if (vendor.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You are not authorized to manage documents for this vendor"
                });
            }
            return next();
        }

        // 2. If it's an update, delete, or fetch operation on a specific document ID
        const documentId = req.params?.id || req.body?.id;
        if (documentId) {
            const document = await prisma.vendorDocument.findUnique({
                where: { id: documentId },
                include: { vendor: true }
            });

            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: "Document not found"
                });
            }

            if (document.vendor.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You are not authorized to manage this document"
                });
            }
            return next();
        }

        return res.status(400).json({
            success: false,
            message: "Bad Request: Vendor ID or Document ID is required"
        });
    } catch (error) {
        next(error);
    }
};
