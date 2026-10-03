-- Outreach: finding contacts.
--
-- A "prospect" is an organisation we have found but not yet decided to email:
-- a company from the Companies House register, or one turned up by a web
-- search. It becomes an outreach contact only when an admin presses Add, and
-- only once a public business email for it has been found.
--
-- What is deliberately NOT stored: officers' names, dates of birth, or a street
-- address. A small company's registered office is often somebody's home, so
-- only the town and the outward half of the postcode (the district, e.g. "ME2")
-- are kept — enough to tell two "Elite Tennis" companies apart, not enough to
-- find a front door.

create table if not exists outreach_prospects (
  id              uuid primary key default gen_random_uuid(),
  org_name        text not null,
  company_number  text,                               -- Companies House number, when it is on the register
  legal_form      text,                               -- Ltd, CIC, LLP, Ltd by guarantee, Unknown…
  corporate_ok    boolean not null default false,     -- confirmed on the register as a corporate body
  town            text,
  district        text,                               -- outward postcode only
  segment         text not null default 'academy',    -- academy | venue | coach
  website         text,
  email           text,
  -- new       found, nothing looked up yet
  -- no_email  the free look found no email (a paid search may)
  -- unsure    a paid search suggested an email we could not confirm on their site
  -- found     a public email, ready to add
  -- nothing   paid search too, still nothing
  -- added     now an outreach contact
  -- dismissed not wanted
  state           text not null default 'new',
  searched_paid   boolean not null default false,
  source          text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
-- Plain unique (not partial) so an upsert can name it; rows without a number
-- are still allowed in any quantity, because NULLs never collide.
create unique index if not exists idx_outreach_prospects_number on outreach_prospects (company_number);
create index if not exists idx_outreach_prospects_state on outreach_prospects (state, created_at);

-- Every paid search, with what it actually cost. The monthly limit is checked
-- against the sum of this table, so the limit holds even if the page is closed
-- half way through a run.
create table if not exists outreach_spend (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null,                       -- lookup | discover
  searches       integer not null default 0,
  input_tokens   integer not null default 0,
  output_tokens  integer not null default 0,
  cost_usd       numeric(10,4) not null default 0,
  note           text,
  created_at     timestamptz not null default now()
);
create index if not exists idx_outreach_spend_at on outreach_spend (created_at desc);

-- The most that paid searches may cost in a calendar month, in US dollars
-- (the currency they are billed in). 0 switches paid search off entirely.
alter table outreach_settings add column if not exists search_cap_usd numeric(10,2) not null default 20;

-- Admin-only, like the rest of outreach: no policies, so only the server's
-- service role can read or write them.
alter table outreach_prospects enable row level security;
alter table outreach_spend     enable row level security;
