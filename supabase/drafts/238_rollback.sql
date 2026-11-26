-- Rollback for 238_impact_communications.sql. Drops the new tables (recipients, threads,
-- automations and their sends, AI usage, scheduler, provider events) and columns, and
-- puts impact_campaigns' policy and status list back as 222/228 left them. Campaign rows
-- in a status 222 doesn't allow are set back to 'draft' first.
begin;
drop function if exists impact_parent_reply(uuid, text);
drop function if exists impact_scheduler_claim(text, uuid, int);
drop function if exists impact_scheduler_release(text, uuid);
drop table if exists impact_provider_events;
drop table if exists impact_scheduler_runs;
drop table if exists impact_scheduler_leases;
drop table if exists impact_ai_usage;
drop table if exists impact_automation_sends;
drop table if exists impact_automations;
drop policy if exists impact_messages_coach_reads on impact_messages;
drop table if exists impact_threads;
drop index if exists impact_messages_external_key;
drop index if exists idx_impact_messages_unread;
alter table impact_messages drop column if exists campaign_id;
alter table impact_messages drop column if exists from_address;
alter table impact_messages drop column if exists external_id;
alter table impact_messages drop column if exists read_at;
drop trigger if exists impact_family_email_changed on tp_families;
drop function if exists impact_family_email_changed();
alter table tp_families drop column if exists email_bounce_reason;
alter table tp_families drop column if exists email_bounced_at;
drop table if exists impact_campaign_recipients;
drop trigger if exists impact_campaign_guard on impact_campaigns;
drop function if exists impact_campaign_guard();
drop policy if exists impact_campaigns_hq_reads on impact_campaigns;
drop policy if exists impact_campaigns_hq_adds on impact_campaigns;
drop policy if exists impact_campaigns_hq_edits on impact_campaigns;
drop policy if exists impact_campaigns_hq_drops on impact_campaigns;
drop policy if exists impact_campaigns_hq on impact_campaigns;
create policy impact_campaigns_hq on impact_campaigns for all to authenticated using (hq_id in (select impact_hqs_for('hq'))) with check (hq_id in (select impact_hqs_for('hq')));
drop index if exists idx_impact_campaigns_due;
update impact_campaigns set status = 'draft' where status not in ('draft', 'scheduled', 'sent');
alter table impact_campaigns drop constraint if exists impact_campaigns_status_check;
alter table impact_campaigns add constraint impact_campaigns_status_check check (status in ('draft', 'scheduled', 'sent'));
alter table impact_campaigns drop column if exists error;
alter table impact_campaigns drop column if exists created_by;
alter table impact_campaigns drop column if exists sections;
alter table impact_campaigns drop column if exists preheader;
alter table impact_campaigns drop column if exists subject;
alter table impact_campaigns drop column if exists kind;
commit;
notify pgrst, 'reload schema';
