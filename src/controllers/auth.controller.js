import ApiResponce from "../utils/ApiResponce.js";

import { generateToken } from "../utils/jwt.js";
import * as authService from "../services/auth.service.js";


export const register = async (req, res, next) => {
    console.log("controller");

    try {
        console.log("in controller");

        const user = await authService.register(req.body);

        res.status(201).json(ApiResponce({
            statusCode: 201,
            message: "User Registed successfully",
        }))
    } catch (error) {
        console.log(error);
        next()
    }
}

export const login = async (req, res, next) => {
    try {
        const user = await authService.login(req.body);

        const token = generateToken({
            id: user.id,
            role: user.role
        });

        res.status(200).json(ApiResponce({
            statusCode: 200,
            message: "User Registed successfully",
            data: { token }
        }))
    } catch (error) {
        console.log(error);
        next()
    }
}