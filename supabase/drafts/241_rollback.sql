-- Rollback for 241_impact_erase_followups.sql: puts impact_erase_family back as 240 had it.
-- Run only with the 241 app code rolled back too. Loses nothing stored: what an erase
-- already cleared or deleted stays that way.

begin;

alter table impact_exports drop constraint if exists impact_exports_file_ok;
drop function if exists impact_user_deletable(uuid);

create or replace function impact_erase_family(p_hq uuid, p_family uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid(); kids uuid[]; n int; out jsonb := '{}'::jsonb;
begin
  if me is null or p_hq not in (select impact_hqs_for('hq')) then raise exception 'Not allowed.' using errcode = '42501'; end if;
  perform 1 from tp_families where id = p_family and hq_id = p_hq for update;
  if not found then raise exception 'No such family.' using errcode = 'P0002'; end if;
  if exists (select 1 from tp_families where id = p_family and erased_at is not null) then
    return jsonb_build_object('alreadyErased', true);
  end if;
  select coalesce(array_agg(id), '{}') into kids from tp_children where family_id = p_family and hq_id = p_hq;

  update tp_families set guardian_name = 'Erased family', guardian2_name = null, email = null, phone = null,
         emergency_contact = null, notes = null, email_bounce_reason = null,
         opt_in_email = false, opt_in_sms = false, opt_in_app = false, unsubscribed_at = coalesce(unsubscribed_at, now()),
         checkin_code = impact_new_checkin_code(), erased_at = now(), erased_by = me, updated_at = now()
   where id = p_family and hq_id = p_hq;

  update tp_children set name = 'Erased child', date_of_birth = null, class_name = null, gender = null, send = null,
         medical_notes = null, notes = null, photo_consent = false, updated_at = now()
   where id = any(kids) and hq_id = p_hq;
  out := out || jsonb_build_object('children', cardinality(kids));

  delete from impact_messages where hq_id = p_hq and (family_id = p_family or child_id = any(kids) or thread_key = 'family:' || p_family);
  get diagnostics n = row_count; out := out || jsonb_build_object('messages', n);
  delete from impact_threads where hq_id = p_hq and (family_id = p_family or thread_key = 'family:' || p_family);
  delete from tp_booklet_notes where hq_id = p_hq and family_id = p_family;
  delete from tp_booklet_scorecards where hq_id = p_hq and family_id = p_family;
  delete from impact_invites where hq_id = p_hq and family_id = p_family;
  update impact_members set revoked_at = coalesce(revoked_at, now()), invited_email = null
   where hq_id = p_hq and family_id = p_family;
  get diagnostics n = row_count; out := out || jsonb_build_object('parentLogins', n);

  update impact_campaign_recipients set provider_id = null, error = null where hq_id = p_hq and family_id = p_family;
  update tp_community_signups set ip_hash = null where hq_id = p_hq and family_id = p_family;
  update tp_qr_checkins set family_label = null, children_names = null, emergency_contact = null, device_id = null
   where hq_id = p_hq and family_id = p_family;
  update tp_impact_responses set comment = null, consent_publish = false
   where hq_id = p_hq and (family_id = p_family or child_id = any(kids));
  update tp_pack_issues set note = null where hq_id = p_hq and child_id = any(kids);
  update tp_pack_payments set reference = null where hq_id = p_hq and child_id = any(kids);
  update tp_volunteers set family_id = null where hq_id = p_hq and family_id = p_family;

  insert into impact_settings_log (hq_id, actor_id, section, source, diff)
  values (p_hq, me, 'data', 'server', jsonb_build_object('erasedFamily', p_family) || out);
  return out;
end $$;
revoke all on function impact_erase_family(uuid, uuid) from public, anon;
grant execute on function impact_erase_family(uuid, uuid) to authenticated;

drop function if exists impact_base_address(text);

-- impact_settings_section as 240 had it (without logoPath).
create or replace function impact_settings_section(k text) returns text language sql immutable as $$
  select case
    when k = 'modules' then 'modules'
    when k in ('messaging', 'sms') then 'messaging'
    when k in ('ai') then 'ai'
    when k in ('termDates', 'sessionDefaults') then 'venues'
    when k in ('integrations', 'twilio') then 'integrations'
    when k in ('org', 'orgUpper', 'legal', 'portal', 'hq', 'email', 'phone', 'address', 'town', 'domain', 'website',
               'logo', 'logoDark', 'logoAlt', 'favicon', 'faviconAlt', 'colours', 'tagline', 'hashtag', 'socialHandle',
               'shortName', 'charityNumber', 'charityStatus', 'privacyUrl', 'safeguarding',
               'volunteer', 'volunteers', 'volunteerUpper', 'volunteersUpper') then 'organisation'
    else 'other' end
$$;

commit;

notify pgrst, 'reload schema';
