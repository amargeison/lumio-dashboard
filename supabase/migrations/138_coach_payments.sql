-- Stripe Connect: one connected account per coach + a money ledger.
create table if not exists coach_stripe (
  coach_id          uuid primary key references auth.users(id) on delete cascade,
  stripe_account_id text,
  charges_enabled   boolean default false,
  details_submitted boolean default false,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table if not exists coach_charges (
  id                          uuid default gen_random_uuid() primary key,
  coach_id                    uuid not null references auth.users(id) on delete cascade,
  player_name                 text,
  package_id                  uuid,
  description                 text,
  amount_pennies              integer not null,
  currency                    text default 'gbp',
  status                      text default 'pending',  -- pending | paid | refunded | failed
  stripe_checkout_session_id  text,
  stripe_payment_intent_id    text,
  paid_at                     timestamptz,
  created_at                  timestamptz default now(),
  updated_at                  timestamptz default now()
);

alter table coach_stripe  enable row level security;
alter table coach_charges enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='coach_stripe' and policyname='coach_stripe_owner') then
    create policy coach_stripe_owner on coach_stripe using (coach_id = auth.uid()) with check (coach_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='coach_charges' and policyname='coach_charges_owner') then
    create policy coach_charges_owner on coach_charges using (coach_id = auth.uid()) with check (coach_id = auth.uid());
  end if;
end $$;

create index if not exists idx_coach_charges_coach on coach_charges(coach_id);
