# Follow-ups

Tracker for known work that has been deferred from a sprint, with enough
context that the work can be picked up cleanly later. Each entry should
include why it was deferred, the concrete tasks, and any risks the
follow-up needs to navigate.

## Rugby role model restructure (deferred from Sprint 2.5)

The rugby portal currently uses individual-stakeholder roles
(player, agent, coach, physio, sponsor) but the product target is
clubs, not individuals. This mismatches football pro's club-aimed
role model and prevents role-aware Quick Actions from working
meaningfully.

Sprint 3 task:
- Restructure RUGBY_ROLES to club-aimed model: Director of Rugby,
  Head Coach, Captain, Performance Director, Analyst, Medical,
  Operations, Commercial (8 roles, mirroring football pro pattern)
- Update RUGBY_ROLE_CONFIG with new whitelists
- Migrate any UI gated on old roles (player/agent/sponsor views)
  — review what to keep, what to relocate
- Add role-aware Quick Actions per the Sprint 2.5 spec that was
  deferred (action sets already drafted in Sprint 2.5 prompt)
- Browser-test new role switcher across all 8 roles

Risk: this is a structural change. Identify all files gated on
current 5 roles before starting (grep `RUGBY_ROLES`). The migration
may surface views that don't fit the new model — those need
product decisions on relocation.
