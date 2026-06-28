-- Messages inbox: a quick reaction (👍 ❤️ 😄 ✅) on a message thread.
-- (coach_messages was created without updated_at, which the generic dbUpdate sets,
-- so add it too — otherwise reacting would fail.)
alter table coach_messages add column if not exists reaction   text;
alter table coach_messages add column if not exists updated_at timestamptz default now();
