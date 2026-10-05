-- Messages: which player a conversation is about.
--
-- Until now a conversation was found by the player's NAME (thread_key). Two
-- children called "Sam Twin" in one academy therefore shared one thread: each
-- family could read the other's private messages, and a message to one went to
-- both. A name is not an identity.
--
-- player_id is the identity. New messages always carry it. Old messages are
-- given it here ONLY where the name belongs to exactly one player in that
-- academy; where two players share the name there is no way to know which
-- family an old message belonged to, so those are left unlinked and the app
-- shows them to neither family (the coach still sees them).

alter table coach_messages add column if not exists player_id uuid references coach_players(id) on delete set null;
create index if not exists idx_coach_messages_player on coach_messages (coach_id, player_id, created_at);

update coach_messages m
   set player_id = p.id
  from coach_players p
 where m.player_id is null
   and m.thread_key is not null
   and p.coach_id = m.coach_id
   and lower(btrim(p.name)) = lower(btrim(m.thread_key))
   and (select count(*) from coach_players q
         where q.coach_id = m.coach_id and lower(btrim(q.name)) = lower(btrim(m.thread_key))) = 1;
