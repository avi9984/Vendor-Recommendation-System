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

    const hashPassword = await bcrypt.hash(payload.password, 10)

    return prisma.user.create({
        data: {
            ...payload,
            password: hashPassword
        }
    })

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
