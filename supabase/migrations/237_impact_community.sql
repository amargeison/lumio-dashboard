-- DRAFT — for review; apply by hand in the SQL editor. Rollback: supabase/drafts/237_rollback.sql
--
-- 237_impact_community.sql
-- Community: families at the weekend community sessions, whether they came from a
-- school or signed up directly.
--
--   1. tp_families: source, community_venue_id, signed_up_at, lapsed_at, waitlisted_at,
--      and checkin_code (the family QR: random, unique in the org, given to every
--      family, existing ones included).
--   2. tp_venues.capacity (a venue at capacity puts new sign-ups on its waiting list).
--   3. tp_community_signups: the GDPR audit trail of each sign-up (channel, consent
--      text version, hashed IP). Read-only to the HQ; the public /join form writes it
--      server-side. Stamped by imports like the other tables, so undo covers it.
--   4. tp_weekend_intents: a family's "We're coming" / "Not this week" for a date at
--      a venue. Parents set their own through impact_parent_set_intent.
--   5. impact_family_checkin: scanning a family's QR records attendance for each of
--      its children at that day's weekend session at the venue (made if there is
--      none). Allowed for the org's HQ (and admins) and for coaches who run sessions
--      at that venue. Volunteers have no logins today, so they scan on an HQ or coach
--      device, as the Volunteer view is used now.
--   6. impact_weekend_day: the volunteer view's numbers for a venue and date —
--      checked in, expected ("We're coming"), not coming.
--   7. impact_parent_weekend: the parent app's "Your weekend session" card — venue,
--      day and time, the family QR, and their answers for the coming dates.
--
-- Additive. Data changed: every existing family gets a check-in code, and families
-- with a child at a school are marked source 'school'. One transaction. Safe to run twice.

begin;

-- ── 1. Families ─────────────────────────────────────────────────────────────
-- 12 characters from 32 unambiguous letters and digits: 60 random bits.
create or replace function impact_new_checkin_code() returns text
language sql volatile set search_path = public as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', get_byte(b, i) % 32 + 1, 1), '' order by i)
  from (select uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid()) as b) r, generate_series(0, 11) i
$$;
-- It is a column default, so it runs as whoever adds a family.
revoke all on function impact_new_checkin_code() from public, anon;
grant execute on function impact_new_checkin_code() to authenticated, service_role;

alter table tp_families add column if not exists source text check (source in ('school', 'community', 'both'));
alter table tp_families add column if not exists community_venue_id uuid references tp_venues(id) on delete set null;
alter table tp_families add column if not exists signed_up_at timestamptz;
alter table tp_families add column if not exists lapsed_at timestamptz;
alter table tp_families add column if not exists waitlisted_at timestamptz;   -- on the chosen venue's waiting list since
alter table tp_families add column if not exists checkin_code text not null default impact_new_checkin_code()
  check (checkin_code ~ '^[A-HJ-NP-Z2-9]{12}$');
create unique index if not exists tp_families_checkin_code_key on tp_families (hq_id, checkin_code);
create index if not exists idx_tp_families_community_venue on tp_families (community_venue_id) where community_venue_id is not null;

-- Families who already have a child at a school came from a school.
update tp_families f set source = 'school'
where f.source is null and exists (select 1 from tp_children c where c.family_id = f.id and c.hq_id = f.hq_id and c.school_id is not null);

-- ── 2. Venue capacity ───────────────────────────────────────────────────────
alter table tp_venues add column if not exists capacity int check (capacity is null or capacity > 0);

-- ── 3. Sign-up audit trail ─────────────────────────────────────────────────
create table if not exists tp_community_signups (
  id                   uuid primary key default gen_random_uuid(),
  hq_id                uuid not null references auth.users(id) on delete cascade,
  family_id            uuid not null references tp_families(id) on delete cascade,
  venue_id             uuid references tp_venues(id) on delete set null,
  channel              text not null check (channel in ('form', 'qr', 'import', 'hq')),
  created_at           timestamptz not null default now(),
  consent_text_version text check (char_length(consent_text_version) <= 60),
  ip_hash              text check (ip_hash ~ '^[0-9a-f]{64}$'),
  import_batch_id      uuid references impact_imports(id) on delete set null
);
create index if not exists idx_tp_community_signups_family on tp_community_signups (family_id);
-- The /join rate limit counts recent sign-ups from one address.
create index if not exists idx_tp_community_signups_ip on tp_community_signups (hq_id, ip_hash, created_at desc) where ip_hash is not null;
create index if not exists idx_tp_community_signups_import on tp_community_signups (import_batch_id) where import_batch_id is not null;
drop trigger if exists impact_import_stamp_guard on tp_community_signups;
create trigger impact_import_stamp_guard before insert or update of import_batch_id on tp_community_signups
  for each row execute function impact_import_stamp_guard();

alter table tp_community_signups enable row level security;
drop policy if exists tp_community_signups_hq_reads on tp_community_signups;
create policy tp_community_signups_hq_reads on tp_community_signups for select to authenticated using (hq_id in (select impact_hqs_for('hq')));
-- The HQ records its own additions and imports; form and QR sign-ups come only from the server.
drop policy if exists tp_community_signups_hq_adds on tp_community_signups;
create policy tp_community_signups_hq_adds on tp_community_signups for insert to authenticated
  with check (hq_id in (select impact_hqs_for('hq')) and channel in ('hq', 'import')
    and exists (select 1 from tp_families f where f.id = family_id and f.hq_id = tp_community_signups.hq_id)
    and (venue_id is null or exists (select 1 from tp_venues v where v.id = venue_id and v.hq_id = tp_community_signups.hq_id)));
-- An audit trail: never edited or deleted from the browser (it goes with the family).
revoke all on tp_community_signups from public, anon, authenticated;
grant select on tp_community_signups to authenticated;
grant insert (hq_id, family_id, venue_id, channel, consent_text_version, import_batch_id) on tp_community_signups to authenticated;

-- ── 4. Weekend intents ──────────────────────────────────────────────────────
create table if not exists tp_weekend_intents (
  id           uuid primary key default gen_random_uuid(),
  hq_id        uuid not null references auth.users(id) on delete cascade,
  family_id    uuid not null references tp_families(id) on delete cascade,
  venue_id     uuid not null references tp_venues(id) on delete cascade,
  session_date date not null,
  coming       boolean not null,
  updated_at   timestamptz not null default now(),
  unique (family_id, venue_id, session_date)
);
create index if not exists idx_tp_weekend_intents_day on tp_weekend_intents (hq_id, venue_id, session_date);
alter table tp_weekend_intents enable row level security;
drop policy if exists tp_weekend_intents_hq on tp_weekend_intents;
create policy tp_weekend_intents_hq on tp_weekend_intents for all to authenticated
  using (hq_id in (select impact_hqs_for('hq')))
  with check (hq_id in (select impact_hqs_for('hq'))
    and exists (select 1 from tp_families f where f.id = family_id and f.hq_id = tp_weekend_intents.hq_id)
    and exists (select 1 from tp_venues v where v.id = venue_id and v.hq_id = tp_weekend_intents.hq_id));
drop policy if exists tp_weekend_intents_parent_reads on tp_weekend_intents;
create policy tp_weekend_intents_parent_reads on tp_weekend_intents for select to authenticated using (family_id in (select impact_my_families()));
revoke all on tp_weekend_intents from public, anon;
grant select, insert, update, delete on tp_weekend_intents to authenticated;

-- ── 5. Family check-in ──────────────────────────────────────────────────────
-- → { family, children: [names checked in], already: [names already in], session_id }
create or replace function impact_family_checkin(p_hq uuid, p_venue uuid, p_code text, p_date date default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_date date := coalesce(p_date, (now() at time zone 'Europe/London')::date);
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_fam tp_families%rowtype;
  v_session uuid;
  v_new text[] := '{}'; v_had text[] := '{}';
  r record;
begin
  if auth.uid() is null then raise exception 'Please sign in again.'; end if;
  if not exists (select 1 from tp_venues v where v.id = p_venue and v.hq_id = p_hq)
     or not (p_hq in (select impact_hqs_for('hq'))
             or (p_hq in (select impact_hqs_for('coach')) and p_venue in (select impact_coach_venues()))) then
    raise exception 'You can’t check families in at that venue.';
  end if;
  if v_date not between (now() at time zone 'Europe/London')::date - 1 and (now() at time zone 'Europe/London')::date then
    raise exception 'Check-in is for today’s session.';
  end if;
  -- One answer for a wrong code, whoever's it is: nothing about other orgs is given away.
  select * into v_fam from tp_families where hq_id = p_hq and checkin_code = v_code;
  if not found then raise exception 'That code isn’t one of this organisation’s families.'; end if;

  select id into v_session from tp_sessions where hq_id = p_hq and kind = 'weekend' and venue_id = p_venue and session_date = v_date order by created_at limit 1;
  if v_session is null then
    insert into tp_sessions (hq_id, kind, venue_id, session_date) values (p_hq, 'weekend', p_venue, v_date) returning id into v_session;
  end if;
  for r in select c.id, c.name from tp_children c where c.family_id = v_fam.id and c.hq_id = p_hq order by c.name loop
    if exists (select 1 from tp_attendance a where a.session_id = v_session and a.child_id = r.id and a.present) then
      v_had := v_had || r.name;
    else
      insert into tp_attendance (hq_id, session_id, child_id, present, via) values (p_hq, v_session, r.id, true, 'qr')
      on conflict (session_id, child_id) do update set present = true, via = 'qr', recorded_at = now();
      v_new := v_new || r.name;
    end if;
  end loop;
  -- Back after a gap: no longer lapsed.
  update tp_families set lapsed_at = null where id = v_fam.id and lapsed_at is not null;
  return jsonb_build_object('family', v_fam.guardian_name, 'children', to_jsonb(v_new), 'already', to_jsonb(v_had), 'session_id', v_session);
end $$;
revoke all on function impact_family_checkin(uuid, uuid, text, date) from public, anon;
grant execute on function impact_family_checkin(uuid, uuid, text, date) to authenticated;

-- ── 6. The volunteer view's numbers ─────────────────────────────────────────
create or replace function impact_weekend_day(p_hq uuid, p_venue uuid, p_date date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from tp_venues v where v.id = p_venue and v.hq_id = p_hq)
     or not (p_hq in (select impact_hqs_for('hq'))
             or (p_hq in (select impact_hqs_for('coach')) and p_venue in (select impact_coach_venues()))) then
    raise exception 'You can’t see that venue.';
  end if;
  return jsonb_build_object(
    'checked_in_children', (select count(*) from tp_attendance a join tp_sessions s on s.id = a.session_id and s.hq_id = p_hq
                            where s.kind = 'weekend' and s.venue_id = p_venue and s.session_date = p_date and a.present),
    'checked_in_families', (select count(distinct c.family_id) from tp_attendance a join tp_sessions s on s.id = a.session_id and s.hq_id = p_hq
                            join tp_children c on c.id = a.child_id where s.kind = 'weekend' and s.venue_id = p_venue and s.session_date = p_date and a.present),
    'expected_families', (select count(*) from tp_weekend_intents i where i.hq_id = p_hq and i.venue_id = p_venue and i.session_date = p_date and i.coming),
    'expected_children', (select count(*) from tp_weekend_intents i join tp_children c on c.family_id = i.family_id and c.hq_id = p_hq
                          where i.hq_id = p_hq and i.venue_id = p_venue and i.session_date = p_date and i.coming),
    'not_coming_families', (select count(*) from tp_weekend_intents i where i.hq_id = p_hq and i.venue_id = p_venue and i.session_date = p_date and not i.coming));
end $$;
revoke all on function impact_weekend_day(uuid, uuid, date) from public, anon;
grant execute on function impact_weekend_day(uuid, uuid, date) to authenticated;

-- ── 7. Parent app ───────────────────────────────────────────────────────────
-- → [{ family_id, checkin_code, venue: { id, name, address, postcode, session_day, session_time } | null,
--      waitlisted, intents: [{ session_date, coming }] }]   (intents from today on)
create or replace function impact_parent_weekend() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'family_id', f.id, 'checkin_code', f.checkin_code, 'waitlisted', f.waitlisted_at is not null,
    'venue', (select jsonb_build_object('id', v.id, 'name', v.name, 'address', v.address, 'postcode', v.postcode, 'session_day', v.session_day, 'session_time', v.session_time)
              from tp_venues v where v.id = f.community_venue_id and v.hq_id = f.hq_id),
    'intents', coalesce((select jsonb_agg(jsonb_build_object('session_date', i.session_date, 'coming', i.coming) order by i.session_date)
                         from tp_weekend_intents i where i.family_id = f.id and i.hq_id = f.hq_id and i.session_date >= (now() at time zone 'Europe/London')::date), '[]'::jsonb)
  )), '[]'::jsonb)
  from tp_families f where f.id in (select impact_my_families())
$$;
revoke all on function impact_parent_weekend() from public, anon;
grant execute on function impact_parent_weekend() to authenticated;

-- "We're coming" / "Not this week", for the family's own venue, today or later (12 weeks ahead at most).
create or replace function impact_parent_set_intent(p_family uuid, p_date date, p_coming boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v_fam tp_families%rowtype; v_today date := (now() at time zone 'Europe/London')::date;
begin
  if p_family is null or p_family not in (select impact_my_families()) then raise exception 'That family could not be found.'; end if;
  select * into v_fam from tp_families where id = p_family;
  if v_fam.community_venue_id is null then raise exception 'Choose a weekend venue first.'; end if;
  if p_date is null or p_date < v_today or p_date > v_today + 84 then raise exception 'Choose a date in the next 12 weeks.'; end if;
  if p_coming is null then raise exception 'Say whether you’re coming.'; end if;
  insert into tp_weekend_intents (hq_id, family_id, venue_id, session_date, coming)
  values (v_fam.hq_id, v_fam.id, v_fam.community_venue_id, p_date, p_coming)
  on conflict (family_id, venue_id, session_date) do update set coming = excluded.coming, updated_at = now();
end $$;
revoke all on function impact_parent_set_intent(uuid, date, boolean) from public, anon;
grant execute on function impact_parent_set_intent(uuid, date, boolean) to authenticated;

commit;
notify pgrst, 'reload schema';
