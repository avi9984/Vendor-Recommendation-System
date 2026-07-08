import ApiResponce from "../utils/ApiResponce.js";
import * as vendorDocumentService from "../services/vendorDocument.service.js";

export const createDocument = async (req, res, next) => {
    try {
        const { vendorId, ...payload } = req.body;
        const document = await vendorDocumentService.createDocument(vendorId, payload);
        res.status(201).json(ApiResponce({
            statusCode: 201,
            message: "Document created successfully",
            data: document
        }))
    } catch (error) {
        console.log(error);
        next(error)
    }
}

export const getDocument = async (req, res, next) => {
    try {
        const vendorId = req.query.vendorId;
        const documents = await vendorDocumentService.getVendorDocumentsByVendorId(vendorId);
        res.status(200).json(ApiResponce({
            statusCode: 200,
            message: "Documents fetched successfully",
            data: documents
        }))
    } catch (error) {
        console.log(error);
        next(error)
    }
}

export const updateDocument = async (req, res, next) => {
    try {
        const id = req.params.id || req.body.id;
        const payload = req.body;
        const document = await vendorDocumentService.updateDocument(id, payload);
        res.status(200).json(ApiResponce({
            statusCode: 200,
            message: "Document updated successfully",
            data: document
        }))
    } catch (error) {
        console.log(error);
        next(error)
    }
}

export const deleteDocument = async (req, res, next) => {
    try {
        const id = req.params.id
        const document = await vendorDocumentService.deleteDocument(id);
        res.status(200).json(ApiResponce({
            statusCode: 200,
            message: "Document deleted successfully",
            data: document
        }))
    } catch (error) {
        console.log(error);
        next(error)
    }
}

export const getExpiredDocuments = async (req, res, next) => {
    try {
        const documents = await vendorDocumentService.getExpiredDocuments();
        res.status(200).json(ApiResponce({
            statusCode: 200,
            message: "Expired documents fetched successfully",
            data: documents
        }))
    } catch (error) {
        console.log(error);
        next(error)
    }
}
