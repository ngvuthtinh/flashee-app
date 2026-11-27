import pool from '../config/db';
import { Db } from '../database/transaction';
import { ProductListItem, PublicVariant } from '../model/Product';

export const productRepository = {
    async findActivePage(limit: number, after: string | null, db: Db = pool): Promise<ProductListItem[]> {
        const query = `SELECT p.id, p.name, p.description,
                              MIN(v.price) AS price_from,
                              BOOL_OR(v.stock_quantity > 0) AS in_stock
                       FROM products p
                       JOIN product_variants v ON v.product_id = p.id AND v.is_active
                       WHERE p.is_active AND ($2::uuid IS NULL OR p.id > $2)
                       GROUP BY p.id
                       ORDER BY p.id
                       LIMIT $1;`;
        const result = await db.query<ProductListItem>(query, [limit, after]);
        return result.rows;
    },

    async findActiveById(id: string, db: Db = pool): Promise<{ id: string; name: string; description: string | null } | null> {
        const query = `SELECT id, name, description FROM products WHERE id = $1 AND is_active;`;
        const result = await db.query(query, [id]);
        return result.rows[0] || null;
    },

    async findActiveVariants(productId: string, db: Db = pool): Promise<PublicVariant[]> {
        const query = `SELECT id, color, size, price, (stock_quantity > 0) AS in_stock
                       FROM product_variants
                       WHERE product_id = $1 AND is_active
                       ORDER BY id;`;
        const result = await db.query<PublicVariant>(query, [productId]);
        return result.rows;
    },
}