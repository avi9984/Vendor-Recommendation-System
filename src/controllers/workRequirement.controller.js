import ApiResponce from "../utils/ApiResponce.js";
import * as workRequirementService from '../services/workRequirement.service.js';
import * as recommendationService from "../services/recommendation.service.js";
import { generateRecommendationSummary } from "../services/ai.service.js";

export const createWorkRequirement = async (req, res, next) => {
    try {
        const workRequirement = await workRequirementService.createWorkRequirement(req.body);
        res.status(201).json(ApiResponce({
            statusCode: 201,
            message: "Work Requirement created successfully",
            data: workRequirement
        }));
    } catch (error) {
        console.error(error);
        next(error);
    }
}

export const getWorkRequirementById = async (req, res, next) => {
    try {
        const workRequirement = await workRequirementService.getWorkRequirementById(req.params.id);
        res.status(200).json(ApiResponce({
            statusCode: 200,
            message: "Work Requirement fetched successfully",
            data: workRequirement
        }));
    } catch (error) {
        console.error(error);
        next(error);
    }
}

export const updateWorkRequirement = async (req, res, next) => {
    try {
        const workRequirement = await workRequirementService.updateWorkRequirement(req.params.id, req.body);
        res.status(200).json(ApiResponce({
            statusCode: 200,
            message: "Work Requirement updated successfully",
            data: workRequirement
        }));
    } catch (error) {
        console.error(error);
        next(error);
    }
}

export const deleteWorkRequirement = async (req, res, next) => {
    try {
        await workRequirementService.deleteWorkRequirement(req.params.id);
        res.status(200).json(ApiResponce({
            statusCode: 200,
            message: "Work Requirement deleted successfully"
        }));
    } catch (error) {
        console.error(error);
        next(error);
    }
}

export const getAllWorkRequirements = async (req, res, next) => {
    try {
        const result = await workRequirementService.getAllWorkRequirements(req.query);
        res.status(200).json(ApiResponce({
            statusCode: 200,
            message: "Work Requirements fetched successfully",
            data: result
        }));
    } catch (error) {
        console.error(error);
        next(error);
    }
}

export const getRecommendedVendor = async (req, res, next) => {
    try {
        const workRequirement = await workRequirementService.getWorkRequirementById(req.params.id);
        const recommendedVendors = await recommendationService.recommendVendors(req.params.id);
        const aiSummary = await generateRecommendationSummary(workRequirement, recommendedVendors);
        
        res.status(200).json(ApiResponce({
            statusCode: 200,
            message: "Recommendations and AI summary generated successfully",
            data: {
                recommendations: recommendedVendors,
                aiSummary
            }
        }));
    } catch (error) {
        console.error(error);
        next(error);
    }
}