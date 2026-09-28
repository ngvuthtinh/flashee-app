// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs

Table users {
  id uuid [primary key]
  user_name varchar [not null]
  email_address varchar [unique, not null]
  phone_number varchar(20) [not null]
  password varchar [not null]
  role varchar [not null]
  created_at timestamp [not null]
  updated_at timestamp [not null, default: `now()`]
}

Table user_profiles {
  id uuid [primary key]
  user_id uuid [unique, not null, ref: - users.id]
  full_name varchar(100)
  date_of_birth date
  avatar_url text
  bio text
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}

Table countries {
  id uuid [primary key]
  country_code varchar(2) [unique, not null]
  country_name varchar
  updated_at timestamp [default: `now()`]
}

Table addresses {
  id uuid [primary key]
  name varchar
  street varchar
  ward varchar
  district varchar
  city varchar
  longitude decimal(9,6)
  latitude decimal(9,6)
  created_at timestamp
  country_id uuid [not null, ref: > countries.id]
  updated_at timestamp [default: `now()`]
}

Table user_address {
  id uuid [primary key]
  user_id uuid [not null, ref: > users.id]
  address_id uuid [not null, ref: > addresses.id]
  is_default boolean [not null, default: false]
  updated_at timestamp [default: `now()`]
}

Table products {
  id uuid [primary key]
  name varchar [not null]
  description varchar
  created_at timestamp
  updated_at timestamp
}

Table product_images {
  id uuid [primary key]
  product_id uuid [not null, ref: > products.id]
  image_url text
  is_thumbnail boolean
  updated_at timestamp [default: `now()`]
}

Table categories {
  id uuid [primary key]
  name varchar
  description varchar
  updated_at timestamp [default: `now()`]
}

Table product_category {
  id uuid [primary key]
  product_id uuid [not null, ref: > products.id]
  category_id uuid [not null, ref: > categories.id]
  updated_at timestamp [default: `now()`]
}

Table product_variants {
  id uuid [primary key]
  product_id uuid [not null, ref: > products.id]
  sku varchar [not null, unique]
  price decimal(12,2) [not null]
  stock_quantity int [not null, default: 0]
  color varchar
  size varchar
  updated_at timestamp [default: `now()`]

  indexes {
    product_id // FK index
    (product_id, price) // Tối ưu lọc biến thể theo sản phẩm và giá
  }
}

Table orders {
  id uuid [primary key]
  user_id uuid [not null, ref: > users.id]
  order_code varchar [unique]
  status varchar [not null, default: 'PENDING']
  payment_status varchar [not null, default: 'UNPAID']
  subtotal_amount decimal(12,2) [not null]
  shipping_fee decimal(12,2) [not null, default: 0]
  discount_amount decimal(12,2) [not null, default: 0]
  total_amount decimal(12,2) [not null]
  shipping_address text [not null]
  created_at timestamp
  updated_at timestamp

  indexes {
    user_id // FK index
    (user_id, created_at) // Tối ưu API: "Xem lịch sử mua hàng của tôi"
    status // Tối ưu Dashboard Admin: "Lọc đơn hàng đang chờ xử lý"
  }
}

Table carts {
  id uuid [primary key]
  user_id uuid [unique, not null, ref: - users.id]
  updated_at timestamp [default: `now()`]
}

Table cart_items {
  id uuid [primary key]
  product_variant_id uuid [not null, ref: > product_variants.id]
  cart_id uuid [not null, ref: > carts.id]
  quantity int [not null, default: 1]
  created_at timestamp
  updated_at timestamp [default: `now()`]

  indexes {
    (cart_id, product_variant_id) [unique] // Đảm bảo 1 món chỉ xuất hiện 1 dòng trong giỏ (trùng thì tăng quantity)
  }
}

Table order_items {
  id uuid [primary key]
  order_id uuid [not null, ref: > orders.id]
  product_variant_id uuid [not null, ref: > product_variants.id]
  quantity int [not null]
  unit_price decimal(12,2) [not null]
  subtotal decimal(12,2) [not null]
  updated_at timestamp [default: `now()`]

  indexes {
    order_id // FK index để load chi tiết đơn
    product_variant_id // FK index để thống kê món nào bán chạy
  }
}

Table payments {
  id uuid [primary key]
  order_id uuid [not null, ref: > orders.id]
  payment_method varchar [not null]
  amount decimal(12,2) [not null]
  status varchar [not null, default: 'PENDING']
  transaction_id varchar
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [default: `now()`]
}

Table reviews {
  id uuid [primary key]
  comment text
  rating int [not null]
  order_item_id uuid [not null, ref: > order_items.id]
  product_id uuid [not null, ref: > products.id]
  user_id uuid [not null, ref: > users.id]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [default: `now()`]

  indexes {
    product_id // FK index để load danh sách đánh giá của 1 trang sản phẩm
    (product_id, rating) // Tối ưu lọc review: "Xem đánh giá 5 sao của sản phẩm này"
  }
}
