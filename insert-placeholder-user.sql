INSERT INTO \
user\ (id, name, email, \emailVerified\, image, \createdAt\, \updatedAt\) VALUES ('user-placeholder', 'Placeholder User', 'placeholder@example.com', true, null, now(), now()) ON CONFLICT (id) DO NOTHING;
