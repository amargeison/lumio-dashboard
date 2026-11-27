-- Rollback for 240_impact_settings.sql. Run only with the 240 app code rolled back too.
--
-- Loses: the settings audit log, the export history and every venue's session length.
-- Erased families stay erased (that can't be undone); only their erased_at/erased_by marks go.
-- Bucket files are not deleted here: empty both buckets in Storage first, or keep them.
-- Check first:
--   select count(*) from impact_settings_log;
--   select count(*) from impact_exports;
--   select count(*) from tp_families where erased_at is not null;

begin;

drop function if exists impact_erase_family(uuid, uuid);
drop trigger if exists impact_orgs_log_settings on impact_orgs;
drop function if exists impact_orgs_log_settings();
drop function if exists impact_settings_section(text);
drop table if exists impact_settings_log;
drop table if exists impact_exports;
alter table tp_families drop column if exists erased_by;
alter table tp_families drop column if exists erased_at;
alter table tp_venues drop column if exists session_minutes;
delete from storage.buckets b where b.id in ('impact-org-assets', 'impact-exports')
  and not exists (select 1 from storage.objects o where o.bucket_id = b.id);

commit;

notify pgrst, 'reload schema';
