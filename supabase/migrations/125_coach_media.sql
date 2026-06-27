-- Lumio Tennis Coach — lesson media (audio/video) → transcript → AI review.
-- A coach records or uploads a session recording; we store the file, transcribe it
-- (OpenAI Whisper), and generate an AI lesson summary. Optionally linked to a
-- Lesson Summary (lesson_id) and/or a player.

create table if not exists coach_media (
  id               uuid primary key default gen_random_uuid(),
  coach_id         uuid not null references sports_profiles(id) on delete cascade,
  lesson_id        text,                 -- optional link to a Lesson Summary
  player_id        uuid,                 -- optional
  player_name      text,
  kind             text not null check (kind in ('audio', 'video')),
  title            text,
  storage_path     text not null,        -- object path inside the coach-media bucket
  mime_type        text,
  duration_seconds numeric,
  size_bytes       bigint,
  status           text not null default 'uploaded', -- uploaded | processing | done | error
  transcript       text,
  review           jsonb,                -- AI lesson summary (focus/covered/takeaways/homework/next)
  error            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_coach_media_coach on coach_media (coach_id, created_at desc);

alter table coach_media enable row level security;
-- The coach can see/manage their own media rows from the browser; the heavy
-- writes (transcript/review) happen via service-role routes.
create policy "coach reads own media"   on coach_media for select using (coach_id = auth.uid());
create policy "coach inserts own media" on coach_media for insert with check (coach_id = auth.uid());
create policy "coach updates own media" on coach_media for update using (coach_id = auth.uid());
create policy "coach deletes own media" on coach_media for delete using (coach_id = auth.uid());

-- Private storage bucket for the files themselves. Playback is via short-lived
-- signed URLs minted server-side; the bucket is never public.
insert into storage.buckets (id, name, public)
values ('coach-media', 'coach-media', false)
on conflict (id) do nothing;

-- A coach may only touch objects under their own {coach_id}/… prefix.
create policy "coach media objects read"   on storage.objects for select
  using (bucket_id = 'coach-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "coach media objects insert" on storage.objects for insert
  with check (bucket_id = 'coach-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "coach media objects delete" on storage.objects for delete
  using (bucket_id = 'coach-media' and (storage.foldername(name))[1] = auth.uid()::text);
