import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiErros.js";

export const createDocument = async (vendorId, payload) => {
    const vendor = await prisma.vendor.findFirst({
        where: {
            OR: [
                { id: vendorId },
                { userId: vendorId }
            ]
        }
    });
    if (!vendor) {
        throw ApiError(404, "Vendor not found");
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


    const vendor = await prisma.vendor.findFirst({
        where: {
            OR: [
                { id: vendorId },
                { userId: vendorId }
            ]
        }
    });
    // console.log("vendor 1", vendor);
    // console.log("vendorId 1", vendorId);
    if (!vendor) {
        throw ApiError(404, "Vendor not found");
    }
    return await prisma.vendorDocument.findMany({
        where: {
            vendorId: vendor.id
        },
        orderBy: { createdAt: "desc" }
    });
}

export const updateDocument = async (id, payload) => {
    const documentExists = await prisma.vendorDocument.findUnique({
        where: { id }
    });
    if (!documentExists) {
        throw ApiError(404, "Document not found");
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
        throw ApiError(404, "Document not found");
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