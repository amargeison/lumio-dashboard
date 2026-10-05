-- 202: an academy's contact email and phone must look like an email address and
-- a phone number.
--
-- Settings → Contact & calendar saved whatever was typed: "not-an-email" as the
-- contact email, "abc" as the phone. The contact email is where the coach's own
-- copy of every booking and camp email is sent, and the reply-to address on the
-- emails families receive — so a wrong value loses mail without anyone being told.
-- The form now checks before it saves; this is the same check where it cannot be
-- skipped.
--
-- Only a CHANGE is checked, and only when it comes from a signed-in person (the
-- server is exempt, as in migration 193). Values already stored are left alone,
-- and a row holding an old bad value can still be saved for any other reason —
-- so this is safe on a database that already holds real data, and safe to run
-- twice.

create or replace function lumio_profile_contact_check()
returns trigger
language plpgsql set search_path = public, pg_catalog as $$
declare
  digits text;
begin
  if lumio_is_server() then return new; end if;

  if new.contact_email is distinct from old.contact_email and new.contact_email is not null then
    if length(new.contact_email) > 254
       or new.contact_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
      raise exception 'That email address does not look right. Check it, or leave it empty.'
        using errcode = '23514';
    end if;
  end if;

  if new.contact_phone is distinct from old.contact_phone and new.contact_phone is not null then
    -- The same rule as the setup wizard: digits with the usual punctuation, at
    -- least seven of them.
    digits := regexp_replace(new.contact_phone, '[^0-9]', '', 'g');
    if new.contact_phone !~ '^[+()0-9[:space:].-]+$' or length(digits) < 7 or length(new.contact_phone) > 40 then
      raise exception 'That phone number does not look right. Use digits, with + for a country code.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end $$;

do $$
begin
  if to_regclass('public.sports_profiles') is not null then
    drop trigger if exists trg_lumio_profile_contact_check on public.sports_profiles;
    create trigger trg_lumio_profile_contact_check
      before update of contact_email, contact_phone on public.sports_profiles
      for each row execute function lumio_profile_contact_check();
  end if;
end $$;
