import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
) {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
        return;
    }

    if (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed') {
        res.status(400).json({ success: false, message: 'Invalid JSON body' });
        return;
    }

    console.error('Unexpected error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
}
