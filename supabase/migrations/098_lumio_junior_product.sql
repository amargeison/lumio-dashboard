-- Extend product_type enum with 'lumio_junior' for the Lumio Junior
-- Football product. Additive only — no destructive changes. Mirrors the
-- application-layer addition in src/lib/sports/product-config.ts.
--
-- ALTER TYPE … ADD VALUE IF NOT EXISTS is idempotent under PostgreSQL
-- 9.6+ (Supabase ships 15+). Safe to re-run.
--
-- See migrations/091_sports_clubs.sql for the original enum + sports_clubs
-- table definition.

ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'lumio_junior';
