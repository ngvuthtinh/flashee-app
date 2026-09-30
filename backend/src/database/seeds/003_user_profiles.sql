INSERT INTO user_profiles (id, user_id, full_name, date_of_birth, avatar_url, bio)
SELECT uuidv7(), u.id, p.full_name, p.date_of_birth::date, p.avatar_url, p.bio
FROM (VALUES
    ('admin@flashee.dev', 'Admin User', '1990-01-15', 'https://i.pravatar.cc/150?img=1', 'Chủ shop'),
    ('customer@flashee.dev', 'Test Customer', '1995-05-20', 'https://i.pravatar.cc/150?img=2', 'Thích sneaker'),
    ('customer2@flashee.dev', 'Another Customer', '1998-11-03', 'https://i.pravatar.cc/150?img=3', 'Chạy bộ mỗi sáng')
) AS p(email_address, full_name, date_of_birth, avatar_url, bio)
JOIN users u ON u.email_address = p.email_address
ON CONFLICT (user_id) DO NOTHING;
