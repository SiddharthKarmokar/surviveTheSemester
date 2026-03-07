import { AppError } from "../errorHandlers/index.js";

export const errorMiddleware = (err, req, res, next) => {
    if(err instanceof AppError) {
        console.log(`Error ${req.method} ${req.url} - ${err.message}`);
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            ...(err.details && { details: err.details}),
            ...(process.env.NODE_ENV === 'production' && { stack: err.stack })
        });
    } 
    console.error(`Unexpected error ${req.method} ${req.url} - ${err.message}`);
    return res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
    })
};

