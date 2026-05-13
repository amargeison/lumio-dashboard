# Path B — Multi-user RBAC Architecture

**Status:** Strategy locked, ready for build
**Date specced:** 12 May 2026
**Build estimate:** 4-6 weeks foundation work
**Build prerequisite:** None — this IS the prerequisite for Path D and Path E

---

## Why this exists

Lumio Sports started as 10 sport-specific dashboards. The strategic shift on 3 May 2026 redefined Lumio Sports as **"Lumio Business for sport clubs"** — multi-user, multi-department, role-based access, workflow + AI.

This spec defines the **foundational data model** that makes that possible. Everything in Travel & Logistics (Path D), the admin tool (Path E), and future cross-department workflows depends on this being built right.

## Scope

**In scope (Phase 1):**
- 4 football products: Lumio Pro, Lumio Club, Lumio Women, Lumio Grassroots
- Multi-user clubs (one user can belong to multiple clubs via memberships)
- Role-based access (admin / manager / member / viewer)
- Department-scoped views with cross-department option
- Role templates (16 pre-configured permission bundles)
- Invite-accept flow with magic links
- Parent-club hierarchy for linked clubs (e.g. men's + women's of same parent)

**Out of scope (deferred):**
- Other sports (boxing/darts/tennis/golf/rugby/cricket) — keep existing 1:1 model
- Lumio Business and Schools RBAC unification — defer 6+ months
- Player-as-user logins (player records only for v1)
- Public self-serve signup (Phase 2 — first 3 founding members are sales-led only)
- Audit log of who-did-what (Phase 2)

---

## B1 — Data model

### Sport (enum, future-proofing)

```
football | (cricket, rugby, etc. deferred)
```

Phase 1: only `football` is live. Schema keeps `sport` field so adding cricket later is a config change, not a migration.

### Product (enum, per-sport)

```
Football products:
  lumio_pro     -- Premier League / Championship
  lumio_club    -- League One / Two / National / non-league
  lumio_women   -- WSL / WSL2 / Championship
  lumio_grassroots -- Step 5+ / county / women's lower
```

### Club (first-class entity)

```
Club
├── id (uuid)
├── name             ("Bolton Wanderers FC")
├── slug             ("bolton-wanderers")
├── sport            (football)
├── product          (lumio_pro | lumio_club | lumio_women | lumio_grassroots)
├── tier             ("premier_league" | "league_one" | "national_league" | etc)
├── parent_club_id   (nullable — for linked clubs like Chelsea Men + Chelsea Women)
├── logo_url
├── brand_primary    (hex)
├── brand_secondary  (hex)
├── league_name
├── billing_status   (founding_member | trial | active | suspended)
├── billing_seats_included
├── billing_seats_purchased
├── setup_complete   (bool)
├── created_by       (uuid → auth.users — typically Arron for founding members)
└── created_at
```

### User

Standard Supabase auth user. Multi-club via memberships.

### ClubMembership (the join table)

```
ClubMembership
├── id (uuid)
├── user_id          (uuid → auth.users — NULL until invite accepted)
├── club_id          (uuid → sports_clubs)
├── display_name     ("Sarah Thompson")
├── title            ("Head of Commercial")
├── avatar_url
├── role             (admin | manager | member | viewer)
├── role_template    ("head_of_commercial" — refs static template)
├── primary_department    ("commercial_marketing")
├── additional_departments (text[] — array of dept slugs)
├── cross_department_view (bool — "sees everything" flag)
├── custom_permissions (jsonb — fine-grained overrides)
├── invited_by       (uuid → auth.users)
├── invited_at
├── accepted_at
├── status           (pending | active | suspended | removed | declined)
└── created_at
```

### Permissions hierarchy

**3-level permissions:**

1. **Role** (club-wide):
   - `admin` — invite users, billing, club settings
   - `manager` — invite within dept, modify dept settings
   - `member` — standard dept access
   - `viewer` — read-only

2. **Department access** (per membership):
   - `primary_department` — home view on login
   - `additional_departments` — full access to other depts
   - No access = module hidden from sidebar

3. **Cross-department view** (special flag):
   - `cross_department_view: true` for CEO/Sporting Director/Owner level

**Default permissions matrix:**

| Role | Own Dept | Other Depts | Billing | Invites | Settings |
|---|---|---|---|---|---|
| Owner | Full | Full (cross-dept) | Yes | Yes | Yes |
| CEO | Full | Full (cross-dept) | Yes | Yes | Yes |
| Dept Head | Full | Read-only | No | Within dept | Dept settings only |
| Dept Member | Full | None | No | No | None |
| Viewer | Read-only | None | No | No | None |

### Department list (shared modules across 4 football products)

| Department | Pro | Club | Women | Grassroots |
|---|---|---|---|---|
| Overview | ✅ | ✅ | ✅ | ✅ |
| Insights | ✅ | ✅ | ✅ | ✅ |
| Board & Executive | ✅ | ✅ | ✅ | ✅ (committee) |
| Football Operations | ✅ | ✅ | ✅ | ✅ |
| Performance & GPS | ✅ | ✅ | ✅ | optional |
| Medical & Welfare | ✅ | ✅ | ✅ | ❌ |
| Recruitment & Scouting | ✅ | ✅ | ✅ | ❌ |
| Youth & Academy | ✅ | ✅ | ✅ | ✅ (Youth Teams) |
| Travel & Logistics | ✅ | ✅ | ✅ | ✅ (lite) |
| Commercial & Marketing | ✅ | ✅ | ✅ | ✅ (lite) |
| Ticketing, CRM & Fans | ✅ | ✅ | ✅ | ❌ |
| Media & Comms | ✅ | ✅ | ✅ | ✅ (lite) |
| Facilities & Grounds | ✅ | ✅ | ✅ | ✅ |
| Finance, HR & Admin | ✅ | ✅ | ✅ | ✅ (lite) |
| Compliance | PSR Modeller | Ground Grading + FSR | WSL Handbook + Carney | FA Charter |
| Community | ✅ | ✅ | ✅ | ✅ |
| Strategy (in Board) | ✅ | ✅ | ✅ | ❌ |
| Settings | ✅ | ✅ | ✅ | ✅ |
| Workflows Library | ✅ | ✅ | ✅ | ✅ |
| Integrations | ✅ | ✅ | ✅ | optional |

**Compliance is special:** each product has its OWN compliance module (flagship feature). Not one generic "Compliance" module across products.

---

## B2 — Invite flow

### Phase 1 strategy: sales-led only

For the first 3 founding members, **Lumio sets up the portal entirely**:
- Arron uses the admin tool (Path E) to provision the club
- Sends a "your portal is ready" email to the founding admin
- Founding admin lands in a working portal
- Founding admin can then invite their team via the in-portal invite flow

**Phase 2:** Self-serve signup enabled (clubs 4-20).

### Invite lifecycle

```
1. CREATED — Admin enters {email, name, role_template}
              → INSERT sports_memberships {status: pending}
              → INSERT sports_invite_tokens {token, 7-day expiry}
              → Email sent with magic link

2. PENDING — Invitee hasn't clicked yet
              → Visible to admin as "Invitation sent"
              → Can resend (invalidates old token), edit, or revoke

3. CLAIMED — Invitee clicked link
              → Set password (Supabase Auth)
              → UPDATE sports_memberships {user_id, status: active}

4. ACTIVE — User logged in, dashboard access

5. SUSPENDED — Admin pauses access (keeps row, blocks login)
                Still counts toward seats (revenue policy)

6. REMOVED — Soft delete, audit trail preserved
              Content attributed to user but un-editable
```

### Email design

**Sender pattern:** "Todd Johnson via Lumio" with Reply-To set to the inviter's email.

Why: personal sender = higher acceptance rate vs corporate sender.

**Founding admin invite expiry:** 30 days (longer for VIP recipients)
**Teammate invite expiry:** 7 days (industry standard)

### Role templates (Lumio Club set)

```typescript
// src/lib/sports/role-templates.ts

export const ROLE_TEMPLATES = [
  // Admin tier
  { id: 'chair_owner', label: 'Chair / Owner', role: 'admin', cross_dept: true,
    primary_dept: 'board_executive', additional: [] },
  { id: 'ceo', label: 'CEO', role: 'admin', cross_dept: true,
    primary_dept: 'board_executive', additional: [] },

  // Senior football
  { id: 'general_manager', label: 'General Manager', role: 'admin', cross_dept: true,
    primary_dept: 'football_operations', additional: ['board_executive', 'finance_hr_admin'] },
  { id: 'director_of_football', label: 'Director of Football', role: 'admin', cross_dept: true,
    primary_dept: 'football_operations', additional: ['recruitment_scouting', 'performance_gps', 'youth_academy'] },
  { id: 'head_coach', label: 'Head Coach / Manager', role: 'manager', cross_dept: false,
    primary_dept: 'football_operations', additional: ['performance_gps', 'medical_welfare'] },
  { id: 'assistant_manager', label: 'Assistant Manager', role: 'member', cross_dept: false,
    primary_dept: 'football_operations', additional: ['performance_gps'] },

  // Operations
  { id: 'club_secretary', label: 'Club Secretary', role: 'manager', cross_dept: false,
    primary_dept: 'football_operations', additional: ['finance_hr_admin', 'compliance'] },
  { id: 'kit_manager', label: 'Kit Manager', role: 'member', cross_dept: false,
    primary_dept: 'football_operations', additional: ['travel_logistics'] },

  // Departmental heads
  { id: 'head_of_commercial', label: 'Head of Commercial', role: 'manager', cross_dept: false,
    primary_dept: 'commercial_marketing', additional: ['media_comms'] },
  { id: 'head_of_recruitment', label: 'Head of Recruitment', role: 'manager', cross_dept: false,
    primary_dept: 'recruitment_scouting', additional: ['football_operations'] },
  { id: 'head_of_medical', label: 'Head of Medical', role: 'manager', cross_dept: false,
    primary_dept: 'medical_welfare', additional: ['performance_gps'] },
  { id: 'press_officer', label: 'Press Officer', role: 'member', cross_dept: false,
    primary_dept: 'media_comms', additional: ['commercial_marketing'] },
  { id: 'head_of_academy', label: 'Head of Academy', role: 'manager', cross_dept: false,
    primary_dept: 'youth_academy', additional: ['recruitment_scouting'] },
  { id: 'head_of_community', label: 'Head of Community', role: 'member', cross_dept: false,
    primary_dept: 'community', additional: [] },
  { id: 'treasurer', label: 'Treasurer / Head of Finance', role: 'manager', cross_dept: false,
    primary_dept: 'finance_hr_admin', additional: ['board_executive'] },

  // Custom escape hatch
  { id: 'custom', label: 'Custom', role: 'member', cross_dept: false,
    primary_dept: null, additional: [] }, // admin picks all
];
```

**Variations per product:**
- **Lumio Pro:** Adds Sporting Director, CFO, Head of PSR Compliance, Cat 1 Academy Manager, Stadium Manager
- **Lumio Women:** Adds Director of Women's Football, Carney Compliance Officer, Head of Player Welfare (women's-specific)
- **Lumio Grassroots:** Simpler set — Chair, Treasurer, Secretary, Manager, Coach, Welfare Officer, Volunteer Press, Volunteer Photographer

### Phase 1 must-have features

1. **Multi-admin nudge** — after 3 invites sent, prompt "promote a second admin for redundancy"
2. **Remove user flow** — soft delete with attribution preserved
3. **Suggested team** — pre-populated role list per product (appears in admin tool Phase 1, in self-serve wizard Phase 2)
4. **Bulk CSV/paste invite** — onboard 12-20 staff at once

### Phase 2+ features (deferred)

- Self-serve provisioning
- AI suggestions ("haven't filled Head of Comms — want me to draft a job ad?")
- Audit log
- Admin transfer workflows
- Advanced permission overrides UI

---

## B3 — Schema spec (Supabase migrations)

7 migration files. Numbered 090-096 (you're at ~089).

### Migration 090: `sports_clubs`

```sql
CREATE TYPE product_type AS ENUM (
  'lumio_pro', 'lumio_club', 'lumio_women', 'lumio_grassroots'
);

CREATE TABLE sports_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sport TEXT NOT NULL DEFAULT 'football',
  product product_type NOT NULL,
  tier TEXT NOT NULL,

  parent_club_id UUID REFERENCES sports_clubs(id) ON DELETE SET NULL,

  logo_url TEXT,
  brand_primary TEXT,
  brand_secondary TEXT,

  league_name TEXT,
  fa_club_id TEXT,

  billing_status TEXT DEFAULT 'founding_member',
  billing_seats_included INT DEFAULT 5,
  billing_seats_purchased INT DEFAULT 0,
  billing_started_at TIMESTAMPTZ,
  billing_renews_at TIMESTAMPTZ,

  setup_complete BOOLEAN DEFAULT false,
  setup_completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sports_clubs_slug ON sports_clubs(slug);
CREATE INDEX idx_sports_clubs_product ON sports_clubs(product);
CREATE INDEX idx_sports_clubs_parent ON sports_clubs(parent_club_id) WHERE parent_club_id IS NOT NULL;
```

### Migration 091: `sports_memberships`

```sql
CREATE TYPE membership_role AS ENUM (
  'admin', 'manager', 'member', 'viewer'
);

CREATE TYPE membership_status AS ENUM (
  'pending', 'active', 'suspended', 'removed', 'declined'
);

CREATE TABLE sports_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL until accepted
  club_id UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  display_name TEXT,
  title TEXT,
  avatar_url TEXT,

  role membership_role NOT NULL DEFAULT 'member',
  role_template TEXT,
  primary_department TEXT NOT NULL,
  additional_departments TEXT[] DEFAULT '{}',
  cross_department_view BOOLEAN DEFAULT false,
  custom_permissions JSONB DEFAULT '{}',

  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  status membership_status DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Once accepted, unique on (user_id, club_id)
CREATE UNIQUE INDEX idx_memberships_user_club_unique
  ON sports_memberships(user_id, club_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX idx_memberships_user ON sports_memberships(user_id) WHERE status = 'active';
CREATE INDEX idx_memberships_club ON sports_memberships(club_id) WHERE status = 'active';
CREATE INDEX idx_memberships_status ON sports_memberships(status);
```

### Migration 092: `sports_invite_tokens`

```sql
CREATE TABLE sports_invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES sports_memberships(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,

  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  consumed_at TIMESTAMPTZ,
  consumed_by_user_id UUID REFERENCES auth.users(id),

  email_sent_at TIMESTAMPTZ,
  email_resent_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invite_tokens_token ON sports_invite_tokens(token);
CREATE INDEX idx_invite_tokens_email ON sports_invite_tokens(email);
CREATE INDEX idx_invite_tokens_membership ON sports_invite_tokens(membership_id);

-- This table is NOT exposed via PostgREST.
-- Access only via /api/sports-auth/accept-invite using service_role key.
-- Resend invalidates old token (write NULL to old, create new).
```

### Migration 093: link sports_profiles for future use

```sql
ALTER TABLE sports_profiles
  ADD COLUMN club_membership_id UUID REFERENCES sports_memberships(id) ON DELETE SET NULL;
```

Nullable. Used only for users who span both individual and team sports (rare). Defensive future-proofing.

### Migration 094: RLS for sports_clubs

```sql
ALTER TABLE sports_clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see clubs they're members of"
  ON sports_clubs FOR SELECT
  USING (
    id IN (
      SELECT club_id FROM sports_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "admins update their clubs"
  ON sports_clubs FOR UPDATE
  USING (
    id IN (
      SELECT club_id FROM sports_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role = 'admin'
    )
  );

-- Service role (Arron's admin tool) bypasses RLS automatically.
```

### Migration 095: RLS for sports_memberships

```sql
ALTER TABLE sports_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members see fellow members of their clubs"
  ON sports_memberships FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM sports_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "admins manage memberships in their clubs"
  ON sports_memberships FOR ALL
  USING (
    club_id IN (
      SELECT club_id FROM sports_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role = 'admin'
    )
  );
```

### Migration 096: dev sample club (optional, dev/staging only)

```sql
-- Run ONLY on dev/staging. Provides a test club for developers.
INSERT INTO sports_clubs (name, slug, product, tier, league_name, brand_primary)
VALUES ('Test FC', 'test-fc', 'lumio_club', 'national_league', 'Vanarama National League', '#14B8A6');
```

### Critical notes

- **Individual sports (boxing/darts/tennis/golf) stay on existing `sports_profiles` 1:1 model.** No migration needed for them.
- **Two parallel models** — individual sports use `sports_profiles`, team sports use `sports_clubs` + `sports_memberships`.
- **Resend invite invalidates old token** — clearer security model.
- **`sports_invite_tokens` should NOT be exposed via PostgREST** — access only via API routes using service_role key.

---

## B4 — Product mechanics

### Single product config file

```typescript
// src/lib/sports/product-config.ts

export type ProductConfig = {
  id: 'lumio_pro' | 'lumio_club' | 'lumio_women' | 'lumio_grassroots';
  display_name: string;
  tier_label: string;
  enabled_modules: ModuleId[];
  compliance_module: ComplianceId;
  role_templates: RoleTemplateId[];
  ai_tone: 'formal' | 'professional' | 'community' | 'volunteer';
  default_seats: number;
  base_price_gbp: number;
  per_seat_price_gbp: number;
  badge_colour: string;
};
```

### Product defaults

| Field | Lumio Pro | Lumio Club | Lumio Women | Lumio Grassroots |
|---|---|---|---|---|
| display_name | "Lumio Pro" | "Lumio Club" | "Lumio Women" | "Lumio Grassroots" |
| tier_label | "Premier League / Championship" | "League One/Two / National / Non-League" | "WSL / WSL2 / Championship" | "Step 5+ / County / Lower-tier Women" |
| ai_tone | formal | professional | community + compliance-aware | volunteer-friendly |
| default_seats | 25 | 8 | 12 | 3 (free tier) |
| base_price_gbp/yr | 18,000 | 3,000 | 8,000 | 0 |
| per_seat_price_gbp/mo | 150 | 40 | 80 | 15 (beyond 3) |
| compliance_module | psr_modeller | ground_grading_fsr | wsl_handbook | fa_charter |
| badge_colour | #EF4444 (red) | #14B8A6 (teal) | #EC4899 (pink — validate with women's contact, consider purple) | #10B981 (green) |

### Module enablement mechanics

- **"Lite" variants** for Grassroots use **conditional rendering** within the same component (check `product === 'lumio_grassroots'`)
- **"Optional" modules** (e.g. Grassroots Performance & GPS) are **asked during onboarding wizard**, not buried in settings
- **Compliance module labels change per product** — "PSR Modeller" appears in Pro sidebar, "Ground Grading" in Club, etc. Not generic "Compliance".

### Billing & seat enforcement

```
available_seats = (billing_seats_included + billing_seats_purchased) - billing_seats_used

billing_seats_used = COUNT(memberships WHERE status IN ('active', 'pending'))
```

**Phase 1:** seat enforcement is essentially manual. Arron sets `billing_seats_included = 20` for founding members.

**Phase 2:** real enforcement kicks in when self-serve launches.

**Suspended users** still count as used seats (revenue policy — admin pays for the right to un-suspend).

### Product migration (upgrades)

If a club gets promoted (e.g. National League → League One — both still Lumio Club, but at the boundary), or a Lumio Club gets promoted to Championship (becomes Lumio Pro):

**Phase 1:** Manual database update by Arron + email to club. No automated upgrade flow.
**Phase 2+:** Self-service upgrade workflow.

---

## Build sequence

1. **Migration 090-093** — schema only, no behaviour change
2. **Migration 094-095** — RLS policies
3. **Role templates code file** — `src/lib/sports/role-templates.ts`
4. **Product config code file** — `src/lib/sports/product-config.ts`
5. **API: /api/sports-auth/accept-invite** — consumes token, mints user, activates membership
6. **Email template** — "Todd via Lumio" pattern via Resend
7. **Admin tool extension** — Path E spec covers this in detail

**Realistic timeline:** 4-6 weeks of focused build with Claude Code + careful review.

**Critical:** schema must be tested on dev Supabase before any production migration. RLS bugs hide in plain sight — manual testing of each policy required.

---

## Locked decisions reference

- **Q1** (multi-membership): Yes, one user → many clubs via memberships
- **Q2** (departments per user): Primary + additional array, not single
- **Q3a** (department list): Locked above
- **Q3b** (compliance modules): Separate flagship modules per product, NOT generic "Compliance"
- **Q4** (permissions flexibility): role_template defaults + custom_permissions overrides
- **Q5** (player records): Records only for v1, no player logins
- **Q6** (scope): Football only, 4 products
- **B2-Q1** (sales-led Phase 1): Yes, first 3 clubs
- **B2-Q2** (email sender): "Todd via Lumio"
- **B2-Q3** (role templates): 16 templates above
- **B2-Q4/5** (suggested team + bulk CSV): Yes, Phase 1
- **B2-Q6** (invite expiry): 7 days teammates, 30 days founding admin
- **B3-Q1** (resend invalidates old token): Yes
- **B3-Q2** (manager role): Include
- **B3-Q3** (role templates as code file): Yes
- **B3-Q4** (don't migrate existing sports_profiles): Yes
- **B4-Q1** (lite modules via conditional rendering): Yes
- **B4-Q2** (optional modules asked during onboarding): Yes
- **B4-Q3** (compliance label per product): Yes
- **B4-Q4** (suspended users still count seats): Yes
- **B4-Q5** (colours): Pro red, Club teal, Women pink (validate), Grassroots green

---

*End of Path B spec. See `path-d-travel-logistics.md` and `path-e-founding-member-admin-tool.md` for the features that build on this foundation.*
