# Build the RGR Partners Dashboard in lumiocms

Hi Claude Code — this is a task brief from Arron. Build this feature, don't just read about it.

## Arron's decisions (answered)

1. **Tenant scope** — Data-driven. Add a `partner` field to the tenant config; the nav entry appears whenever `tenant.partner === 'RGR'`. Future-proof for adding more partners later.
2. **Demo vs live data** — Serve `scripts/rgr/data.json` verbatim from `/api/partners/rgr/dashboard` for v1. Swap in the real DB-backed endpoint later behind the same URL. Do not fork into two code paths.
3. **Teacher PII** — Show name + email. RGR reps need this to actually do their job.
4. **Chart library** — Recharts (already in `package.json`). Convert the 16 Chart.js configs from the reference `rgr_dashboard.html` into Recharts components.

## What you need to build

Add a new **Partners** section to the lumiocms left-hand nav, below the existing `Tools` section, containing a single tab called **RGR** (Really Great Reading). The RGR page is a seven-tab partner dashboard that surfaces the portfolio of ~68 US schools that RGR manages under the TEL TED programme.

The tabs are: **Overview** (landing), **Insights**, **Schools**, **Account Info**, **Assessments**, **Training**, **DRL Access**.

## Reference files in this folder

Before you start, read these in this order:

1. `rgr_dashboard.html` — a working, fully interactive reference implementation. Open it in a browser to see exactly what the end result should look and behave like. This is the source of truth for visual design, interactions, and chart configurations.
2. `RGR_DASHBOARD_SPEC.md` — a spec document covering the data model, RAG/phase business logic, design tokens, tab structure, and the CSV-to-JSON ETL. Read it end-to-end.
3. `data.json` — the current data payload. Use it as your mock API response during development. The shape is documented in the spec.
4. `build_data.py` — the Python ETL that turned seven CSV exports into `data.json`. Keep it as the canonical source for the data contract.

## Your job

1. Add the **Partners** nav section and the **RGR** child route to the existing navigation in lumiocms.
2. Build the RGR page using lumiocms's existing component stack (React, Vue, whichever — match what's already there). Mirror the dark-theme design tokens already documented in the spec.
3. Port each of the seven tabs faithfully from `rgr_dashboard.html`. The reference uses Chart.js and SheetJS — use whichever charting and Excel libraries are already in the lumiocms dependency tree, or add Chart.js/SheetJS if nothing suitable is installed.
4. Keep the three export buttons (Export Excel, Export PDF, Print) in the page header. The Excel export logic is in the reference — it produces a 7-sheet workbook. The PDF export uses `window.print()` with print-specific CSS (also in the reference).
5. Replace the embedded `data.json` blob with a real API call. Wire a new GET endpoint — suggested path `/api/partners/rgr/dashboard` — that returns the same `Payload` shape defined in the spec. Server-side, the data comes from the OxEd platform's existing tables; `build_data.py` shows the joins and derived fields (engagement RAG, phase, next-action copy).
6. Enforce authorization: the page must be gated on a partner role. The RGR user should only see schools they manage. Scope the query server-side; do not trust a client-side filter.

## Business rules — do not re-derive these, copy from the spec

- **School engagement RAG**: green = assessments this year + ≥1 fully-trained teacher + portal access ≤ 30 days; red = zero assessments AND zero completed training; amber = everything else.
- **Student RAG**: LS total score ≥ 90 green, 85–89 amber, < 85 red.
- **Programme phase (0–4)**: 0 none · 1 assessment · 2 PD · 3 Whole-Class · 4 NELI Intervention. Phases are cumulative (take max).
- **Next-action copy**: generated at payload build time, not client-side — see spec section 6.
- **PII rule**: student names and DOBs are in the raw CSV but must NEVER leave the server for the RGR view. Only codenames (e.g. `grass_door_62`) and student UUIDs are exposed. Teacher names and emails ARE shown.
- **Grade labels**: UK → US. Map `reception → Kindergarten`, `year_1 → 1st Grade`, etc. Mapping is in the spec and in `yearMap` on the payload.

## Expected DX / acceptance checklist

Walk through these once the build is done:

- [ ] `Partners → RGR` appears in the left nav, styled consistently with existing nav items.
- [ ] All seven tabs render without console errors.
- [ ] Overview KPI strip shows: schools, students, assessments (CY), avg score, teachers trained, schools needing attention.
- [ ] Overview RAG donut + student-RAG donut + US state-grid map + top-5-needs-attention list + activity feed all populate from the API.
- [ ] Schools table is sortable, filterable by state and RAG, searchable; clicking a row opens a right-hand drawer with that school's detail.
- [ ] Account Info shows phase distribution + attention table with recommended next action.
- [ ] Assessments tab has score histogram + subskill radar + pupil-level table (codenames only, NEVER names).
- [ ] Training tab shows completion-rate bar, course-status stacked bar, and teacher × course grid.
- [ ] DRL Access tab shows the "1 of 68 schools is using DRL" callout and the kick-off-eligibility table.
- [ ] Export to Excel downloads a 7-sheet workbook (Summary, Schools, Account Info, Assessments, Training, DRL, Progress).
- [ ] Export to PDF triggers `window.print()` with all tabs rendered together and print CSS applied.
- [ ] Dark theme matches the rest of lumiocms.
- [ ] Partner-role auth enforced server-side; the endpoint 403s for non-partner users.

## Questions to ask Arron, NOT guess

- Whether lumiocms already has a chart library or whether you should add Chart.js.
- Whether to put the Excel/PDF export at the page level (current reference) or per-tab.
- Whether the URL should support deep links (e.g. `#schools?state=Florida`).
- Partner-role naming: `partners.view.rgr` is a suggestion — check what convention lumiocms already uses.

## Things that are intentional, don't "fix" them

- Only 1 of 68 schools has touched the DRL. That's real data — surface it, don't hide it.
- 17 schools are red-engagement. That's the whole point of the tab.
- The 2024-25 assessments file uses UK year labels for US data. Map on ingest.
- The training CSV joins by school NAME (not ID). Keep that join or migrate the data to use School OxEd ID on the real API.

## If you get stuck

Every piece of business logic and every chart is already working in `rgr_dashboard.html`. If something feels ambiguous, open that file in a browser and match what you see. If the spec and the reference disagree, the spec wins (the reference was built from it).

Good luck — ping Arron with any decisions that need a human judgement call.
