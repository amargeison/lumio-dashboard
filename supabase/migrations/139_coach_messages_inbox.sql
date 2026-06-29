-- Dashboard inbox: read/unread state and dismiss (hide from the inbox feed).
alter table coach_messages add column if not exists read      boolean default false;
alter table coach_messages add column if not exists dismissed boolean default false;
