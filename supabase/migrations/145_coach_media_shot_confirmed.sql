-- Lumio Tennis — confirmed shot labels (private training set).
-- When a coach confirms/corrects an AI highlight clip's shot tag, we mark it
-- confirmed. Confirmed clips (clip video + correct shot_type) are the labelled
-- data the private classifier (modal/tennis_shots/train.py) learns from — and,
-- because the coach confirms before students see it, wrong tags never ship.

alter table coach_media add column if not exists shot_confirmed boolean default false;

-- Pull the confirmed training clips quickly when exporting for training.
create index if not exists idx_coach_media_shot_confirmed
  on coach_media (coach_id, shot_type) where shot_confirmed = true;
