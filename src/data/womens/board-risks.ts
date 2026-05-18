// Shared single source of truth for the Women's portal board-level risk register.
// Consumed by:
//   - WomensBoardSuiteView (Overview tab "Risk Register (board snapshot)"
//     and Governance tab "Risk Register" sub-tab, which renders snapshot
//     entries + additional entries).
//   - WomensInsightsView (CEO/Chairman tab — same snapshot, mirrored).
//
// Editing here changes both surfaces simultaneously. Any risk appearing on
// both Overview/CEO snapshot AND Governance full register has guaranteed
// identical wording, identical RAG rating, and uses the locked 72% / £260k
// wage-to-revenue / FSR-headroom figures established by the Board Suite.

export type BoardRiskLevel = 'High' | 'Medium' | 'Low'

export interface BoardRisk {
  risk: string
  level: BoardRiskLevel
  color: string
  mitigation: string
}

export const RISK_OVERVIEW_SNAPSHOT: readonly BoardRisk[] = [
  { risk: 'FSR breach if wage bill exceeds 80% cap',                level: 'Medium', color: '#F59E0B', mitigation: 'Currently 72% (£260k headroom) — monthly CFO review' },
  { risk: 'Two senior player contracts expire summer 2026',          level: 'High',   color: '#EF4444', mitigation: 'Renewal talks open — board approval required Jun' },
  { risk: 'Welfare Lead post unfilled — interim cover only',         level: 'High',   color: '#EF4444', mitigation: 'Shortlist of 3, final interviews w/c 26 May' },
  { risk: 'East terrace safety re-inspection due',                   level: 'Medium', color: '#F59E0B', mitigation: 'Inspection booked 7 Jun, contractor briefed' },
  { risk: 'Sponsorship pipeline thinner than budget for 26/27',      level: 'Medium', color: '#F59E0B', mitigation: 'Commercial Lead opening 4 new conversations Q2' },
] as const
