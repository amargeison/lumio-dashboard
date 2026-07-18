-- Ten Project Portal — Phase 1 data model (2 of 4): QR gate scan-ins.
-- See Ten_Project_Portal_Scoping_v2.docx §5.2. Raw self-service check-in
-- events from the venue-gate QR (offline-first PWA syncs these when signal
-- returns). Kept separate from coach_attendance so the raw feed survives:
-- a resolution step de-duplicates (two parents scanning the same family,
-- one parent with several children) and writes clean rows into
-- coach_attendance with source='qr'. TENOR taps land here too (source='tenor').

create table if not exists tp_qr_checkins (
  id              uuid primary key default gen_random_uuid(),
  hq_id           uuid not null references auth.users(id) on delete cascade,
  venue_id        uuid references coach_venues(id) on delete set null,
  session_date    date not null,
  member_id       uuid references coach_members(id) on delete set null, -- known family, if recognised
  family_label    text,             -- first-visit fallback before a member exists
  children_names  text,             -- 'Mia + Tom' as entered/confirmed
  children_count  int default 1 check (children_count between 1 and 10),
  adults_count    int default 1 check (adults_count between 0 and 10),
  consent_data    boolean default false,  -- layered consent captured on first visit
  consent_photo   boolean default false,
  emergency_contact text,           -- first-visit capture only
  source          text not null default 'qr' check (source in ('qr','tenor')),
  device_id       text,             -- offline de-dup aid (same phone re-syncing)
  captured_at     timestamptz,      -- when the scan happened on-device (offline-safe)
  synced_at       timestamptz default now(),
  resolved        boolean default false,  -- true once written into coach_attendance
  resolved_note   text,             -- e.g. 'deduped with <id>' | 'new family created'
  created_at      timestamptz default now()
);

create index if not exists idx_tp_qr_hq_date on tp_qr_checkins(hq_id, session_date);
create index if not exists idx_tp_qr_venue_date on tp_qr_checkins(venue_id, session_date);
create index if not exists idx_tp_qr_unresolved on tp_qr_checkins(hq_id, resolved) where resolved = false;

-- RLS: HQ owner only. The public scan page NEVER writes here directly —
-- it posts to a server route (anon, rate-limited, venue-token-validated)
-- which inserts with the service role. Parents read nothing from this table.
alter table tp_qr_checkins enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tp_qr_checkins' and policyname='tp_qr_checkins_hq') then
    create policy tp_qr_checkins_hq on tp_qr_checkins using (hq_id = auth.uid()) with check (hq_id = auth.uid());
  end if;
end $$;
