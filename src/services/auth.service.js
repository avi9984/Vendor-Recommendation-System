import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiErros.js";


export const register = async (payload) => {
    const user = await prisma.user.findUnique({
        where: { email: payload.email }
    })

    if (user) {
        throw ApiError(409, "Email already exists")
    }

    // Check if there is an existing vendor profile created by Admin for this email
    const existingVendor = await prisma.vendor.findUnique({
        where: { email: payload.email }
    })

    let role = payload.role;
    if (existingVendor) {
        role = "VENDOR";
    }

    const hashPassword = await bcrypt.hash(payload.password, 10)

    const newUser = await prisma.user.create({
        data: {
            ...payload,
            role,
            password: hashPassword
        }
    })

    // If vendor exists, link it to the newly created user
    if (existingVendor) {
        await prisma.vendor.update({
            where: { id: existingVendor.id },
            data: { userId: newUser.id }
        })
    }

    return newUser;
}

export const login = async (payload) => {
    const user = await prisma.user.findUnique({
        where: { email: payload.email }
    })
    if (!user) {
        throw ApiError(401, "Invalid credentials");
    }

    const isMatch = await bcrypt.compare(
        payload.password,
        user.password
    );
    if (!isMatch) {
        throw ApiError(401, "Invalid credentials");
    }
    return user;
}
