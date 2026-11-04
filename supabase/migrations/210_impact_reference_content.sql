-- DRAFT — NOT APPLIED. For review; move to supabase/migrations/ and apply by hand.
--
-- 210_impact_reference_content.sql
-- Shared, factual reference content for Lumio Impact portals — currently the
-- Sport Network tab's PE & School Sport Partnerships Network / PE & Sport
-- Premium facts (key 'sport_network'). Written only by the server route
-- POST /api/impact/sport-network (service role) after it re-checks gov.uk /
-- DfE / Youth Sport Trust; read by every portal.
--
-- After applying, set IMPACT_SPORT_NETWORK_REFRESH=on in the server env to
-- enable the tab's "Update" button. Until then the button reports that it
-- isn't enabled and the tab shows the verified baseline from
-- src/data/impact/sport-network.ts.

create table if not exists impact_reference_content (
  key         text primary key,
  content     jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table impact_reference_content enable row level security;

-- Public policy facts: anyone may read; no insert/update/delete policies, so
-- only the service role (the server route) can write.
do $$ begin
  if not exists (select 1 from pg_policies where tablename='impact_reference_content' and policyname='impact_reference_content_read') then
    create policy impact_reference_content_read on impact_reference_content for select using (true);
  end if;
end $$;
