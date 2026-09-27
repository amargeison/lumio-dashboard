-- ─────────────────────────────────────────────────────────────────────────────
-- One portal address per academy.
--
-- portal_slug has only ever had a plain index, so two head coaches who both
-- called their club "Penrith Tennis Club" would both be given
-- /tennis/coach/penrith-tennis-club. Data would not mix — everything is keyed
-- to the login — but anything that resolves an academy from its address could
-- land on the wrong one, and a parent following a link could arrive at a
-- stranger's club. With more head coaches signing up, it gets enforced.
--
-- Scoped by sport, so a tennis academy and a cricket club can share a name.
-- Case-insensitive, because "PG-Tennis" and "pg-tennis" are the same URL to a
-- person typing it.
-- ─────────────────────────────────────────────────────────────────────────────

-- Anything already doubled: the oldest account keeps the address, later ones
-- get "-2", "-3". Their old links stop resolving, which is why this should run
-- before there are many accounts rather than after.
with ranked as (
  select id,
         row_number() over (
           partition by coalesce(sport, ''), lower(portal_slug)
           order by created_at asc nulls last, id asc
         ) as n
  from sports_profiles
  where portal_slug is not null and portal_slug <> ''
)
update sports_profiles p
set portal_slug = p.portal_slug || '-' || r.n
from ranked r
where p.id = r.id and r.n > 1;

create unique index if not exists uniq_sports_profiles_portal_slug
  on sports_profiles (coalesce(sport, ''), lower(portal_slug))
  where portal_slug is not null and portal_slug <> '';
