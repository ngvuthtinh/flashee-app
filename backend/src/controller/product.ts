import { Request, Response, NextFunction } from 'express';
import { productService } from '../service/product';
import { AppError } from '../errors/AppError';
import { isUuid, parsePagination } from '../validation/productSchemas';

export const productController = {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { limit, after } = parsePagination(req.query);
            const data = await productService.list(limit, after);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params['id'];
            if (typeof id !== 'string' || !isUuid(id)) {
                throw AppError.notFound('Product not found');
            }
            const product = await productService.getById(id);
            res.status(200).json({ success: true, data: { product } });
        } catch (error) {
            next(error);
        }
    },
}