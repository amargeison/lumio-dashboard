-- DRAFT — for review; apply by hand in the SQL editor.
--
-- 225_impact_child_flags.sql
-- Somewhere to record the flags Priority Reach and Insights report on, and a
-- first aid date for volunteers. Additive: new nullable columns only, so every
-- existing row reads null, nothing is dropped, and RLS is unchanged (the existing
-- tp_children and tp_volunteers policies cover new columns).
--
--   tp_children.gender          one of four values, or null
--   tp_children.fsm             free school meals
--   tp_children.pupil_premium
--   tp_volunteers.first_aid_expiry   same name and type as tp_staff
--
-- Null means "not recorded" and is never counted as false. That's why fsm and
-- pupil_premium have no default, the same as send.
-- Safe to run twice.

alter table tp_children   add column if not exists gender           text;
alter table tp_children   add column if not exists fsm              boolean;
alter table tp_children   add column if not exists pupil_premium    boolean;
alter table tp_volunteers add column if not exists first_aid_expiry date;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'tp_children_gender_ok') then
    alter table tp_children add constraint tp_children_gender_ok
      check (gender is null or gender in ('female', 'male', 'other', 'prefer_not_to_say'));
  end if;
end $$;

notify pgrst, 'reload schema';
