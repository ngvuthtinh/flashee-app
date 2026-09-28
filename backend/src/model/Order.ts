export interface Order {
    id: string;
    user_id: string;
    order_code?: string;
    status: string;
    payment_status: string;
    subtotal_amount: number;
    shipping_fee: number;
    discount_amount: number;
    total_amount: number;
    shipping_address: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_variant_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface Payment {
    id: string;
    order_id: string;
    payment_method: string;
    amount: number;
    status: string;
    transaction_id?: string;
    created_at: Date;
}

export interface Review {
    id: string;
    comment?: string;
    rating: number;
    order_item_id: string;
    product_id: string;
    user_id: string;
    created_at: Date;
    updated_at?: Date;
}
