import ApiError from "../utils/ApiErros.js";

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No user profile found"
            });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: Role '${req.user.role}' does not have permission to access this resource`
            });
        }
        
        next();
    };
};
