-- DRAFT — for review; apply by hand in the SQL editor. Rollback: supabase/drafts/228_rollback.sql
--
-- 228_impact_members.sql
-- Real users who belong to an org. Until now the HQ login was the only identity:
-- auth.uid() was hq_id, and coaches and parents were views the HQ switched between.
--
--   impact_members   who belongs to which org, in which role
--   impact_invites   a pending invite; only the token's hash is stored
--
-- Every tp_/impact_ policy is rebuilt here. Access is decided by impact_members
-- and impact_orgs alone, never by sports_profiles.portal_slug, which a user can edit.
--
-- The role helpers are SECURITY DEFINER so policies can use them without RLS
-- recursing back through the tables they read. Each returns a set, so one login
-- can belong to two orgs. A foreign key doesn't prove ownership, so every helper
-- matches hq_id on the row it follows.
--
-- RLS works on rows, not columns. So parents don't read tp_families, tp_children or
-- tp_sessions directly: those hold the HQ's own notes. impact_parent_home() returns
-- the fields a family should see, and impact_parent_update_family() the ones it may
-- change.
--
-- One transaction: if anything fails, nothing changes. Safe to run twice.

begin;

-- ── Members and invites ─────────────────────────────────────────────────────
create table if not exists impact_members (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  hq_id         uuid not null references auth.users(id) on delete cascade,
  role          text not null check (role in ('coach', 'parent', 'school')),
  staff_id      uuid references tp_staff(id) on delete set null,
  family_id     uuid references tp_families(id) on delete set null,
  school_id     uuid references tp_schools(id) on delete set null,
  invited_email text,
  invited_at    timestamptz,
  accepted_at   timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now(),
  unique (user_id, hq_id),
  constraint impact_members_target_ok check (
    (role = 'coach' and staff_id is not null) or (role = 'parent' and family_id is not null) or (role = 'school' and school_id is not null))
);
create index if not exists idx_impact_members_user on impact_members (user_id) where revoked_at is null;
create index if not exists idx_impact_members_hq on impact_members (hq_id);

create table if not exists impact_invites (
  id          uuid primary key default gen_random_uuid(),
  hq_id       uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('coach', 'parent', 'school')),
  staff_id    uuid references tp_staff(id) on delete cascade,
  family_id   uuid references tp_families(id) on delete cascade,
  school_id   uuid references tp_schools(id) on delete cascade,
  email       text not null check (position('@' in email) > 1),
  token_hash  text not null unique,
  expires_at  timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  revoked_at  timestamptz,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint impact_invites_target_ok check (
    (role = 'coach' and staff_id is not null) or (role = 'parent' and family_id is not null) or (role = 'school' and school_id is not null))
);
create index if not exists idx_impact_invites_hq on impact_invites (hq_id, created_at desc);

-- ── Who is the caller? ──────────────────────────────────────────────────────
-- 'hq' is the org's own login. A role of null means any role.
create or replace function impact_hqs_for(p_role text default null) returns setof uuid
language sql stable security definer set search_path = public as $$
  select auth.uid() where (p_role is null or p_role = 'hq') and exists (select 1 from impact_orgs where hq_id = auth.uid())
  union
  select hq_id from impact_members
  where user_id = auth.uid() and accepted_at is not null and revoked_at is null and (p_role is null or role = p_role)
$$;

/** The one org to act in. A login's own org comes first, then the oldest id, so the answer never varies. */
create or replace function impact_hq_for(p_role text default null) returns uuid
language sql stable security definer set search_path = public as $$
  select h from impact_hqs_for(p_role) h order by (h = auth.uid()) desc, h limit 1
$$;

create or replace function impact_my_staff() returns setof uuid
language sql stable security definer set search_path = public as $$
  select m.staff_id from impact_members m join tp_staff s on s.id = m.staff_id and s.hq_id = m.hq_id
  where m.user_id = auth.uid() and m.role = 'coach' and m.accepted_at is not null and m.revoked_at is null
$$;

create or replace function impact_my_families() returns setof uuid
language sql stable security definer set search_path = public as $$
  select m.family_id from impact_members m join tp_families f on f.id = m.family_id and f.hq_id = m.hq_id
  where m.user_id = auth.uid() and m.role = 'parent' and m.accepted_at is not null and m.revoked_at is null
$$;

create or replace function impact_my_schools() returns setof uuid
language sql stable security definer set search_path = public as $$
  select m.school_id from impact_members m join tp_schools s on s.id = m.school_id and s.hq_id = m.hq_id
  where m.user_id = auth.uid() and m.role = 'school' and m.accepted_at is not null and m.revoked_at is null
$$;

-- A coach's world: programmes they lead, or have a session on.
create or replace function impact_coach_programmes() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from tp_programmes where lead_staff_id in (select impact_my_staff())
  union
  select programme_id from tp_sessions where programme_id is not null and lead_staff_id in (select impact_my_staff())
$$;

create or replace function impact_coach_sessions() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from tp_sessions where lead_staff_id in (select impact_my_staff()) or programme_id in (select impact_coach_programmes())
$$;

create or replace function impact_coach_children() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from tp_children where programme_id in (select impact_coach_programmes())
  union
  select child_id from tp_attendance where session_id in (select impact_coach_sessions())
$$;

create or replace function impact_parent_children() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from tp_children where family_id in (select impact_my_families())
$$;

-- ── Rebuild every policy ────────────────────────────────────────────────────
-- Dropped by reading pg_policies, not by name: six policies don't follow the
-- <table>_hq pattern, and a guarded create would keep an old policy's text.
do $$
declare r record; t text;
  everyone text[] := array[
    'tp_schools','tp_programmes','tp_qr_checkins','tp_fundraising_campaigns','tp_fundraising_events','tp_fundraising_pledges','tp_donations',
    'tp_impact_responses','tp_funder_reports','tp_pathway_referrals','tp_venues','tp_staff','tp_families','tp_volunteers','tp_children',
    'tp_sessions','tp_attendance','impact_messages','impact_campaigns','tp_cpd','impact_leads','impact_lead_events','tp_pack_items','tp_booklet'];
  reads text[] := array['impact_lead_hooks','tp_pack_stock','tp_pack_issues','tp_pack_stock_moves'];
begin
  for r in select tablename, policyname from pg_policies where schemaname = 'public'
    and tablename = any (everyone || reads || array['tp_pack_sizes','tp_pack_payments']) loop
    execute format('drop policy %I on %I', r.policyname, r.tablename);
  end loop;
  -- HQ: everything, as now.
  foreach t in array everyone loop
    execute format('create policy %I on %I for all to authenticated using (hq_id in (select impact_hqs_for(''hq''))) with check (hq_id in (select impact_hqs_for(''hq'')))', t || '_hq', t);
  end loop;
  foreach t in array reads loop
    execute format('create policy %I on %I for select to authenticated using (hq_id in (select impact_hqs_for(''hq'')))', t || '_hq_reads', t);
  end loop;
end $$;

create policy tp_pack_sizes_hq on tp_pack_sizes for all to authenticated using (hq_id in (select impact_hqs_for('hq'))) with check (
  hq_id in (select impact_hqs_for('hq'))
  and exists (select 1 from tp_children c where c.id = child_id and c.hq_id = tp_pack_sizes.hq_id)
  and exists (select 1 from tp_pack_items i where i.id = item_id and i.hq_id = tp_pack_sizes.hq_id));
create policy tp_pack_payments_hq on tp_pack_payments for all to authenticated using (hq_id in (select impact_hqs_for('hq'))) with check (
  hq_id in (select impact_hqs_for('hq'))
  and (child_id is null or exists (select 1 from tp_children c where c.id = child_id and c.hq_id = tp_pack_payments.hq_id))
  and exists (select 1 from tp_pack_items i where i.id = item_id and i.hq_id = tp_pack_payments.hq_id));
create policy tp_pack_stock_moves_hq_adds on tp_pack_stock_moves for insert to authenticated with check (
  hq_id in (select impact_hqs_for('hq')) and reason <> 'issued'
  and exists (select 1 from tp_pack_items i where i.id = item_id and i.hq_id = tp_pack_stock_moves.hq_id)
  and (child_id is null or exists (select 1 from tp_children c where c.id = child_id and c.hq_id = tp_pack_stock_moves.hq_id)));

-- Coach: reads scoped to their programmes and sessions.
create policy tp_schools_coach on tp_schools for select to authenticated using (id in (select school_id from tp_programmes where id in (select impact_coach_programmes())));
create policy tp_programmes_coach on tp_programmes for select to authenticated using (id in (select impact_coach_programmes()));
create policy tp_sessions_coach on tp_sessions for select to authenticated using (id in (select impact_coach_sessions()));
create policy tp_children_coach on tp_children for select to authenticated using (id in (select impact_coach_children()));
create policy tp_families_coach on tp_families for select to authenticated using (id in (select family_id from tp_children where id in (select impact_coach_children())));
create policy tp_staff_coach_self on tp_staff for select to authenticated using (id in (select impact_my_staff()));
create policy tp_venues_coach on tp_venues for select to authenticated using (id in (select venue_id from tp_sessions where id in (select impact_coach_sessions())));
-- Registers for their sessions. The child must be in the same org as the session.
create policy tp_attendance_coach_reads on tp_attendance for select to authenticated using (session_id in (select impact_coach_sessions()));
create policy tp_attendance_coach_adds on tp_attendance for insert to authenticated with check (
  hq_id in (select impact_hqs_for('coach')) and session_id in (select impact_coach_sessions())
  and exists (select 1 from tp_children c where c.id = child_id and c.hq_id = tp_attendance.hq_id));
create policy tp_attendance_coach_edits on tp_attendance for update to authenticated using (session_id in (select impact_coach_sessions())) with check (
  hq_id in (select impact_hqs_for('coach')) and session_id in (select impact_coach_sessions()));
-- QR check-ins have no session id, so "their sessions" is the venues of their sessions.
create policy tp_qr_checkins_coach_reads on tp_qr_checkins for select to authenticated using (tp_venue_id in (select venue_id from tp_sessions where id in (select impact_coach_sessions())));
create policy tp_qr_checkins_coach_adds on tp_qr_checkins for insert to authenticated with check (
  hq_id in (select impact_hqs_for('coach')) and tp_venue_id in (select venue_id from tp_sessions where id in (select impact_coach_sessions())));
-- The pack, for issuing.
create policy tp_pack_items_member on tp_pack_items for select to authenticated using (hq_id in (select impact_hqs_for('coach')) or hq_id in (select impact_hqs_for('parent')));
create policy tp_pack_stock_coach on tp_pack_stock for select to authenticated using (hq_id in (select impact_hqs_for('coach')));
create policy tp_booklet_member on tp_booklet for select to authenticated using (hq_id in (select impact_hqs_for('coach')) or hq_id in (select impact_hqs_for('parent')));
create policy tp_pack_issues_coach on tp_pack_issues for select to authenticated using (child_id in (select impact_coach_children()));
create policy tp_pack_sizes_coach on tp_pack_sizes for all to authenticated using (child_id in (select impact_coach_children())) with check (
  hq_id in (select impact_hqs_for('coach')) and child_id in (select impact_coach_children())
  and exists (select 1 from tp_pack_items i where i.id = item_id and i.hq_id = tp_pack_sizes.hq_id));

-- Parent: everything else comes through impact_parent_home().
create policy tp_attendance_parent on tp_attendance for select to authenticated using (child_id in (select impact_parent_children()));
create policy tp_pack_issues_parent on tp_pack_issues for select to authenticated using (child_id in (select impact_parent_children()));
create policy tp_pack_payments_parent on tp_pack_payments for select to authenticated using (child_id in (select impact_parent_children()));
create policy impact_messages_parent on impact_messages for select to authenticated using (
  family_id in (select impact_my_families()) and hq_id in (select impact_hqs_for('parent')) and status in ('sent', 'filed', 'received'));
-- Returns decide who still holds an item, so both roles need them for their own children.
create policy tp_pack_stock_moves_returns on tp_pack_stock_moves for select to authenticated using (
  reason = 'returned' and (child_id in (select impact_coach_children()) or child_id in (select impact_parent_children())));

-- School: its own rows. Readiness and attendance views are a later brief.
create policy tp_schools_school on tp_schools for select to authenticated using (id in (select impact_my_schools()));
create policy tp_programmes_school on tp_programmes for select to authenticated using (school_id in (select impact_my_schools()));
create policy tp_fundraising_campaigns_school on tp_fundraising_campaigns for select to authenticated using (school_id in (select impact_my_schools()));

-- Members and invites: readable, written only by the functions and the server.
alter table impact_members enable row level security;
alter table impact_invites enable row level security;
drop policy if exists impact_members_self on impact_members;
create policy impact_members_self on impact_members for select to authenticated using (user_id = auth.uid() or hq_id in (select impact_hqs_for('hq')));
drop policy if exists impact_invites_hq on impact_invites;
create policy impact_invites_hq on impact_invites for select to authenticated using (hq_id in (select impact_hqs_for('hq')));
revoke insert, update, delete, truncate on impact_members, impact_invites from public, anon, authenticated;
-- The token hash never leaves the server.
revoke select on impact_invites from public, anon, authenticated;
grant select (id, hq_id, role, staff_id, family_id, school_id, email, expires_at, accepted_at, revoked_at, created_by, created_at) on impact_invites to authenticated;

-- ── The parent's read and write ─────────────────────────────────────────────
create or replace function impact_parent_home() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', f.id, 'hq_id', f.hq_id, 'guardian_name', f.guardian_name, 'guardian2_name', f.guardian2_name, 'email', f.email, 'phone', f.phone,
    'emergency_contact', f.emergency_contact, 'consent_data', f.consent_data, 'consent_photo', f.consent_photo,
    'opt_in_email', f.opt_in_email, 'opt_in_sms', f.opt_in_sms, 'opt_in_app', f.opt_in_app,
    'children', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'date_of_birth', c.date_of_birth, 'year_group', c.year_group, 'stickers', c.stickers, 'photo_consent', c.photo_consent,
      'school', (select s.name from tp_schools s where s.id = c.school_id and s.hq_id = f.hq_id),
      'sessions', (select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'kind', x.kind, 'session_date', x.session_date, 'venue', (select v.name from tp_venues v where v.id = x.venue_id and v.hq_id = f.hq_id)) order by x.session_date), '[]'::jsonb)
        from tp_sessions x where x.hq_id = f.hq_id and (x.programme_id = c.programme_id or x.id in (select a.session_id from tp_attendance a where a.child_id = c.id)))
    ) order by c.name), '[]'::jsonb) from tp_children c where c.family_id = f.id and c.hq_id = f.hq_id)
  )), '[]'::jsonb)
  from tp_families f where f.id in (select impact_my_families())
$$;

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

-- ── Accepting an invite ─────────────────────────────────────────────────────
-- Single use, expiring, and only for the address it was sent to, so a forwarded
-- link gets nobody in. The server hashes the token; this never sees the original.
create or replace function impact_accept_invite(p_token_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_inv impact_invites%rowtype;
begin
  if v_user is null then raise exception 'Please sign in again.'; end if;
  select * into v_inv from impact_invites where token_hash = p_token_hash for update;
  if not found or v_inv.revoked_at is not null then raise exception 'This invite isn’t valid. Ask for a new one.'; end if;
  if v_inv.accepted_at is not null then raise exception 'This invite has already been used.'; end if;
  if v_inv.expires_at < now() then raise exception 'This invite has expired. Ask for a new one.'; end if;
  select email into v_email from auth.users where id = v_user;
  if lower(coalesce(v_email, '')) <> lower(v_inv.email) then raise exception 'This invite was sent to a different email address.'; end if;
  if v_user = v_inv.hq_id then raise exception 'This is the organisation’s own login.'; end if;

  insert into impact_members (user_id, hq_id, role, staff_id, family_id, school_id, invited_email, invited_at, accepted_at)
  values (v_user, v_inv.hq_id, v_inv.role, v_inv.staff_id, v_inv.family_id, v_inv.school_id, v_inv.email, v_inv.created_at, now())
  on conflict (user_id, hq_id) do update set role = excluded.role, staff_id = excluded.staff_id, family_id = excluded.family_id, school_id = excluded.school_id,
    invited_email = excluded.invited_email, invited_at = excluded.invited_at, accepted_at = now(), revoked_at = null;
  update impact_invites set accepted_at = now() where id = v_inv.id;
  return jsonb_build_object('role', v_inv.role, 'slug', (select slug from impact_orgs where hq_id = v_inv.hq_id));
end $$;

-- ── The pack functions: HQ as now, and a coach for children on their sessions ─
create or replace function impact_issue_pack(
  p_child uuid, p_lines jsonb, p_session uuid default null, p_issued_by uuid default null, p_note text default null
) returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_hq uuid;
  v_is_hq boolean;
  v_by uuid := p_issued_by;
  v_line jsonb;
  v_item tp_pack_items%rowtype;
  v_size text;
  v_label text;
  v_last timestamptz;
  v_qty integer;
  v_count integer := 0;
begin
  if auth.uid() is null then raise exception 'Please sign in again.'; end if;
  if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) = 0 then raise exception 'Choose at least one item to issue.'; end if;
  select hq_id into v_hq from tp_children where id = p_child;
  v_is_hq := v_hq in (select impact_hqs_for('hq'));
  if v_hq is null or not (v_is_hq or p_child in (select impact_coach_children())) then raise exception 'That child could not be found.'; end if;
  if p_session is not null and not exists (select 1 from tp_sessions where id = p_session and hq_id = v_hq) then raise exception 'That session could not be found.'; end if;
  if not v_is_hq then
    if p_session is not null and p_session not in (select impact_coach_sessions()) then raise exception 'That session could not be found.'; end if;
    -- A coach is always recorded as themselves, whatever the request says.
    select staff_id into v_by from impact_members where user_id = auth.uid() and hq_id = v_hq and role = 'coach' and accepted_at is not null and revoked_at is null;
  elsif p_issued_by is not null and not exists (select 1 from tp_staff where id = p_issued_by and hq_id = v_hq) then
    raise exception 'That coach could not be found.';
  end if;

  -- In item order, so two people issuing at once can't deadlock on the stock rows.
  for v_line in select value from jsonb_array_elements(p_lines) order by value->>'item_id', value->>'size' loop
    select * into v_item from tp_pack_items where id = (v_line->>'item_id')::uuid and hq_id = v_hq and active;
    if not found then raise exception 'That item could not be found.'; end if;

    v_size := nullif(btrim(coalesce(v_line->>'size', '')), '');
    if v_item.has_sizes and v_size is null then raise exception 'Choose a size for %.', v_item.name; end if;
    if v_item.has_sizes and not v_size = any (v_item.sizes) then raise exception '% doesn’t come in size %.', v_item.name, v_size; end if;
    if not v_item.has_sizes then v_size := null; end if;
    v_label := v_item.name || coalesce(' ' || v_size, '');

    if v_item.kind = 'paid' and not exists (select 1 from tp_pack_payments where hq_id = v_hq and child_id = p_child and item_id = v_item.id) then
      raise exception 'No payment recorded for % — record it first', v_item.name;
    end if;

    -- A second one needs a return after the last issue.
    select max(issued_at) into v_last from tp_pack_issues where child_id = p_child and item_id = v_item.id;
    if v_last is not null and not exists (
      select 1 from tp_pack_stock_moves where child_id = p_child and item_id = v_item.id and reason = 'returned' and created_at > v_last
    ) then
      raise exception 'This child already has a %.', v_item.name;
    end if;

    select qty into v_qty from tp_pack_stock where item_id = v_item.id and coalesce(size, '') = coalesce(v_size, '') for update;
    if coalesce(v_qty, 0) < 1 then raise exception 'No % in stock — receive stock first', v_label; end if;

    insert into tp_pack_issues (hq_id, child_id, item_id, size, issued_by, session_id, note)
    values (v_hq, p_child, v_item.id, v_size, v_by, p_session, nullif(btrim(coalesce(p_note, '')), ''));
    insert into tp_pack_stock_moves (hq_id, item_id, size, delta, reason, child_id)
    values (v_hq, v_item.id, v_size, -1, 'issued', p_child);
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

create or replace function impact_record_past_issue(p_child uuid, p_item uuid, p_size text, p_issued_at timestamptz) returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_hq uuid;
  v_item tp_pack_items%rowtype;
  v_size text := nullif(btrim(coalesce(p_size, '')), '');
begin
  if auth.uid() is null then raise exception 'Please sign in again.'; end if;
  select hq_id into v_hq from tp_children where id = p_child;
  if v_hq is null or v_hq not in (select impact_hqs_for('hq')) then raise exception 'That child could not be found.'; end if;
  select * into v_item from tp_pack_items where id = p_item and hq_id = v_hq;
  if not found then raise exception 'That item could not be found.'; end if;
  if not v_item.has_sizes then v_size := null; end if;
  if v_size is not null and not v_size = any (v_item.sizes) then raise exception '% doesn’t come in size %.', v_item.name, v_size; end if;
  if p_issued_at is null or p_issued_at > now() then raise exception 'That date isn’t in the past.'; end if;
  if exists (select 1 from tp_pack_issues where child_id = p_child and item_id = p_item) then return 0; end if;
  insert into tp_pack_issues (hq_id, child_id, item_id, size, issued_at, note) values (v_hq, p_child, p_item, v_size, p_issued_at, 'Imported');
  return 1;
end $$;

create or replace function impact_return_item(
  p_child uuid, p_item uuid, p_reason text, p_note text default null,
  p_reissue boolean default false, p_size text default null, p_issued_by uuid default null
) returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_hq uuid;
  v_item tp_pack_items%rowtype;
  v_issue tp_pack_issues%rowtype;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_size text := nullif(btrim(coalesce(p_size, '')), '');
  v_label text;
begin
  if auth.uid() is null then raise exception 'Please sign in again.'; end if;
  if p_reason is null or p_reason not in ('too_small', 'damaged', 'lost_replaced', 'other') then raise exception 'Choose a reason for the return.'; end if;
  if p_reason = 'other' and v_note is null then raise exception 'Add a note saying why it was returned.'; end if;
  select hq_id into v_hq from tp_children where id = p_child;
  if v_hq is null or v_hq not in (select impact_hqs_for('hq')) then raise exception 'That child could not be found.'; end if;
  select * into v_item from tp_pack_items where id = p_item and hq_id = v_hq;
  if not found then raise exception 'That item could not be found.'; end if;

  select * into v_issue from tp_pack_issues where child_id = p_child and item_id = p_item order by issued_at desc limit 1;
  if not found or exists (
    select 1 from tp_pack_stock_moves where child_id = p_child and item_id = p_item and reason = 'returned' and created_at > v_issue.issued_at
  ) then
    raise exception 'This child doesn’t have a % to return.', v_item.name;
  end if;

  v_label := case p_reason when 'too_small' then 'Too small' when 'damaged' then 'Damaged' when 'lost_replaced' then 'Lost, replaced' else 'Other' end
    || coalesce(' · ' || v_note, '');
  insert into tp_pack_stock_moves (hq_id, item_id, size, delta, reason, child_id, note)
  values (v_hq, p_item, v_issue.size, 1, 'returned', p_child, v_label);
  if p_reason in ('damaged', 'lost_replaced') then
    insert into tp_pack_stock_moves (hq_id, item_id, size, delta, reason, child_id, note)
    values (v_hq, p_item, v_issue.size, -1, 'adjusted', p_child, 'Written off: ' || v_label);
  end if;

  if not p_reissue then return 0; end if;
  if v_item.has_sizes and v_size is null then v_size := v_issue.size; end if;
  perform impact_issue_pack(p_child, jsonb_build_array(jsonb_build_object('item_id', p_item, 'size', v_size)), null, p_issued_by, 'Replacement: ' || v_label);
  if v_item.has_sizes then
    insert into tp_pack_sizes (hq_id, child_id, item_id, size) values (v_hq, p_child, p_item, v_size)
    on conflict (child_id, item_id) do update set size = excluded.size, updated_at = now();
  end if;
  return 1;
end $$;

-- ── Grants ──────────────────────────────────────────────────────────────────
do $$
declare f text;
begin
  foreach f in array array[
    'impact_hqs_for(text)','impact_hq_for(text)','impact_my_staff()','impact_my_families()','impact_my_schools()','impact_coach_programmes()',
    'impact_coach_sessions()','impact_coach_children()','impact_parent_children()','impact_parent_home()',
    'impact_parent_update_family(uuid,text,text,text,boolean,boolean,boolean,boolean,boolean)','impact_accept_invite(text)'] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

commit;

notify pgrst, 'reload schema';
