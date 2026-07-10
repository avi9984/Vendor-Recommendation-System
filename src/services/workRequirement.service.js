import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiErros.js";

export const createWorkRequirement = async (payload) => {
    const data = { ...payload };
    if (payload.expectedStartDate) {
        data.expectedStartDate = new Date(payload.expectedStartDate);
    }
    return prisma.workRequirement.create({
        data
    });
}

export const getWorkRequirementById = async (id) => {
    const workRequirement = await prisma.workRequirement.findUnique({
        where: { id }
    });
    if (!workRequirement) {
        throw ApiError(404, "Work Requirement not found");
    }
    return workRequirement;
}

export const updateWorkRequirement = async (id, payload) => {
    await getWorkRequirementById(id);
    const data = { ...payload };
    if (payload.expectedStartDate) {
        data.expectedStartDate = new Date(payload.expectedStartDate);
    }
    return prisma.workRequirement.update({
        where: { id },
        data
    });
}

export const deleteWorkRequirement = async (id) => {
    await getWorkRequirementById(id);
    return prisma.workRequirement.delete({
        where: { id }
    });
}

export const getAllWorkRequirements = async (query) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {};

    if (query.search) {
        where.OR = [
            {
                title: {
                    contains: query.search,
                    mode: 'insensitive'
                }
            },
            {
                description: {
                    contains: query.search,
                    mode: 'insensitive'
                }
            },
            {
                location: {
                    contains: query.search,
                    mode: 'insensitive'
                }
            }
        ];
    }

    if (query.category) {
        where.category = query.category;
    }

    if (query.location) {
        where.location = query.location;
    }

    const [workRequirements, total] = await Promise.all([
        prisma.workRequirement.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.workRequirement.count({ where })
    ]);

    return {
        data: workRequirements,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}