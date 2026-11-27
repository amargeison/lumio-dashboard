-- 240: Settings (brief 5). Settings → the Coach-style panel with sections. Most of it is
-- app code and impact_orgs.settings (jsonb, no schema): organisation details, colours,
-- charity number, safeguarding lead, term dates, Twilio on/off, AI feature switches.
-- This migration adds only what can't live in that jsonb:
--
--   1. impact_settings_log: who changed which section, when, and what (old → new).
--      a) Every change to impact_orgs.settings is logged by a trigger, so a browser save
--         can't skip it and can't name someone else as the author.
--      b) The app adds rows for sections stored elsewhere (booklet, venues, people…),
--         always as the signed-in user.
--      c) Data events (export, erase) are written by the server or the erase function.
--      Append-only: nobody edits or deletes a row from the browser.
--   2. tp_venues.session_minutes: default session length per venue (day, time and
--      capacity already exist).
--   3. Logo upload: private bucket impact-org-assets (PNG, JPEG or WebP, 2 MB; no SVG,
--      which can carry script). No storage policies, as with booklets: the server uploads
--      with the service key and serves the logo through the app.
--   4. "Export everything": private bucket impact-exports (ZIP, 50 MB) and
--      impact_exports, one row per export. The server builds the ZIP and emails a
--      link that expires after 7 days; the file is deleted then.
--   5. Erase a family (GDPR): impact_erase_family(hq, family). It anonymises the
--      family and its children in this org, deletes their messages, threads, booklet
--      notes and invites, and revokes parent logins. Attendance, sign-up dates, campaign
--      counts and the like stay, so totals don't change. It logs who and when, with no
--      names. It can't be undone.
--
-- Apply after 239. One transaction: if anything fails, nothing changes. Safe to run twice.

begin;

-- ── 1. Settings audit log ───────────────────────────────────────────────────
create table if not exists impact_settings_log (
  id        uuid primary key default gen_random_uuid(),
  hq_id     uuid not null references auth.users(id) on delete cascade,
  actor_id  uuid default auth.uid() references auth.users(id) on delete set null,   -- null = Lumio (SQL or the server)
  section   text not null check (section in ('organisation', 'people', 'modules', 'messaging', 'booklet', 'venues', 'data', 'integrations', 'ai', 'other')),
  source    text not null default 'app' check (source in ('auto', 'app', 'server')),
  diff      jsonb not null default '{}'::jsonb check (jsonb_typeof(diff) = 'object' and pg_column_size(diff) <= 32768),
  at        timestamptz not null default now()
);
create index if not exists idx_impact_settings_log_hq on impact_settings_log (hq_id, at desc);

alter table impact_settings_log enable row level security;
drop policy if exists impact_settings_log_hq_reads on impact_settings_log;
create policy impact_settings_log_hq_reads on impact_settings_log for select to authenticated
  using (hq_id in (select impact_hqs_for('hq')));
-- The browser logs its own saves to sections kept outside impact_orgs.settings: always as
-- itself, never 'auto' or 'server', never a data event.
drop policy if exists impact_settings_log_hq_adds on impact_settings_log;
create policy impact_settings_log_hq_adds on impact_settings_log for insert to authenticated
  with check (hq_id in (select impact_hqs_for('hq')) and actor_id = auth.uid() and source = 'app' and section <> 'data');
revoke all on impact_settings_log from public, anon, authenticated;
grant select on impact_settings_log to authenticated;
grant insert (hq_id, section, diff) on impact_settings_log to authenticated;

-- Which section a top-level settings key belongs to.
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

-- One row per section changed: { key: { from, to } }. A diff too big to keep lists the keys only.
create or replace function impact_orgs_log_settings() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  k text; sec text; diffs jsonb := '{}'::jsonb; d jsonb;
  actor uuid := nullif(coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', ''), '')::uuid;
begin
  if new.settings is not distinct from old.settings then return new; end if;
  for k in select jsonb_object_keys(coalesce(old.settings, '{}'::jsonb)) union select jsonb_object_keys(coalesce(new.settings, '{}'::jsonb)) loop
    if (old.settings -> k) is distinct from (new.settings -> k) then
      sec := impact_settings_section(k);
      diffs := jsonb_set(diffs, array[sec], coalesce(diffs -> sec, '{}'::jsonb)
                 || jsonb_build_object(k, jsonb_build_object('from', old.settings -> k, 'to', new.settings -> k)));
    end if;
  end loop;
  for sec, d in select * from jsonb_each(diffs) loop
    if pg_column_size(d) > 16384 then
      d := jsonb_build_object('truncated', true, 'keys', (select jsonb_agg(x) from jsonb_object_keys(d) x));
    end if;
    insert into impact_settings_log (hq_id, actor_id, section, source, diff) values (new.hq_id, actor, sec, 'auto', d);
  end loop;
  return new;
end $$;
revoke all on function impact_orgs_log_settings() from public, anon, authenticated;

drop trigger if exists impact_orgs_log_settings on impact_orgs;
create trigger impact_orgs_log_settings after update of settings on impact_orgs
  for each row execute function impact_orgs_log_settings();

-- ── 2. Default session length per venue ─────────────────────────────────────
alter table tp_venues add column if not exists session_minutes int check (session_minutes is null or session_minutes between 15 and 480);

-- ── 3. Logo uploads ─────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('impact-org-assets', 'impact-org-assets', false, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 2097152, allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

-- ── 4. Export everything ────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('impact-exports', 'impact-exports', false, 52428800, array['application/zip'])
on conflict (id) do update set public = false, file_size_limit = 52428800, allowed_mime_types = array['application/zip'];

create table if not exists impact_exports (
  id           uuid primary key default gen_random_uuid(),
  hq_id        uuid not null references auth.users(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  status       text not null default 'building' check (status in ('building', 'ready', 'failed', 'expired')),
  path         text check (char_length(path) <= 300),      -- in impact-exports: '<hq_id>/<id>.zip'
  bytes        bigint check (bytes is null or bytes >= 0),
  tables       jsonb not null default '{}'::jsonb,          -- { table: row count }
  error        text check (char_length(error) <= 500),
  created_at   timestamptz not null default now(),
  ready_at     timestamptz,
  expires_at   timestamptz not null default now() + interval '7 days'
);
create index if not exists idx_impact_exports_hq on impact_exports (hq_id, created_at desc);
create index if not exists idx_impact_exports_expiry on impact_exports (expires_at) where status = 'ready';
alter table impact_exports enable row level security;
drop policy if exists impact_exports_hq_reads on impact_exports;
create policy impact_exports_hq_reads on impact_exports for select to authenticated using (hq_id in (select impact_hqs_for('hq')));
-- Built, sent and expired only by the server.
revoke all on impact_exports from public, anon, authenticated;
grant select on impact_exports to authenticated;

-- ── 5. Erase a family (GDPR) ────────────────────────────────────────────────
alter table tp_families add column if not exists erased_at timestamptz;
alter table tp_families add column if not exists erased_by uuid references auth.users(id) on delete set null;

-- Called as the HQ (or an admin of it) from the signed-in session; the caller is the actor.
-- Everything is limited to this org's rows. Returns what was cleared or removed (counts only).
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

  -- Children: no name, birth date, class, gender, SEND, medical or notes. Year group, school,
  -- programme, FSM and pupil premium stay, so the demographics totals still add up.
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

  -- Rows kept for the totals, with anything personal cleared.
  update impact_campaign_recipients set provider_id = null, error = null where hq_id = p_hq and family_id = p_family;
  update tp_community_signups set ip_hash = null where hq_id = p_hq and family_id = p_family;
  update tp_qr_checkins set family_label = null, children_names = null, emergency_contact = null, device_id = null
   where hq_id = p_hq and family_id = p_family;
  update tp_impact_responses set comment = null, consent_publish = false
   where hq_id = p_hq and (family_id = p_family or child_id = any(kids));
  update tp_pack_issues set note = null where hq_id = p_hq and child_id = any(kids);
  update tp_pack_payments set reference = null where hq_id = p_hq and child_id = any(kids);
  -- A volunteer is their own record; only the link to this family goes.
  update tp_volunteers set family_id = null where hq_id = p_hq and family_id = p_family;

  insert into impact_settings_log (hq_id, actor_id, section, source, diff)
  values (p_hq, me, 'data', 'server', jsonb_build_object('erasedFamily', p_family) || out);
  return out;
end $$;
revoke all on function impact_erase_family(uuid, uuid) from public, anon;
grant execute on function impact_erase_family(uuid, uuid) to authenticated;

commit;

notify pgrst, 'reload schema';

-- Check (read-only):
--   select table_name from information_schema.tables where table_name in ('impact_settings_log', 'impact_exports');
--   select id, public, file_size_limit, allowed_mime_types from storage.buckets where id in ('impact-org-assets', 'impact-exports');
--   select column_name from information_schema.columns where table_name = 'tp_families' and column_name in ('erased_at', 'erased_by');
--   select column_name from information_schema.columns where table_name = 'tp_venues' and column_name = 'session_minutes';
--   select proname from pg_proc where proname in ('impact_erase_family', 'impact_orgs_log_settings', 'impact_settings_section');
