export const validate = (schema) => (req, res, next) => {
    console.log("come to here validation");

    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ errors: result.error.flatten() });
    }
    req.body = result.data;
    next();
};