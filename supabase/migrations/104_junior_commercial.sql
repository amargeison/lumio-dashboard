-- supabase/migrations/104_junior_commercial.sql
-- Workstream B / Migration 104 — Lumio Junior Football commercial + storage.
-- LAST schema migration in Workstream B.
--
-- Builds on 099 + 100 + 101 + 102 + 103:
--   - Reuses helper functions: junior_staff_club_ids,
--     junior_guardian_player_ids, junior_welfare_club_ids (all 099)
--   - Reuses trigger function: junior_force_club_id_from_player (099) for
--     junior_subscriptions. junior_revenue_share has NO force trigger —
--     it has no player_id (club-level aggregate).
--   - NO new helper functions.
--
-- Two tables, three ENUMs, one Supabase Storage bucket.
--
-- SERVICE-ROLE WRITES — both tables in this migration are written by the
-- Stripe webhook handler running as service_role, NOT by portal users.
-- Same model as junior_skills_framework (103): RLS enabled, SELECT
-- policy only, NO INSERT/UPDATE/DELETE policy. service_role bypasses
-- RLS and mutates the rows out-of-band. authenticated and anon roles
-- get zero write paths to either table.
--
-- NO CARD DATA — junior_subscriptions stores a Stripe subscription
-- reference (stripe_subscription_ref) only and never any payment
-- instrument detail. PCI scope stays at Stripe.
--
-- STORAGE — creates the private 'junior-media' bucket for player photos
-- and video clips (the video_ref / thumbnail_ref / full_match_ref
-- paths on junior_video_clips, 102). The bucket is SERVICE-ROLE-ACCESS-
-- ONLY in the interim: no storage.objects SELECT policy is created for
-- junior-media, so authenticated and anon roles cannot read the bucket
-- directly. The sole reader path is a signed URL minted by server
-- code that has already evaluated the junior_video_clips (102)
-- consent gate. Same fail-closed model as the two tables here.

-- ─── ENUMs ────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE junior_subscription_tier AS ENUM (
    'parent_app'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE junior_subscription_status AS ENUM (
    'trialing', 'active', 'past_due', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE junior_revenue_share_status AS ENUM (
    'pending', 'paid'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── TABLES ───────────────────────────────────────────────────────────────

-- junior_subscriptions — one row per (player, paying-guardian) parent-app
-- subscription. Card data NEVER stored — only the Stripe subscription
-- reference. Rows are created and mutated EXCLUSIVELY by the Stripe
-- webhook running as service_role (see RLS section below); portal
-- users have read paths only.
--
-- club_id is denormalised from junior_players.club_id and FORCED by
-- 099's junior_force_club_id_from_player trigger; junior_players.club_id
-- is immutable (099) so the denormalised value can never drift.
--
-- stripe_subscription_ref is NULLABLE: a row can be inserted in
-- 'trialing' state before Stripe has finalised the subscription record
-- (free-trial onboarding). The webhook backfills the ref when Stripe
-- confirms.
CREATE TABLE IF NOT EXISTS junior_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  club_id                UUID NOT NULL REFERENCES sports_clubs(id)        ON DELETE CASCADE,
  player_id              UUID NOT NULL REFERENCES junior_players(id)      ON DELETE CASCADE,
  guardian_membership_id UUID NOT NULL REFERENCES sports_memberships(id)  ON DELETE CASCADE,

  tier   junior_subscription_tier   NOT NULL DEFAULT 'parent_app',
  status junior_subscription_status NOT NULL DEFAULT 'trialing',

  stripe_subscription_ref TEXT,

  current_period_end TIMESTAMPTZ,
  started_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at       TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One subscription row per (player, paying-guardian) pair. Re-subscribe
  -- after cancel = the webhook UPDATEs the existing row (status back to
  -- 'active', new stripe_subscription_ref); we never insert a duplicate
  -- pair. A co-guardian later sponsoring the same child = a separate
  -- row with a different guardian_membership_id and is valid.
  UNIQUE (player_id, guardian_membership_id)
);

-- junior_revenue_share — club-level aggregate of parent-app subscription
-- revenue per period. NO player_id — this table sits above per-child
-- subscription rows; junior_subscriptions is the source of truth, this
-- is the per-period rollup the chairman dashboard shows and that Lumio
-- pays against.
--
-- club_id is a direct FK to sports_clubs; NO force trigger — there is
-- no player to derive club_id from; the club IS the subject.
--
-- period is free-form TEXT (e.g. '2026-09') so monthly / quarterly /
-- season cadences can coexist without schema change. The aggregator is
-- the canonical writer; format is its concern.
CREATE TABLE IF NOT EXISTS junior_revenue_share (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  club_id UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  period TEXT NOT NULL,                                  -- '2026-09' etc.

  gross_pence          INT          NOT NULL CHECK (gross_pence          >= 0),
  active_subscriptions INT          NOT NULL CHECK (active_subscriptions >= 0),
  club_share_pct       NUMERIC(5,2) NOT NULL CHECK (club_share_pct BETWEEN 0 AND 100),
  club_payout_pence    INT          NOT NULL CHECK (club_payout_pence    >= 0),

  status    junior_revenue_share_status NOT NULL DEFAULT 'pending',
  payout_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (club_id, period)
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────

-- junior_subscriptions. player_id is the leading column of the UNIQUE on
-- (player_id, guardian_membership_id), so its lookup is already
-- indexed. Add club_id + guardian_membership_id and two targeted
-- partials.
CREATE INDEX IF NOT EXISTS idx_junior_subscriptions_club
  ON junior_subscriptions(club_id);
CREATE INDEX IF NOT EXISTS idx_junior_subscriptions_guardian
  ON junior_subscriptions(guardian_membership_id);
-- Parent-app hot path: "my child's currently-live subscription".
CREATE INDEX IF NOT EXISTS idx_junior_subscriptions_player_active
  ON junior_subscriptions(player_id)
  WHERE status IN ('trialing','active');
-- Webhook lookup by Stripe subscription reference. Partial — the ref
-- is nullable while a row sits in 'trialing' before Stripe confirms.
CREATE INDEX IF NOT EXISTS idx_junior_subscriptions_stripe_ref
  ON junior_subscriptions(stripe_subscription_ref)
  WHERE stripe_subscription_ref IS NOT NULL;

-- junior_revenue_share. club_id is the leading column of the UNIQUE on
-- (club_id, period), so its lookup is already indexed. status is
-- low-cardinality; no extra index.

-- ─── updated_at TRIGGERS ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_junior_subscriptions_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_junior_subscriptions_updated_at ON junior_subscriptions;
CREATE TRIGGER trg_junior_subscriptions_updated_at
  BEFORE UPDATE ON junior_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_junior_subscriptions_updated_at();

CREATE OR REPLACE FUNCTION update_junior_revenue_share_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_junior_revenue_share_updated_at ON junior_revenue_share;
CREATE TRIGGER trg_junior_revenue_share_updated_at
  BEFORE UPDATE ON junior_revenue_share
  FOR EACH ROW EXECUTE FUNCTION update_junior_revenue_share_updated_at();

-- ─── FORCE-CLUB-ID TRIGGER ───────────────────────────────────────────────
-- junior_subscriptions has player_id → club_id is forced from the
-- player. junior_revenue_share has no player_id (club IS the subject)
-- → no force trigger.

DROP TRIGGER IF EXISTS trg_junior_subscriptions_force_club_id ON junior_subscriptions;
CREATE TRIGGER trg_junior_subscriptions_force_club_id
  BEFORE INSERT OR UPDATE ON junior_subscriptions
  FOR EACH ROW EXECUTE FUNCTION junior_force_club_id_from_player();

-- ─── RLS ──────────────────────────────────────────────────────────────────

-- ── junior_subscriptions ─────────────────────────────────────────────────
-- SERVICE-ROLE WRITES — RLS enabled, SELECT policy only, NO write
-- policy. Same model as junior_skills_framework (103): authenticated
-- and anon roles cannot INSERT / UPDATE / DELETE; the Stripe webhook
-- running as service_role bypasses RLS and is the sole writer.
--
-- SELECT branches:
--   (a) staff for the club, via junior_staff_club_ids() — chairman /
--       coach / team_manager / welfare_officer / academy_lead. Staff
--       need subscription state for collections, retention and
--       safeguarding-adjacent workflows.
--   (b) any guardian of the player, via junior_guardian_player_ids().
--       This covers BOTH the paying guardian themselves AND a
--       co-guardian on the same player (split households where one
--       parent pays but both should see the subscription). A separate
--       "guardian_membership_id matches my membership" branch would be
--       a strict subset of (b) and is therefore omitted.
ALTER TABLE junior_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Junior staff + guardians read subscriptions" ON junior_subscriptions;
CREATE POLICY "Junior staff + guardians read subscriptions"
  ON junior_subscriptions FOR SELECT
  USING (
    club_id   IN (SELECT * FROM junior_staff_club_ids())
    OR player_id IN (SELECT * FROM junior_guardian_player_ids())
  );

-- ── junior_revenue_share ─────────────────────────────────────────────────
-- SERVICE-ROLE WRITES — RLS enabled, SELECT policy only, NO write
-- policy. Revenue-share rows are computed by the Lumio billing
-- aggregator and written service-role only.
--
-- SELECT gated to junior_welfare_club_ids() — chairman + welfare_officer.
-- In practice this is chairman; welfare_officer seeing club payout
-- totals is harmless. Coaches, team managers, academy leads, parents
-- and the players themselves never see club-level revenue.
ALTER TABLE junior_revenue_share ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chairman + welfare read revenue share" ON junior_revenue_share;
CREATE POLICY "Chairman + welfare read revenue share"
  ON junior_revenue_share FOR SELECT
  USING (club_id IN (SELECT * FROM junior_welfare_club_ids()));

-- ─── STORAGE ──────────────────────────────────────────────────────────────
-- Private bucket for junior player photos and video clips. The
-- video_ref / thumbnail_ref / full_match_ref paths on
-- junior_video_clips (102) point here.
--
-- FAIL-CLOSED, SERVICE-ROLE-ACCESS-ONLY (interim model).
--   - Bucket is PRIVATE (public = false): no CDN, no anon read.
--   - NO storage.objects SELECT/INSERT/UPDATE/DELETE policy is created
--     for junior-media in this migration. With RLS enabled on
--     storage.objects and no junior-media policy present, NO
--     authenticated or anon user can read or write the bucket
--     directly — only service_role (which bypasses RLS) can.
--   - The SOLE legitimate reader path is a signed URL minted by
--     server code that has ALREADY evaluated the junior_video_clips
--     (102) consent gate (restricted = false AND film_consent =
--     true, with the no-junior_consent-row case failing closed).
--     The server proxy is the enforced mechanism, not one option
--     beside an open door. Same fail-closed posture as the two
--     tables in this migration.
--
-- Idempotent bucket creation via INSERT … ON CONFLICT on
-- storage.buckets.id — bucket id is the primary key and matches the
-- bucket name. Same pattern as 047 (logos) and 056b (profile-photos).
-- storage.buckets is just a regular Postgres table; no special
-- Supabase wrinkle for SQL-migration bucket creation.
--
-- DEFERRED — fine-grained per-child storage RLS, mirroring the
-- junior_video_clips consent gate at the FILE layer (path-based,
-- typically {club_id}/{player_id}/{clip_id}.ext, checking
-- junior_players.restricted = false AND a junior_consent row with
-- film_consent = true), is intentionally NOT installed here. The
-- final path layout and the video-hosting decision (direct Supabase
-- Storage vs. signed-URL proxy vs. external CDN) belong to
-- Workstream C. Until then ALL junior media reads MUST flow through
-- a server-minted signed URL whose issuance is gated by the
-- junior_video_clips SELECT predicate — never via a direct
-- authenticated storage read.

INSERT INTO storage.buckets (id, name, public)
VALUES ('junior-media', 'junior-media', false)
ON CONFLICT (id) DO NOTHING;
