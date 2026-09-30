INSERT INTO countries (id, country_name, country_code)
VALUES
    (uuidv7(), 'Vietnam', 'VN'),
    (uuidv7(), 'United States', 'US')
ON CONFLICT (country_code) DO NOTHING;
