-- Mevcut DB'lere day_of_week kolonu ekler.
-- Yeni kurulumlarda schema.sql zaten bu kolonu içerir; bu migration NO-OP olarak çalışır.
-- SQLite ALTER TABLE ADD COLUMN idempotent değil; PRAGMA ile kontrol etmek için
--   wrangler --command ile ayrıca çalıştır.

ALTER TABLE duty_teachers ADD COLUMN day_of_week INTEGER;
