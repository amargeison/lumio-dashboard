-- DRAFT — for review; apply by hand (same as 209/210).
--
-- 211_impact_orgs.sql
-- One row per live Lumio Impact portal, keyed by its URL slug
-- (/impact/<slug>). Holds the org's own settings — name, contact email,
-- logo, volunteer term, and which modules are switched on — plus the HQ login
-- that owns it. Mirrors coach_settings (152) but keyed by slug, so a portal's
-- branding exists before its HQ account does (Ten Project's is seeded below
-- and shows immediately; hq_id is attached once the login is created).
--
-- Isolation: tp_* rows are RLS-scoped to hq_id = auth.uid() (148–151), so two
-- orgs never see each other's data; this table only decides which login is
-- the HQ for which slug, and what the portal looks like.

create table if not exists impact_orgs (
  slug        text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 2 and 60),
  hq_id       uuid unique references auth.users(id) on delete set null,
  settings    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table impact_orgs enable row level security;

-- Portal branding is public (it's shown on the portal itself), so anyone may
-- read. Only the org's own HQ may change its settings; nobody may change
-- slug/hq_id from the browser (no insert/delete policies; see the trigger).
do $$ begin
  if not exists (select 1 from pg_policies where tablename='impact_orgs' and policyname='impact_orgs_read') then
    create policy impact_orgs_read on impact_orgs for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='impact_orgs' and policyname='impact_orgs_hq_update') then
    create policy impact_orgs_hq_update on impact_orgs for update
      using (hq_id = auth.uid()) with check (hq_id = auth.uid());
  end if;
end $$;

-- Browser updates may only touch settings (not slug or hq_id).
create or replace function impact_orgs_guard() returns trigger language plpgsql as $$
begin
  if current_setting('request.jwt.claims', true) is not null
     and coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') <> 'service_role' then
    if new.slug is distinct from old.slug or new.hq_id is distinct from old.hq_id then
      raise exception 'impact_orgs: slug and hq_id are managed by Lumio';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists impact_orgs_guard on impact_orgs;
create trigger impact_orgs_guard before update on impact_orgs
  for each row execute function impact_orgs_guard();

-- ── Seed ────────────────────────────────────────────────────────────────────
-- Ten Project (founder member): its saved settings are what the live portal
-- shows — replacing the brand that used to be hard-coded. All modules on.
insert into impact_orgs (slug, settings) values ('ten-project', '{
  "org": "Ten Project",
  "legal": "Ten Project Ltd",
  "hq": "Ten Project HQ",
  "email": "info@tenproject.org.uk",
  "address": "7 Cranmer Close, Morden, London SM4 4SU",
  "town": "Morden, London",
  "domain": "tenproject.org.uk",
  "logo": "/tenproject_logo.png",
  "logoDark": "/tenproject_logo_dark.png",
  "favicon": "/tenproject-favicon-64.png",
  "favicon32": "/tenproject-favicon-32.png",
  "volunteer": "TENOR",
  "volunteers": "TENORs",
  "tagline": "LEARN. PLAY. TOGETHER.",
  "hashtag": "#tenproject",
  "socialHandle": "tenprojectuk",
  "modules": {}
}'::jsonb)
on conflict (slug) do nothing;

-- ── Attaching an HQ login (once that login exists) ────────────────────────
-- Create it in Supabase → Authentication → Add user, then (replacing the email):
--   insert into sports_profiles (id, sport, display_name, brand_name, portal_slug, onboarding_complete)
--     select id, 'impact', 'Ten Project HQ', 'Ten Project', 'ten-project', true
--     from auth.users where email = '<ten project hq email>'
--     on conflict (id) do update set sport = 'impact', portal_slug = 'ten-project';
--   update impact_orgs set hq_id = (select id from auth.users where email = '<ten project hq email>')
--     where slug = 'ten-project';
