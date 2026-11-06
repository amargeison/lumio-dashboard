-- 234: a real org's Activity Booklet. The printed PDF, the fuller booklet content, and
-- what a family writes in it.
--
-- tp_booklet gains the booklet's own text, the warm-up, a map of video links and the PDF's
-- details. Each week's top_tip, did_you_know, video and scorecard live in the weeks jsonb,
-- so they need no column. Stickers are unchanged.
--
-- The PDF sits in a private bucket with no policies on storage.objects, so nobody reaches
-- it with their own login: the server uploads it and signs short links, after checking the
-- caller belongs to the org. pdf_path can only ever be the org's own path, so an HQ can't
-- point its row at another org's file and have the server sign that.
--
-- tp_booklet_notes and tp_booklet_scorecards are the family's. HQ can read both. A coach
-- reads neither: impact_coach_home() gains 'practised', which says a note exists for a
-- child and a week and carries none of its text.
--
-- Policies run as the caller and a parent can't read tp_children or tp_families, so the
-- check that a row's child, family and org belong together is a SECURITY DEFINER helper.
--
-- Apply this before deploying the app that reads these columns.
--
-- One transaction: if anything fails, nothing changes. Safe to run twice.

begin;

-- ── The booklet ─────────────────────────────────────────────────────────────
alter table tp_booklet add column if not exists motto text not null default '';
alter table tp_booklet add column if not exists "values" text not null default '';
alter table tp_booklet add column if not exists website text not null default '';
alter table tp_booklet add column if not exists hashtag text not null default '';
alter table tp_booklet add column if not exists warm_up jsonb not null default '{}'::jsonb check (jsonb_typeof(warm_up) = 'object');  -- { title, text, did_you_know: [] }
alter table tp_booklet add column if not exists completion text not null default '';
alter table tp_booklet add column if not exists tenors text not null default '';
alter table tp_booklet add column if not exists notes_prompt text not null default '';
alter table tp_booklet add column if not exists videos jsonb not null default '{}'::jsonb check (jsonb_typeof(videos) = 'object');    -- { forehand: url, … }
alter table tp_booklet add column if not exists pdf_path text;
alter table tp_booklet add column if not exists pdf_name text;
alter table tp_booklet add column if not exists pdf_pages int;
alter table tp_booklet add column if not exists pdf_bytes int;
alter table tp_booklet add column if not exists pdf_uploaded_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tp_booklet_pdf_path_own') then
    alter table tp_booklet add constraint tp_booklet_pdf_path_own check (pdf_path is null or pdf_path = hq_id::text || '/booklet.pdf');
  end if;
end $$;

-- ── The PDF's bucket ────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('impact-booklets', 'impact-booklets', false, 10485760, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['application/pdf'];

-- ── What a family writes ────────────────────────────────────────────────────
create table if not exists tp_booklet_notes (
  hq_id      uuid not null references auth.users(id) on delete cascade,
  family_id  uuid not null references tp_families(id) on delete cascade,
  child_id   uuid not null references tp_children(id) on delete cascade,
  week       int not null check (week between 1 and 10),
  text       text not null default '' check (char_length(text) <= 2000),
  updated_at timestamptz not null default now(),
  primary key (child_id, week)
);
create index if not exists idx_tp_booklet_notes_hq on tp_booklet_notes (hq_id);

create table if not exists tp_booklet_scorecards (
  family_id  uuid primary key references tp_families(id) on delete cascade,
  hq_id      uuid not null references auth.users(id) on delete cascade,
  player_a   text not null default '' check (char_length(player_a) <= 80),
  player_b   text not null default '' check (char_length(player_b) <= 80),
  games      jsonb not null default '[]'::jsonb check (jsonb_typeof(games) = 'array' and jsonb_array_length(games) <= 20),  -- [{ a, b }]
  updated_at timestamptz not null default now()
);
create index if not exists idx_tp_booklet_scorecards_hq on tp_booklet_scorecards (hq_id);

-- Is this the caller's own family, in this org? And is this child in it?
create or replace function impact_parent_has_family(p_family uuid, p_hq uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from tp_families f where f.id = p_family and f.hq_id = p_hq and f.id in (select impact_my_families()))
$$;

create or replace function impact_parent_has_child(p_child uuid, p_family uuid, p_hq uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select impact_parent_has_family(p_family, p_hq)
    and exists (select 1 from tp_children c where c.id = p_child and c.family_id = p_family and c.hq_id = p_hq)
$$;

revoke execute on function impact_parent_has_family(uuid, uuid) from public, anon;
revoke execute on function impact_parent_has_child(uuid, uuid, uuid) from public, anon;
grant execute on function impact_parent_has_family(uuid, uuid) to authenticated;
grant execute on function impact_parent_has_child(uuid, uuid, uuid) to authenticated;

alter table tp_booklet_notes enable row level security;
alter table tp_booklet_scorecards enable row level security;
revoke all on tp_booklet_notes, tp_booklet_scorecards from public, anon;
grant select, insert, update, delete on tp_booklet_notes, tp_booklet_scorecards to authenticated;

drop policy if exists tp_booklet_notes_parent on tp_booklet_notes;
create policy tp_booklet_notes_parent on tp_booklet_notes for all to authenticated
  using (child_id in (select impact_parent_children()))
  with check (impact_parent_has_child(child_id, family_id, hq_id));
drop policy if exists tp_booklet_notes_hq on tp_booklet_notes;
create policy tp_booklet_notes_hq on tp_booklet_notes for select to authenticated using (hq_id in (select impact_hqs_for('hq')));

drop policy if exists tp_booklet_scorecards_parent on tp_booklet_scorecards;
create policy tp_booklet_scorecards_parent on tp_booklet_scorecards for all to authenticated
  using (family_id in (select impact_my_families()))
  with check (impact_parent_has_family(family_id, hq_id));
drop policy if exists tp_booklet_scorecards_hq on tp_booklet_scorecards;
create policy tp_booklet_scorecards_hq on tp_booklet_scorecards for select to authenticated using (hq_id in (select impact_hqs_for('hq')));

-- ── The coach's dot ─────────────────────────────────────────────────────────
create or replace function impact_coach_home(p_hq uuid default null) returns jsonb
language sql stable security definer set search_path = public as $$
  with org as (
    select coalesce(p_hq, impact_hq_for('coach')) as hq
  ), allowed as (
    select hq from org where hq in (select impact_hqs_for('coach'))
  ), kids as (
    select c.* from tp_children c join allowed a on a.hq = c.hq_id where c.id in (select impact_coach_children())
  ), ses as (
    select s.* from tp_sessions s join allowed a on a.hq = s.hq_id where s.id in (select impact_coach_sessions())
  )
  select jsonb_build_object(
    'hq_id', (select hq from allowed),
    'me', (
      select jsonb_build_object('dbs_status', st.dbs_status, 'dbs_expiry', st.dbs_expiry, 'first_aid_expiry', st.first_aid_expiry, 'safeguarding_date', st.safeguarding_date)
      from tp_staff st join allowed a on a.hq = st.hq_id where st.id in (select impact_my_staff()) limit 1),
    'schools', coalesce((
      select jsonb_agg(jsonb_build_object('id', sc.id, 'name', sc.name, 'borough', sc.borough, 'address', sc.address, 'status', sc.status) order by sc.name)
      from tp_schools sc join allowed a on a.hq = sc.hq_id
      where sc.id in (select school_id from tp_programmes where id in (select impact_coach_programmes()))), '[]'::jsonb),
    'children', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', k.id, 'family_id', k.family_id, 'programme_id', k.programme_id, 'school_id', k.school_id,
        'name', k.name, 'year_group', k.year_group, 'school', sc.name, 'medical_notes', k.medical_notes, 'send', k.send,
        'consent_photo', coalesce(k.photo_consent, false) and coalesce(f.consent_photo, false), 'stickers', k.stickers
      ) order by k.name)
      from kids k
      left join tp_schools sc on sc.id = k.school_id and sc.hq_id = k.hq_id
      left join tp_families f on f.id = k.family_id and f.hq_id = k.hq_id), '[]'::jsonb),
    'programmes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'school_id', p.school_id, 'term_label', p.term_label, 'year_groups', p.year_groups, 'current_week', p.current_week,
        'status', p.status, 'lead_staff_id', p.lead_staff_id, 'venue_id', p.venue_id
      ) order by p.term_label)
      from tp_programmes p join allowed a on a.hq = p.hq_id where p.id in (select impact_coach_programmes())), '[]'::jsonb),
    'venues', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id, 'name', v.name, 'address', v.address, 'postcode', v.postcode, 'courts', v.courts, 'surface', v.surface,
        'access_notes', v.access_notes, 'storage_notes', v.storage_notes, 'session_day', v.session_day, 'session_time', v.session_time
      ) order by v.name)
      from tp_venues v join allowed a on a.hq = v.hq_id where v.id in (select impact_coach_venues())), '[]'::jsonb),
    'families', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'guardian_name', f.guardian_name, 'phone', f.phone, 'emergency_contact', f.emergency_contact) order by f.guardian_name)
      from tp_families f join allowed a on a.hq = f.hq_id where f.id in (select family_id from kids)), '[]'::jsonb),
    'sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'kind', s.kind, 'programme_id', s.programme_id, 'session_date', s.session_date, 'week_number', s.week_number,
        'lead_staff_id', s.lead_staff_id, 'venue_id', s.venue_id, 'venue', v.name
      ) order by s.session_date)
      from ses s left join tp_venues v on v.id = s.venue_id and v.hq_id = s.hq_id), '[]'::jsonb),
    'attendance', coalesce((
      select jsonb_agg(jsonb_build_object('session_id', t.session_id, 'child_id', t.child_id, 'present', t.present, 'via', t.via))
      from tp_attendance t where t.session_id in (select id from ses) and t.child_id in (select id from kids)), '[]'::jsonb),
    'practised', coalesce((
      select jsonb_agg(jsonb_build_object('child_id', n.child_id, 'week', n.week))
      from tp_booklet_notes n where n.child_id in (select id from kids) and btrim(n.text) <> ''), '[]'::jsonb),
    'paid', coalesce((
      select jsonb_agg(distinct jsonb_build_object('child_id', p.child_id, 'item_id', p.item_id))
      from tp_pack_payments p where p.child_id in (select id from kids)), '[]'::jsonb)
  )
$$;

commit;

notify pgrst, 'reload schema';
