-- ─────────────────────────────────────────────────────────────────────────────
-- "Read this one." — a coach's recommendation, attached to a player.
--
-- The Resource Centre could only ever recommend to EVERYONE: a resource carried
-- a racket colour and every player on that colour saw it. But the reason a coach
-- hands a fourteen-year-old Winning Ugly is nothing to do with their colour —
-- it is that they lose to players they out-hit. That is a recommendation to one
-- person, and there was nowhere to put it.
--
-- Deliberately denormalised. The title and author are copied in rather than
-- joined, because the books are a fixed shelf in code and the student portal
-- reads this through a service-role query that should not have to know that.
-- A recommendation is also a record of something the coach said at the time —
-- if the shelf changes later, what they recommended should not.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists coach_player_resources (
  id         uuid default gen_random_uuid() primary key,
  coach_id   uuid not null references auth.users(id) on delete cascade,
  player_id  uuid not null references coach_players(id) on delete cascade,
  kind       text not null default 'book',      -- book | resource
  ref_id     text not null,                     -- books.ts id, or a coach_resources id
  title      text not null,
  author     text,
  note       text,                              -- why the coach picked it
  created_at timestamptz default now()
);

-- One recommendation per player per item. Recommending the same book twice is a
-- coach clicking again, not a second recommendation.
create unique index if not exists uq_player_resource on coach_player_resources (player_id, kind, ref_id);
create index if not exists idx_player_resources_coach on coach_player_resources (coach_id, player_id);

alter table coach_player_resources enable row level security;

drop policy if exists lumio_player_resources_owner on coach_player_resources;
create policy lumio_player_resources_owner on coach_player_resources for all to authenticated
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

-- A coach can see and set recommendations for the players they are assigned,
-- using the same helper the rest of the academy's tables use (migration 166).
drop policy if exists lumio_player_resources_staff on coach_player_resources;
create policy lumio_player_resources_staff on coach_player_resources for select to authenticated
  using (lumio_in_academy(coach_id));

-- ── Lumio's own writing is not a book ───────────────────────────────────────
-- The seeded library filed ten PDFs — parent guides, cheat sheets, reading
-- notes — under "Books", so the Books tab showed Lumio's own worksheets and no
-- actual books. They are guides, and now say so. Matched on the lumio: url
-- prefix, so a coach's own book entry is left exactly where they put it.
update coach_resources
   set category = 'Guides', updated_at = now()
 where category = 'Books'
   and url like 'lumio:%';
