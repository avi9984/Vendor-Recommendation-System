const ApiResponce = ({
    success = true,
    statusCode = 200,
    message = "Success",
    data = null
}) => ({
    success,
    statusCode,
    message,
    data
})

export default ApiResponce;