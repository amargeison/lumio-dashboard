-- Ten Project Portal — Phase 1 data model (3 of 4): School Fundraising.
-- See Ten_Project_Portal_Scoping_v2.docx §5.9 + Journey C. Campaigns for
-- unfunded schools: target thermometer, events, sponsored-ball-hit pledges,
-- and donations (Stripe + logged cash). receiving_entity stays flexible per
-- campaign (school/PTA vs Ten Project Ltd) — decision pending with Harry;
-- Gift Aid handling depends on it, so it is recorded per campaign, not global.

-- ── Campaigns ──────────────────────────────────────────────────────────────
create table if not exists tp_fundraising_campaigns (
  id                    uuid primary key default gen_random_uuid(),
  hq_id                 uuid not null references auth.users(id) on delete cascade,
  school_id             uuid not null references tp_schools(id) on delete cascade,
  programme_id          uuid references tp_programmes(id) on delete set null,  -- the programme it unlocks
  public_slug           text unique,     -- tenproject.org.uk/fundraise/{slug} — served via server route
  target_pence          int not null check (target_pence > 0),
  receiving_entity      text not null default 'tbc'
                        check (receiving_entity in ('school','pta','ten_project','tbc')),
  status                text not null default 'draft'
                        check (status in ('draft','live','paused','complete','unlocked')),
  match_partner         text,            -- e.g. trust/sponsor topping up
  match_note            text,
  match_threshold_pence int,             -- raised amount that triggers the match
  match_amount_pence    int,
  celebrated_at         timestamptz,     -- the unlock moment (public-page celebration)
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index if not exists idx_tp_camp_hq on tp_fundraising_campaigns(hq_id);
create index if not exists idx_tp_camp_school on tp_fundraising_campaigns(school_id);
create index if not exists idx_tp_camp_slug on tp_fundraising_campaigns(public_slug);

-- ── Events (fair stall, cake sale, sponsored ball hit, quiz night…) ────────
create table if not exists tp_fundraising_events (
  id            uuid primary key default gen_random_uuid(),
  hq_id         uuid not null references auth.users(id) on delete cascade,
  campaign_id   uuid not null references tp_fundraising_campaigns(id) on delete cascade,
  name          text not null,
  event_type    text not null default 'other'
                check (event_type in ('fair_stall','cake_sale','sponsored_ball_hit','quiz_night','other')),
  event_date    date,
  status        text not null default 'planned'
                check (status in ('planned','live','complete','cancelled')),
  target_pence  int,
  ai_pack       jsonb,           -- generated pack: checklist, poster copy, parent letter,
                                 -- risk-assessment prompts, sponsor asks (v2.0 §5.9)
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_tp_events_campaign on tp_fundraising_events(campaign_id);

-- ── Pledges (sponsored ball hit) ───────────────────────────────────────────
create table if not exists tp_fundraising_pledges (
  id                    uuid primary key default gen_random_uuid(),
  hq_id                 uuid not null references auth.users(id) on delete cascade,
  event_id              uuid not null references tp_fundraising_events(id) on delete cascade,
  child_player_id       uuid references coach_players(id) on delete set null, -- whose sponsor sheet
  pledger_name          text,
  pledger_email         text,
  per_ball_pence        int,     -- per-ball pledge…
  flat_pence            int,     -- …or a flat amount (one of the two)
  balls_hit             int,     -- tallied in-app on event day
  amount_due_pence      int,     -- computed after the tally
  collected             boolean default false,
  collected_at          timestamptz,
  stripe_payment_intent text,
  chase_count           int default 0,   -- automatic collection chase-ups sent
  created_at            timestamptz default now()
);

create index if not exists idx_tp_pledges_event on tp_fundraising_pledges(event_id);
create index if not exists idx_tp_pledges_uncollected on tp_fundraising_pledges(hq_id, collected) where collected = false;

-- ── Donations (Stripe + logged cash) ───────────────────────────────────────
create table if not exists tp_donations (
  id                    uuid primary key default gen_random_uuid(),
  hq_id                 uuid not null references auth.users(id) on delete cascade,
  campaign_id           uuid not null references tp_fundraising_campaigns(id) on delete cascade,
  event_id              uuid references tp_fundraising_events(id) on delete set null,
  amount_pence          int not null check (amount_pence > 0),
  method                text not null default 'stripe' check (method in ('stripe','cash','bank')),
  gift_aid              boolean default false,  -- eligibility depends on receiving_entity
  donor_name            text,
  donor_email           text,
  message               text,            -- optional public message on the campaign page
  stripe_payment_intent text,
  created_at            timestamptz default now()
);

create index if not exists idx_tp_donations_campaign on tp_donations(campaign_id);

-- ── RLS — HQ owner only ────────────────────────────────────────────────────
-- The public campaign page (thermometer, donate) reads via a server route that
-- exposes only slug + totals; Stripe webhooks insert donations with the
-- service role. School users see their campaign through scoped server routes
-- (coach_members-style membership), never direct table access.
alter table tp_fundraising_campaigns enable row level security;
alter table tp_fundraising_events enable row level security;
alter table tp_fundraising_pledges enable row level security;
alter table tp_donations enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tp_fundraising_campaigns' and policyname='tp_camp_hq') then
    create policy tp_camp_hq on tp_fundraising_campaigns using (hq_id = auth.uid()) with check (hq_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='tp_fundraising_events' and policyname='tp_fund_events_hq') then
    create policy tp_fund_events_hq on tp_fundraising_events using (hq_id = auth.uid()) with check (hq_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='tp_fundraising_pledges' and policyname='tp_pledges_hq') then
    create policy tp_pledges_hq on tp_fundraising_pledges using (hq_id = auth.uid()) with check (hq_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='tp_donations' and policyname='tp_donations_hq') then
    create policy tp_donations_hq on tp_donations using (hq_id = auth.uid()) with check (hq_id = auth.uid());
  end if;
end $$;
