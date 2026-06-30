-- Lumio Tennis Coach — video highlights (V1).
-- The AI splits a session video into per-shot highlight clips. Each clip is a
-- first-class coach_media row (so it reuses storage, RLS and the signed-URL
-- playback route) but linked back to its source recording and tagged with the
-- shot type + its time window in the source.

alter table coach_media add column if not exists clip_of   uuid;        -- source coach_media.id (null = a normal recording)
alter table coach_media add column if not exists shot_type text;        -- serve | forehand | backhand | volley | smash
alter table coach_media add column if not exists clip_start numeric;    -- seconds into the source video
alter table coach_media add column if not exists clip_end   numeric;

-- Fetch all clips for a source recording quickly.
create index if not exists idx_coach_media_clip_of on coach_media (clip_of) where clip_of is not null;
