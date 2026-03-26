/**
 * PupilOverview.tsx
 *
 * Drop-in replacement for the sparse Overview tab on the pupil page.
 * Uses every field from the Pupil interface.
 *
 * USAGE:
 *   Replace the Overview tab content with:
 *   <PupilOverview pupil={pupil} assessments={assessments} />
 *
 * Matches your portal's existing colour palette (navy #0f1a2e, amber #f59e0b,
 * green #16a34a, warm grey backgrounds).
 */

import { useState } from "react";

// ── Types (copy from your existing types file) ──────────────────────────────
interface Pupil {
  id: number;
  name: string;
  year: string;
  dob: string;
  gender: "M" | "F";
  ethnicity: string;
  eal: boolean;
  fsm: boolean;
  pp: boolean;
  lac: boolean;
  youngCarer: boolean;
  sendStatus: "None" | "Monitoring" | "SEN Support" | "EHCP";
  sendNeed?: string;
  sendTier?: "Universal" | "Targeted" | "Targeted+" | "Specialist";
  ispStatus?: "Active" | "Draft" | "Review due";
  readingAge?: string;
  bookBand?: string;
  phonicsPhase?: string;
  mathsGroup?: string;
  attainment: "Above" | "Expected" | "Below";
  attendancePct: number;
  safeguardingFlag: boolean;
  cpStatus?: string;
  socialWorker?: string;
  medicalNotes?: string;
  dietary?: string;
  medication?: string;
  parent1: string;
  parent1Phone: string;
  parent2?: string;
  parent2Phone?: string;
  behaviourNotes?: string;
  passportSummary?: string;
  keyStrengths?: string[];
  supportStrategies?: string[];
  interventions?: string[];
  class: string;
  classTeacher: string;
}

interface Assessment {
  date: string;
  label: string;
  standardScore: number;
  percentile: number;
  band: "GREEN" | "AMBER" | "RED";
  subtestScores?: {
    label: string;
    raw: number;
    total: number;
    pctRaw: number;
  }[];
}

interface Props {
  pupil: Pupil;
  assessments?: Assessment[];
}

// ── Design tokens (matching your portal) ───────────────────────────────────
const T = {
  navy:     "#0f1a2e",
  navyMid:  "#1e3a5f",
  white:    "#ffffff",
  surface:  "#f7f8fc",
  border:   "#e2e8f0",
  slate:    "#64748b",
  slateLt:  "#f1f5f9",
  amber:    "#f59e0b",
  amberLt:  "#fef3c7",
  amberDk:  "#92400e",
  green:    "#16a34a",
  greenLt:  "#dcfce7",
  red:      "#dc2626",
  redLt:    "#fee2e2",
  violet:   "#7c3aed",
  violetLt: "#f3e8ff",
  teal:     "#0891b2",
  tealLt:   "#ecfeff",
  rose:     "#e11d48",
  roseLt:   "#fff1f2",
  orange:   "#ea580c",
  orangeLt: "#fff7ed",
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function calcAge(dob: string) {
  const b = new Date(dob), n = new Date();
  let y = n.getFullYear() - b.getFullYear(), mo = n.getMonth() - b.getMonth();
  if (mo < 0 || (mo === 0 && n.getDate() < b.getDate())) { y--; mo += 12; }
  return `${y}y ${mo}m`;
}

function attainmentColor(a: string) {
  if (a === "Above")    return { bg: T.greenLt,  color: T.green,  dot: T.green  };
  if (a === "Below")    return { bg: T.redLt,    color: T.red,    dot: T.red    };
                        return { bg: T.amberLt,  color: T.amberDk,dot: T.amber  };
}

function bandColor(b?: "GREEN" | "AMBER" | "RED") {
  if (b === "GREEN") return { bg: T.greenLt,  color: T.green,  dot: T.green  };
  if (b === "AMBER") return { bg: T.amberLt,  color: T.amberDk,dot: T.amber  };
  if (b === "RED")   return { bg: T.redLt,    color: T.red,    dot: T.red    };
                     return { bg: T.slateLt,  color: T.slate,  dot: T.slate  };
}

function sendColor(s: string) {
  if (s === "EHCP")       return { bg: T.roseLt,   color: T.rose   };
  if (s === "SEN Support")return { bg: T.orangeLt, color: T.orange };
  if (s === "Monitoring") return { bg: T.amberLt,  color: T.amberDk};
                          return { bg: T.slateLt,  color: T.slate  };
}

function attendanceColor(pct: number) {
  if (pct >= 96) return T.green;
  if (pct >= 90) return T.amber;
                 return T.red;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({
  title, icon, accent = T.navy, children,
}: { title: string; icon: string; accent?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: T.white, borderRadius: 14, border: `1px solid ${T.border}`,
      overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,.06)",
    }}>
      <div style={{
        padding: "12px 18px", borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", gap: 10,
        background: T.slateLt,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{
          fontSize: 13, fontWeight: 700, color: T.navy,
          letterSpacing: 0.3, textTransform: "uppercase",
        }}>{title}</span>
        <div style={{ marginLeft: "auto", width: 3, height: 20, borderRadius: 2, background: accent }} />
      </div>
      <div style={{ padding: "16px 18px" }}>{children}</div>
    </div>
  );
}

function Chip({
  label, bg, color, dot,
}: { label: string; bg: string; color: string; dot?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: bg, color, borderRadius: 6, padding: "3px 10px",
      fontSize: 12, fontWeight: 600,
    }}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />}
      {label}
    </span>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value?: string | number | null; mono?: boolean }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 13, color: T.slate }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: T.navy, fontFamily: mono ? "monospace" : "inherit" }}>
        {value}
      </span>
    </div>
  );
}

function ScoreBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: T.slate }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ background: T.slateLt, borderRadius: 6, height: 8, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 6, background: color, width: `${pct}%`, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

// Mini sparkline-style score journey
function ScoreJourney({ assessments }: { assessments: Assessment[] }) {
  if (!assessments?.length) return <p style={{ fontSize: 13, color: T.slate }}>No assessments recorded yet.</p>;

  const maxSS = 130, minSS = 50, h = 80;
  const w = Math.max(assessments.length * 80, 240);

  function y(ss: number) {
    return h - Math.round(((ss - minSS) / (maxSS - minSS)) * h);
  }

  const points = assessments.map((a, i) => ({ x: 40 + i * 80, y: y(a.standardScore), ...a }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={w} height={h + 40} viewBox={`0 0 ${w} ${h + 40}`} style={{ display: "block" }}>
        {/* Threshold lines */}
        {[{ ss: 90, label: "Green threshold", color: T.green }, { ss: 82, label: "Amber threshold", color: T.amber }].map(t => {
          const ty = y(t.ss);
          return (
            <g key={t.ss}>
              <line x1={20} y1={ty} x2={w - 10} y2={ty} stroke={t.color} strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
              <text x={w - 10} y={ty - 3} fontSize={9} fill={t.color} textAnchor="end">{t.label}</text>
            </g>
          );
        })}
        {/* Line */}
        {points.length > 1 && (
          <path d={pathD} fill="none" stroke={T.teal} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {/* Points */}
        {points.map((p, i) => {
          const bc = bandColor(p.band);
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={7} fill={bc.dot} stroke={T.white} strokeWidth={2} />
              <text x={p.x} y={p.y - 13} fontSize={11} fontWeight="700" fill={bc.color} textAnchor="middle">{p.standardScore}</text>
              <text x={p.x} y={h + 22} fontSize={10} fill={T.slate} textAnchor="middle">{p.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── DEMO DATA (replace with real pupil prop in your portal) ─────────────────
const DEMO_PUPIL: Pupil = {
  id: 1,
  name: "Amara Johnson",
  year: "Reception",
  dob: "2020-04-15",
  gender: "F",
  ethnicity: "Black African",
  eal: false,
  fsm: true,
  pp: true,
  lac: false,
  youngCarer: false,
  sendStatus: "SEN Support",
  sendNeed: "Speech, Language & Communication",
  sendTier: "Targeted",
  ispStatus: "Active",
  readingAge: "4y 2m",
  bookBand: "Pink",
  phonicsPhase: "Phase 3",
  mathsGroup: "Group B",
  attainment: "Below",
  attendancePct: 82,
  safeguardingFlag: false,
  medicalNotes: "Mild asthma — inhaler kept in medical room.",
  dietary: "No known allergies",
  parent1: "Fatima Johnson",
  parent1Phone: "07712 345678",
  parent2: "David Johnson",
  parent2Phone: "07823 456789",
  behaviourNotes: "Responds well to visual prompts and 1:1 praise. Can become frustrated when unable to communicate.",
  passportSummary: "Amara is a kind, creative child who loves art and outdoor play. She communicates best in small group settings.",
  keyStrengths: ["Visual learning", "Creative arts", "Positive relationships with peers", "Responds to structured routine"],
  supportStrategies: ["Visual timetable", "Makaton signs for key words", "Pre-teaching vocabulary", "Reduce verbal load — use visuals"],
  interventions: ["NELI (Nuffield Early Language Intervention)", "SALT weekly sessions", "Phonics booster group"],
  class: "Reception A",
  classTeacher: "Mrs Chen",
};

const DEMO_ASSESSMENTS: Assessment[] = [
  { date: "2024-09-10", label: "Autumn", standardScore: 62, percentile: 8,  band: "RED",   subtestScores: [{ label: "Exp. Vocab", raw: 3, total: 12, pctRaw: 25 }, { label: "Rec. Vocab", raw: 4, total: 10, pctRaw: 40 }, { label: "Listening", raw: 3, total: 8,  pctRaw: 38 }, { label: "Grammar",   raw: 2, total: 12, pctRaw: 17 }] },
  { date: "2025-02-14", label: "Spring", standardScore: 80, percentile: 15, band: "RED",   subtestScores: [{ label: "Exp. Vocab", raw: 6, total: 12, pctRaw: 50 }, { label: "Rec. Vocab", raw: 6, total: 10, pctRaw: 60 }, { label: "Listening", raw: 5, total: 8,  pctRaw: 63 }, { label: "Grammar",   raw: 4, total: 12, pctRaw: 33 }] },
];

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function PupilOverview({ pupil = DEMO_PUPIL, assessments = DEMO_ASSESSMENTS }: Props) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const latest   = assessments[assessments.length - 1];
  const previous = assessments.length > 1 ? assessments[assessments.length - 2] : null;
  const gain     = latest && previous ? latest.standardScore - previous.standardScore : null;
  const attC     = attainmentColor(pupil.attainment);
  const sendC    = sendColor(pupil.sendStatus);
  const attPct   = pupil.attendancePct;

  const flags = [
    pupil.fsm         && { label: "FSM",          bg: T.violetLt, color: T.violet },
    pupil.pp          && { label: "Pupil Premium", bg: T.violetLt, color: T.violet },
    pupil.eal         && { label: "EAL",           bg: T.tealLt,   color: T.teal   },
    pupil.lac         && { label: "LAC",           bg: T.roseLt,   color: T.rose   },
    pupil.youngCarer  && { label: "Young Carer",   bg: T.roseLt,   color: T.rose   },
  ].filter(Boolean) as { label: string; bg: string; color: string }[];

  // ── Layout ───────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Lexend Deca','Segoe UI',system-ui,sans-serif", padding: "20px 0" }}>

      {/* ── ROW 1: Flags + Quick Profile ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>

        {/* Profile Summary */}
        <SectionCard title="Pupil Profile" icon="🧒" accent={T.navy}>
          <InfoRow label="Date of Birth"   value={`${new Date(pupil.dob).toLocaleDateString("en-GB")} (${calcAge(pupil.dob)})`} />
          <InfoRow label="Gender"          value={pupil.gender === "F" ? "Female" : "Male"} />
          <InfoRow label="Ethnicity"       value={pupil.ethnicity} />
          <InfoRow label="Class"           value={pupil.class} />
          <InfoRow label="Class Teacher"   value={pupil.classTeacher} />
          <InfoRow label="Year Group"      value={pupil.year} />
          {flags.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {flags.map(f => <Chip key={f.label} label={f.label} bg={f.bg} color={f.color} />)}
            </div>
          )}
        </SectionCard>

        {/* Attendance */}
        <SectionCard title="Attendance" icon="📅" accent={attendanceColor(attPct)}>
          {/* Big number */}
          <div style={{ textAlign: "center", padding: "10px 0 14px" }}>
            <div style={{ fontSize: 52, fontWeight: 800, color: attendanceColor(attPct), lineHeight: 1 }}>
              {attPct}%
            </div>
            <div style={{ fontSize: 12, color: T.slate, marginTop: 6 }}>
              {attPct >= 96 ? "Good attendance" : attPct >= 90 ? "Attendance concern" : "Persistent absence"}
            </div>
          </div>
          {/* Bar */}
          <div style={{ background: T.slateLt, borderRadius: 8, height: 10, overflow: "hidden", marginBottom: 10 }}>
            <div style={{ height: "100%", borderRadius: 8, background: attendanceColor(attPct), width: `${attPct}%`, transition: "width 1s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.slate }}>
            <span>96%+ expected</span>
            <span style={{ color: attPct < 90 ? T.red : T.slate }}>
              {attPct < 90 ? "⚠ Persistent absence" : attPct < 96 ? "↓ Below target" : "✓ On track"}
            </span>
          </div>
        </SectionCard>

        {/* Attainment & Academic */}
        <SectionCard title="Academic Profile" icon="📚" accent={attC.dot}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Chip label={`Attainment: ${pupil.attainment}`} bg={attC.bg} color={attC.color} dot={attC.dot} />
          </div>
          <InfoRow label="Reading Age"     value={pupil.readingAge} />
          <InfoRow label="Book Band"       value={pupil.bookBand} />
          <InfoRow label="Phonics Phase"   value={pupil.phonicsPhase} />
          <InfoRow label="Maths Group"     value={pupil.mathsGroup} />
        </SectionCard>
      </div>

      {/* ── ROW 2: LanguageScreen Journey ────────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <SectionCard title="LanguageScreen — Score Journey" icon="🗣️" accent={T.teal}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}>
            {/* Journey chart */}
            <div>
              <ScoreJourney assessments={assessments} />
            </div>
            {/* Latest scores + subtest bars */}
            {latest && (
              <div style={{ minWidth: 220 }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: T.slate, marginBottom: 4, textTransform: "uppercase", letterSpacing: .6 }}>Latest Result · {latest.label}</div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 38, fontWeight: 800, color: bandColor(latest.band).dot, lineHeight: 1 }}>{latest.standardScore}</span>
                    <div>
                      <Chip label={latest.band} bg={bandColor(latest.band).bg} color={bandColor(latest.band).color} dot={bandColor(latest.band).dot} />
                      <div style={{ fontSize: 11, color: T.slate, marginTop: 4 }}>{latest.percentile}th percentile</div>
                    </div>
                    {gain !== null && (
                      <div style={{ marginLeft: "auto", fontSize: 22, fontWeight: 800, color: gain > 0 ? T.green : T.red }}>
                        {gain > 0 ? "+" : ""}{gain}
                      </div>
                    )}
                  </div>
                </div>
                {latest.subtestScores && (
                  <div>
                    <div style={{ fontSize: 11, color: T.slate, marginBottom: 8, textTransform: "uppercase", letterSpacing: .6 }}>Subtest Profile</div>
                    {latest.subtestScores.map((s, i) => {
                      const colors = [T.amber, T.violet, T.teal, T.rose];
                      return <ScoreBar key={s.label} label={s.label} pct={s.pctRaw} color={colors[i % colors.length]} />;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── ROW 3: SEND + Interventions + Wellbeing ──────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>

        {/* SEND */}
        <SectionCard title="SEN & SEND" icon="🎯" accent={sendC.color}>
          <div style={{ marginBottom: 12 }}>
            <Chip label={pupil.sendStatus} bg={sendC.bg} color={sendC.color} />
            {pupil.sendTier && <Chip label={`Tier: ${pupil.sendTier}`} bg={T.slateLt} color={T.slate} />}
          </div>
          <InfoRow label="Primary Need" value={pupil.sendNeed} />
          <InfoRow label="ISP Status"   value={pupil.ispStatus} />
          {pupil.passportSummary && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.slate, marginBottom: 6, textTransform: "uppercase", letterSpacing: .6 }}>Pupil Passport</div>
              <p style={{ margin: 0, fontSize: 13, color: T.navy, lineHeight: 1.6 }}>{pupil.passportSummary}</p>
            </div>
          )}
        </SectionCard>

        {/* Interventions */}
        <SectionCard title="Interventions" icon="⚡" accent={T.violet}>
          {pupil.interventions?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pupil.interventions.map((iv, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                  background: T.violetLt, borderRadius: 8, borderLeft: `3px solid ${T.violet}`,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.violet, flexShrink: 0 }}>#{i + 1}</span>
                  <span style={{ fontSize: 13, color: T.navy }}>{iv}</span>
                </div>
              ))}
            </div>
          ) : <p style={{ fontSize: 13, color: T.slate, margin: 0 }}>No active interventions.</p>}
        </SectionCard>

        {/* Wellbeing */}
        <SectionCard title="Wellbeing & Pastoral" icon="💛" accent={T.amber}>
          {pupil.keyStrengths?.length && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.slate, marginBottom: 8, textTransform: "uppercase", letterSpacing: .6 }}>Key Strengths</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {pupil.keyStrengths.map(s => (
                  <Chip key={s} label={s} bg={T.amberLt} color={T.amberDk} />
                ))}
              </div>
            </div>
          )}
          {pupil.behaviourNotes && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.slate, marginBottom: 6, textTransform: "uppercase", letterSpacing: .6 }}>Behaviour Notes</div>
              <p style={{ margin: 0, fontSize: 13, color: T.navy, lineHeight: 1.6 }}>{pupil.behaviourNotes}</p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── ROW 4: Support Strategies + Medical + Contact ────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>

        {/* Support Strategies */}
        <SectionCard title="Support Strategies" icon="🛠️" accent={T.teal}>
          {pupil.supportStrategies?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {pupil.supportStrategies.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ width: 20, height: 20, borderRadius: 5, background: T.tealLt, color: T.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: T.navy, lineHeight: 1.45 }}>{s}</span>
                </div>
              ))}
            </div>
          ) : <p style={{ fontSize: 13, color: T.slate, margin: 0 }}>No strategies recorded.</p>}
        </SectionCard>

        {/* Medical */}
        <SectionCard title="Medical & Dietary" icon="🏥" accent={T.red}>
          <InfoRow label="Medical Notes" value={pupil.medicalNotes} />
          <InfoRow label="Dietary Needs"  value={pupil.dietary} />
          <InfoRow label="Medication"     value={pupil.medication} />
          {!pupil.medicalNotes && !pupil.dietary && !pupil.medication && (
            <p style={{ fontSize: 13, color: T.slate, margin: 0 }}>No medical or dietary information recorded.</p>
          )}
        </SectionCard>

        {/* Contact */}
        <SectionCard title="Parent / Carer Contact" icon="📞" accent={T.navyMid}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.slate, marginBottom: 6, textTransform: "uppercase", letterSpacing: .6 }}>Primary Contact</div>
            <InfoRow label="Name"  value={pupil.parent1} />
            <InfoRow label="Phone" value={pupil.parent1Phone} mono />
          </div>
          {pupil.parent2 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.slate, marginBottom: 6, textTransform: "uppercase", letterSpacing: .6 }}>Secondary Contact</div>
              <InfoRow label="Name"  value={pupil.parent2} />
              <InfoRow label="Phone" value={pupil.parent2Phone} mono />
            </div>
          )}
          {pupil.socialWorker && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.rose, marginBottom: 6, textTransform: "uppercase", letterSpacing: .6 }}>Social Worker</div>
              <InfoRow label="Name" value={pupil.socialWorker} />
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── ROW 5: Safeguarding (only shown if flagged) ───────────────────── */}
      {(pupil.safeguardingFlag || pupil.cpStatus) && (
        <div style={{ marginBottom: 14 }}>
          <SectionCard title="Safeguarding" icon="🔒" accent={T.red}>
            <div style={{
              background: T.redLt, borderRadius: 10, padding: "12px 16px",
              border: `1.5px solid ${T.red}44`, display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 22 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: T.red, fontSize: 14, marginBottom: 4 }}>Safeguarding Flag Active</div>
                {pupil.cpStatus && <p style={{ margin: 0, fontSize: 13, color: T.navy }}>{pupil.cpStatus}</p>}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── AI Summary ───────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #fef9ee, #fffbf5)",
        border: `1.5px solid ${T.amber}44`,
        borderRadius: 14, padding: "16px 20px",
        display: "flex", gap: 14, alignItems: "flex-start",
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${T.amber}, ${T.amberDk})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
        }}>✨</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 6 }}>
            AI Summary — {pupil.name}
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: T.navy, lineHeight: 1.7 }}>
            {pupil.name} is a <strong>{pupil.attainment.toLowerCase()}</strong>-attaining pupil in {pupil.class} with{" "}
            <strong>{pupil.sendStatus}</strong> status for <em>{pupil.sendNeed || "SEND"}</em>.{" "}
            {latest && <>
              Their most recent LanguageScreen score of <strong>{latest.standardScore}</strong> ({latest.band} band,{" "}
              {latest.percentile}th percentile){" "}
              {gain !== null && gain > 0 ? `represents a gain of +${gain} points since the previous assessment, ` : ""}
              indicates they{" "}
              {latest.band === "RED" ? "require targeted language intervention." :
               latest.band === "AMBER" ? "may benefit from additional language support." :
               "are making good language progress."}
            </>}{" "}
            {pupil.interventions?.length ? `Active interventions include: ${pupil.interventions.join(", ")}.` : ""}{" "}
            {pupil.attendancePct < 90 ? `Attendance of ${pupil.attendancePct}% is a concern and may be impacting progress.` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
