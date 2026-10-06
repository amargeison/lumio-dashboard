-- ─────────────────────────────────────────────────────────────────────────────
-- Close the tables that only Lumio's own servers ever read.
--
-- SEPARATE FROM 193 ON PURPOSE. 193 changes rules inside the coach portal and
-- was tested end to end. This file reaches into every other Lumio product
-- (admin, workspaces, schools, football) and could only be checked here by
-- reading the code and re-running the signed-out sweep — nobody has clicked
-- through those products with it applied. Read the note below, then run it on
-- its own.
--
-- WHAT WAS WRONG. Dozens of tables had row level security switched OFF, so the
-- public key that ships in every browser could read and change them: the admin
-- user list, admin sign-in links, integration tokens, one-time codes, staff and
-- payroll records. The migrations that made those tables never switched it on
-- (095 says it relies on Supabase doing so by default; it does not for tables
-- created by SQL). A few more had it on but with a rule that says "everyone".
--
-- WHAT THIS DOES. Switches row level security on — with no rules added — for
-- the tables in section 1, and removes the "everyone" rule from the tables in
-- section 2. With no rule that lets them in, the browser roles (anon,
-- authenticated) get nothing. The service key is not subject to row level
-- security at all, so server code carries on exactly as before.
--
-- WHICH TABLES, AND WHY ONLY THESE. A table is here only if every piece of code
-- that touches it runs on the server and builds its database client from the
-- service key — or nothing touches it at all. The evidence, table by table and
-- file by file, is in /home/claude/qa/fix-dbrules/rls-audit.md. Tables that any
-- browser code, or any server code using the public key, reads or writes are
-- NOT here: they need real rules written first, and are listed in that audit
-- (businesses, business_employees, sports_demo_leads, the football_* tables
-- read through src/lib/football-data.ts, crm_contacts, crm_deals, the school_*
-- and hr_* tables …).
--
-- ONE THING TO CHECK BEFORE RUNNING IN PRODUCTION. Most of that server code
-- builds its client as
--     SUPABASE_SERVICE_ROLE_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY
-- so if the service key were ever missing from the server's environment those
-- routes would quietly fall back to the public key — and after this migration
-- they would then read nothing. The key has to be set already (sign-up, the
-- coach portal and the admin area all require it outright), but confirm
-- SUPABASE_SERVICE_ROLE_KEY is present on the server first.
--
-- Anything outside this repository that reads these tables with the PUBLIC key
-- (an automation, a spreadsheet, another app) would also stop. None is known.
--
-- Safe to run twice; skips any table that is not there. To undo for one table:
--     alter table <name> disable row level security;
-- ─────────────────────────────────────────────────────────────────────────────


-- ══ 1. Switch row level security on ═════════════════════════════════════════
do $$
declare t text;
begin
  foreach t in array array[
    -- Admin area: who the admins are, their sign-in links and sessions.
    'admin_users', 'admin_magic_links', 'admin_sessions', 'account_research',

    -- Workspaces: sessions, one-time codes, third-party tokens, staff records.
    'business_sessions', 'workspace_otps', 'integration_tokens',
    'workspace_staff', 'workspace_payroll', 'workspace_contacts',
    'workspace_employee_checklist', 'workspace_it_assets',
    'business_meetings', 'business_compliance_logs', 'business_finance_monthly',
    'activity_log', 'email_log', 'crm_merge_log',

    -- Football: everything read only through /api/football/* and /api/admin/*.
    'football_club_comparison_data', 'football_comparison_benchmarks',
    'football_competitor_metrics', 'football_fan_journey', 'football_fan_metrics',
    'football_match_reports', 'football_nps_surveys', 'football_player_injuries',
    'football_player_stats_history', 'football_season_tickets',
    'football_social_mentions', 'football_transfer_searches',
    'football_transfer_targets', 'gps_player_data', 'gps_sessions',

    -- No code reads these at all.
    'director_suite_items', 'slt_suite_items', 'football_tier_features',
    'onboarding_uploads', 'school_incidents',

    -- No code reads these directly either, and they already HAVE proper
    -- membership rules (migrations 095 and 096) that have never been in force
    -- because the switch was off. This turns those rules on.
    'sports_clubs', 'sports_memberships'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end $$;


-- ══ 2. Remove "everyone may" rules from tables only the server uses ═════════
-- These had row level security on, with a rule whose condition is simply
-- `true` — which is the same as having it off. school_magic_links (school
-- sign-in codes) and school_sessions were readable and writable signed out.
-- Only rules that are unconditional are removed; a rule with a real condition
-- is left exactly as it is.
do $$
declare t text; pol record;
begin
  foreach t in array array[
    -- Read and written only by server routes / server actions.
    'school_magic_links', 'school_sessions', 'school_cover_pool',
    'briefing_actions', 'business_imported_data',
    'crm_companies', 'crm_activities', 'crm_aria_insights', 'crm_pipeline_stages',
    -- No code reads these at all.
    'hr_contracts', 'partners', 'school_attendance_snapshots', 'school_communication_templates'
  ] loop
    if to_regclass('public.' || t) is null then continue; end if;
    for pol in
      select p.policyname
      from pg_policies p
      where p.schemaname = 'public' and p.tablename = t
        and not ('service_role' = any (p.roles))
        and coalesce(p.qual, 'true') = 'true'
        and coalesce(p.with_check, 'true') = 'true'
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;
    -- In case it was off here too.
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
