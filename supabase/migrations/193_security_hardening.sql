-- ─────────────────────────────────────────────────────────────────────────────
-- Security hardening for the coach portal's database rules.
--
-- Every block below closes something a tester got through using nothing but
-- the public key and (at most) an ordinary sign-in. The pattern is the same
-- each time: a rule checked ONE thing ("is coach_id you?") and trusted the rest
-- of the row. The rest of the row is typed by whoever is calling.
--
-- Safe to run twice. Deletes nothing. Every object is checked for before it is
-- touched, because production has tables and columns added by hand that the
-- migrations do not know about, and may be missing ones they do.
--
-- Reminder of the two questions (migration 164):
--   coach_id  = which ACADEMY owns this row
--   staff_id  = which COACH it is for
-- ─────────────────────────────────────────────────────────────────────────────


-- ══ 0. "Is this the server?" ════════════════════════════════════════════════
-- Several rules below say "only Lumio's own servers may do this". The servers
-- connect with the service key, whose database role is allowed past row level
-- security; the browser connects as `anon` or `authenticated`, which are not.
-- So the test is that permission itself, read from the database, rather than a
-- list of role names that could drift. Anything unrecognised counts as NOT the
-- server — the failure mode is a refusal, never an opening.
--
-- Deliberately NOT security definer: it has to see who is really calling.
create or replace function lumio_is_server()
returns boolean
language sql stable set search_path = public, pg_catalog as $$
  select coalesce(
    (select r.rolsuper or r.rolbypassrls from pg_roles r where r.rolname = current_user),
    false)
$$;


-- ══ 1. The staff directory view was writable by anybody ═════════════════════
-- WHAT WAS WRONG. coach_staff_directory (migration 167) exists so an assistant
-- coach can see colleagues' names without seeing their DBS numbers. To do that
-- it runs with its owner's rights, not the caller's. Migration 167 then ran
-- `revoke all … from public` — but on Supabase the browser roles `anon` and
-- `authenticated` are granted everything on every new table and view BY NAME,
-- and revoking from PUBLIC does not touch a named grant. So the view kept
-- insert, update and delete for both, and because it runs with its owner's
-- rights those writes went straight past coach_staff's row level security: a
-- signed-out visitor could add a coach to any academy, and any assistant could
-- rename, delete or promote a colleague.
--
-- THE RULE NOW. The view is read-only, for signed-in users only. It still runs
-- with its owner's rights — switching it to the caller's rights would hide every
-- colleague from an assistant, since they have no read access to coach_staff
-- (that is the whole reason the view exists). Its WHERE clause is what limits
-- it to the caller's own academy.
do $$
begin
  if to_regclass('public.coach_staff_directory') is not null then
    revoke all on public.coach_staff_directory from public, anon, authenticated;
    grant select on public.coach_staff_directory to authenticated;
  end if;
end $$;

-- The same hole on any other view. A view that runs with its owner's rights and
-- can be written through with the public key is a way round row level security
-- by construction, whatever it selects. The migrations create no other view, but
-- production may hold ones made by hand, so every such view in the public schema
-- loses its write grants for the browser roles. Reading is left exactly as it is.
do $$
declare v record;
begin
  for v in
    select c.oid::regclass as rel
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
      and not coalesce(c.reloptions::text[] @> array['security_invoker=true'], false)
      and not coalesce(c.reloptions::text[] @> array['security_invoker=on'], false)
  loop
    execute format('revoke insert, update, delete, truncate on %s from public, anon, authenticated', v.rel);
  end loop;
end $$;

-- One function was answering questions for signed-out visitors. Given an academy
-- and a child's name, lumio_payment_player returns that child's id — and, like
-- the view, it had been "revoked from public" while anon kept its named grant.
-- Only the payments trigger ever needed it, and a trigger does not need a grant.
do $$
begin
  if to_regprocedure('public.lumio_payment_player(uuid, text)') is not null then
    revoke all on function public.lumio_payment_player(uuid, text) from public, anon, authenticated;
  end if;
end $$;


-- ══ 2. An account owner could edit their own plan, and anybody could become an academy ══
-- WHAT WAS WRONG. sports_profiles had "you may insert and update the row whose
-- id is you", covering every column. So a head coach could set their own plan,
-- account status and admin notes, or take a reserved address such as `demo`.
-- And any signed-in parent or student could INSERT a row for themselves with
-- sport = 'coach' — which is exactly what the server checks to decide somebody
-- is a real academy (src/lib/coach/academy-guard.ts), so they walked into the
-- paid features without signing up.
--
-- THE RULE NOW.
--   · Creating a profile is the server's job (the sign-up route). The browser
--     may still send an UPSERT for a row that already exists — the first-run
--     wizard does — but it can no longer bring a row into being.
--   · The owner may change the columns the wizard and Settings write, and
--     nothing else. It is a list of what IS allowed, so a column added later is
--     locked until somebody decides otherwise.
--   · `setup_complete` may be switched on by the owner only for a self-setup
--     portal — that is what the wizard does. For a portal Lumio is setting up,
--     going live stays Lumio's decision.
--   · A portal address must be lower-case letters, digits and single hyphens,
--     2 to 60 characters, and not one of the words the site itself uses. Checked
--     only when the address CHANGES, so an older address that would not pass
--     today is not broken by an unrelated save. One address per sport is already
--     guaranteed by the unique index from migration 186.
--
-- Left writable on purpose: `enabled_features`. It sounds like billing but is
-- the list of modules a player ticked in the sports onboarding wizard
-- (src/components/sports/OnboardingWizard.tsx writes it from the browser); what
-- an academy has paid for lives elsewhere.
--
-- The server is exempt from all of it: sign-up, the admin screens and support
-- need to set every one of these.
create or replace function lumio_profile_guard()
returns trigger
language plpgsql set search_path = public, pg_catalog as $$
declare
  k text;
  was jsonb;
  -- Everything the browser legitimately writes today. See the wizard
  -- (CoachOnboardingWizard.tsx, components/sports/OnboardingWizard.tsx) and
  -- Settings (saveCoachProfile in coach-db.ts, SportsSettings.tsx).
  allowed constant text[] := array[
    'display_name', 'nickname', 'avatar_url', 'brand_name', 'brand_logo_url',
    'club_name', 'location', 'contact_email', 'contact_phone', 'calendar_provider',
    'dpa_accepted_at', 'head_coach_dbs_number', 'head_coach_dbs_expiry',
    'head_coach_safeguarding_date', 'portal_slug', 'enabled_features', 'invites',
    'setup_type', 'setup_complete', 'onboarding_complete', 'updated_at'
  ];
  -- Words that are pages of the site, not academies. Kept in step with
  -- /api/coach/slug-check and /api/sports-auth/create-profile.
  reserved constant text[] := array[
    'demo', 'admin', 'new', 'settings', 'login', 'signup', 'api', 'portal',
    'lumio', 'test', 'sso', 'guides'
  ];
begin
  if lumio_is_server() then return new; end if;

  if tg_op = 'INSERT' then
    -- An upsert arrives here first even when the row exists; the changes it
    -- carries are then checked as an UPDATE below. With no existing row this
    -- would be a brand-new profile, which the browser may not create.
    if not exists (select 1 from sports_profiles p where p.id = new.id) then
      raise exception 'Your account has not been set up yet. Please sign up first, or contact Lumio support if you already have.'
        using errcode = '42501';
    end if;
    return new;
  end if;

  was := to_jsonb(old);
  for k in
    select n.key
    from jsonb_each(to_jsonb(new)) n
    where n.value is distinct from (was -> n.key)
  loop
    if not (k = any (allowed)) then
      raise exception 'This part of your account (%) is managed by Lumio and cannot be changed here.', k
        using errcode = '42501';
    end if;
  end loop;

  if new.setup_complete is distinct from old.setup_complete
     and not (new.setup_complete is true and new.setup_type = 'self') then
    raise exception 'Lumio switches your portal on once it has been set up for you. Nothing was changed.'
      using errcode = '42501';
  end if;

  if new.portal_slug is distinct from old.portal_slug then
    if new.portal_slug is null or new.portal_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
      raise exception 'That portal address will not work. Please use lower-case letters, numbers and hyphens only.'
        using errcode = '23514';
    end if;
    if length(new.portal_slug) < 2 or length(new.portal_slug) > 60 then
      raise exception 'A portal address needs to be between 2 and 60 characters long.'
        using errcode = '23514';
    end if;
    if new.portal_slug = any (reserved) then
      raise exception 'That portal address is reserved. Please choose a different one.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end $$;

do $$
begin
  if to_regclass('public.sports_profiles') is not null then
    drop trigger if exists trg_lumio_profile_guard on public.sports_profiles;
    create trigger trg_lumio_profile_guard
      before insert or update on public.sports_profiles
      for each row execute function lumio_profile_guard();
  end if;
end $$;


-- ══ 3. A head coach could forge "bank connected" and paid charges ═══════════
-- WHAT WAS WRONG. coach_stripe and coach_charges had "full access to your own
-- rows". A coach could therefore write a row saying their bank was connected,
-- point it at any Stripe account id, or invent a paid charge — the portal then
-- showed the live Take-a-payment form.
--
-- THE RULE NOW. These two are written only by the server (the connect route,
-- checkout and the Stripe webhook, all using the service key). The academy's
-- owner may read their own rows; nobody writes them from a browser. The write
-- grants are removed as well as the policy, so a policy somebody adds later
-- under another name cannot quietly reopen it.
do $$
declare t text; pol record;
begin
  foreach t in array array['coach_stripe', 'coach_charges'] loop
    if to_regclass('public.' || t) is null then continue; end if;

    execute format('alter table public.%I enable row level security', t);
    execute format('revoke insert, update, delete, truncate on public.%I from public, anon, authenticated', t);

    -- Any policy on these tables that allows a write goes; a read-only one for
    -- the owner replaces them.
    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t and cmd <> 'SELECT'
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;

    execute format('drop policy if exists lumio_owner_reads on public.%I', t);
    execute format($f$
      create policy lumio_owner_reads on public.%I for select to authenticated
        using (coach_id = auth.uid())
    $f$, t);
  end loop;
end $$;


-- ══ 4. A row could point at another academy's player, coach or camp ═════════
-- WHAT WAS WRONG. Every rule checked `coach_id` and nothing else on the row. So
-- a signed-in student could write skill scores against their own player with
-- coach_id set to THEMSELVES — the row passed, the family's app showed the
-- scores, and the real coach was then blocked from grading that skill. Another
-- academy could put its own attendee on MY camp (coach_id theirs, camp_id mine):
-- my camp's emails then went to an address they chose and the place came out of
-- my capacity. The same shape was open on every table that carries a player, a
-- coach or a camp.
--
-- THE RULE NOW. Whoever a row points at must belong to the academy the row
-- belongs to: player_id must be one of that academy's players, staff_id one of
-- its coaches, camp_id one of its camps. Checked for every writer, the server
-- included — there is no honest reason for a row to cross academies. Checked
-- when a row is created or when the link (or the academy) changes, so an old
-- row whose player has since been deleted can still be edited.
--
-- These run with their owner's rights because the caller often cannot see the
-- thing being pointed at (an assistant cannot read coach_staff at all). They
-- answer only yes or no, and give the same answer for "another academy's" and
-- "does not exist".
create or replace function lumio_guard_player_ref()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.player_id is not null
     and (tg_op = 'INSERT'
          or new.player_id is distinct from old.player_id
          or new.coach_id  is distinct from old.coach_id)
     and not exists (select 1 from coach_players p
                     where p.id = new.player_id and p.coach_id = new.coach_id) then
    raise exception 'That player is not on this academy''s roster.' using errcode = '42501';
  end if;
  return new;
end $$;

create or replace function lumio_guard_staff_ref()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.staff_id is not null
     and (tg_op = 'INSERT'
          or new.staff_id is distinct from old.staff_id
          or new.coach_id is distinct from old.coach_id)
     and not exists (select 1 from coach_staff s
                     where s.id = new.staff_id and s.coach_id = new.coach_id) then
    raise exception 'That coach is not part of this academy.' using errcode = '42501';
  end if;
  return new;
end $$;

create or replace function lumio_guard_camp_ref()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.camp_id is not null
     and (tg_op = 'INSERT'
          or new.camp_id  is distinct from old.camp_id
          or new.coach_id is distinct from old.coach_id)
     and not exists (select 1 from coach_camps c
                     where c.id = new.camp_id and c.coach_id = new.coach_id) then
    raise exception 'That camp does not belong to this academy.' using errcode = '42501';
  end if;
  return new;
end $$;

-- coach_members names its academy `academy_id`, and its links are the player a
-- family may see and the coach a login acts as. Both must be the academy's own:
-- a membership pointing at another academy's child would show that child to a
-- stranger.
create or replace function lumio_guard_member_refs()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.scope_player_id is not null
     and (tg_op = 'INSERT'
          or new.scope_player_id is distinct from old.scope_player_id
          or new.academy_id      is distinct from old.academy_id)
     and not exists (select 1 from coach_players p
                     where p.id = new.scope_player_id and p.coach_id = new.academy_id) then
    raise exception 'That player is not on this academy''s roster.' using errcode = '42501';
  end if;
  if new.staff_id is not null
     and (tg_op = 'INSERT'
          or new.staff_id   is distinct from old.staff_id
          or new.academy_id is distinct from old.academy_id)
     and not exists (select 1 from coach_staff s
                     where s.id = new.staff_id and s.coach_id = new.academy_id) then
    raise exception 'That coach is not part of this academy.' using errcode = '42501';
  end if;
  return new;
end $$;

revoke all on function lumio_guard_player_ref()  from public, anon, authenticated;
revoke all on function lumio_guard_staff_ref()   from public, anon, authenticated;
revoke all on function lumio_guard_camp_ref()    from public, anon, authenticated;
revoke all on function lumio_guard_member_refs() from public, anon, authenticated;

-- Attach to every coach table that has the column. Named tables rather than
-- "anything called coach_*", so a table added by hand in production with a
-- column that merely shares a name is not caught by surprise; each is skipped
-- if the table or the column is not there.
do $$
declare
  t text;
  has_col boolean;
  spec record;
begin
  for spec in
    select * from (values
      ('player_id', 'lumio_guard_player_ref', 'trg_lumio_guard_player', array[
        'coach_attendance', 'coach_booking_links', 'coach_bookings', 'coach_camp_attendees',
        'coach_development', 'coach_media', 'coach_messages', 'coach_payments',
        'coach_player_resources', 'coach_player_skills', 'coach_sessions', 'coach_watch_sessions']),
      ('staff_id', 'lumio_guard_staff_ref', 'trg_lumio_guard_staff', array[
        'coach_attendance', 'coach_booking_links', 'coach_bookings', 'coach_camps',
        'coach_development', 'coach_equipment', 'coach_kit_items', 'coach_players',
        'coach_session_plans', 'coach_sessions', 'coach_staff_venues']),
      ('camp_id', 'lumio_guard_camp_ref', 'trg_lumio_guard_camp', array[
        'coach_camp_attendees', 'coach_camp_blasts', 'coach_camp_channels',
        'coach_camp_emails', 'coach_messages'])
    ) as s(col, fn, trg, tables)
  loop
    foreach t in array spec.tables loop
      select count(*) = 2 into has_col
      from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name in (spec.col, 'coach_id');
      if not has_col then continue; end if;
      execute format('drop trigger if exists %I on public.%I', spec.trg, t);
      execute format('create trigger %I before insert or update on public.%I for each row execute function %I()',
                     spec.trg, t, spec.fn);
    end loop;
  end loop;

  select count(*) = 3 into has_col
  from information_schema.columns
  where table_schema = 'public' and table_name = 'coach_members'
    and column_name in ('academy_id', 'scope_player_id', 'staff_id');
  if has_col then
    drop trigger if exists trg_lumio_guard_member on public.coach_members;
    create trigger trg_lumio_guard_member before insert or update on public.coach_members
      for each row execute function lumio_guard_member_refs();
  end if;
end $$;


-- ══ 5. A row's player NAME and player ID could say two different people ═════
-- WHAT WAS WRONG. Payments, bookings, lessons, development notes, recordings and
-- camp places all carry both player_name and player_id. The access rules read
-- the id; the coach's screens show and total by the name. Nothing made them
-- agree. An assistant coach could therefore file an invoice with the id of one
-- of THEIR players and the name of somebody else's: the rule saw their own
-- player and let it through, and the head coach saw a new debt against a family
-- the assistant has nothing to do with. (Migration 188's trigger only filled the
-- id in when it was missing — "a player_id set deliberately by the app is left
-- alone".)
--
-- THE RULE NOW. The id is the truth and the name is its label.
--   · A row written with a player_id carries that player's name, whatever name
--     was sent with it. The forged invoice above becomes an ordinary invoice for
--     the assistant's own player, which they are allowed to raise.
--   · The one exception is an edit that changes the NAME and leaves the id
--     alone. Several screens work that way (the payment and lesson forms send
--     only a name), and the coach plainly means "this is for somebody else
--     now". The row follows the name: it is linked to the one player in the
--     academy with that name, or to nobody if there is none or more than one.
--     The access rule then runs on the id that results, so an assistant still
--     cannot move a payment onto a player who is not theirs.
--   · A row with a name and no id is linked the same way: one match or none.
--     (This is what migration 188 did for payments; it now holds for the others.
--     It grants nothing new — the family's app already shows unlinked rows by
--     name.)
--
-- Why the id wins rather than the name: the id is what the rules check and what
-- the family's app reads, two players CAN share a name, and a name goes out of
-- date the moment a player is renamed. If the name won, a stale name in an open
-- browser tab would silently detach a row from its player.
create or replace function lumio_player_by_name(p_academy uuid, p_name text)
returns uuid
language sql stable security definer set search_path = public as $$
  select case when count(*) = 1 then min(p.id::text)::uuid end
  from coach_players p
  where p.coach_id = p_academy
    and lower(btrim(p.name)) = lower(btrim(p_name))
$$;
revoke all on function lumio_player_by_name(uuid, text) from public, anon, authenticated;

create or replace function lumio_link_player()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_name text;
begin
  if new.player_id is not null then
    select p.name into v_name
    from coach_players p
    where p.id = new.player_id and p.coach_id = new.coach_id;

    if not found then
      -- Only reachable for an old row whose player has since been deleted
      -- (bookings, lessons and recordings have no foreign key). A new or changed
      -- link to a missing player was already refused by section 4.
      return new;
    end if;

    if lower(btrim(coalesce(new.player_name, ''))) = lower(btrim(coalesce(v_name, ''))) then
      return new;                                   -- they agree
    end if;

    if tg_op = 'UPDATE'
       and new.player_id   is not distinct from old.player_id
       and new.player_name is distinct from old.player_name then
      new.player_id := null;                        -- the name was edited: follow it (below)
    else
      new.player_name := v_name;                    -- the id is the truth
      return new;
    end if;
  end if;

  if new.player_id is null and coalesce(btrim(new.player_name), '') <> '' then
    new.player_id := lumio_player_by_name(new.coach_id, new.player_name);
  end if;
  return new;
end $$;
revoke all on function lumio_link_player() from public, anon, authenticated;

-- The same question for a coach: staff_id and assigned_coach.
--
-- The id already won here (migration 165), so the two could not be made to
-- disagree. Three things were still loose:
--   · the name was looked up by id alone, so an id from another academy would
--     have copied that academy's coach's name onto the row;
--   · a name with no id was matched with `limit 1`, so two coaches sharing a
--     name gave the row to whichever came first — the "ambiguous must fail
--     closed" rule from migration 166 was not being kept here;
--   · an edit that changed only the name was silently undone, because the id
--     was still set and the name was re-derived from it. The roster form sends
--     only the name, so a player's coach could be set once and never changed.
-- Now: looked up within the academy only, one match or none, and a changed name
-- with an untouched id is followed, exactly as for players above.
create or replace function sync_assigned_coach()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_name text;
begin
  if tg_op = 'UPDATE'
     and new.staff_id is not null
     and new.staff_id is not distinct from old.staff_id
     and new.assigned_coach is distinct from old.assigned_coach
     and not exists (select 1 from coach_staff s
                     where s.id = new.staff_id and s.coach_id = new.coach_id
                       and lower(trim(s.name)) = lower(trim(coalesce(new.assigned_coach, '')))) then
    new.staff_id := null;
  end if;

  if new.staff_id is not null then
    select s.name into v_name from coach_staff s
    where s.id = new.staff_id and s.coach_id = new.coach_id;
    if found then new.assigned_coach := v_name; end if;
  elsif coalesce(trim(new.assigned_coach), '') <> '' then
    select case when count(*) = 1 then min(s.id::text)::uuid end into new.staff_id
    from coach_staff s
    where s.coach_id = new.coach_id
      and lower(trim(s.name)) = lower(trim(new.assigned_coach));
  end if;
  return new;
end $$;


-- ══ 6. Existing rows: fill in the player where there is no doubt ════════════
-- Rows written before player ids existed (or by a screen that sends only a name)
-- are linked now, by the same rule as always: the name belongs to exactly one
-- player in that academy. Two players sharing the name → left unlinked rather
-- than guessed at. Run BEFORE the new triggers are attached so this touches
-- nothing but the one column.
do $$
declare t text; ok boolean;
begin
  foreach t in array array[
    'coach_bookings', 'coach_sessions', 'coach_payments',
    'coach_development', 'coach_media', 'coach_camp_attendees'
  ] loop
    select count(*) = 3 into ok
    from information_schema.columns
    where table_schema = 'public' and table_name = t
      and column_name in ('coach_id', 'player_id', 'player_name');
    if not ok then continue; end if;
    execute format($f$
      update public.%I x
         set player_id = lumio_player_by_name(x.coach_id, x.player_name)
       where x.player_id is null
         and coalesce(btrim(x.player_name), '') <> ''
         and lumio_player_by_name(x.coach_id, x.player_name) is not null
    $f$, t);
  end loop;
end $$;

-- Messages are addressed by name in thread_key (or, on older rows, recipients).
-- Same rule as migrations 194 and 196; repeated here so it holds whichever order
-- the three are run in.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'coach_messages' and column_name = 'player_id') then
    update public.coach_messages m
       set player_id = lumio_player_by_name(m.coach_id, coalesce(nullif(btrim(m.thread_key), ''), btrim(m.recipients)))
     where m.player_id is null
       and m.camp_id is null
       and coalesce(nullif(btrim(m.thread_key), ''), btrim(m.recipients)) is not null
       and lumio_player_by_name(m.coach_id, coalesce(nullif(btrim(m.thread_key), ''), btrim(m.recipients))) is not null;
  end if;
end $$;

-- Now attach the name/id rule. On payments it replaces migration 188's trigger.
do $$
declare t text; ok boolean;
begin
  foreach t in array array[
    'coach_bookings', 'coach_sessions', 'coach_payments',
    'coach_development', 'coach_media', 'coach_camp_attendees'
  ] loop
    select count(*) = 3 into ok
    from information_schema.columns
    where table_schema = 'public' and table_name = t
      and column_name in ('coach_id', 'player_id', 'player_name');
    if not ok then continue; end if;
    execute format('drop trigger if exists trg_lumio_link_player on public.%I', t);
    execute format('create trigger trg_lumio_link_player before insert or update on public.%I for each row execute function lumio_link_player()', t);
  end loop;

  if to_regclass('public.coach_payments') is not null then
    drop trigger if exists trg_coach_payments_player on public.coach_payments;
  end if;
end $$;


-- ══ 7. Renaming a player cut them off from their own history ════════════════
-- WHAT WAS WRONG. Fixing a one-letter typo in a player's name left their
-- bookings, lessons, invoices, camp places and messages under the old spelling.
-- The screens match those by name, so the player showed "No lessons", "Nothing
-- booked" and "No plan", and the debt sat at the bottom of the payments table
-- under a name that was no longer on the roster.
--
-- THE RULE NOW. A rename carries through, modelled on the one staff already
-- have (trg_coach_staff_cascade_rename, migration 164):
--   · rows linked to the player by id take the new name;
--   · rows with NO id that carry the old name take the new name — and the id —
--     only when the old name belonged to this player and nobody else in the
--     academy. If two players shared it there is no telling whose the row was,
--     so it is left alone.
-- Tables with only a name (card charges, GPS sessions, a session plan's
-- "group / player", the per-player targets inside a camp) follow the second
-- rule. A booking's title is carried too when it IS the name, or ends with it
-- ("Private — Eve Evans"), since the title is what the calendar shows.
--
-- Messages: thread_key, recipients and from_name hold the player's name on a
-- conversation with that family, and are changed only where they hold exactly
-- the old name. to_name is not touched — it is the COACH a family wrote to.
-- A camp thread (thread_key 'camp:<id>') is never a player's name and is left.
create or replace function coach_players_cascade_rename()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_old    text := lower(btrim(coalesce(old.name, '')));
  v_only   boolean;
  t        text;
  has_id   boolean;
  spec     record;
begin
  if new.name is not distinct from old.name
     or coalesce(btrim(new.name), '') = ''
     or v_old = '' then
    return new;
  end if;

  -- Was the old name this player's alone?
  v_only := not exists (
    select 1 from coach_players p
    where p.coach_id = new.coach_id and p.id <> new.id
      and lower(btrim(p.name)) = v_old);

  -- Tables carrying both the name and the id.
  foreach t in array array[
    'coach_bookings', 'coach_sessions', 'coach_payments',
    'coach_development', 'coach_media', 'coach_camp_attendees'
  ] loop
    select count(*) = 3 into has_id
    from information_schema.columns
    where table_schema = 'public' and table_name = t
      and column_name in ('coach_id', 'player_id', 'player_name');
    if not has_id then continue; end if;

    if t = 'coach_bookings' then
      -- The title first, while the old name is still on the row to match by.
      update coach_bookings b
         set title = case
               when lower(btrim(b.title)) = v_old then new.name
               else left(b.title, length(b.title) - length(old.name)) || new.name
             end
       where b.coach_id = new.coach_id
         and (b.player_id = new.id
              or (v_only and b.player_id is null and lower(btrim(b.player_name)) = v_old))
         and (lower(btrim(b.title)) = v_old
              or right(b.title, length(old.name) + 3) = ' — ' || old.name);
    end if;

    execute format(
      'update public.%I set player_name = $1 where coach_id = $2 and player_id = $3 and player_name is distinct from $1', t)
      using new.name, new.coach_id, new.id;

    if v_only then
      execute format(
        'update public.%I set player_name = $1, player_id = $3 where coach_id = $2 and player_id is null and lower(btrim(player_name)) = $4', t)
        using new.name, new.coach_id, new.id, v_old;
    end if;
  end loop;

  -- Tables with a name and nothing else.
  if v_only then
    for spec in
      select * from (values
        ('coach_charges',       'player_name'),
        ('coach_gps_sessions',  'player_name'),
        ('coach_session_plans', 'group_name')
      ) as s(tbl, col)
    loop
      select count(*) = 2 into has_id
      from information_schema.columns
      where table_schema = 'public' and table_name = spec.tbl
        and column_name in ('coach_id', spec.col);
      if not has_id then continue; end if;
      execute format(
        'update public.%I set %I = $1 where coach_id = $2 and lower(btrim(%I)) = $3', spec.tbl, spec.col, spec.col)
        using new.name, new.coach_id, v_old;
    end loop;

    -- A camp's per-player targets: a list of { player_name, goals, … }.
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'coach_camps' and column_name = 'player_targets') then
      update coach_camps c
         set player_targets = (
               select jsonb_agg(
                        case when jsonb_typeof(e.v) = 'object' and lower(btrim(e.v ->> 'player_name')) = v_old
                             then jsonb_set(e.v, '{player_name}', to_jsonb(new.name))
                             else e.v end
                        order by e.n)
               from jsonb_array_elements(c.player_targets) with ordinality as e(v, n))
       where c.coach_id = new.coach_id
         and jsonb_typeof(c.player_targets) = 'array'
         and exists (select 1 from jsonb_array_elements(c.player_targets) x
                     where jsonb_typeof(x) = 'object' and lower(btrim(x ->> 'player_name')) = v_old);
    end if;
  end if;

  -- Messages.
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'coach_messages' and column_name = 'player_id') then
    update coach_messages m
       set thread_key = case when lower(btrim(m.thread_key)) = v_old then new.name else m.thread_key end,
           recipients = case when lower(btrim(m.recipients)) = v_old then new.name else m.recipients end,
           from_name  = case when lower(btrim(m.from_name))  = v_old then new.name else m.from_name  end,
           player_id  = new.id
     where m.coach_id = new.coach_id
       and (m.player_id = new.id
            or (v_only and m.player_id is null and m.camp_id is null
                and lower(coalesce(nullif(btrim(m.thread_key), ''), btrim(m.recipients))) = v_old))
       and (lower(btrim(m.thread_key)) = v_old
            or lower(btrim(m.recipients)) = v_old
            or lower(btrim(m.from_name))  = v_old);
  end if;

  return new;
end $$;
revoke all on function coach_players_cascade_rename() from public, anon, authenticated;

do $$
begin
  if to_regclass('public.coach_players') is not null then
    drop trigger if exists trg_coach_players_cascade_rename on public.coach_players;
    create trigger trg_coach_players_cascade_rename
      after update of name on public.coach_players
      for each row execute function coach_players_cascade_rename();
  end if;
end $$;


-- ══ 8. An assistant could read every player's book recommendations ══════════
-- WHAT WAS WRONG. Migration 174 says, in its own comment, "a coach can see and
-- set recommendations for the players they are assigned" — and then granted
-- read on the whole academy's and no write at all. The coach's note on a book
-- ("why I picked this for her") is about one child; an assistant could read the
-- notes for children they do not teach, and could not recommend a book to the
-- ones they do.
--
-- THE RULE NOW. What that comment says: read and write, for the players
-- assigned to them, by the same test skills, recordings and payments use.
do $$
begin
  if to_regclass('public.coach_player_resources') is not null then
    drop policy if exists lumio_player_resources_staff on public.coach_player_resources;
    create policy lumio_player_resources_staff on public.coach_player_resources
      for all to authenticated
      using (lumio_can_see(coach_id, (select p.staff_id from coach_players p where p.id = coach_player_resources.player_id)))
      with check (lumio_can_see(coach_id, (select p.staff_id from coach_players p where p.id = coach_player_resources.player_id)));
  end if;
end $$;


-- ══ 9. What is already there ════════════════════════════════════════════════
-- Nothing is changed or removed here; this only says what was found, so whoever
-- runs the migration can decide. The statements to act on each are in the
-- comments.
do $$
declare n bigint; t text; total bigint := 0; ok boolean;
begin
  -- Skill scores filed under somebody who is not the player's academy (section
  -- 4's hole, already used). They block the real coach from grading that skill.
  -- To remove them:
  --   delete from coach_player_skills s using coach_players p
  --    where p.id = s.player_id and p.coach_id <> s.coach_id;
  if to_regclass('public.coach_player_skills') is not null then
    select count(*) into n from coach_player_skills s
      join coach_players p on p.id = s.player_id where p.coach_id <> s.coach_id;
    if n > 0 then raise notice '193: % skill score(s) are filed under an account that is not the player''s academy — review and remove (see comment in section 9).', n; end if;
  end if;

  -- Camp places filed under one academy against another academy's camp.
  --   select a.* from coach_camp_attendees a join coach_camps c on c.id = a.camp_id
  --    where c.coach_id <> a.coach_id;
  if to_regclass('public.coach_camp_attendees') is not null then
    select count(*) into n from coach_camp_attendees a
      join coach_camps c on c.id = a.camp_id where c.coach_id <> a.coach_id;
    if n > 0 then raise notice '193: % camp place(s) belong to a different academy from their camp — review (see comment in section 9).', n; end if;
  end if;

  -- Rows whose name is not their player's current name: history left behind by
  -- a rename before today, or a forged pairing. Each is put right the next time
  -- it is saved. To put them all right now (this overwrites the stored name
  -- with the roster name, so look first):
  --   update <table> x set player_name = p.name from coach_players p
  --    where p.id = x.player_id and p.coach_id = x.coach_id
  --      and lower(btrim(coalesce(x.player_name, ''))) <> lower(btrim(p.name));
  foreach t in array array[
    'coach_bookings', 'coach_sessions', 'coach_payments',
    'coach_development', 'coach_media', 'coach_camp_attendees'
  ] loop
    select count(*) = 3 into ok
    from information_schema.columns
    where table_schema = 'public' and table_name = t
      and column_name in ('coach_id', 'player_id', 'player_name');
    if not ok then continue; end if;
    execute format($f$
      select count(*) from public.%I x join coach_players p on p.id = x.player_id and p.coach_id = x.coach_id
       where lower(btrim(coalesce(x.player_name, ''))) <> lower(btrim(p.name))
    $f$, t) into n;
    total := total + n;
  end loop;
  if total > 0 then raise notice '193: % linked row(s) carry a name that is not their player''s current name — see comment in section 9.', total; end if;
end $$;
