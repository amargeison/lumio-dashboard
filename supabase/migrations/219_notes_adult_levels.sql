-- 219 — Coach's notes on each client, and the adult levels.
--
--   coach_player_notes    the coach's private "about them" log: family, work,
--                         holidays, what they enjoy. Never shown to the family,
--                         never sent to Lumio Coach. A health note can only be
--                         kept for a client who has consented to health notes.
--   coach_adult_levels    the academy's adult levels, in order: a name, a line
--                         about the level, a video link (YouTube or Vimeo) and
--                         the checklist to pass it
--   coach_adult_passes    which checklist items each player has passed, and when
--   coach_players         adult_level_id: the adult level a player is on
--
-- Safe to run twice.

-- ── Coach's notes ─────────────────────────────────────────────────────────────
create table if not exists coach_player_notes (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references auth.users(id) on delete cascade,
  staff_id    uuid references coach_staff(id) on delete set null,
  player_id   uuid not null references coach_players(id) on delete cascade,
  kind        text not null default 'other',   -- family | work | interests | holidays | health | other
  text        text not null,
  noted_on    date not null default current_date,
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'coach_player_notes_kind_ok') then
    alter table coach_player_notes add constraint coach_player_notes_kind_ok check (kind in ('family', 'work', 'interests', 'holidays', 'health', 'other'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coach_player_notes_text_ok') then
    alter table coach_player_notes add constraint coach_player_notes_text_ok check (char_length(btrim(text)) between 1 and 1000);
  end if;
end $$;
create index if not exists idx_coach_player_notes_player on coach_player_notes (player_id, noted_on desc);
create index if not exists idx_coach_player_notes_coach on coach_player_notes (coach_id, staff_id);

-- Health notes are special category data: kept only with the client's consent.
create or replace function lumio_note_health_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'health' and not exists (
    select 1 from coach_players p where p.id = new.player_id and p.coach_id = new.coach_id and coalesce(p.consent_medical, false)
  ) then
    raise exception 'A health note can only be kept for a client who has consented to health notes.' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end $$;
revoke all on function lumio_note_health_guard() from public, anon, authenticated;
drop trigger if exists trg_note_health_guard on coach_player_notes;
create trigger trg_note_health_guard before insert or update on coach_player_notes
  for each row execute function lumio_note_health_guard();

-- ── Adult levels ──────────────────────────────────────────────────────────────
create table if not exists coach_adult_levels (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references auth.users(id) on delete cascade,
  position    integer not null default 0,
  name        text not null,
  summary     text,
  video_url   text,
  checklist   jsonb not null default '[]'::jsonb,   -- [{ id, text }]
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'coach_adult_levels_name_ok') then
    alter table coach_adult_levels add constraint coach_adult_levels_name_ok check (char_length(btrim(name)) between 1 and 60);
  end if;
  -- Only a web address: it becomes a video player on the coach's and the family's page.
  if not exists (select 1 from pg_constraint where conname = 'coach_adult_levels_video_ok') then
    alter table coach_adult_levels add constraint coach_adult_levels_video_ok check (video_url is null or (video_url ~* '^https://[^[:space:]]+$' and char_length(video_url) <= 400));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coach_adult_levels_checklist_ok') then
    alter table coach_adult_levels add constraint coach_adult_levels_checklist_ok check (jsonb_typeof(checklist) = 'array' and jsonb_array_length(checklist) <= 30);
  end if;
end $$;
create index if not exists idx_coach_adult_levels_coach on coach_adult_levels (coach_id, position);

create table if not exists coach_adult_passes (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references auth.users(id) on delete cascade,
  staff_id    uuid references coach_staff(id) on delete set null,
  player_id   uuid not null references coach_players(id) on delete cascade,
  level_id    uuid not null references coach_adult_levels(id) on delete cascade,
  item_id     text not null,
  passed_on   date not null default current_date,
  created_at  timestamptz not null default now()
);
create index if not exists idx_coach_adult_passes_player on coach_adult_passes (player_id, level_id);
create index if not exists idx_coach_adult_passes_coach on coach_adult_passes (coach_id, staff_id);

alter table coach_players add column if not exists adult_level_id uuid references coach_adult_levels(id) on delete set null;

-- A level from another academy can never be pointed at.
create or replace function lumio_guard_player_adult_level()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.adult_level_id is not null and not exists (select 1 from coach_adult_levels l where l.id = new.adult_level_id and l.coach_id = new.coach_id) then
    raise exception 'That level is not one of this academy''s.' using errcode = '42501';
  end if;
  return new;
end $$;
create or replace function lumio_guard_pass_level()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from coach_adult_levels l where l.id = new.level_id and l.coach_id = new.coach_id) then
    raise exception 'That level is not one of this academy''s.' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function lumio_guard_player_adult_level() from public, anon, authenticated;
revoke all on function lumio_guard_pass_level() from public, anon, authenticated;
drop trigger if exists trg_lumio_guard_adult_level on coach_players;
create trigger trg_lumio_guard_adult_level before insert or update of adult_level_id, coach_id on coach_players
  for each row execute function lumio_guard_player_adult_level();
drop trigger if exists trg_lumio_guard_adult_level on coach_adult_passes;
create trigger trg_lumio_guard_adult_level before insert or update on coach_adult_passes
  for each row execute function lumio_guard_pass_level();

-- ── Who may see and change them ──────────────────────────────────────────────
-- Notes and passes follow the player: the portal files them under the player's
-- coach, so an assistant sees what is written about their own players. Levels are the academy's own: every coach at the academy can read
-- them, and only the head coach changes them.
do $$
declare t text;
begin
  foreach t in array array['coach_player_notes', 'coach_adult_passes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists lumio_coach_own on public.%I', t);
    execute format($f$
      create policy lumio_coach_own on public.%I for all to authenticated
        using (lumio_can_see(coach_id, staff_id))
        with check (lumio_can_see(coach_id, staff_id))
    $f$, t);
    execute format('drop trigger if exists trg_lumio_guard_player on public.%I', t);
    execute format('create trigger trg_lumio_guard_player before insert or update on public.%I for each row execute function lumio_guard_player_ref()', t);
    execute format('drop trigger if exists trg_lumio_guard_staff on public.%I', t);
    execute format('create trigger trg_lumio_guard_staff before insert or update on public.%I for each row execute function lumio_guard_staff_ref()', t);
  end loop;
end $$;

alter table coach_adult_levels enable row level security;
drop policy if exists lumio_coach_reads on coach_adult_levels;
create policy lumio_coach_reads on coach_adult_levels for select to authenticated using (lumio_in_academy(coach_id));
drop policy if exists lumio_owner_writes on coach_adult_levels;
create policy lumio_owner_writes on coach_adult_levels for all to authenticated using (coach_id = auth.uid()) with check (coach_id = auth.uid());

notify pgrst, 'reload schema';
