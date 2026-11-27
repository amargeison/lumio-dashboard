-- Rollback for 239_impact_plan_changes.sql. Run only with the 239 app code rolled back too.
--
-- Loses: every family's weekend_too answer, every Coaches & providers lead, and the
-- school-programme-week automation (its sends go with it, by cascade). Check first:
--   select count(*) from tp_families where weekend_too;
--   select count(*) from impact_leads where pipeline = 'providers';
--   select count(*) from impact_automations where kind = 'programme_week';

begin;

update impact_orgs
   set settings = jsonb_set(settings, '{modules}', (settings -> 'modules') - 'tenors' - 'qr_checkin' - 'public_fundraising')
                  || '{"volunteer": "TENOR", "volunteers": "TENORs"}'::jsonb
 where slug = 'ten-project';

delete from impact_automations where kind = 'programme_week';
alter table impact_automations drop constraint if exists impact_automations_kind_ok;
alter table impact_automations add constraint impact_automations_kind_ok
  check (kind in ('welcome', 'session_reminder', 'missed_you', 'pack_issued', 'booklet_nudge'));

delete from impact_leads where pipeline = 'providers';
alter table impact_leads drop constraint if exists impact_leads_pipeline_ok;
alter table impact_leads add constraint impact_leads_pipeline_ok check (pipeline in ('schools', 'funders'));

alter table tp_families drop column if exists weekend_too;

commit;
