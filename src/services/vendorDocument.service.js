import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiErros.js";

export const createDocument = async (vendorId, payload) => {
    const vendor = await prisma.vendor.findUnique({
        where: {
            id: vendorId
        }
    });
    if (!vendor) {
        throw new ApiError(404, "Vendor not found");
    }
    const document = await prisma.vendorDocument.create({
        data: {
            vendorId: vendor.id,
            documentType: payload.documentType,
            documentName: payload.documentName,
            expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : null,
            verified: payload.verified ?? false
        }
    });
    return document;
}

export const getVendorDocumentsByVendorId = async (vendorId) => {
    const vendor = await prisma.vendor.findUnique({
        where: {
            id: vendorId
        }
    });
    if (!vendor) {
        throw new ApiError(404, "Vendor not found");
    }
    return await prisma.vendorDocument.findMany({
        where: {
            vendorId: vendorId
        },
        orderBy: { createdAt: "desc" }
    });
}

export const updateDocument = async (id, payload) => {
    const documentExists = await prisma.vendorDocument.findUnique({
        where: { id }
    });
    if (!documentExists) {
        throw new ApiError(404, "Document not found");
    }

    const data = { ...payload };
    if (payload.expiryDate) {
        data.expiryDate = new Date(payload.expiryDate);
    }

    const document = await prisma.vendorDocument.update({
        where: { id },
        data
    });
    return document;
}

export const deleteDocument = async (id) => {
    const documentExists = await prisma.vendorDocument.findUnique({
        where: { id }
    });
    if (!documentExists) {
        throw new ApiError(404, "Document not found");
    }
    return await prisma.vendorDocument.delete({
        where: { id }
    });
}

export const getExpiredDocuments = async () => {
    return await prisma.vendorDocument.findMany({
        where: {
            expiryDate: {
                lt: new Date()
            }
        },
        orderBy: { expiryDate: "asc" }
    });
}