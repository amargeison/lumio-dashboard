# Lumio Sports — Media & Content Module Build

## Handoff Brief

**Date:** April 2026
**Context:** This module replaces the "Coming in Full Build" placeholder and existing partial Media & Content sections across all 10 sports demo portals with a unified, fully interactive tabbed interface.
**Repo:** `github.com/amargeison/lumio-dashboard` — branch `dev`
**Working dir:** `C:\Users\ArronMargeison\lumio-dashboard`
**Deploy:** `git checkout main && git merge dev && git push origin main && git checkout dev` — Vercel auto-deploys. Never run `deploy.sh` alone.
**Demo PIN:** `071711`

---

## What You're Building

A shared `MediaContentModule` component used by all 10 sports demo portals. Four tabs: **Social | Sponsors | Press | Interviews**. Fully interactive with React `useState` — session-only state that resets on page reload (intentional, no persistence). Zero API calls, zero localStorage, zero Supabase. Demo visitors can draft posts, tick checkboxes, add interviews, mark things done — but nothing persists.

**Golf (James Harrington)** is the fully-populated reference implementation. Other 9 sports get TODO placeholder content — real content will be written in a separate pass after the plumbing is verified on Golf.

---

## Current State of Each Sport

| Sport | Current Media & Content state | File path |
|---|---|---|
| Golf | "Coming in Full Build" placeholder — **empty** | `src/app/(golf)/golf/[slug]/page.tsx` |
| Tennis | Real content: Statement Generator, stats cards, Press & Media Log, Brand Usage Guidelines | `src/app/tennis/[slug]/page.tsx` |
| Boxing | Partial: "Media Obligations" section only | `src/app/(boxing)/boxing/[slug]/page.tsx` |
| Darts | Unknown — grep to confirm | `src/app/darts/[slug]/page.tsx` |
| Cricket | Unknown — grep to confirm | `src/app/cricket/[slug]/page.tsx` |
| Rugby | Unknown — grep to confirm | `src/app/rugby/[slug]/page.tsx` |
| Football Pro | Unknown — grep to confirm | `src/app/(football)/football/[slug]/page.tsx` |
| Football Non-League | Unknown — grep to confirm | Check routing |
| Football Grassroots | Unknown — grep to confirm | Check routing |
| Women's FC | Unknown — grep to confirm | `src/app/womens/[slug]/page.tsx` |

**IMPORTANT:** For sports with existing content (Tennis, Boxing), the new module must **ABSORB** the existing sections into the appropriate tabs — not delete them. Existing Statement Generator → Press tab. Existing Press & Media Log → Press tab. Existing Brand Usage Guidelines → Sponsors tab. Existing Media Obligations → Sponsors tab.

---

## Demo Personas (use these names — do NOT invent new ones)

| Sport | Demo player | Notes |
|---|---|---|
| Golf | James Harrington | World #87, DP World Tour, 4.82 pts avg, Race to Dubai #43 |
| Tennis | Alex Rivera | ATP #67, 1,847 pts, coach Marco Bianchi |
| Darts | Jake "The Hammer" Morrison | PDC #19, 97.8 avg |
| Boxing | Marcus Cole "The Machine" | WBC #6, fighting Viktor Petrov (WBC #3) |
| Cricket | Grep the codebase for existing demo persona |
| Rugby | Grep the codebase for existing demo persona |
| Football Pro | AFC Wimbledon (blue #003DA5 / yellow #F1C40F) |
| Football Non-League | Harfield FC (amber) |
| Football Grassroots | Sunday Rovers FC (green) |
| Women's FC | Oakridge Women FC |

---

## Sport Accent Colours

| Sport | Accent | Hex |
|---|---|---|
| Golf | Green | `#16a34a` |
| Tennis | Purple | `#a855f7` |
| Darts | Green | `#22c55e` |
| Boxing | Red | `#ef4444` |
| Cricket | Grep for existing accent |
| Rugby | Grep for existing accent |
| Football Pro | Blue | `#003DA5` |
| Football Non-League | Amber | Grep |
| Football Grassroots | Green | Grep |
| Women's FC | Pink | `#BE185D` |

---

## Invented Brand Universe (CRITICAL — never use real brand names)

All sponsor names, press outlets, and broadcasters in demo content must use these invented brands. See `docs/brand-universe.md` in the repo for the full table. Key ones for this module:

| Category | Invented Brand | Replaces |
|---|---|---|
| Watch/luxury | Meridian Watches | Rolex |
| Apparel/kit | Apex Performance | Lululemon, Nike, Adidas, Puma, Under Armour |
| Equipment | Vanta Sports | Wilson, Callaway, TaylorMade, Everlast, Red Dragon |
| Finance/bank | Northbridge Financial | HSBC |
| Automotive | Halden Motors | BMW |
| Betting | Crown Wagers | Paddy Power, Betway, Ladbrokes |
| Energy drink | Kinetix Hydration | Red Bull |
| Tech/audio | Linea Systems | Bose |
| Eyewear | Ridgeline Optics | Oakley |
| Insurance | Everline Assurance | AXA |
| Fitness equipment | Technivus Equipment | Technogym |
| UK broadcaster (TV) | Northbridge Sport | Sky Sports |
| UK broadcaster (free) | Crown Broadcasting | BBC Sport |
| UK broadcaster (secondary) | Crown TV | ITV |
| UK broadcaster (radio) | Northbridge Talk | TalkSport |
| European broadcaster | Continental Sport | Eurosport, TNT Sports |
| US broadcaster | Apex Sports Network | ESPN |
| UK press | Capital Herald | Evening Standard |
| UK press | The Dispatch | Daily Mail |

**The rule:** if you're inventing a sponsor, press outlet, or broadcaster for demo content, check this table first. If the category already has an invented brand, use it. If not, invent one that fits and add it to the table.

**Pattern 1 (REPLACE):** Real entity in a fabricated relationship with a fictional persona.
**Pattern 2 (KEEP):** Real entity in a factual public-information context (rankings, governing bodies, real integrations like DataGolf/SwingVision/TrackMan).

---

## Component Architecture

### Files to create

```
src/components/sports/media-content/MediaContentModule.tsx   ← shared component
src/lib/demo-content/media-content.ts                        ← content data file
```

### Props

```typescript
interface MediaContentModuleProps {
  sport: string;           // 'golf', 'tennis', 'darts', etc.
  accentColor: string;     // sport accent hex
  existingContent?: ReactNode;  // optional existing JSX to absorb (Tennis, Boxing)
}
```

### How to wire it into demo pages

For each sport's `[slug]/page.tsx`, find the Media & Content section and replace the placeholder/existing content with:

```tsx
{isDemoShell && (
  <MediaContentModule
    sport="golf"
    accentColor="#16a34a"
  />
)}
```

For sports with existing content (Tennis, Boxing), extract the existing JSX and pass it:

```tsx
{isDemoShell && (
  <MediaContentModule
    sport="tennis"
    accentColor="#a855f7"
    existingContent={<ExistingTennisMediaContent />}
  />
)}
```

On NON-demo shells (real founding members), keep existing behaviour (placeholder or current content) until the real feature is built.

---

## Tab Specifications

### Tab 1: Social

**Layout:** Left (2/3 width) scheduled posts feed + Right (1/3 width) compose panel.

**Left — Scheduled Posts Feed:**
- Grouped by: Today / Tomorrow / This Week / Next Week
- Each post card shows: platform icons (Instagram/X/TikTok/YouTube/Facebook), scheduled time, caption preview (2 lines truncated), status badge (Scheduled / Draft / Published / Needs approval)
- "..." menu per card: Edit / Duplicate / Delete / Mark published
- Clicking a card opens an edit modal (reuses compose panel fields)

**Right — Compose Panel:**
- Platform multi-select (toggle chips: Instagram, X, TikTok, YouTube, Facebook)
- Caption textarea with character count
- Hashtag chip input (type + enter to add, click to remove)
- Schedule date/time picker
- "Save draft" and "Schedule post" buttons
- Clicking "Schedule" with valid input prepends a new card to the feed with status "Scheduled"

**Top Stats Strip:**
- "12 scheduled this week" / "3 drafts" / "5 pending approval" / "2.4M reach last 7 days"
- Numbers come from the content data file, update reactively when posts are added/deleted

### Tab 2: Sponsors

**Layout:** Summary strip at top, sponsor cards below, expandable Brand Usage Guidelines section at bottom.

**Summary Strip:**
- "4 active sponsors" / "7 obligations this month" / "2 overdue" / "£XXk monthly value"

**Sponsor Cards (one per sponsor):**
- Sponsor name + logo placeholder (coloured circle with initials)
- Contract value / duration
- Obligations checklist (3–5 items with checkboxes, e.g. "1 Instagram post wearing branded polo", "Equipment bag visible in 2 tournament photos")
- Progress bar (obligations met / total) — updates reactively when checkboxes are ticked
- Next deadline
- "Add obligation" button opens a simple modal (text field + due date)
- Ticking the last unchecked obligation triggers a subtle toast: "Obligation complete ✓"

**Brand Usage Guidelines (expandable):**
- If the sport has existing Brand Usage Guidelines content (Tennis does), render it here as an expandable section
- Otherwise, render a placeholder set of brand guidelines from the content data file

### Tab 3: Press

**Layout:** Stats strip at top, press mentions feed (left), mini-charts (right sidebar).

**Stats Strip:**
- "23 mentions this week" / "Sentiment: 87% positive" / "Top outlet: [sport-specific]" / "1 interview request pending"

**Press Mentions Feed (card list, newest first):**
- Each card: outlet name, headline, date, author, sentiment badge (Positive / Neutral / Negative), 2-line excerpt, "Read" link (inert), "Log response" button (opens modal)

**Right Sidebar:**
- Mention velocity chart: simple SVG bars showing 7 days of mention counts
- Sentiment donut: SVG donut chart (positive / neutral / negative)

**Absorbed existing content (if present):**
- Tennis "Statement Generator" → render as a collapsible section at the top of the Press tab
- Tennis/other "Press & Media Log" with status badges (Done / Upcoming / Confirmed / TBC) → render as a sub-section titled "Press Schedule" below the mentions feed

### Tab 4: Interviews

**Layout:** Split view — left (upcoming interviews list) + right (interview prep panel for selected interview).

**Left — Upcoming Interviews List:**
- Card per interview: outlet + journalist name, date/time, format badge (In-person / Phone / Video / Written), prep status badge (Not started / In progress / Ready), topic chips
- "New interview" button prepends a blank card
- Clicking a card selects it and loads the prep panel on the right

**Right — Interview Prep Panel:**
- Talking points (editable list — add/remove items)
- Topics to avoid (editable list)
- Key stats to mention (editable list)
- "Mark prep ready" button → flips the status badge to "Ready" on the selected card

---

## Content Data File Structure

File: `src/lib/demo-content/media-content.ts`

```typescript
export type SocialPost = {
  id: string;
  platforms: Array<'instagram' | 'x' | 'tiktok' | 'youtube' | 'facebook'>;
  scheduledFor: string;
  caption: string;
  hashtags: string[];
  status: 'scheduled' | 'draft' | 'published' | 'needs-approval';
};

export type SponsorObligation = {
  id: string;
  text: string;
  done: boolean;
  dueDate?: string;
};

export type Sponsor = {
  id: string;
  name: string;
  contractValue: string;
  contractDuration: string;
  monthlyValue: string;
  obligations: SponsorObligation[];
  nextDeadline: string;
};

export type PressMention = {
  id: string;
  outlet: string;
  headline: string;
  date: string;
  author: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  excerpt: string;
};

export type Interview = {
  id: string;
  outlet: string;
  journalist: string;
  datetime: string;
  format: 'in-person' | 'phone' | 'video' | 'written';
  prepStatus: 'not-started' | 'in-progress' | 'ready';
  topics: string[];
  talkingPoints: string[];
  topicsToAvoid: string[];
  keyStats: string[];
};

export type MediaContentData = {
  stats: {
    social: { scheduled: number; drafts: number; pending: number; reach: string };
    sponsors: { active: number; obligations: number; overdue: number; monthlyValue: string };
    press: { mentions: number; sentiment: string; topOutlet: string; pendingRequests: number };
  };
  social: SocialPost[];
  sponsors: Sponsor[];
  press: PressMention[];
  interviews: Interview[];
};

export const MEDIA_CONTENT: Record<string, MediaContentData> = {
  golf: { /* FULLY POPULATED — see Golf Content section below */ },
  tennis: TODO_DATA,
  darts: TODO_DATA,
  boxing: TODO_DATA,
  cricket: TODO_DATA,
  rugby: TODO_DATA,
  'football-pro': TODO_DATA,
  'football-non-league': TODO_DATA,
  'football-grassroots': TODO_DATA,
  womens: TODO_DATA,
};
```

---

## Golf Content (James Harrington — fully populate)

Use these guidelines for the reference implementation:

**Social posts (8–10):** Mix of Instagram, X, TikTok. References to Halden Motors International Open, Munich prep, Race to Dubai, caddie, equipment sponsors (Vanta Sports), fans. Mix of Scheduled / Draft / Needs approval statuses.

**Sponsors (4):** Use invented brands only.
- Vanta Sports — Equipment + Bonus, GBP 45,000/yr + bonuses. 3–5 obligations (use equipment in all events, social mentions 2/month, appear in 1 campaign/yr).
- Apex Performance — Apparel, GBP 65,000/yr. Obligations: wear on course, Instagram posts, brand events.
- Meridian Watches — Cash + watch allocation, GBP 120,000/yr. Obligations: wear in press conferences, appear in campaigns, monthly ranking reports.
- Northbridge Financial — Platform partnership, GBP 30,000/yr. Obligations: logo on bag, brand mentions in interviews.

Mix of ticked and unticked obligations. At least one sponsor should be 1 obligation away from complete.

**Press mentions (6–8):** Use invented outlets only.
- Fairway Quarterly, The Green Network, European Tour Insider, Capital Herald, Northbridge Sport Online, The Dispatch Sport — all invented.
- Mix of positive / neutral / negative sentiment.
- Headlines tied to James Harrington's recent form: Race to Dubai position, Halden Motors International Open preview, recent round analysis.

**Interviews (3–4):** Mix of formats.
- One "Ready" (prep complete, talking points filled in about Race to Dubai position, Munich course conditions).
- One "In progress" (some talking points, need more stats).
- One "Not started" (just outlet + date, empty prep panel).
- Topics should reference Harrington's actual demo context: Race to Dubai #43, 4.82 pts avg, upcoming Halden Motors International Open.

**Tone:** Confident, specific numbers, professional PR language. Match the voice of the existing James Harrington AI Summary already on the Golf portal's Today tab.

---

## Critical Build Rules

### DO:
- Use React `useState` for ALL interactivity — optimistic updates, no loading spinners for session-only actions
- Match existing Lumio Sports visual style: dark bg (#07080F family), card borders consistent with existing, Geist font inheritance
- Use sport accent colour for active tab underline, primary buttons, progress bars, badge accents
- Make tabs keyboard-navigable, modals trap focus and close on Escape
- Grep the codebase before editing any file — confirm the correct file path and routing from the routing map below
- Create a single-file component (`MediaContentModule.tsx`) — all 10 sports use the same component

### DO NOT:
- Use `localStorage`, `sessionStorage`, or any browser storage API
- Use HTML `<form>` tags — use `button onClick` handlers and controlled inputs
- Use any Supabase calls or API fetches — this is a pure static/interactive component
- Use real brand names for sponsors, press outlets, or broadcasters — see brand universe table
- Use pulse/flash animations on buttons — no red animation
- Override the Geist font — it inherits from root layout
- Push to main — commit to dev only, user will review and merge
- Run `deploy.sh` — use standard git merge flow

---

## Critical Routing Map (verify before editing)

| URL | File |
|---|---|
| `/golf/[slug]` | `src/app/(golf)/golf/[slug]/page.tsx` |
| `/tennis/[slug]` | `src/app/tennis/[slug]/page.tsx` |
| `/darts/[slug]` | `src/app/darts/[slug]/page.tsx` |
| `/boxing/[slug]` | `src/app/(boxing)/boxing/[slug]/page.tsx` |
| `/cricket/[slug]` | `src/app/cricket/[slug]/page.tsx` |
| `/rugby/[slug]` | `src/app/rugby/[slug]/page.tsx` |
| `/football/[slug]` | `src/app/(football)/football/[slug]/page.tsx` |
| `/womens/[slug]` | `src/app/womens/[slug]/page.tsx` |

**Rule:** Before writing any prompt editing a Lumio file, always state which URL the change affects and confirm the correct file from the routing map. Never target demo-workspace for changes visible at `/lumio-dev`. If unsure, grep first, change second.

---

## Execution Steps

### Step 1 — Discovery (grep first, do not edit yet)
- `grep -rn "Coming in Full Build" src/`
- `grep -rn "Media & Content" src/`
- `grep -rn "Statement Generator" src/`
- `grep -rn "Press & Media Log" src/`
- `grep -rn "Brand Usage Guidelines" src/`
- `grep -rn "Media Obligations" src/`

Map the current state for each of the 10 sports. Report which have placeholders, which have real content, which have partial content. Report how `isDemoShell` is detected on each page.

### Step 2 — Create the shared component + content data file
Build `MediaContentModule.tsx` and `media-content.ts` as specified above. Fully populate Golf content. Use TODO_DATA for other 9 sports.

### Step 3 — Wire into demo pages
Replace placeholders / existing content with `<MediaContentModule>` on each sport's page. For sports with existing content (Tennis, Boxing), extract and pass as `existingContent` prop.

### Step 4 — Verify
- TypeScript check: `npx tsc --noEmit`
- Trace `/golf/golf-demo` — full interactive module with Harrington content
- Trace `/tennis/tennis-demo` — module absorbing existing Statement Generator, Press Log, Brand Guidelines
- Trace at least one other sport — module with TODO placeholder content visible
- Confirm zero `localStorage` / `sessionStorage` usage in the module
- Confirm zero `<form>` tags
- Confirm tabs switch via `useState`
- Confirm at least one interaction per tab works (post schedule, obligation checkbox, interview prep ready)

### Step 5 — Report, commit, do NOT deploy
- Files created/touched
- Sport-by-sport coverage table (real content vs TODO)
- Any sports where existing content absorption had issues
- TypeScript clean confirmation
- Commit: `"feat: Media & Content module — interactive demo with Golf reference implementation"`

---

## After This Lands

Once Golf looks right in the browser:
1. Write content for the other 9 sports (separate pass, same persona-anchored approach)
2. Polish any absorbed content (Tennis Statement Generator, Boxing Media Obligations) to match the new tab layout
3. Consider extending the module to the `/app` routes for founding members (future sprint)

---

## Style Reference

The Marcus Cole (Boxing) AI Evening Summary is the gold-standard style reference for demo content voice. See the Boxing portal's Today tab for examples. Key characteristics:
- 5 items per summary
- Each item is 1–2 sentences
- Every item has a concrete time, name, or number
- Every item is actionable ("log today before 09:00", "book Dr Mitchell 09:00")
- Tone is confident and specific, not vague or hedging
