# RGR Partners Dashboard — Port Spec (for Claude Code)

This document tells Claude Code everything it needs to port `rgr_dashboard.html` into the lumiocms stack (`dev.lumiocms.com/telted/horizon-education-us-demo`). It's the design + data + logic brief. Pair it with the HTML file which is the visual + behavioural reference.

---

## 1. Where this lives in lumiocms

Add to the left-hand nav, **under the `Tools` section**:

```
Tools
├── Workflows
├── Reports
├── Settings
Partners          ← new section header
└── RGR           ← new tab (this dashboard)
```

The dashboard lands on its own page (same chrome as Overview/Insights pages). The page itself is a 7-tab interface — the "RGR" nav item just opens the page; tab state lives inside the page.

## 2. Tech stack assumptions

The reference build is one self-contained HTML file. When porting:

- If lumiocms is **React**, split into per-tab components (`<OverviewTab/>`, `<SchoolsTab/>`, …). A top-level `<RGRDashboard/>` owns tab state and passes data down. Use Chart.js or migrate to Recharts — the chart configs in the reference are small and portable.
- If lumiocms is **Vue/Svelte/plain HTML**, the reference can be dropped in with minor chrome adjustments.
- Data should come from the API (see section 5), not from embedded CSVs. The reference inlines JSON so it renders standalone — in lumiocms, replace the `<script id="app-data">…</script>` block with an API fetch on mount.

## 3. Design system

Matches the existing lumiocms dark aesthetic. Design tokens (CSS vars in the reference):

```
--bg       #0b1518    page background
--panel    #132428    card background
--border   #1f3a40    card/table borders
--ink      #e7f4f5    primary text
--ink-dim  #9db5b8    secondary text
--ink-mute #6d8588    tertiary / muted labels
--teal     #14b8a6    primary accent
--amber    #f59e0b    amber state
--red      #ef4444    red state
--green    #22c55e    green state
--blue     #3b82f6    info state
--purple   #8b5cf6    secondary accent
```

Typography: system font stack. Body 14px. Headers 14–22px. KPI values 28px/700. Uppercase labels 10.5–11px letter-spacing 0.08–0.1em.

Cards: 12px radius, 1px border, 18px padding, subtle inset + drop shadow.

Badges / pills: 20px radius, 2×9 padding, 11px/600. RAG colour-coded via `.badge.green/.amber/.red/.teal/.blue/.purple/.neutral`.

Tables: sticky headers, hover-row highlight `var(--panel-2)`, 10/12 padding, 13px body text, 11px uppercase headers.

## 4. Tab structure

| Order | Tab | Landing? | Purpose |
|---|---|---|---|
| 1 | Overview | yes | KPI strip + RAG donuts + US map + needs-attention + activity feed |
| 2 | Insights | — | Deeper analytics: RAG by state, completion by state, avg by grade, paired-score scatter, subskill histogram, course breakdown |
| 3 | Schools | — | Sortable/filterable table of all 68 schools with drill-down drawer |
| 4 | Account Info | — | RAG + programme phase view with next-action recommendations |
| 5 | Assessments | — | Score histogram, subskill radar, pupil-level table (codenames only) |
| 6 | Training | — | Course-completion charts + teacher × course grid |
| 7 | DRL Access | — | Digital Resource Library adoption (currently 1/68 schools) |

## 5. Data contract

The reference serializes everything into one JSON blob (`public/api/partners/rgr/dashboard`). Shape:

```ts
type Payload = {
  generatedAt: string;              // ISO date
  partner: { name: string; shortName: string; schoolsUnderManagement: number };
  kpi: KPI;
  schools: School[];                // school-level roll-up
  teachers: Teacher[];              // training grid source
  assessments: Assessment[];        // pupil-level, codenames only
  pairedAssessments: Paired[];      // for progress scatter
  yearMap: Record<string,string>;   // "reception"→"Kindergarten" etc.
};

type School = {
  id: string;            // School OxEd ID (UUID)
  name: string;          // display name (no trailing "(code)")
  code: string;          // e.g. "32963" — parsed from parens
  state: string;         // full US state name
  students: number;
  classes: number;
  uploaded: boolean;
  accessed: boolean;
  portalAccess: string;  // ISO date, may be ''
  daysSincePortal: number | null;
  lastAssessmentDate: string;
  daysSinceAssessment: number | null;
  totalAssessments: number;
  assessmentsCY: number; // current year only
  red: number; amber: number; green: number;   // student-level RAG counts
  teachersInvited: number;
  teachersFullyTrained: number;
  courseCounts: Record<string, Record<string, number>>;
  hasDRL: boolean;
  wcMilestone: string;   // "Topic 1: My Body" etc, '' if none
  psMilestone: string;
  lastDRL: string;
  engagement: "red" | "amber" | "green";
  phase: 0 | 1 | 2 | 3 | 4;
  phaseLabels: string[];
  nextAction: string;    // human recommendation copy
};

type Teacher = {
  name: string; school: string; schoolFull: string; email: string;
  fullyTrained: boolean;
  invitedDate: string; lastVisit: string;
  c1: string; c2: string; c3: string; c4: string; supportHub: string;
  // status enum: "Completed" | "In progress" | "Enrolled" | "Not started"
};

type Assessment = {
  year: "2024-25" | "2025-26";
  codename: string;                   // ANONYMIZED — never real names
  schoolId: string;
  schoolName: string;
  yearGroup: string;                  // UK label as stored
  grade: string;                      // US label for display
  gradeOrder: number;                 // for sorting
  ageMonths: number;
  assessmentDate: string;
  assessmentIndex: number;            // 1, 2, 3 in-year
  rag: "red" | "amber" | "green";
  total: number; ev: number; rv: number; lc: number; sr: number;
  gender: string;
  studentId: string;                  // Student OxEd ID
};
```

### Source CSVs (how the reference built `Payload`)

| CSV export | Purpose | Key field |
|---|---|---|
| `overview.csv` | Per-school roll-up (state, students, classes, portal access) | School OxEd ID |
| `LS.csv` | Assessment totals per school + RAG mix | School OxEd ID |
| `DRL.csv` | DRL visit + milestones per school | School OxEd ID |
| `LS assessments CAY.csv` | Pupil-level assessments, current year | Student OxEd ID |
| `LS assessments 2024_25.csv` | Pupil-level, previous year | Student OxEd ID |
| `st.csv` | Student roster (names, DOBs) | **DO NOT USE** for RGR view — PII |
| `training.csv` | Teacher-level training status | School name (not ID — join by name) |

**Important**: `training.csv` has `School name` not `School OxEd ID`. Join by exact match on the full `"{name} ({code})"` string.

### PII rules

- Student names and DOBs are in the raw data but **must not be shown to partners**. The payload already strips them — only `codename` and `studentId` (UUID) remain per pupil.
- Teacher names + emails **are** shown (RGR needs to know who's trained). If this changes, drop the `name` and `email` fields in the `Teacher` type.

### US grade labels

UK → US mapping in `yearMap`:

```
nursery    → Pre-K
reception  → Kindergarten
year_1     → 1st Grade
year_2     → 2nd Grade
year_3     → 3rd Grade
year_4     → 4th Grade
year_5     → 5th Grade
year_6     → 6th Grade
```

## 6. Business logic

### School-level RAG engagement

```
IF  assessmentsCY == 0  AND  teachersFullyTrained == 0
    AND no teacher has ever marked any C1-C4 Completed
→   engagement = "red"        ("not using the programme")

ELSE IF assessmentsCY > 0  AND teachersFullyTrained >= 1
    AND daysSincePortal <= 30
→   engagement = "green"

ELSE
→   engagement = "amber"
```

Currently yields: **17 red / 40 amber / 11 green** for the 68-school portfolio.

### Student-level RAG (LanguageScreen)

Standard score bands (LS convention, mean 100, SD 15):

```
total >= 90   → green
85 <= t < 90  → amber
total < 85    → red
```

### Programme phase (0–4)

```
Phase 0 : no activity
Phase 1 : ≥1 assessment this year
Phase 2 : ≥1 teacher completed C1 Language Fundamentals
Phase 3 : ≥1 teacher completed C4 Whole Class  OR DRL WC milestone reached
Phase 4 : ≥1 teacher completed C2 NELI Intervention
```

Each phase implies all prior phases (we take `max`).

### Next-action copy

Generated at payload build time (not client-side) so it's auditable:

```
if no assessments and no teachers invited:  "Kick-off call: no activity yet. Schedule onboarding."
elif assessmentsCY == 0:                   "Prompt school to run LanguageScreen assessments."
elif teachersFullyTrained == 0:            "Encourage teachers to complete C1 Language Fundamentals."
elif not hasDRL:                            "Introduce the Digital Resource Library (DRL)."
elif daysSincePortal > 30:                  "Re-engage: portal dormant {N} days."
else:                                       "On track — maintain cadence."
```

## 7. Known data quirks

- `2024-25` file uses UK labels (`year_2`, `year_3`) for US data — treat as legacy; map via `yearMap`.
- `CAY.csv` contained 274 NUL bytes — strip on ingest (`tr -d '\0'`).
- `Gender` is `unknown` for most rows; only 46% have a value.
- `First language` is `Unknown` for all current rows.
- Only **1 school** has any DRL activity (Big Horn Elementary, "Topic 1: My Body", last visit 2026-04-08). This is a feature not a bug — surface it as an action item.
- **4 schools** have repeat assessments in both years (2024-25 + 2025-26); the other 46 data-having schools are single-year only.

## 8. Charts (reference IDs → what they show)

| Canvas id | Chart | Tab |
|---|---|---|
| `chEngagement` | School engagement donut (R/A/G) | Overview |
| `chRag` | Student RAG donut | Overview |
| `chByGrade` | Bar, CY assessments by US grade | Overview |
| `chSubskills` | Horizontal bar, portfolio avg per subskill | Overview |
| `chFunnel` | Stacked bar, course statuses | Overview |
| `chRagByState` | Horizontal stacked, RAG mix per state | Insights |
| `chCompByState` | Horizontal bar, CY completion % per state | Insights |
| `chAvgByGrade` | Bar, avg total score by grade | Insights |
| `chPaired` | Scatter, first-vs-last total for paired pupils | Insights |
| `chSubDist` | Grouped bar, subskill score distributions | Insights |
| `chCoursesBreak` | Stacked bar, course breakdown | Insights |
| `chPhases` | Horizontal bar, phase count | Account Info |
| `chScoreHist` | Bar histogram, all CY total scores | Assessments |
| `chRadar` | Radar, portfolio vs benchmark subskills | Assessments |
| `chTrTop` | Horizontal bar, top 10 schools by training % | Training |
| `chTrCourses` | Stacked bar, course statuses | Training |

All charts: grid lines `var(--border)`, tick colour `var(--ink-mute)`, no titles (titles are on cards).

## 9. Interactivity checklist

- [ ] Click a schools-table row → slide-in drawer showing that school's detail (RAG distribution, phase stepper, teachers list, DRL state, next action).
- [ ] Search box on Schools/Assessments/Training filters the table in real time.
- [ ] State dropdown on Schools filters by state.
- [ ] RAG segmented control on Schools, Account Info, Assessments.
- [ ] Year segmented control on Assessments (defaults to 2025-26).
- [ ] Sort arrows on sortable column headers.
- [ ] Drawer closes on backdrop click + on × button.

## 10. File delivered

- `rgr_dashboard.html` — the working reference, ~1.3 MB with inline data + Chart.js via CDN
- `data.json` — just the payload, in case you want to hit it as a mock endpoint
- `build_data.py` — the ETL that turns the 7 CSVs into `data.json`; keep for re-derivation
- `build_html.py` — the script that assembles the HTML; not runtime-needed but useful for regenerating the static page

## 11. Open items for the lumiocms port

1. **Real API.** The reference is a snapshot of today's data. In lumiocms, serve `Payload` from a GET endpoint that joins the underlying tables. The CSVs are exports from that same system.
2. **Auth.** The whole view should be gated on a partner role (`partners.view.rgr` or similar). Partners should only see schools they manage — this is already scoped to RGR's 68 schools in the export, but enforce server-side on the real endpoint.
3. **Student-level PII.** Confirm the `name` + `email` fields on teachers are acceptable to show. If not, swap to initials or a teacher ID.
4. **Refresh cadence.** RAG and phase are snapshots. Decide whether they're computed on the fly or cached — the logic in section 6 is deterministic and cheap.
5. **Deep-links.** Consider URL fragment `#assessments?school=…` so RGR reps can bookmark a filtered view.

