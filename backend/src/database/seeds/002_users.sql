-- Password for all 3 users: password123 (bcrypt cost 10)
INSERT INTO users (id, user_name, email_address, phone_number, password, role, created_at)
VALUES
    (uuidv7(), 'Admin User', 'admin@flashee.dev', '0900000001', '$2b$10$9FsKlCTLeyync7oeHstqouwJi77tjTidFmn4w7BU4qJ5SYsR6AC/2', 'ADMIN', now()),
    (uuidv7(), 'Test Customer', 'customer@flashee.dev', '0900000002', '$2b$10$9FsKlCTLeyync7oeHstqouwJi77tjTidFmn4w7BU4qJ5SYsR6AC/2', 'CUSTOMER', now()),
    (uuidv7(), 'Another Customer', 'customer2@flashee.dev', '0900000003', '$2b$10$9FsKlCTLeyync7oeHstqouwJi77tjTidFmn4w7BU4qJ5SYsR6AC/2', 'CUSTOMER', now())
ON CONFLICT (email_address) DO NOTHING;
