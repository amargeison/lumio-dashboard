-- Sample club seed — provisions a single test club ("Lumio FC") so
-- developers and the admin tool have something to query against
-- before the first founding member is onboarded.
--
-- Naming rationale: "Lumio FC" (not the spec's "Test FC") because
-- this Supabase project is the production database — there is no
-- separate dev environment. A row called "Lumio FC" is unambiguously
-- internal sample data; "Test FC" could be mistaken for a real
-- founding member's choice of name.
--
-- Branding: uses Lumio's master brand colours (purple #6C3FC5 +
-- teal #0D9488), NOT the Lumio Club product badge colour from the
-- B4 product-config table (#14B8A6). A real Lumio Club customer
-- would pick their own club colours; using Lumio's brand here
-- reinforces "this is internal sample data".
--
-- League name uses 'National League' rather than the spec's
-- 'Vanarama National League' — Vanarama is the trademarked title
-- sponsor and CLAUDE.md's brand rules forbid real third-party
-- brand names without a signed partnership.
--
-- Safe to delete at any time: this row has no inbound FKs until
-- a sports_memberships or sports_invite_tokens row is created
-- against it. If those exist, deleting this row will cascade and
-- remove them (per 092/093 ON DELETE CASCADE).
--
-- Idempotent: ON CONFLICT (slug) DO NOTHING. Re-running this
-- migration against a DB that already has the lumio-fc row is a
-- no-op, not an error.
--
-- See docs/specs/path-b-rbac-architecture.md ("Migration 096" in spec, 097 here).

INSERT INTO sports_clubs (
  name,
  slug,
  sport,
  product,
  tier,
  league_name,
  brand_primary,
  brand_secondary,
  billing_status,
  billing_seats_included,
  setup_complete
)
VALUES (
  'Lumio FC',
  'lumio-fc',
  'football',
  'lumio_club',
  'national_league',
  'National League',
  '#6C3FC5',       -- Lumio purple (canonical)
  '#0D9488',       -- Lumio teal (canonical)
  'founding_member',
  8,               -- Lumio Club default per spec B4
  true             -- setup_complete = true so the row is queryable
                   -- by "active clubs only" filters; can flip to
                   -- false to test the onboarding flow
)
ON CONFLICT (slug) DO NOTHING;
