import { Request, Response, NextFunction } from "express";
import { Schema, validate } from '../validation/validate';
import { AppError } from "../errors/AppError";

export function validateBody(schema: Schema) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = validate(schema, req.body);

        if (!result.ok) {
            throw AppError.badRequest('Validation failed', result.errors);
        }

        req.body = result.data;
        next();
    }
}