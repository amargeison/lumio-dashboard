-- 239: changes from the Ten Project website, portal & app plan (Harry's review).
--
--   1. Modules: no schema. Settings → Modules gains "QR check-in" (qr_checkin) and
--      "Public fundraising pages" (public_fundraising) beside the existing Volunteers
--      module (id 'tenors', labelled with the org's own term). Missing = on, so every
--      other org, Lumio Test and the demo stay as they are. Ten Project: all three off.
--   2. tp_families.weekend_too: a school family who says they'll come to the weekend
--      sessions too ("TENOR" in Ten Project's old forms). Shown on Families and
--      Community; Insights counts it as school → weekend intent. Ten Project's volunteer
--      term becomes "Volunteer" / "Volunteers" (it was TENOR / TENORs), because TENOR
--      now means this flag, not a volunteer.
--   4. Leads: a third pipeline, 'providers' (Coaches & providers).
--   5. Automations: a new kind, 'programme_week' (school programme week N), off until
--      HQ switches it on. Each week 1–10 goes once per family (step 'pweek:<programme>:<n>').
--
-- No table, policy or function is added; tp_families' existing HQ-only policies cover the
-- new column. Nothing is backfilled: weekend_too starts false for everyone.
--
-- Apply this before deploying the app that reads these columns.
-- One transaction: if anything fails, nothing changes. Safe to run twice.

begin;

-- ── 2. School family coming at weekends too ─────────────────────────────────
alter table tp_families add column if not exists weekend_too boolean not null default false;

-- ── 4. Leads: Coaches & providers ───────────────────────────────────────────
alter table impact_leads drop constraint if exists impact_leads_pipeline_ok;
alter table impact_leads add constraint impact_leads_pipeline_ok check (pipeline in ('schools', 'funders', 'providers'));

-- ── 5. Automations: school programme week N ─────────────────────────────────
-- 238 declared the kind check inline, so Postgres named it; drop whichever check mentions kind.
do $$
declare c record;
begin
  for c in select conname from pg_constraint
           where conrelid = 'impact_automations'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%kind%'
  loop
    execute format('alter table impact_automations drop constraint %I', c.conname);
  end loop;
end $$;
alter table impact_automations add constraint impact_automations_kind_ok
  check (kind in ('welcome', 'session_reminder', 'missed_you', 'pack_issued', 'booklet_nudge', 'programme_week'));

-- ── 1 + 2. Ten Project's settings only ──────────────────────────────────────
update impact_orgs
   set settings = jsonb_set(coalesce(settings, '{}'::jsonb), '{modules}',
                            coalesce(settings -> 'modules', '{}'::jsonb) || '{"tenors": false, "qr_checkin": false, "public_fundraising": false}'::jsonb)
                  || '{"volunteer": "Volunteer", "volunteers": "Volunteers"}'::jsonb
 where slug = 'ten-project';

commit;

-- Check (read-only):
--   select slug, settings->'modules', settings->>'volunteer', settings->>'volunteers' from impact_orgs order by slug;
--   select column_name, data_type, column_default from information_schema.columns where table_name = 'tp_families' and column_name = 'weekend_too';
--   select conname, pg_get_constraintdef(oid) from pg_constraint where conname in ('impact_leads_pipeline_ok', 'impact_automations_kind_ok');
