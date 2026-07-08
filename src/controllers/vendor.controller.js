import ApiResponce from "../utils/ApiResponce.js";
import * as vendorService from "../services/vendor.service.js";



export const createVendor = async (req, res, next) => {
    try {
        const vendor = await vendorService.createVendor(req.body);
        res.status(201).json(ApiResponce({
            statusCode: 201,
            message: "Vendor created successfully",
            data: vendor
        }))
    } catch (error) {
        console.log(error);
        next()
    }
}

export const getVendorById = async (req, res, next) => {
    try {
        const vendor = await vendorService.getVendorById(req.params.id);
        res.status(200).json(ApiResponce({
            statusCode: 200,
            message: "Vendor fetched successfully",
            data: vendor
        }))
    } catch (error) {
        console.log(error);
        next()
    }
}

export const updateVendor = async (req, res, next) => {
    try {
        const vendor = await vendorService.updateVendor(req.params.id, req.body);
        res.status(200).json(ApiResponce({
            statusCode: 200,
            message: "Vendor updated successfully",
            data: vendor
        }))
    } catch (error) {
        console.log(error);
        next()
    }
}

export const deleteVendor = async (req, res, next) => {
    try {
        const vendor = await vendorService.deleteVendor(req.params.id);
        res.status(200).json(ApiResponce({
            statusCode: 200,
            message: "Vendor inactive successfully",
            data: vendor
        }))
    } catch (error) {
        console.log(error);
        next()
    }
}

export const getAllVendors = async (req, res, next) => {
    try {
        const vendors = await vendorService.getAllVendors(req.query);
        res.status(200).json(ApiResponce({
            statusCode: 200,
            message: "Vendors fetched successfully",
            data: vendors
        }))
    } catch (error) {
        console.log(error);
        next()
    }
}