-- Resource Centre cards carry more than a link: a format, level, duration, the
-- racket they map to, and tags. (title, category=kind, url, notes=description
-- already exist on coach_resources.)
alter table coach_resources add column if not exists format   text;   -- Video | PDF | Plan | Worksheet
alter table coach_resources add column if not exists level    text;   -- Beginner | Intermediate | Advanced | All levels
alter table coach_resources add column if not exists duration text;
alter table coach_resources add column if not exists racket   text;   -- racket stage id (white..black)
alter table coach_resources add column if not exists tags     text;   -- comma-separated
