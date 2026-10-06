-- Messages belong to the ACADEMY, and an assistant coach can read the
-- conversations of their own players.
--
-- Three things were wrong, and this is the database half of putting them right
-- (the send route is the other half — it now files every message under the
-- academy's id and stamps the player it is about):
--
--   1. A message sent by an invited (assistant) coach was filed under the
--      assistant's own user id. The family's app and the head coach's inbox both
--      look under the ACADEMY's id, so the message reached nobody while the
--      coach was told "Sent in-app".
--   2. coach_messages had one rule — coach_id = auth.uid() — so an assistant
--      could read no conversation at all, not even with a player they teach.
--   3. Migration 194 linked old messages to a player only where thread_key was
--      set. The welcome message and the "Session booked" notices were written
--      with thread_key empty and the name in `recipients`, so they stayed
--      unlinked.
--
-- Safe to run twice. Only ADDS policies (Postgres ORs them), so the head coach's
-- existing access cannot shrink.

-- ── 1. Old messages an assistant sent: move them to the academy ─────────────
-- Only where there is no doubt whose academy it is: the sender owns no academy
-- of their own and is a coach in exactly one. Outbound rows only (nothing an
-- outside system delivered), so the (coach_id, external_id) uniqueness cannot
-- be disturbed.
update coach_messages msg
   set coach_id = m.academy_id
  from coach_members m
 where msg.coach_id = m.member_user_id
   and m.role = 'coach'
   and msg.direction = 'out'
   and msg.external_id is null
   and msg.camp_id is null
   and not exists (select 1 from sports_profiles sp where sp.id = msg.coach_id and sp.sport = 'coach')
   and (select count(*) from coach_members m2
         where m2.member_user_id = msg.coach_id and m2.role = 'coach') = 1;

-- ── 2. Link the old rows that 194 could not reach ───────────────────────────
-- Same rule as 194: only where the name belongs to exactly one player in that
-- academy. Two players sharing the name → left unlinked, shown to neither
-- family. Run after step 1 so the rows just moved are linked too.
update coach_messages m
   set player_id = p.id
  from coach_players p
 where m.player_id is null
   and m.camp_id is null
   and coalesce(nullif(btrim(m.thread_key), ''), btrim(m.recipients)) is not null
   and p.coach_id = m.coach_id
   and lower(btrim(p.name)) = lower(coalesce(nullif(btrim(m.thread_key), ''), btrim(m.recipients)))
   and (select count(*) from coach_players q
         where q.coach_id = m.coach_id
           and lower(btrim(q.name)) = lower(coalesce(nullif(btrim(m.thread_key), ''), btrim(m.recipients)))) = 1;

-- ── 3. An assistant coach reads their own players' conversations ────────────
-- Scoped exactly as skills, media and payments are (migrations 166 and 188): a
-- message is theirs if the PLAYER it is about is assigned to them. A message
-- with no player (a camp thread, a venue, a contact, an old row that could not
-- be linked) stays with the head coach.
--
-- Read, mark as read / react, and delete — what the inbox does. Deliberately no
-- INSERT: sending goes through the server route, which checks the recipient and
-- records who really sent it.
drop policy if exists lumio_coach_player_messages_read on coach_messages;
create policy lumio_coach_player_messages_read on coach_messages for select to authenticated
  using (player_id is not null
         and lumio_can_see(coach_id, (select p.staff_id from coach_players p where p.id = coach_messages.player_id)));

drop policy if exists lumio_coach_player_messages_update on coach_messages;
create policy lumio_coach_player_messages_update on coach_messages for update to authenticated
  using (player_id is not null
         and lumio_can_see(coach_id, (select p.staff_id from coach_players p where p.id = coach_messages.player_id)))
  with check (player_id is not null
         and lumio_can_see(coach_id, (select p.staff_id from coach_players p where p.id = coach_messages.player_id)));

drop policy if exists lumio_coach_player_messages_delete on coach_messages;
create policy lumio_coach_player_messages_delete on coach_messages for delete to authenticated
  using (player_id is not null
         and lumio_can_see(coach_id, (select p.staff_id from coach_players p where p.id = coach_messages.player_id)));
