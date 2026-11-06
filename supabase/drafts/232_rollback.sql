-- ROLLBACK for 232_impact_parent_resubscribe.sql. Run by hand in the SQL editor only if 232
-- has to be undone. Puts impact_parent_home() and impact_parent_update_family() back as
-- 229 and 228 left them. Safe to run twice. A family that has already opted back in stays
-- opted back in. The app that sends p_resubscribe can't save a parent's details after this.

begin;

create or replace function impact_parent_home() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', f.id, 'hq_id', f.hq_id, 'guardian_name', f.guardian_name, 'guardian2_name', f.guardian2_name, 'email', f.email, 'phone', f.phone,
    'emergency_contact', f.emergency_contact, 'consent_data', f.consent_data, 'consent_photo', f.consent_photo,
    'opt_in_email', f.opt_in_email, 'opt_in_sms', f.opt_in_sms, 'opt_in_app', f.opt_in_app,
    'children', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'date_of_birth', c.date_of_birth, 'year_group', c.year_group, 'stickers', c.stickers, 'photo_consent', c.photo_consent,
      'school', (select s.name from tp_schools s where s.id = c.school_id and s.hq_id = f.hq_id),
      'sessions', (select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'kind', x.kind, 'session_date', x.session_date, 'week_number', x.week_number, 'venue', (select v.name from tp_venues v where v.id = x.venue_id and v.hq_id = f.hq_id)) order by x.session_date), '[]'::jsonb)
        from tp_sessions x where x.hq_id = f.hq_id and (x.programme_id = c.programme_id or x.id in (select a.session_id from tp_attendance a where a.child_id = c.id)))
    ) order by c.name), '[]'::jsonb) from tp_children c where c.family_id = f.id and c.hq_id = f.hq_id)
  )), '[]'::jsonb)
  from tp_families f where f.id in (select impact_my_families())
$$;

drop function if exists impact_parent_update_family(uuid, text, text, text, boolean, boolean, boolean, boolean, boolean, boolean);

create or replace function impact_parent_update_family(
  p_family uuid, p_email text, p_phone text, p_emergency_contact text,
  p_consent_data boolean, p_consent_photo boolean, p_opt_in_email boolean, p_opt_in_sms boolean, p_opt_in_app boolean
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_family is null or p_family not in (select impact_my_families()) then raise exception 'That family could not be found.'; end if;
  update tp_families set email = nullif(btrim(p_email), ''), phone = nullif(btrim(p_phone), ''), emergency_contact = nullif(btrim(p_emergency_contact), ''),
    consent_data = p_consent_data, consent_photo = p_consent_photo, opt_in_email = p_opt_in_email, opt_in_sms = p_opt_in_sms, opt_in_app = p_opt_in_app,
    consent_at = case when consent_data is distinct from p_consent_data or consent_photo is distinct from p_consent_photo then now() else consent_at end,
    updated_at = now()
  where id = p_family;
end $$;

revoke all on function impact_parent_update_family(uuid, text, text, text, boolean, boolean, boolean, boolean, boolean) from public, anon;
grant execute on function impact_parent_update_family(uuid, text, text, text, boolean, boolean, boolean, boolean, boolean) to authenticated;

commit;

notify pgrst, 'reload schema';
