export interface Product {
    product_id: string;
    name: string;
    description?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface ProductImage {
    product_image_id: string;
    product_id: string;
    image_url?: string;
    is_thumbnail?: boolean;
}

export interface Category {
    category_id: string;
    name?: string;
    description?: string;
}

export interface ProductCategory {
    product_category_id: string;
    product_id: string;
    category_id: string;
}

export interface ProductVariant {
    product_variant_id: string;
    product_id: string;
    sku: string;
    price: number;
    stock_quantity: number;
    color?: string;
    size?: string;
}
