-- 206: "set-up complete" can be switched on by the owner ONLY for a self-setup
-- portal — including when no set-up type has been chosen yet.
--
-- WHAT WAS WRONG. Migration 193 says the owner may switch `setup_complete` on
-- only for a self-setup portal. Its test was
--     not (new.setup_complete is true and new.setup_type = 'self')
-- For an academy that has never run the wizard, setup_type is NULL, so
-- `setup_type = 'self'` is NULL rather than false, the whole test is NULL, and
-- the refusal is never raised: a brand-new academy could mark itself live
-- through the database API.
--
-- THE RULE NOW. The same rule as 193, with comparisons that treat NULL as a
-- value: a change to setup_complete from a signed-in person is allowed only when
-- it is being switched ON and the row's set-up type is 'self' (after the same
-- write). Anything else — no type chosen, "set it up for me", or switching it
-- off — is refused with 193's own message.
--
-- Not changed, on purpose: sending {setup_type:'self', setup_complete:true}
-- together is still accepted. That is exactly what the wizard sends when a
-- coach chooses "I'll add my own data", including a coach who first chose
-- "set it up for me" and then changes their mind; it is their choice to make.
--
-- A separate small trigger rather than a new copy of lumio_profile_guard(), so
-- this cannot overwrite a change somebody else makes to that function. The
-- server is exempt, as in 193. Only a CHANGE is checked, so rows already stored
-- are untouched: safe on a database holding real data, and safe to run twice.

create or replace function lumio_profile_setup_guard()
returns trigger
language plpgsql set search_path = public, pg_catalog as $$
begin
  if lumio_is_server() then return new; end if;

  if coalesce(new.setup_complete, false) is distinct from coalesce(old.setup_complete, false)
     and not (new.setup_complete is true and new.setup_type is not distinct from 'self') then
    raise exception 'Lumio switches your portal on once it has been set up for you. Nothing was changed.'
      using errcode = '42501';
  end if;

  return new;
end $$;

do $$
begin
  if to_regclass('public.sports_profiles') is not null then
    drop trigger if exists trg_lumio_profile_setup_guard on public.sports_profiles;
    create trigger trg_lumio_profile_setup_guard
      before update on public.sports_profiles
      for each row execute function lumio_profile_setup_guard();
  end if;
end $$;
