-- ─────────────────────────────────────────────────────────────────────────────
-- Camps: one place per player, emails that are retried, and a way to stop
-- mailing a family about camps.
--
-- Four small things for the camp screens (the first has two parts). Safe to run twice. Deletes only the
-- log rows described in section 2, which are re-worked-out on the next hourly
-- run; nothing a family or a coach typed is touched.
-- ─────────────────────────────────────────────────────────────────────────────


-- ══ 1. A failed camp email is tried again ═══════════════════════════════════
-- WHAT WAS WRONG. coach_camp_emails holds one row per attendee and stage
-- (migration 159), and a send that failed once wrote a 'failed' row that then
-- blocked that email for ever: the family never got "See you tomorrow" because
-- Lumio Coach returned one unusable reply.
--
-- THE RULE NOW. The hourly job tries a failed email again on later runs, up to
-- three attempts in all, and the coach can press "Send again" on the Emails
-- tab. `attempts` is the count. It is raised BEFORE each retry is sent, in one
-- conditional update, so two runs that overlap cannot both send it.
alter table coach_camp_emails add column if not exists attempts integer not null default 1;

comment on column coach_camp_emails.attempts is
  'How many times this email has been tried. The hourly job stops at three; "Send again" on the Emails tab is not limited.';

-- WHAT WAS ALSO WRONG. Each row records a decision ("sent", "skipped — the camp
-- has already started") but not the date it was decided FOR. When a coach moved
-- a camp, the rows written for the old dates went on blocking the countdown for
-- the new ones: a camp postponed to tomorrow never sent "See you tomorrow".
--
-- THE RULE NOW. `due_at` is when that email was due at the moment the row was
-- written. The hourly job compares it with the camp's dates as they are today
-- and discards a row that no longer matches (camp-lifecycle.ts, logOutOfDate),
-- so the email is decided again for the new date. Rows written before this
-- column existed have no date and are judged on when they were written.
alter table coach_camp_emails add column if not exists due_at timestamptz;

comment on column coach_camp_emails.due_at is
  'When this email was due, for the camp dates in force when the row was written. Null on rows older than migration 201.';


-- ══ 2. "Don't send this one" was recorded weeks early ═══════════════════════
-- WHAT WAS WRONG. Ticking "Don't send this one" wrote a 'skipped by the coach'
-- row for every attendee at the next hourly run, long before the email was due.
-- Unticking it later changed nothing: the rows were already there.
--
-- THE RULE NOW. That switch is read on every run and never written to the log
-- (camp-lifecycle.ts). The rows already written are removed here so a coach who
-- changed their mind is listened to. Where the switch is still on, nothing is
-- sent; where it is off, the email goes if it is still within three days of its
-- date, and is otherwise recorded as too late — it is never sent weeks late.
--
-- Matched on the exact wording the old code wrote, at the time it wrote it.
delete from coach_camp_emails
 where status = 'skipped' and error = 'skipped by the coach';


-- ══ 3. One place per player per camp ════════════════════════════════════════
-- WHAT WAS WRONG. Double-clicking "+ Add" on the Attendees tab put the same
-- roster player on the camp twice (two places, two confirmations): the browser
-- was the only thing checking.
--
-- THE RULE NOW. A place added in the portal, or by an import, is refused when
-- that player already holds a place on that camp that has not been cancelled.
-- The camp row is locked for the length of the check, so two clicks at the same
-- instant are one after the other — and so is a public sign-up arriving at that
-- moment, which locks the same row (migration 197).
--
-- WHY A TRIGGER AND NOT A UNIQUE INDEX. Two things the database already does
-- would be broken by an index on (camp_id, player_id):
--   • Merging two roster records (migration 200) moves both records' places to
--     the one that is kept. If both were on the same camp the merge would fail
--     outright — and that is exactly the pair a coach is asked to merge after a
--     public sign-up made a second record for a child already on the roster.
--   • A public sign-up for a roster child the coach had already added would be
--     answered with an error instead of a place (migration 197 decides what a
--     public sign-up may be tied to, and is left alone here).
-- So the rule is enforced on what a coach ADDS, which is where the fault was.
-- Rows that are moved onto a player afterwards (a merge) are not refused; the
-- notice below lists any camp that already has the same player twice, so they
-- can be looked at by hand.
create or replace function lumio_one_camp_place()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- The public sign-up has its own rules and already holds this lock.
  if new.player_id is null
     or coalesce(new.source, 'coach') = 'signup'
     or coalesce(new.status, 'confirmed') = 'cancelled' then
    return new;
  end if;

  perform 1 from coach_camps c where c.id = new.camp_id for update;

  if exists (select 1 from coach_camp_attendees a
              where a.camp_id = new.camp_id
                and a.player_id = new.player_id
                and coalesce(a.status, 'confirmed') <> 'cancelled') then
    raise exception 'They already have a place on this camp.' using errcode = '23505';
  end if;
  return new;
end $$;

revoke all on function lumio_one_camp_place() from public, anon, authenticated;

-- Named to sort AFTER trg_lumio_link_player (migration 193), which is what
-- fills in player_id for a row that arrives with only a name.
drop trigger if exists trg_lumio_one_camp_place on public.coach_camp_attendees;
create trigger trg_lumio_one_camp_place before insert on public.coach_camp_attendees
  for each row execute function lumio_one_camp_place();

do $$
declare
  n integer;
begin
  select count(*) into n from (
    select 1 from coach_camp_attendees
     where player_id is not null and coalesce(status, 'confirmed') <> 'cancelled'
     group by camp_id, player_id having count(*) > 1) d;
  if n > 0 then
    raise notice 'Migration 201: % camp/player pair(s) already hold more than one place. Nothing was changed; list them with: select camp_id, player_id, count(*) from coach_camp_attendees where player_id is not null and coalesce(status, ''confirmed'') <> ''cancelled'' group by 1, 2 having count(*) > 1;', n;
  end if;
end $$;


-- ══ 4. "Please stop emailing me about camps" ════════════════════════════════
-- WHAT WAS WRONG. Camp announcements end "if you'd rather not hear about camps,
-- just reply and say so — you'll be taken off the list", and there was no list
-- to be taken off: nothing on a player recorded it, and every new announcement
-- ticked the whole roster again.
--
-- THE RULE NOW. One flag on the player, set by the coach when a family asks.
-- The announcement route leaves out every address that belongs to a flagged
-- player, whatever the browser sends. It covers camp ANNOUNCEMENTS only — the
-- emails about a camp somebody has actually booked are not marketing and are
-- not affected.
alter table coach_players add column if not exists no_camp_emails boolean not null default false;

comment on column coach_players.no_camp_emails is
  'The family asked not to be sent camp announcements. Honoured by /api/coach/camp-blast. Does not affect emails about a camp they are booked on.';
