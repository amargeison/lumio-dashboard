-- Sports invite tokens — magic-link tokens for the accept-invite flow.
-- One token per outstanding invite. Resending invalidates the old
-- token (mechanism lives in the API — see /api/sports-admin/resend-invite)
-- and creates a new one.
--
-- Writers:
--   - /api/sports-admin/invite (service role) — issues token on invite
--   - /api/sports-auth/accept-invite (service role) — consumes token
--   - /api/sports-admin/resend-invite (service role) — invalidates old + issues new
-- Readers:
--   - Service role ONLY. This table contains opaque tokens that grant
--     account-creation rights and must never reach the browser via
--     PostgREST. RLS is enabled with no policies so anon/authenticated
--     roles get zero rows; service-role callers bypass RLS.
--
-- See docs/specs/path-b-rbac-architecture.md ("Migration 092" in spec, 093 here).

CREATE TABLE IF NOT EXISTS sports_invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  membership_id UUID NOT NULL REFERENCES sports_memberships(id) ON DELETE CASCADE,

  -- UUID is implicitly UNIQUE (constraint creates a backing B-tree
  -- index — no explicit idx_invite_tokens_token needed).
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,

  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  consumed_at TIMESTAMPTZ,
  consumed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  email_sent_at TIMESTAMPTZ,
  email_resent_count INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Defensive guard against an API caller passing expires_at in the
  -- past at INSERT time. The DEFAULT (NOW() + 7 days) already lands
  -- safely; this CHECK catches explicit overrides that don't.
  CONSTRAINT sports_invite_tokens_expires_after_created
    CHECK (expires_at > created_at)
);

-- No idx_invite_tokens_token — token has UNIQUE which gives an
-- implicit B-tree index. Email and membership_id are the lookup
-- paths the accept-invite + resend-invite APIs need.
CREATE INDEX IF NOT EXISTS idx_invite_tokens_email
  ON sports_invite_tokens(email);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_membership
  ON sports_invite_tokens(membership_id);

-- No updated_at column or trigger by design. Tokens are write-once
-- in normal flow: created on invite, optionally mutated once when
-- the link is clicked (consumed_at + consumed_by_user_id) or when
-- the email is resent (email_sent_at + email_resent_count). The
-- explicit consumed_at IS the "this token is done" signal — a
-- separate updated_at would only duplicate that information.

-- RLS enabled with no policies. This denies all access to anon and
-- authenticated roles via PostgREST, while service-role callers (the
-- accept-invite / resend-invite API routes) bypass RLS and read/write
-- normally. Pattern mirrors 089_lumio_waitlist.sql and 090_page_views.sql.
ALTER TABLE sports_invite_tokens ENABLE ROW LEVEL SECURITY;
