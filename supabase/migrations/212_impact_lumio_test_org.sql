-- DRAFT — for review; apply by hand after 211_impact_orgs.sql.
--
-- 212_impact_lumio_test_org.sql
-- Lumio's own empty test portal at /impact/lumio-test: a separate org with its
-- own HQ login, fully isolated from /impact/ten-project.
--   • Branding/modules: its own impact_orgs row — generic, nothing pre-filled.
--   • Data: every tp_* row is RLS-scoped to hq_id = auth.uid(), so this login
--     only ever sees/writes its own rows; Ten Project's HQ never sees them.
--   • Access: the portal treats a signed-in Impact HQ as this org's HQ only if
--     impact_orgs.hq_id matches; anyone else is refused at this address.

insert into impact_orgs (slug, settings) values ('lumio-test', '{"modules": {}}'::jsonb)
on conflict (slug) do nothing;

-- ── After creating the login ────────────────────────────────────────────────
-- 1. Supabase → Authentication → Users → Add user → email + password
--    (use an address you control, e.g. impact-test@lumiosports.com; tick
--    "Auto confirm user").
-- 2. Run, replacing the email:
--
--   insert into sports_profiles (id, sport, display_name, brand_name, portal_slug, onboarding_complete)
--     select id, 'impact', 'Lumio Test HQ', 'Lumio Test', 'lumio-test', true
--     from auth.users where email = 'impact-test@lumiosports.com'
--     on conflict (id) do update set sport = 'impact', portal_slug = 'lumio-test';
--
--   update impact_orgs set hq_id = (select id from auth.users where email = 'impact-test@lumiosports.com')
--     where slug = 'lumio-test';
--
-- 3. Sign in at https://www.lumiosports.com/sports-login with that email, then
--    open https://www.lumiosports.com/impact/lumio-test — you're its HQ:
--    Settings → Organisation / Modules are editable and saved for this org only.
