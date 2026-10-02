-- ─────────────────────────────────────────────────────────────────────────────
-- Outreach: Lumio's own business-to-business email, run from the admin portal.
--
-- Why this exists rather than a newsletter tool or the app's own mail service:
-- both only allow mail to people who opted in, and close accounts that send to
-- addresses found in public. Outreach to a tennis club's published business
-- address is lawful in the UK (PECR treats a company or other corporate body as
-- a "corporate subscriber": no consent needed, but the sender must be
-- identified and an opt-out offered) — it just has to go out as ordinary
-- person-to-person mail from our own mailbox, a few dozen a day.
--
-- The rules these tables exist to enforce:
--   • A contact is only ever emailed cold when `corporate_ok` is true — i.e. a
--     person has confirmed it is a company, CIC, charity or similar. Sole
--     traders and "don't know yet" are held back (they count as individuals and
--     need consent). `basis = 'opt_in'` is the other way in: they asked for it.
--   • One email per contact per campaign, ever (unique index on sends).
--   • An unsubscribe is permanent and survives the contact being deleted and
--     re-imported: it lives in its own table, keyed by address.
--
-- Service role only: RLS is on and there are no policies, so nothing in a
-- browser can read the contact list or the suppression list.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists outreach_contacts (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  org_name      text,
  contact_name  text,
  role          text,
  segment       text not null default 'academy',   -- academy | venue | coach
  legal_form    text,                               -- as found: Ltd, CIC, Club, Sole trader, Unknown…
  corporate_ok  boolean not null default false,     -- confirmed corporate subscriber → cold email allowed
  basis         text not null default 'b2b',        -- b2b | opt_in
  website       text,
  source        text,
  notes         text,
  status        text not null default 'active',     -- active | replied | unsubscribed | bounced
  unsub_token   uuid not null default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index if not exists idx_outreach_contacts_email on outreach_contacts (lower(email));
create unique index if not exists idx_outreach_contacts_token on outreach_contacts (unsub_token);
create index if not exists idx_outreach_contacts_segment on outreach_contacts (segment, status);

create table if not exists outreach_campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  segment     text not null,                        -- which contacts it goes to
  subject     text not null default '',
  body        text not null default '',
  status      text not null default 'draft',        -- draft | active | paused
  -- 'plain' is an ordinary person-to-person email. 'designed' is a branded
  -- newsletter layout: logo header, optional picture, headline and button.
  style       text not null default 'plain',        -- plain | designed
  headline    text,
  image_url   text,
  button_text text,
  button_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists outreach_sends (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references outreach_campaigns(id) on delete cascade,
  contact_id   uuid not null references outreach_contacts(id) on delete cascade,
  email        text not null,
  status       text not null default 'sending',     -- sending | sent | failed
  error        text,
  created_at   timestamptz not null default now(),
  sent_at      timestamptz
);
-- The guarantee that nobody gets the same campaign twice, even if two runs overlap.
create unique index if not exists idx_outreach_sends_once on outreach_sends (campaign_id, contact_id);
create index if not exists idx_outreach_sends_sent on outreach_sends (sent_at desc);

create table if not exists outreach_suppressions (
  email       text primary key,                     -- lower-cased
  reason      text,                                 -- unsubscribed | bounced | manual
  created_at  timestamptz not null default now()
);

-- One row of settings. The mailbox password is NOT here — that stays in the
-- server environment.
create table if not exists outreach_settings (
  id            integer primary key default 1 check (id = 1),
  company_line  text not null default '',           -- registered name, number and address, shown in every email
  daily_limit   integer not null default 250,
  warmup        boolean not null default true,     -- build up to the limit over the first weeks
  paused        boolean not null default false,
  updated_at    timestamptz not null default now()
);
insert into outreach_settings (id) values (1) on conflict (id) do nothing;

alter table outreach_contacts     enable row level security;
alter table outreach_campaigns    enable row level security;
alter table outreach_sends        enable row level security;
alter table outreach_suppressions enable row level security;
alter table outreach_settings     enable row level security;

-- Pictures used in designed emails. Public read (an email client has to be able
-- to load them); uploads only ever happen through the admin API with the
-- service role, so no upload policy is needed or wanted.
insert into storage.buckets (id, name, public)
values ('outreach', 'outreach', true)
on conflict (id) do nothing;
