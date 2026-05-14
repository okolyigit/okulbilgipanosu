-- Okul Bilgi Panosu — D1 schema

CREATE TABLE IF NOT EXISTS schools (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  motto         TEXT,
  city          TEXT,
  logo_url      TEXT,
  email         TEXT,
  password_hash TEXT NOT NULL,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_email ON schools(email) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS announcements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id   INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  badge_text  TEXT,
  badge_type  TEXT DEFAULT 'default',
  title       TEXT NOT NULL,
  body        TEXT,
  image_url   TEXT,
  video_url   TEXT,
  sort_order  INTEGER DEFAULT 0,
  active      INTEGER DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_announcements_school ON announcements(school_id, sort_order);

CREATE TABLE IF NOT EXISTS duty_teachers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id    INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  zone         TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  day_of_week  INTEGER,  -- 1=Pzt, 2=Salı, 3=Çar, 4=Per, 5=Cuma. NULL = her gün.
  sort_order   INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_duty_school ON duty_teachers(school_id, sort_order);

CREATE TABLE IF NOT EXISTS ticker_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id   INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  active      INTEGER DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_ticker_school ON ticker_items(school_id, sort_order);
