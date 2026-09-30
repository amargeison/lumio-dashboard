-- ─────────────────────────────────────────────────────────────────────────────
-- Founder period: every module on for every academy.
--
-- New accounts used to start on Pro Lite (Racket Progression only), which hid
-- Video & Audio and Effort & Rewards from founding coaches who were promised
-- everything. The code default is now NEW_ACCOUNT_TIER = 'elite'
-- (src/app/coach/[slug]/_lib/feature-flags.ts); this switches the academies
-- that already exist on too.
--
-- coach_settings.data.features is the server's copy of a coach's module flags.
-- The portal loads it on every visit, and the player app reads it to decide
-- what a family sees. Only that key changes; every other setting is kept.
--
-- When payments go live, set NEW_ACCOUNT_TIER to 'essential' in the code. Do
-- not re-run this.
-- ─────────────────────────────────────────────────────────────────────────────

update coach_settings
set data = jsonb_set(coalesce(data, '{}'::jsonb), '{features}',
                     '{"effort": true, "video": true, "audio": true, "racket": true}'::jsonb, true),
    updated_at = now();
