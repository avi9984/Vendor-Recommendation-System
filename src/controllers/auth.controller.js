import ApiResponce from "../utils/ApiResponce.js";
import { generateToken } from "../utils/jwt.js";
import * as authService from "../services/auth.service.js";

export const register = async (req, res, next) => {
    try {
        const newUser = await authService.register(req.body);

        res.status(201).json(ApiResponce({
            statusCode: 201,
            message: "User registered successfully",
            data: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        }));
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const user = await authService.login(req.body);

        const token = generateToken({
            id: user.id,
            role: user.role
        });

        res.status(200).json(ApiResponce({
            statusCode: 200,
            message: "User logged in successfully",
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        }));
    } catch (error) {
        next(error);
    }
};