-- Public storage bucket for player profile photos. Reads are public (so the URL
-- on coach_players.avatar_url renders anywhere); writes happen server-side via the
-- service role only (scoped upload routes), so there's no client write policy.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
