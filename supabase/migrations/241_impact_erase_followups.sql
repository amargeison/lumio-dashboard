-- 241: follow-ups to 240's erase and exports. 240 is applied and stays as it is.
--
--   1. impact_erase_family clears more on each child: free school meals and pupil premium
--      too. Kept: year group, school, programme and attendance, plus fee status, fee amount
--      and stickers (the accounts and outcome figures need them; not identifying once the
--      names are gone).
--   2. Before it clears the family's email addresses, it deletes this org's unlinked
--      "Not a family here" emails from them. "From them" means the same address, or the
--      same address once any +tag is stripped on both sides, in the thread key or the
--      sender address; it checks the family's email and any invite addresses. The count goes in the log row.
--   3. It returns the parent logins it revoked. The server route then checks each with
--      impact_user_deletable() and, when that says yes, deletes the user through the
--      Supabase admin API and logs it. The check is deliberately cautious: a user is
--      deletable only when nothing anywhere still points at them through a foreign key,
--      apart from their revoked Impact memberships and two audit columns. Any Coach
--      academy, Coach player or parent link, other Impact access, or anything else keeps
--      the user.
--   4. impact_exports: a ready export has a file and a time; an expired one has no file
--      (the scheduler deletes the ZIP, then marks the row expired). Who may request an
--      export, and that the link goes only to the requester's own sign-in email, is
--      enforced in the server route.
--
--   5. The settings log files an uploaded logo's storage path (logoPath) under
--      Organisation, with the logo itself, rather than "other".
--
-- One transaction: if anything fails, nothing changes. Safe to run twice.

begin;

-- ── 5. Section for logoPath ─────────────────────────────────────────────────
create or replace function impact_settings_section(k text) returns text language sql immutable as $$
  select case
    when k = 'modules' then 'modules'
    when k in ('messaging', 'sms') then 'messaging'
    when k in ('ai') then 'ai'
    when k in ('termDates', 'sessionDefaults') then 'venues'
    when k in ('integrations', 'twilio') then 'integrations'
    when k in ('org', 'orgUpper', 'legal', 'portal', 'hq', 'email', 'phone', 'address', 'town', 'domain', 'website',
               'logo', 'logoDark', 'logoPath', 'logoAlt', 'favicon', 'faviconAlt', 'colours', 'tagline', 'hashtag', 'socialHandle',
               'shortName', 'charityNumber', 'charityStatus', 'privacyUrl', 'safeguarding',
               'volunteer', 'volunteers', 'volunteerUpper', 'volunteersUpper') then 'organisation'
    else 'other' end
$$;

-- ── 2. The +tag-free form of an address (same rule as baseAddress in inbound.ts) ──
create or replace function impact_base_address(e text) returns text language sql immutable as $$
  select case when position('@' in x) < 2 then x
              else split_part(split_part(x, '@', 1), '+', 1) || '@' || split_part(x, '@', 2) end
    from (select lower(trim(coalesce(e, ''))) as x) s
$$;

-- ── 3. Can this auth user be deleted? (service key only) ────────────────────
create or replace function impact_user_deletable(p_user uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare r record; hit boolean;
begin
  if p_user is null or not exists (select 1 from auth.users where id = p_user) then return false; end if;
  for r in
    select c.conrelid::regclass as tbl, n.nspname as sch, cl.relname as rel, a.attname as col
      from pg_constraint c
      join pg_class cl on cl.oid = c.conrelid
      join pg_namespace n on n.oid = cl.relnamespace
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
     where c.contype = 'f' and c.confrelid = 'auth.users'::regclass and n.nspname <> 'auth'
  loop
    -- Audit columns only record who did something; they don't give access.
    continue when (r.sch, r.rel, r.col) in (('public', 'impact_settings_log', 'actor_id'), ('public', 'tp_families', 'erased_by'));
    if (r.sch, r.rel, r.col) = ('public', 'impact_members', 'user_id') then
      execute format('select exists (select 1 from %s where %I = $1 and revoked_at is null)', r.tbl, r.col) into hit using p_user;
    else
      execute format('select exists (select 1 from %s where %I = $1)', r.tbl, r.col) into hit using p_user;
    end if;
    if hit then return false; end if;
  end loop;
  return true;
end $$;
revoke all on function impact_user_deletable(uuid) from public, anon, authenticated;
grant execute on function impact_user_deletable(uuid) to service_role;

-- ── 1–3. Erase ──────────────────────────────────────────────────────────────
create or replace function impact_erase_family(p_hq uuid, p_family uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid(); kids uuid[]; bases text[]; users uuid[]; n int; out jsonb := '{}'::jsonb;
begin
  if me is null or p_hq not in (select impact_hqs_for('hq')) then raise exception 'Not allowed.' using errcode = '42501'; end if;
  perform 1 from tp_families where id = p_family and hq_id = p_hq for update;
  if not found then raise exception 'No such family.' using errcode = 'P0002'; end if;
  if exists (select 1 from tp_families where id = p_family and erased_at is not null) then
    return jsonb_build_object('alreadyErased', true);
  end if;
  select coalesce(array_agg(id), '{}') into kids from tp_children where family_id = p_family and hq_id = p_hq;

  -- Their addresses, before they're cleared: the family's own, and any invite sent to them.
  select coalesce(array_agg(distinct impact_base_address(e)) filter (where position('@' in coalesce(e, '')) > 1), '{}') into bases from (
    select email as e from tp_families where id = p_family and hq_id = p_hq
    union all select email from impact_invites where hq_id = p_hq and family_id = p_family
    union all select invited_email from impact_members where hq_id = p_hq and family_id = p_family
  ) s;
  delete from impact_messages
   where hq_id = p_hq and family_id is null and thread_key like 'email:%'
     and (impact_base_address(substr(thread_key, 7)) = any(bases) or impact_base_address(from_address) = any(bases));
  get diagnostics n = row_count; out := out || jsonb_build_object('unlinkedEmails', n);

  update tp_families set guardian_name = 'Erased family', guardian2_name = null, email = null, phone = null,
         emergency_contact = null, notes = null, email_bounce_reason = null,
         opt_in_email = false, opt_in_sms = false, opt_in_app = false, unsubscribed_at = coalesce(unsubscribed_at, now()),
         checkin_code = impact_new_checkin_code(), erased_at = now(), erased_by = me, updated_at = now()
   where id = p_family and hq_id = p_hq;

  -- Children: year group, school, programme, attendance, fee status/amount and stickers are kept.
  update tp_children set name = 'Erased child', date_of_birth = null, class_name = null, gender = null, send = null,
         fsm = null, pupil_premium = null,
         medical_notes = null, notes = null, photo_consent = false, updated_at = now()
   where id = any(kids) and hq_id = p_hq;
  out := out || jsonb_build_object('children', cardinality(kids));

  delete from impact_messages where hq_id = p_hq and (family_id = p_family or child_id = any(kids) or thread_key = 'family:' || p_family);
  get diagnostics n = row_count; out := out || jsonb_build_object('messages', n);
  delete from impact_threads where hq_id = p_hq and (family_id = p_family or thread_key = 'family:' || p_family);
  delete from tp_booklet_notes where hq_id = p_hq and family_id = p_family;
  delete from tp_booklet_scorecards where hq_id = p_hq and family_id = p_family;
  delete from impact_invites where hq_id = p_hq and family_id = p_family;
  with r as (
    update impact_members set revoked_at = coalesce(revoked_at, now()), invited_email = null
     where hq_id = p_hq and family_id = p_family returning user_id)
  select coalesce(array_agg(distinct user_id), '{}') into users from r;
  out := out || jsonb_build_object('parentLogins', cardinality(users));

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
  -- The revoked logins go back to the server route (not into the log), which deletes any
  -- that impact_user_deletable() clears.
  return out || jsonb_build_object('revokedUsers', to_jsonb(users));
end $$;
revoke all on function impact_erase_family(uuid, uuid) from public, anon;
grant execute on function impact_erase_family(uuid, uuid) to authenticated;

-- ── 4. Exports: ready has a file; expired has none ──────────────────────────
alter table impact_exports drop constraint if exists impact_exports_file_ok;
alter table impact_exports add constraint impact_exports_file_ok check (
  (status <> 'ready' or (path is not null and ready_at is not null)) and (status <> 'expired' or path is null));

commit;

notify pgrst, 'reload schema';

-- Check (read-only):
--   select proname from pg_proc where proname in ('impact_base_address', 'impact_user_deletable');
--   select conname from pg_constraint where conname = 'impact_exports_file_ok';
