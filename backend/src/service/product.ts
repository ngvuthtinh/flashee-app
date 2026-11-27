import { productRepository } from '../repository/Product';
import { AppError } from '../errors/AppError';
import { ProductListItem, ProductDetail } from '../model/Product';

export const productService = {
    async list(limit: number, after: string | null): Promise<{
        items: ProductListItem[];
        pagination: { limit: number; has_more: boolean; next_cursor: string | null };
    }> {
        const rows = await productRepository.findActivePage(limit + 1, after);
        const hasMore = rows.length > limit;
        const items = hasMore ? rows.slice(0, limit) : rows;
        const nextCursor = hasMore ? items[items.length - 1]!.id : null;

        return { items, pagination: { limit, has_more: hasMore, next_cursor: nextCursor } };
    },

    async getById(id: string): Promise<ProductDetail> {
        const product = await productRepository.findActiveById(id);
        if (!product) {
            throw AppError.notFound('Product not found');
        }
        const variants = await productRepository.findActiveVariants(id);
        return { ...product, variants };
    },
} 