-- Two-way inbox (v2): inbound messages land in coach_messages with direction='in'.
alter table coach_messages add column if not exists direction   text default 'out';   -- 'out' | 'in'
alter table coach_messages add column if not exists from_name   text;                 -- inbound sender display
alter table coach_messages add column if not exists thread_key   text;                 -- conversation grouping key
alter table coach_messages add column if not exists external_id  text;                 -- gmail msgId / twilio sid (dedupe)
create index if not exists idx_coach_messages_external on coach_messages(coach_id, external_id);
create index if not exists idx_coach_messages_thread   on coach_messages(coach_id, thread_key);
