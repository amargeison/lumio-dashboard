-- ─────────────────────────────────────────────────────────────────────────────
-- The player app can hold a conversation.
--
-- Until now a family could type one thing and send it: a message to "the
-- academy". They could not reply to a particular message, could not react to
-- one, could not choose WHICH coach they were writing to, and a camp — eight
-- families and three coaches in Spain for a week — had no shared thread at all,
-- which is exactly the situation that sends everyone back to WhatsApp.
--
-- Three columns, each answering one of those.
-- ─────────────────────────────────────────────────────────────────────────────

-- Who the sender meant. A family messaging the academy leaves this null (it goes
-- to whoever picks the inbox up, as now); naming a coach routes it to them
-- without hiding it from the head coach, who can still see every message in
-- their own academy.
alter table coach_messages add column if not exists to_name text;

-- The message this one answers. A quote, not a separate thread: a reply that
-- loses what it was replying to is how a conversation becomes unreadable once
-- there are more than five messages in it.
alter table coach_messages add column if not exists reply_to uuid;

-- The camp this message belongs to. Set → everyone on that camp sees it: the
-- families booked on and the coaches travelling. thread_key is 'camp:<id>' for
-- these rows, so a camp conversation can never collide with a player's name.
alter table coach_messages add column if not exists camp_id uuid references coach_camps(id) on delete cascade;

create index if not exists idx_coach_messages_camp on coach_messages (coach_id, camp_id, created_at desc);

comment on column coach_messages.to_name is 'The coach a family addressed this to, by name. Null = the academy.';
comment on column coach_messages.reply_to is 'coach_messages.id this is a reply to — rendered as a quote above the body.';
comment on column coach_messages.camp_id is 'Set on camp-wide messages. Visible to every family booked on that camp and every coach travelling with it.';
