-- "Low-to-high topspin forehand" in the Lumio starter library pointed at a test
-- video. It has been taken out of the library (so no new academy receives it);
-- this removes the copies already seeded into academies' Resource Centres.
--
-- Matched on the title AND that exact video, so a coach's own resource that
-- happens to share the title is left alone.
delete from coach_resources
where lower(title) = 'low-to-high topspin forehand'
  and url ilike '%KV9DTSNkLAg%';
