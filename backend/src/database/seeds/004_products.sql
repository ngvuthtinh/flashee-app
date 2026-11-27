-- Products
INSERT INTO products (id, name, description, is_active)
SELECT uuidv7(), p.name, p.description, p.is_active
FROM (VALUES
    ('Ultraboost Light',          'Giày chạy bộ đệm êm, phù hợp chạy đường dài', true),
    ('Samba OG',                  'Giày sân cỏ phong cách retro', true),
    ('Stan Smith',                'Giày da trắng kinh điển', true),
    ('Gazelle Indoor',            'Giày thể thao nhẹ, đế cao su', true),
    ('Adilette Comfort',          'Dép quai ngang êm chân', true),
    ('Essentials Hoodie',         'Áo hoodie nỉ mềm', true),
    ('Tiro Track Pants',          'Quần thể thao ống đứng', true),
    ('Trefoil Tee',               'Áo thun cổ tròn logo Trefoil', true),
    ('Classic Backpack',          'Ba lô đi học, đi làm', true),
    ('Performance Socks',         'Vớ cổ cao thấm hút mồ hôi', true),
    ('Sport Water Bottle 750ml',  'Bình nước thể thao', true),
    ('Ultraboost Limited 2026',   'Bản giới hạn, số lượng rất ít', true),
    ('Superstar Classic',         'Mẫu đã ngừng bán', false)
) AS p(name, description, is_active)
WHERE NOT EXISTS (SELECT 1 FROM products x WHERE x.name = p.name);

-- Variants
INSERT INTO product_variants (id, product_id, sku, price, stock_quantity, color, size)
SELECT uuidv7(), pr.id, v.sku, v.price, v.stock, v.color, v.size
FROM (VALUES
    ('Ultraboost Light',         'UB-BLK-41',  4500000,  20, 'Black', '41'),
    ('Ultraboost Light',         'UB-BLK-42',  4500000,  25, 'Black', '42'),
    ('Ultraboost Light',         'UB-BLK-43',  4500000,  15, 'Black', '43'),
    ('Ultraboost Light',         'UB-WHT-42',  4500000,  12, 'White', '42'),

    ('Samba OG',                 'SB-WHT-41',  2800000,  30, 'White', '41'),
    ('Samba OG',                 'SB-WHT-42',  2800000,  25, 'White', '42'),
    ('Samba OG',                 'SB-BLK-42',  2800000,  18, 'Black', '42'),

    ('Stan Smith',               'SS-WHT-40',  2400000,  22, 'White', '40'),
    ('Stan Smith',               'SS-WHT-41',  2400000,  28, 'White', '41'),
    ('Stan Smith',               'SS-WHT-42',  2400000,  20, 'White', '42'),

    ('Gazelle Indoor',           'GZ-BLU-41',  2600000,  16, 'Blue',  '41'),
    ('Gazelle Indoor',           'GZ-BLU-42',  2600000,  14, 'Blue',  '42'),

    ('Adilette Comfort',         'AD-BLK-M',    700000,  60, 'Black', 'M'),
    ('Adilette Comfort',         'AD-BLK-L',    700000,  55, 'Black', 'L'),
    ('Adilette Comfort',         'AD-WHT-M',    700000,  40, 'White', 'M'),

    ('Essentials Hoodie',        'HD-GRY-M',   1200000,  35, 'Grey',  'M'),
    ('Essentials Hoodie',        'HD-GRY-L',   1200000,  30, 'Grey',  'L'),
    ('Essentials Hoodie',        'HD-BLK-M',   1200000,  32, 'Black', 'M'),
    ('Essentials Hoodie',        'HD-BLK-L',   1200000,  28, 'Black', 'L'),

    ('Tiro Track Pants',         'TP-BLK-M',   1100000,  26, 'Black', 'M'),
    ('Tiro Track Pants',         'TP-BLK-L',   1100000,  24, 'Black', 'L'),

    ('Trefoil Tee',              'TT-WHT-S',    650000,  50, 'White', 'S'),
    ('Trefoil Tee',              'TT-WHT-M',    650000,  70, 'White', 'M'),
    ('Trefoil Tee',              'TT-WHT-L',    650000,  45, 'White', 'L'),
    ('Trefoil Tee',              'TT-BLK-M',    650000,  60, 'Black', 'M'),

    ('Classic Backpack',         'BP-BLK',      950000,  40, 'Black', NULL),
    ('Classic Backpack',         'BP-NVY',      950000,  35, 'Navy',  NULL),

    ('Performance Socks',        'SK-M',        250000, 120, NULL,    'M'),
    ('Performance Socks',        'SK-L',        250000, 110, NULL,    'L'),

    ('Sport Water Bottle 750ml', 'WB-750',      320000, 100, NULL,    NULL),

    ('Ultraboost Limited 2026',  'UBL-BLK-42', 6500000,   5, 'Black', '42'),
    ('Ultraboost Limited 2026',  'UBL-BLK-43', 6500000,   3, 'Black', '43'),

    ('Superstar Classic',        'SSC-WHT-42', 2300000,   8, 'White', '42')
) AS v(product_name, sku, price, stock, color, size)
JOIN products pr ON pr.name = v.product_name
ON CONFLICT (sku) DO NOTHING;