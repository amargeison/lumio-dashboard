-- Messages a family could not see.
--
-- The coach's inbox groups a conversation by `recipients`, and the portal reads
-- a family's thread with `recipients = <player name>`. But the coach's SEND path
-- wrote `recipients` as a DISPLAY SUMMARY — every addressee joined with commas.
-- So a message to one player whose name matched exactly arrived; a message to
-- two people produced "Sven, Sophia Jones", which equals neither name, and the
-- message appeared on the coach's dashboard and in their inbox while being
-- invisible to both families. It looked like a portal bug. It was an addressing
-- bug: a summary string is not an address.
--
-- Sending now writes one row per recipient, each carrying that person's own
-- `thread_key` — which is what every INBOUND path (portal reply, inbound email,
-- inbound SMS) has always done. This backfills the outbound history so messages
-- already sent turn up too, rather than only fixing it from today.
--
-- Only unambiguous rows are touched: `recipients` has to name exactly one player
-- on that coach's roster. A comma-joined broadcast cannot be split into the
-- threads it should have been, so it is left alone rather than guessed at.

update coach_messages m
   set thread_key = p.name
  from coach_players p
 where m.thread_key is null
   and p.coach_id = m.coach_id
   and lower(trim(m.recipients)) = lower(trim(p.name))
   and m.recipients is not null
   and trim(m.recipients) <> '';

create index if not exists idx_coach_messages_thread on coach_messages (coach_id, thread_key);
