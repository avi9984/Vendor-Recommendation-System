import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiErros.js";

export const createVendor=async(payload)=>{
    const vendor=await prisma.vendor.findUnique({
        where:{email:payload.email}
    })
    if(vendor){
        throw ApiError(409, "Vendor already exists");
    }

    // Check if a User account with the vendor's email already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: payload.email }
    });

    let userId = null;
    if (existingUser) {
        userId = existingUser.id;
        // Promote the user to VENDOR if they are currently a USER
        if (existingUser.role === "USER") {
            await prisma.user.update({
                where: { id: existingUser.id },
                data: { role: "VENDOR" }
            });
        }
    }

    return prisma.vendor.create({
        data: {
            ...payload,
            userId
        }
    }) 
}

export const getVendorById=async(id)=>{
    const vendor=await prisma.vendor.findFirst({
        where:{
            OR: [
                { id },
                { userId: id }
            ]
        }
    });
    if(!vendor){
        throw ApiError(404, "Vendor not found")
    }
    return vendor
}

export const updateVendor=async(id,payload)=>{
    const vendor = await getVendorById(id);
    return prisma.vendor.update({
        where:{id: vendor.id},
        data:payload
    });
}

export const deleteVendor=async(id)=>{
    const vendor = await getVendorById(id);
    return prisma.vendor.update({
        where:{id: vendor.id},
        data:{status:"INACTIVE"}
    })
}

export const getAllVendors=async(query)=>{
    const page=Number(query.page)||1;
    const limit= Number(query.limit)||10;
    const skip=(page-1)*limit;

    const where={};

    if(query.search){
        where.OR=[
            {
                vendorname: {
                    contains: query.search,
                    mode: 'insensitive'
                }
            },
            {
                category: {
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

    if(query.category){
        where.category = query.category;
    }

    if(query.status){
        where.status = query.status;
    }

    if(query.location){
        where.location = query.location;
    }

    const [vendors, total] = await Promise.all([
        prisma.vendor.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.vendor.count({ where })
    ]);

    return {
        data: vendors,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}