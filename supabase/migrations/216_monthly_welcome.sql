-- 216 — Monthly plans, and the welcome link with its questionnaire.
--
--   coach_memberships        a client's monthly plan: a set amount, taken on a
--                            set day each month from their saved card or Direct
--                            Debit, once they have agreed to it
--   coach_membership_bills   one month of a plan: the claim that it is being
--                            charged, and the charge that paid it
--   coach_welcome_links      a client's welcome link: the questionnaire, their
--                            card or Direct Debit, the cancellation policy and
--                            (when there is one) their monthly plan, in one place
--   coach_questionnaires     what they told the coach
--
-- Lumio takes each month itself (no Stripe Billing, so no 0.7% billing fee):
-- the same off-session payment as a lesson, claimed once per plan per month.
--
-- The coach sets a plan up from the portal, but only the client can agree to
-- it: the agreement columns are written by the server alone, and changing the
-- amount or the day of an agreed plan asks the client to agree again.
-- Safe to run twice.

create table if not exists coach_memberships (
  id              uuid primary key default gen_random_uuid(),
  coach_id        uuid not null references auth.users(id) on delete cascade,
  staff_id        uuid references coach_staff(id) on delete set null,
  player_id       uuid not null references coach_players(id) on delete cascade,
  name            text not null default 'Monthly plan',
  amount_pennies  integer not null,
  day_of_month    integer not null default 1,
  starts_month    text not null,                  -- 'YYYY-MM'
  covers          text not null default 'lessons', -- lessons | group | none
  group_id        uuid references coach_groups(id) on delete set null,
  status          text not null default 'offered', -- offered | active | paused | ended
  agreed_at       timestamptz,
  agreed_by       text,
  agreed_text     text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'coach_memberships_ok') then
    alter table coach_memberships add constraint coach_memberships_ok check (
      char_length(btrim(name)) between 1 and 80
      and amount_pennies between 50 and 200000
      and day_of_month between 1 and 28
      and starts_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
      and covers in ('lessons', 'group', 'none')
      and status in ('offered', 'active', 'paused', 'ended')
    );
  end if;
end $$;
create index if not exists idx_coach_memberships_coach on coach_memberships (coach_id, status);
create index if not exists idx_coach_memberships_player on coach_memberships (player_id);

alter table coach_memberships enable row level security;
drop policy if exists lumio_coach_own on coach_memberships;
create policy lumio_coach_own on coach_memberships for all to authenticated
  using (lumio_can_see(coach_id, staff_id)) with check (lumio_can_see(coach_id, staff_id));
-- The browser may write everything except the client's agreement.
revoke insert, update on coach_memberships from authenticated;
grant insert (id, coach_id, staff_id, player_id, name, amount_pennies, day_of_month, starts_month, covers, group_id, status, notes, created_at, updated_at) on coach_memberships to authenticated;
grant update (staff_id, name, amount_pennies, day_of_month, starts_month, covers, group_id, status, notes, updated_at) on coach_memberships to authenticated;

-- A plan is only 'active' once the client has agreed; a changed amount or day
-- needs agreeing again.
create or replace function lumio_membership_guard() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and old.agreed_at is not null
     and (new.amount_pennies is distinct from old.amount_pennies or new.day_of_month is distinct from old.day_of_month)
     and new.agreed_at is not distinct from old.agreed_at then
    new.agreed_at := null; new.agreed_by := null; new.agreed_text := null;
  end if;
  if new.status = 'active' and new.agreed_at is null then new.status := 'offered'; end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists trg_membership_guard on coach_memberships;
create trigger trg_membership_guard before insert or update on coach_memberships
  for each row execute function lumio_membership_guard();

create table if not exists coach_membership_bills (
  id              uuid primary key default gen_random_uuid(),
  coach_id        uuid not null references auth.users(id) on delete cascade,
  staff_id        uuid references coach_staff(id) on delete set null,
  membership_id   uuid not null references coach_memberships(id) on delete cascade,
  player_id       uuid references coach_players(id) on delete set null,
  period          text not null,                  -- 'YYYY-MM'
  amount_pennies  integer not null,
  charge_id       uuid references coach_charges(id) on delete set null,
  status          text not null default 'charging', -- charging | done | failed
  failure_reason  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (membership_id, period)
);
create index if not exists idx_coach_membership_bills_coach on coach_membership_bills (coach_id, period);

create table if not exists coach_welcome_links (
  id            uuid primary key default gen_random_uuid(),
  coach_id      uuid not null references auth.users(id) on delete cascade,
  staff_id      uuid references coach_staff(id) on delete set null,
  player_id     uuid not null references coach_players(id) on delete cascade,
  token         text not null unique,
  version       text not null default 'short',     -- short | long
  sent_to       text,
  sent_at       timestamptz,
  opened_at     timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_coach_welcome_links_player on coach_welcome_links (coach_id, player_id);

create table if not exists coach_questionnaires (
  id              uuid primary key default gen_random_uuid(),
  coach_id        uuid not null references auth.users(id) on delete cascade,
  staff_id        uuid references coach_staff(id) on delete set null,
  player_id       uuid not null references coach_players(id) on delete cascade,
  link_id         uuid references coach_welcome_links(id) on delete set null,
  version         text not null,
  answers         jsonb not null default '{}'::jsonb,
  health_consent  boolean not null default false,
  submitted_at    timestamptz not null default now()
);
create index if not exists idx_coach_questionnaires_player on coach_questionnaires (coach_id, player_id, submitted_at desc);

-- Written only by the server; the coach (and an invited coach, for their own
-- players) may read them.
do $$
declare t text;
begin
  foreach t in array array['coach_membership_bills', 'coach_welcome_links', 'coach_questionnaires'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke insert, update, delete, truncate on public.%I from public, anon, authenticated', t);
    execute format('drop policy if exists lumio_coach_reads on public.%I', t);
    execute format($f$
      create policy lumio_coach_reads on public.%I for select to authenticated
        using (lumio_can_see(coach_id, staff_id))
    $f$, t);
  end loop;
end $$;

notify pgrst, 'reload schema';
