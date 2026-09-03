export interface Cart {
    cart_id: string;
    user_id: string;
    updated_at?: Date;
}

export interface CartItem {
    cart_item_id: string;
    product_variant_id: string;
    cart_id: string;
    quantity: number;
    created_at?: Date;
}
