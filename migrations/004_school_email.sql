ALTER TABLE schools ADD COLUMN email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_email ON schools(email) WHERE email IS NOT NULL;
