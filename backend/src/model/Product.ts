export interface Product {
    id: string;
    name: string;
    description?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface ProductImage {
    id: string;
    product_id: string;
    image_url?: string;
    is_thumbnail?: boolean;
}

export interface Category {
    id: string;
    name?: string;
    description?: string;
}

export interface ProductCategory {
    id: string;
    product_id: string;
    category_id: string;
}

export interface ProductVariant {
    id: string;
    product_id: string;
    sku: string;
    price: number;
    stock_quantity: number;
    color?: string;
    size?: string;
}
