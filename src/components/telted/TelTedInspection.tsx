'use client'

import { useState } from 'react'
import { ClipboardList, Download, Printer, X, Loader2, CheckCircle2, ChevronRight, AlertTriangle, ShieldCheck, FileText, ChevronDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ReferenceLine, LineChart, Line } from 'recharts'
import { PUPILS, CLASSES, STAFF, neliPupils, neliAvgGain, classAvgI, classAvgE } from '@/components/neli/neliData'
import { C, Card, Stats, Pill, Narrative, Table, Actions, ChartTip, axis, trend, bandColor, bandSoft, bandLabel, SUBTESTS, sub, avg, gain, today, us, SCHOOL, DISTRICT, GRADE } from '@/components/telted/TelTedReports'

const P = PUPILS as any[]

// ─── Static inspection data (demo) ───────────────────────────────────────────
type Rag = 'red' | 'amber' | 'green'
const RAG_META: Record<Rag, { label: string; color: string; soft: string; desc: string }> = {
  green: { label: 'Green', color: C.green, soft: C.greenSoft, desc: 'Strong evidence available' },
  amber: { label: 'Amber', color: C.amber, soft: C.amberSoft, desc: 'Some evidence, needs strengthening' },
  red: { label: 'Red', color: C.red, soft: C.redSoft, desc: 'Immediate action required' },
}
const SELF_AREAS: { area: string; rating: Rag; owner: string; evidence: string[]; pack: string; action?: string }[] = [
  { area: 'Teaching Quality', rating: 'green', owner: 'H. Brooks', pack: 'lang', evidence: ['Manualised TEL Ted sessions delivered 3× group + 2× individual per week', 'Session fidelity 92% (TEL Ted Tracker)', 'Lesson observations Nov & Feb — both graded strong'] },
  { area: 'Student Progress', rating: 'green', owner: 'S. Mitchell', pack: 'progress', evidence: [`Cohort average ${classAvgI} → ${classAvgE} (+${(classAvgE - classAvgI).toFixed(1)})`, `TEL Ted students +${neliAvgGain} average gain`, `Students below 85 fell from ${P.filter(p => p.is < 85).length} to ${P.filter(p => p.es < 85).length}`] },
  { area: 'SEND Support', rating: 'amber', owner: 'D. Chen', pack: 'progress', evidence: ['5 students with language-related support plans, all on TEL Ted', 'One speech-language referral outstanding since October'], action: 'Chase SALT referral for Amara Johnson; add review dates to all plans' },
  { area: 'Staff Training', rating: 'amber', owner: 'D. Chen', pack: 'staff', evidence: ['3 of 4 delivery staff fully certified (all three OxEd modules)', 'J. Okafor — Module 3 outstanding'], action: 'Book Module 3 for J. Okafor before the May reassessment window' },
  { area: 'Data Management', rating: 'green', owner: 'S. Mitchell', pack: 'summary', evidence: ['100% LanguageScreen coverage, two assessment windows', 'MIS sync nightly; data encrypted at rest', 'FERPA/COPPA documentation on file'] },
  { area: 'Parent Engagement', rating: 'amber', owner: 'H. Brooks', pack: 'lang', evidence: ['Family newsletters and take-home cards every two weeks (English + Spanish)', 'Parent conference attendance 71% for TEL Ted families'], action: 'Offer phone/video slots for the three families who missed the spring conference' },
  { area: 'Safeguarding', rating: 'green', owner: 'D. Chen', pack: 'staff', evidence: ['Safeguarding policy reviewed Aug 2026', 'All staff completed annual refresher; background checks current'] },
]
const COMPLIANCE_ITEMS: { item: string; status: 'ok' | 'warn'; owner: string; reviewed: string; due: string; evidence: string }[] = [
  { item: 'FERPA compliant — student records access and disclosure', status: 'ok', owner: 'Principal', reviewed: 'Aug 12, 2026', due: 'Aug 2027', evidence: 'Data-sharing agreement with OxEd & Assessment; annual notice to families' },
  { item: 'COPPA compliant — under-13 digital assessment consent', status: 'ok', owner: 'D. Chen', reviewed: 'Aug 12, 2026', due: 'Aug 2027', evidence: 'Consent forms on file for all 28 students (LanguageScreen app)' },
  { item: 'Student data encrypted in transit and at rest', status: 'ok', owner: 'IT / Lumio', reviewed: 'Sep 1, 2026', due: 'Quarterly', evidence: 'Lumio Schools security statement; Supabase encryption at rest' },
  { item: 'Staff background checks current', status: 'warn', owner: 'D. Chen', reviewed: 'Sep 1, 2026', due: 'Oct 15, 2026', evidence: '3 of 4 current — J. Okafor renewal submitted, awaiting return' },
  { item: 'Safeguarding / child-protection policy current', status: 'ok', owner: 'D. Chen', reviewed: 'Aug 20, 2026', due: 'Aug 2027', evidence: 'Policy v7 signed by governing board' },
  { item: 'Annual safeguarding training refresh', status: 'warn', owner: 'D. Chen', reviewed: 'Sep 2025', due: 'Sep 30, 2026', evidence: 'Refresher scheduled Sep 24 — 2 staff still to complete' },
  { item: 'TEL Ted programme documentation complete', status: 'ok', owner: 'S. Mitchell', reviewed: 'Sep 2, 2026', due: 'Termly', evidence: 'Teacher Guides Parts 1 & 2, session records, timeline, progress sheets' },
]
const MOCK_QUESTIONS: { q: string; answer: string; evidence: string[]; rating: 'Outstanding' | 'Good' | 'Requires Improvement'; pack: string }[] = [
  { q: 'How do you identify students with language difficulties?', rating: 'Good', pack: 'lang', answer: `Every ${GRADE} student is screened with LanguageScreen in the first four weeks. Students scoring below 90 are reviewed with the class teacher and SENCO, cross-referenced with the support register and teacher observation, and selected for TEL Ted: NELI Intervention using the standardised protocol.`, evidence: ['LanguageScreen September results — 100% coverage', 'Selection meeting notes, Sept 26', 'Support register'] },
  { q: 'What impact has the TEL Ted programme had on student outcomes?', rating: 'Outstanding', pack: 'progress', answer: `TEL Ted students have gained +${neliAvgGain} standard score points on average, ${(neliAvgGain / Math.max(avg(P.filter(p => !p.neli).map(gain)), 0.1)).toFixed(1)}× the rate of their peers, and the cohort average rose from ${classAvgI} to ${classAvgE}. The disadvantage gap narrowed by ${Math.round((1 - (avg(P.filter(p => !p.fsm).map(p => p.es)) - avg(P.filter(p => p.fsm).map(p => p.es))) / (avg(P.filter(p => !p.fsm).map(p => p.is)) - avg(P.filter(p => p.fsm).map(p => p.is)))) * 100)}%.`, evidence: ['End of Term Summary report', 'Class Dashboard — Sept vs now', 'Subgroup gap analysis'] },
  { q: 'How do you ensure interventions are delivered consistently?', rating: 'Good', pack: 'staff', answer: 'Sessions follow the manualised Teacher Guides. Every session is logged in the TEL Ted Tracker with attendance and fidelity checks; the coordinator reviews the log weekly and observes one session per fortnight.', evidence: ['TEL Ted Tracker session logs (92% fidelity)', 'Coordinator observation notes', 'Staff timetable'] },
  { q: "How are parents informed about their child's progress?", rating: 'Requires Improvement', pack: 'lang', answer: 'Families of TEL Ted students receive newsletters and take-home cards every two weeks in English and Spanish, and a Parent Communication Report at each conference. Attendance at spring conferences was 71%, so we are adding phone and video slots.', evidence: ['Family newsletters (English/Spanish)', 'Parent Communication Reports', 'Conference attendance log'] },
  { q: 'What training have staff received to deliver the programme?', rating: 'Good', pack: 'staff', answer: 'All four delivery staff completed OxEd Modules 1 and 2; three have completed Module 3 (CPD-certified). Module 3 is booked for the remaining teaching assistant. Safeguarding refresher training is annual.', evidence: ['OxEd CPD certificates', 'Training matrix', 'CPD hours log'] },
  { q: 'How do you use assessment data to adapt provision?', rating: 'Good', pack: 'summary', answer: 'Subtest analysis identified Receptive Vocabulary as the weakest strand, so whole-class slides and songs were front-loaded for vocabulary. Students with a single weak subtest are monitored and reassessed in the May window.', evidence: ['Subtest Analysis report', 'Cohort At-Risk report', 'Reassessment schedule'] },
  { q: 'How do you safeguard student data in digital assessment?', rating: 'Good', pack: 'summary', answer: 'LanguageScreen runs under a signed data-sharing agreement; consent is held for every student under COPPA; data is encrypted in transit and at rest and synced nightly to the MIS with role-based access.', evidence: ['FERPA/COPPA documentation', 'Consent forms', 'Lumio security statement'] },
]
const RATING_COLOR: Record<string, string> = { Outstanding: C.green, Good: C.blue, 'Requires Improvement': C.amber }

// staff training detail (demo)
const TRAINING = STAFF.map((s, i) => ({
  ...s,
  role: s.role.replace('NELI', 'TEL Ted'),
  m1: ['Sep 8, 2025', 'Sep 8, 2025', 'Sep 15, 2025', 'Sep 8, 2025'][i],
  m2: [true, true, false, true][i] ? ['Oct 6, 2025', 'Oct 6, 2025', '', 'Oct 13, 2025'][i] : '',
  m3: [true, false, false, true][i] ? ['Nov 17, 2025', '', '', 'Nov 17, 2025'][i] : '',
  cpd: [18, 12, 6, 18][i],
  safeguarding: ['Sep 24, 2026 (booked)', 'Sep 3, 2026', 'Sep 3, 2026', 'Sep 3, 2026'][i],
  check: ['Current', 'Renewal pending', 'Current', 'Current'][i],
  observed: ['Nov 12, Feb 4', 'Nov 12', '—', 'Feb 4'][i],
}))

// ─── Document viewer ─────────────────────────────────────────────────────────
function DocViewer({ title, subtitle, cat, onClose, children }: { title: string; subtitle: string; cat: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', overflowY: 'auto', padding: '24px 16px' }} onClick={onClose}>
      <style>{`@media print { .telted-doc-chrome { display:none !important } .telted-doc { position: static !important; background:#fff !important; } }`}</style>
      <div className="telted-doc" style={{ width: 960, maxWidth: '100%', background: '#07080F', border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, alignSelf: 'flex-start' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 18, paddingBottom: 14, borderBottom: `2px solid ${C.border}` }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>🐻 TEL Ted · {cat}</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0, fontFamily: 'Georgia, serif' }}>{title}</h2>
            <p style={{ fontSize: 11, color: C.dim, margin: '4px 0 0' }}>{subtitle}</p>
          </div>
          <div className="telted-doc-chrome" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, cursor: 'pointer' }}><Printer size={13} /> Print</button>
            <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '8px 14px', borderRadius: 8, border: 'none', background: C.teal, color: '#fff', cursor: 'pointer' }}><Download size={13} /> Download PDF</button>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
          </div>
        </div>
        {children}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 8, fontSize: 10, color: C.faint }}>
          Generated by <strong style={{ color: C.dim }}>Lumio Schools</strong> · OxEd & Assessment · TEL Ted Program · {SCHOOL} · {today()} · Confidential — for inspection and district use
        </div>
      </div>
    </div>
  )
}
function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <h3 style={{ fontSize: 14, fontWeight: 800, color: C.text, margin: '18px 0 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 24, height: 24, borderRadius: 7, background: C.tealSoft, color: C.teal, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>{title}
      </h3>
      {children}
    </div>
  )
}

// ─── Pack 1: Language & Literacy Evidence Pack ───────────────────────────────
function LangPack() {
  const fsm = P.filter(p => p.fsm), non = P.filter(p => !p.fsm)
  const neliAvgI = avg(neliPupils.map((p: any) => p.is)), neliAvgE = avg(neliPupils.map((p: any) => p.es))
  const t = trend(classAvgI, classAvgE).map((d, i) => ({ ...d, neli: trend(neliAvgI, neliAvgE)[i].v }))
  const subs = SUBTESTS.map(s => ({ name: s.short, All: avg(P.map(p => sub(p, s.key))), 'TEL Ted': avg(neliPupils.map((p: any) => sub(p, s.key))) }))
  return (
    <>
      <Narrative>This pack evidences {SCHOOL}’s early oral-language provision for the {GRADE} cohort: universal screening, targeted intervention through TEL Ted: NELI (EEF 5/5 evidence rating), and measured impact on outcomes and equity. All data is drawn from LanguageScreen and the TEL Ted Tracker as at {today()}.</Narrative>
      <Section n={1} title="Identification and screening">
        <Stats items={[{ l: 'Students screened', v: `${P.length}/${P.length}`, c: C.green, s: 'Sept window' }, { l: 'Below threshold (Sept)', v: P.filter(p => p.is < 90).length, c: C.amber, s: 'Score < 90' }, { l: 'Selected for TEL Ted', v: neliPupils.length, c: C.gold }, { l: 'Reassessed', v: `${P.length}/${P.length}`, c: C.green, s: 'Spring window' }]} />
        <Card><p style={{ fontSize: 12, color: C.body, margin: 0, lineHeight: 1.7 }}>Screening uses LanguageScreen (University of Oxford), a standardised app-based assessment of receptive vocabulary, expressive vocabulary, sentence repetition and listening comprehension (mean 100, SD 15). Students below 90 were reviewed by the class teacher and SENCO against the support register; the five lowest-scoring students with no competing explanation were selected for the 20-week intervention.</p></Card>
      </Section>
      <Section n={2} title="Cohort outcomes">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card title="Average standard score" sub="September to now">
            <ResponsiveContainer width="100%" height={190}><AreaChart data={t} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="month" tick={axis} /><YAxis domain={[65, 105]} tick={axis} /><Tooltip content={<ChartTip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><ReferenceLine y={90} stroke={C.red} strokeDasharray="5 3" /><Area type="monotone" dataKey="v" name="All students" stroke={C.blue} fill={C.blue} fillOpacity={0.12} strokeWidth={2} /><Area type="monotone" dataKey="neli" name="TEL Ted" stroke={C.gold} fill={C.gold} fillOpacity={0.12} strokeWidth={2} /></AreaChart></ResponsiveContainer>
          </Card>
          <Card title="Subtest averages" sub="All students vs TEL Ted students">
            <ResponsiveContainer width="100%" height={190}><BarChart data={subs} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="name" tick={axis} /><YAxis domain={[60, 110]} tick={axis} /><Tooltip content={<ChartTip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><ReferenceLine y={90} stroke={C.red} strokeDasharray="5 3" /><Bar dataKey="All" fill={C.blue} radius={[3, 3, 0, 0]} /><Bar dataKey="TEL Ted" fill={C.gold} radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
          </Card>
        </div>
        <Card title="Band movement and subgroups">
          <Table head={['Measure', 'September', 'Now', 'Change']} rows={[
            ['Cohort average', classAvgI, <strong style={{ color: C.teal }}>{classAvgE}</strong>, <span style={{ color: C.green, fontWeight: 700 }}>+{(classAvgE - classAvgI).toFixed(1)}</span>],
            ['TEL Ted students average', neliAvgI, <strong style={{ color: C.gold }}>{neliAvgE}</strong>, <span style={{ color: C.green, fontWeight: 700 }}>+{neliAvgGain}</span>],
            ['Students below 85', P.filter(p => p.is < 85).length, P.filter(p => p.es < 85).length, <span style={{ color: C.green, fontWeight: 700 }}>{P.filter(p => p.es < 85).length - P.filter(p => p.is < 85).length}</span>],
            ['Students 90+', P.filter(p => p.is >= 90).length, P.filter(p => p.es >= 90).length, <span style={{ color: C.green, fontWeight: 700 }}>+{P.filter(p => p.es >= 90).length - P.filter(p => p.is >= 90).length}</span>],
            ['Economically disadvantaged (avg)', avg(fsm.map(p => p.is)), avg(fsm.map(p => p.es)), <span style={{ color: C.green, fontWeight: 700 }}>+{(avg(fsm.map(p => p.es)) - avg(fsm.map(p => p.is))).toFixed(1)}</span>],
            ['Disadvantage gap', (avg(non.map(p => p.is)) - avg(fsm.map(p => p.is))).toFixed(1), (avg(non.map(p => p.es)) - avg(fsm.map(p => p.es))).toFixed(1), <span style={{ color: C.green, fontWeight: 700 }}>−{((avg(non.map(p => p.is)) - avg(fsm.map(p => p.is))) - (avg(non.map(p => p.es)) - avg(fsm.map(p => p.es)))).toFixed(1)}</span>],
            ['English learners (avg)', avg(P.filter(p => p.eal).map(p => p.is)), avg(P.filter(p => p.eal).map(p => p.es)), <span style={{ color: C.green, fontWeight: 700 }}>+{(avg(P.filter(p => p.eal).map(p => p.es)) - avg(P.filter(p => p.eal).map(p => p.is))).toFixed(1)}</span>],
          ]} />
        </Card>
      </Section>
      <Section n={3} title="Intervention records">
        <Card title="TEL Ted: NELI Intervention — delivery log summary" sub="Three group and two individual sessions per week, 20-week programme">
          <Table head={['Student', 'Class', 'Interventionist', 'Week', 'Sessions', 'Fidelity', 'Sept', 'Now', 'Gain', 'Band']} rows={neliPupils.map((p: any) => [
            <strong style={{ color: C.text }}>{p.name}</strong>, p.class, p.interventionist, `${p.neliWeek}/20`, `${p.neliSessions}/${p.neliExpected}`, <span style={{ color: p.neliSessions / p.neliExpected >= 0.9 ? C.green : C.amber, fontWeight: 700 }}>{Math.round(p.neliSessions / p.neliExpected * 100)}%</span>, p.is, <strong style={{ color: bandColor(p.es) }}>{p.es}</strong>, <span style={{ color: C.green, fontWeight: 700 }}>+{gain(p)}</span>, <Pill color={bandColor(p.es)} soft={bandSoft(p.es)}>{bandLabel(p.es)}</Pill>,
          ])} />
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card title="Programme materials in use">
            <Table head={['Resource', 'Source']} rows={[['Teacher Guides Parts 1 & 2 (127 + 118 pp)', 'OxEd portal'], ['Flashcards Parts 1 & 2', 'OxEd portal'], ['Group session breakdowns, PEER / CROWD techniques', 'OxEd portal'], ['Phonology activities (beginning, blending, segmenting)', 'OxEd portal'], ['Progress & record sheets', 'OxEd portal'], ['Whole Class slides, songs, stories', 'OxEd portal']]} />
          </Card>
          <Card title="Family engagement">
            <Table head={['Activity', 'Frequency', 'Reach']} rows={[['Family newsletters (English + Spanish)', 'Every two weeks', '5/5 families'], ['Take-home vocabulary cards', 'Every two weeks', '5/5 families'], ['Parent Communication Report', 'Each conference', '5/5 generated'], ['Spring parent conference', 'Termly', '71% attended'], ['Certificate of achievement', 'Programme end', 'Planned — May']]} />
          </Card>
        </div>
      </Section>
      <Actions title="Next steps" items={['Complete Weeks 18–20 and reassess all TEL Ted students in the May LanguageScreen window.', 'Chase the outstanding speech-language referral (Amara Johnson).', 'Roll TEL Ted: Whole Class to Kindergarten A from spring break.', 'Add phone/video conference slots to lift family engagement above 90%.']} />
    </>
  )
}

// ─── Pack 2: Student Progress Pack ───────────────────────────────────────────
function ProgressPack() {
  return (
    <>
      <Narrative>Individual profiles for the {neliPupils.length} students on TEL Ted: NELI Intervention — scores, trajectory, subtest profile, support plan and next steps. Names should be redacted before external circulation; inspectors may view originals on site.</Narrative>
      <Stats items={[{ l: 'Students', v: neliPupils.length, c: C.gold }, { l: 'Avg gain', v: `+${neliAvgGain}`, c: C.green }, { l: 'Now on track', v: neliPupils.filter((p: any) => p.es >= 90).length, c: C.green }, { l: 'Still below 85', v: neliPupils.filter((p: any) => p.es < 85).length, c: C.red }, { l: 'Avg fidelity', v: `${Math.round(neliPupils.reduce((s: number, p: any) => s + p.neliSessions / p.neliExpected, 0) / neliPupils.length * 100)}%`, c: C.teal }]} />
      {neliPupils.map((p: any, i: number) => {
        const traj = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map((m, k) => ({ month: m, score: Math.round((p.is + gain(p) * (k / 6)) * 10) / 10 }))
        const cls = CLASSES.find(c => c.id === p.class)
        return (
          <Section key={p.id} n={i + 1} title={`${p.name} — ${cls?.name.replace('Reception', 'Kindergarten')}`}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
              <Card>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  <Pill color={bandColor(p.es)} soft={bandSoft(p.es)}>{bandLabel(p.es)} · {p.es}</Pill><Pill color={C.gold}>Week {p.neliWeek}/20 · {p.neliSessions}/{p.neliExpected} sessions</Pill>
                  {p.fsm && <Pill color={C.blue}>Economically disadvantaged</Pill>}{p.eal && <Pill color={C.purple}>English learner</Pill>}{p.sen?.status !== 'None' && <Pill color={C.amber}>{p.sen.status}</Pill>}
                </div>
                <p style={{ fontSize: 12, color: C.body, lineHeight: 1.7, margin: '0 0 10px' }}>{us(p.notes).replace(/NELI/g, 'TEL Ted')}</p>
                <Table head={['Subtest', 'Score', 'Band']} rows={SUBTESTS.map(s => [s.name, <strong style={{ color: bandColor(sub(p, s.key)) }}>{sub(p, s.key)}</strong>, <Pill color={bandColor(sub(p, s.key))} soft={bandSoft(sub(p, s.key))}>{bandLabel(sub(p, s.key))}</Pill>])} />
              </Card>
              <div>
                <Card title="Trajectory" sub={`${p.is} → ${p.es} (+${gain(p)})`}>
                  <ResponsiveContainer width="100%" height={120}><LineChart data={traj} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="month" tick={axis} /><YAxis domain={[55, 100]} tick={axis} /><ReferenceLine y={90} stroke={C.red} strokeDasharray="5 3" /><Line type="monotone" dataKey="score" name="Score" stroke={C.teal} strokeWidth={2.5} dot={{ r: 2 }} /></LineChart></ResponsiveContainer>
                </Card>
                <Card title="Support plan">
                  <Table head={['Item', 'Detail']} rows={[['Status', p.sen.status], ['Plan', p.sen.plan || '—'], ['Adjustments', (p.sen.adjustments || []).join(', ') || '—'], ['Attendance', `${p.attendance}%`], ['Interventionist', p.interventionist], ['Next review', p.senDetail?.nextReview || 'May 2027']]} />
                </Card>
              </div>
            </div>
            <Card title="Next steps"><ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: C.body, lineHeight: 1.8 }}>{p.nextSteps.map((s: string, k: number) => <li key={k}>{us(s).replace(/NELI programme/g, 'TEL Ted programme').replace(/parent newsletter/g, 'family newsletter')}</li>)}</ol></Card>
          </Section>
        )
      })}
    </>
  )
}

// ─── Pack 3: Staff Training Records ──────────────────────────────────────────
function StaffPack() {
  const full = TRAINING.filter(t => t.m1 && t.m2 && t.m3).length
  return (
    <>
      <Narrative>Training, certification and safeguarding records for staff delivering TEL Ted at {SCHOOL}. OxEd & Assessment training is CPD-certified in three modules: Module 1 (Programme & LanguageScreen), Module 2 (Delivering group and individual sessions), Module 3 (Narrative, phonology and progress monitoring).</Narrative>
      <Stats items={[{ l: 'Delivery staff', v: TRAINING.length, c: C.blue }, { l: 'Fully certified', v: `${full}/${TRAINING.length}`, c: full === TRAINING.length ? C.green : C.amber }, { l: 'CPD hours logged', v: TRAINING.reduce((s, t) => s + t.cpd, 0), c: C.teal }, { l: 'Safeguarding current', v: `${TRAINING.filter(t => !t.safeguarding.includes('booked')).length}/${TRAINING.length}`, c: C.amber }, { l: 'Background checks', v: `${TRAINING.filter(t => t.check === 'Current').length}/${TRAINING.length}`, c: C.amber }]} />
      <Section n={1} title="TEL Ted certification matrix">
        <Card><Table head={['Staff member', 'Role', 'Module 1', 'Module 2', 'Module 3', 'CPD hrs', 'Status']} rows={TRAINING.map(t => [
          <strong style={{ color: C.text }}>{t.name}</strong>, t.role,
          ...[t.m1, t.m2, t.m3].map(d => d ? <span style={{ color: C.green, fontWeight: 600 }}>✓ {d}</span> : <span style={{ color: C.amber, fontWeight: 600 }}>Outstanding</span>),
          t.cpd, (t.m1 && t.m2 && t.m3) ? <Pill color={C.green} soft={C.greenSoft}>Certified</Pill> : <Pill color={C.amber} soft={C.amberSoft}>In progress</Pill>,
        ])} /></Card>
      </Section>
      <Section n={2} title="Safeguarding and vetting">
        <Card><Table head={['Staff member', 'Safeguarding refresher', 'Background check', 'Session observations', 'Notes']} rows={TRAINING.map(t => [
          <strong style={{ color: C.text }}>{t.name}</strong>,
          <span style={{ color: t.safeguarding.includes('booked') ? C.amber : C.green }}>{t.safeguarding}</span>,
          <span style={{ color: t.check === 'Current' ? C.green : C.amber, fontWeight: 600 }}>{t.check}</span>,
          t.observed, <span style={{ fontSize: 11, color: C.muted }}>{t.check !== 'Current' ? 'Renewal submitted Aug 28; supervised delivery until returned' : t.safeguarding.includes('booked') ? 'Attending Sep 24 refresher' : '—'}</span>,
        ])} /></Card>
      </Section>
      <Section n={3} title="Training programme and CPD log">
        <Card><Table head={['Date', 'Event', 'Provider', 'Attendees', 'Hours']} rows={[
          ['Sep 8, 2025', 'Module 1 — Programme overview & LanguageScreen administration', 'OxEd & Assessment', '4', '6'],
          ['Oct 6, 2025', 'Module 2 — Delivering group and individual sessions', 'OxEd & Assessment', '3', '6'],
          ['Nov 17, 2025', 'Module 3 — Narrative, phonology and progress monitoring', 'OxEd & Assessment', '2', '6'],
          ['Jan 14, 2026', 'Coordinator network: data review & fidelity clinic', 'OxEd & Assessment', '1', '2'],
          ['Sep 3, 2026', 'Annual safeguarding refresher', 'District', '3', '3'],
          ['Sep 24, 2026', 'Annual safeguarding refresher (make-up)', 'District', '1 (booked)', '3'],
          ['Oct 2026', 'Module 3 — J. Okafor (booked)', 'OxEd & Assessment', '1', '6'],
        ]} /></Card>
      </Section>
      <Actions items={['Complete Module 3 for J. Okafor (booked October) to reach 4/4 fully certified.', 'Confirm return of the pending background-check renewal; maintain supervised delivery until then.', 'Ensure S. Mitchell attends the Sep 24 safeguarding make-up session.', 'Schedule a spring observation for J. Okafor to complete the observation cycle.']} />
    </>
  )
}

// ─── Pack 4: State Inspection Summary ────────────────────────────────────────
function SummaryPack({ ratings }: { ratings: Record<string, Rag> }) {
  const greens = Object.values(ratings).filter(r => r === 'green').length
  const compliant = COMPLIANCE_ITEMS.filter(c => c.status === 'ok').length
  const fsm = P.filter(p => p.fsm), non = P.filter(p => !p.fsm)
  const gapI = avg(non.map(p => p.is)) - avg(fsm.map(p => p.is)), gapE = avg(non.map(p => p.es)) - avg(fsm.map(p => p.es))
  return (
    <>
      <Narrative>Executive summary for district and state inspection. {SCHOOL} operates a systematic early oral-language strategy in {GRADE}: universal screening with LanguageScreen, targeted intervention through TEL Ted: NELI (EEF 5/5), trained and certified staff, and measurable, equity-focused impact. Self-assessment stands at {greens}/{Object.keys(ratings).length} green; compliance at {compliant}/{COMPLIANCE_ITEMS.length} with two items scheduled for closure this month.</Narrative>
      <Stats items={[{ l: 'Screening coverage', v: '100%', c: C.green }, { l: 'Cohort gain', v: `+${(classAvgE - classAvgI).toFixed(1)}`, c: C.teal }, { l: 'TEL Ted gain', v: `+${neliAvgGain}`, c: C.gold }, { l: 'Gap reduction', v: `${Math.round((1 - gapE / gapI) * 100)}%`, c: C.green }, { l: 'Self-assessment', v: `${greens}/7`, c: greens >= 5 ? C.green : C.amber }, { l: 'Compliance', v: `${compliant}/7`, c: C.amber }]} />
      <Section n={1} title="Programme overview">
        <Card><Table head={['Element', 'Detail']} rows={[['Programme', 'TEL Ted — US adaptation of the Nuffield Early Language Intervention (NELI), OxEd & Assessment / University of Oxford'], ['Evidence base', 'EEF 5/5 rating; +3 months additional progress in two RCTs; 20-week manualised programme'], ['Cohort', `${P.length} ${GRADE} students across ${CLASSES.length} classes; ${neliPupils.length} on targeted intervention`], ['Assessment', 'LanguageScreen (4 subtests, standard scores) — September and spring windows'], ['Delivery', '3 group + 2 individual sessions per week; TEL Ted Tracker logs attendance and fidelity'], ['Staffing', `${STAFF.length} delivery staff; ${TRAINING.filter(t => t.m1 && t.m2 && t.m3).length} fully certified; coordinator S. Mitchell`]]} /></Card>
      </Section>
      <Section n={2} title="Impact summary">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card title="Standard score bands" sub="Students by band, Sept vs now">
            <ResponsiveContainer width="100%" height={180}><BarChart data={[{ band: 'Needs support', Sept: P.filter(p => p.is < 85).length, Now: P.filter(p => p.es < 85).length }, { band: 'Monitor', Sept: P.filter(p => p.is >= 85 && p.is < 90).length, Now: P.filter(p => p.es >= 85 && p.es < 90).length }, { band: 'On track', Sept: P.filter(p => p.is >= 90).length, Now: P.filter(p => p.es >= 90).length }]} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="band" tick={axis} /><YAxis tick={axis} allowDecimals={false} /><Tooltip content={<ChartTip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="Sept" fill={C.faint} radius={[3, 3, 0, 0]} /><Bar dataKey="Now" fill={C.teal} radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
          </Card>
          <Card title="Key metrics">
            <Table head={['Metric', 'Value']} rows={[['Cohort average (Sept → now)', `${classAvgI} → ${classAvgE}`], ['TEL Ted students average gain', `+${neliAvgGain} (vs +${avg(P.filter(p => !p.neli).map(gain))} peers)`], ['Students below 85', `${P.filter(p => p.is < 85).length} → ${P.filter(p => p.es < 85).length}`], ['Disadvantage gap', `${gapI.toFixed(1)} → ${gapE.toFixed(1)} points`], ['Delivery fidelity', `${Math.round(neliPupils.reduce((s: number, p: any) => s + p.neliSessions / p.neliExpected, 0) / neliPupils.length * 100)}%`], ['Family reach (TEL Ted)', '5/5 families, materials in English and Spanish']]} />
          </Card>
        </div>
      </Section>
      <Section n={3} title="Self-assessment (RAG)">
        <Card><Table head={['Area', 'Rating', 'Owner', 'Headline evidence', 'Action']} rows={SELF_AREAS.map(a => { const r = ratings[a.area] || a.rating; return [<strong style={{ color: C.text }}>{a.area}</strong>, <Pill color={RAG_META[r].color} soft={RAG_META[r].soft}>{RAG_META[r].label}</Pill>, a.owner, <span style={{ fontSize: 11 }}>{a.evidence[0]}</span>, <span style={{ fontSize: 11, color: C.muted }}>{a.action || '—'}</span>] })} /></Card>
      </Section>
      <Section n={4} title="Compliance">
        <Card><Table head={['Item', 'Status', 'Owner', 'Last reviewed', 'Next due']} rows={COMPLIANCE_ITEMS.map(c => [<span style={{ color: C.text }}>{c.item}</span>, c.status === 'ok' ? <Pill color={C.green} soft={C.greenSoft}>Compliant</Pill> : <Pill color={C.amber} soft={C.amberSoft}>Action due</Pill>, c.owner, c.reviewed, c.due])} /></Card>
      </Section>
      <Section n={5} title="Evidence appendix">
        <Card><Table head={['Ref', 'Document', 'Location']} rows={[['A', 'Language & Literacy Evidence Pack', 'Inspection Mode → Evidence Packs'], ['B', 'Student Progress Pack (5 profiles)', 'Inspection Mode → Evidence Packs'], ['C', 'Staff Training Records', 'Inspection Mode → Evidence Packs'], ['D', 'End of Term Summary, Subtest Analysis, Class Dashboard, SVoR', 'Reports tab'], ['E', 'TEL Ted Tracker session logs', 'LanguageScreen & TEL TED tab'], ['F', 'OxEd CPD certificates, consent forms, policies', 'School office (paper)']]} /></Card>
      </Section>
      <Actions title="Priority actions before inspection" items={SELF_AREAS.filter(a => a.action).map(a => `${a.area}: ${a.action}`).concat(COMPLIANCE_ITEMS.filter(c => c.status === 'warn').map(c => `Compliance: ${c.evidence}`))} />
    </>
  )
}

// ─── Mock inspection report ──────────────────────────────────────────────────
function MockReport() {
  const counts = { Outstanding: MOCK_QUESTIONS.filter(q => q.rating === 'Outstanding').length, Good: MOCK_QUESTIONS.filter(q => q.rating === 'Good').length, 'Requires Improvement': MOCK_QUESTIONS.filter(q => q.rating === 'Requires Improvement').length }
  return (
    <>
      <Stats items={[{ l: 'Overall judgement', v: 'Good', c: C.blue }, { l: 'Outstanding', v: counts.Outstanding, c: C.green }, { l: 'Good', v: counts.Good, c: C.blue }, { l: 'Requires improvement', v: counts['Requires Improvement'], c: C.amber }]} />
      <Narrative accent={C.blue}>Mock inspection conducted against {MOCK_QUESTIONS.length} standard lines of enquiry for early language provision. Overall judgement: <strong style={{ color: C.text }}>Good</strong>, with impact on outcomes judged Outstanding. One area — parent communication — requires improvement; the action is already scheduled and should lift the judgement to Good by the next review.</Narrative>
      {MOCK_QUESTIONS.map((m, i) => (
        <Card key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Q{i + 1}. {m.q}</h4><Pill color={RATING_COLOR[m.rating]}>{m.rating}</Pill>
          </div>
          <p style={{ fontSize: 12, color: C.body, lineHeight: 1.7, margin: '8px 0' }}><strong style={{ color: C.dim }}>Model answer — </strong>{m.answer}</p>
          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}><strong style={{ color: C.dim }}>Evidence: </strong>{m.evidence.join(' · ')}</p>
        </Card>
      ))}
      <Actions title="Actions from mock inspection" items={['Add phone/video conference options and re-run the parent engagement measure before the next review.', 'Complete Module 3 certification for the remaining teaching assistant.', 'Keep session fidelity above 90% through Week 20 and document the May reassessment.', 'Rehearse Q2 and Q6 with the coordinator using the End of Term and Subtest reports on screen.']} />
    </>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
const PACKS = [
  { id: 'lang', title: 'Language & Literacy Evidence Pack', desc: 'TEL Ted impact data, assessment scores, intervention records', icon: '📖', pages: 8, last: 'Mar 10, 2026', contents: ['Identification & screening', 'Cohort outcomes & subgroup gaps', 'Intervention delivery log', 'Materials & family engagement'] },
  { id: 'progress', title: 'Student Progress Pack', desc: 'Individual profiles, score trajectories, support plans', icon: '📈', pages: 12, last: 'Mar 14, 2026', contents: [`${neliPupils.length} student profiles`, 'Trajectory & subtest scores', 'Support plans & adjustments', 'Next steps per student'] },
  { id: 'staff', title: 'Staff Training Records', desc: 'CPD logs, TEL Ted certification, safeguarding training', icon: '🎓', pages: 5, last: 'Mar 2, 2026', contents: ['Certification matrix (3 modules)', 'Safeguarding & background checks', 'Observation cycle', 'CPD log'] },
  { id: 'summary', title: 'State Inspection Summary', desc: 'Complete programme overview for district/state inspection', icon: '🛡️', pages: 10, last: 'Mar 10, 2026', contents: ['Executive summary', 'Impact metrics', 'RAG self-assessment', 'Compliance & evidence appendix'] },
]

export default function TelTedInspectionPage() {
  const [tab, setTab] = useState('evidence')
  const [generating, setGenerating] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [doc, setDoc] = useState<string | null>(null)
  const [ratings, setRatings] = useState<Record<string, Rag>>(Object.fromEntries(SELF_AREAS.map(a => [a.area, a.rating])))
  const [reviewed, setReviewed] = useState<Record<number, boolean>>({})
  const [openQ, setOpenQ] = useState<number | null>(0)
  const greens = Object.values(ratings).filter(r => r === 'green').length
  const compliant = COMPLIANCE_ITEMS.filter((c, i) => c.status === 'ok' || reviewed[i]).length

  function generate(id: string) {
    setGenerating(id); setStep(0)
    setTimeout(() => setStep(1), 500); setTimeout(() => setStep(2), 1000)
    setTimeout(() => { setGenerating(null); setDoc(id) }, 1500)
  }
  const steps = ['Collecting LanguageScreen and Tracker data…', 'Compiling evidence sections…', 'Rendering document…']
  const tabs = [{ id: 'evidence', label: 'Evidence Packs', icon: '📦' }, { id: 'self', label: 'Self Assessment', icon: '📊' }, { id: 'compliance', label: 'Compliance', icon: '✅' }, { id: 'mock', label: 'Mock Inspection', icon: '🔍' }]
  const btn = (active: boolean): React.CSSProperties => ({ fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8, border: `1px solid ${active ? C.teal : C.border}`, background: active ? C.teal : C.bg, color: active ? '#fff' : C.muted, cursor: 'pointer' })
  const packMeta = PACKS.find(p => p.id === doc)

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.tealSoft }}><ClipboardList size={20} style={{ color: C.teal }} /></div>
        <div><h1 className="text-xl font-bold" style={{ color: C.text }}>Inspection Mode</h1><p className="text-sm" style={{ color: C.dim }}>Prepare evidence for district or state inspection</p></div>
      </div>
      <Stats items={[{ l: 'Evidence packs', v: PACKS.length, c: C.teal, s: `${PACKS.reduce((s, p) => s + p.pages, 0)} pages` }, { l: 'Self assessment', v: `${greens}/7 Green`, c: greens >= 5 ? C.green : C.amber }, { l: 'Compliance items', v: `${compliant}/7`, c: compliant === 7 ? C.green : C.amber }, { l: 'Mock score', v: 'Good', c: C.blue, s: '1 of 7 areas to improve' }]} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={btn(tab === t.id)}>{t.icon} {t.label}</button>)}</div>

      {tab === 'evidence' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PACKS.map(pack => (
            <div key={pack.id} className="rounded-xl p-5 flex flex-col" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{pack.icon}</span>
                <div className="flex-1">
                  <h4 className="text-sm font-bold" style={{ color: C.text }}>{pack.title}</h4>
                  <p className="text-xs" style={{ color: C.dim }}>{pack.desc}</p>
                </div>
                <span style={{ fontSize: 10, color: C.faint, whiteSpace: 'nowrap' }}>~{pack.pages} pp · Last: {pack.last}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">{pack.contents.map(c => <span key={c} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.muted }}>{c}</span>)}</div>
              {generating === pack.id ? (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: '#0A0B10', border: `1px solid ${C.border}` }}>
                  {steps.map((s, i) => <p key={s} style={{ fontSize: 11, margin: '2px 0', color: i < step ? C.green : i === step ? C.text : C.faint, display: 'flex', alignItems: 'center', gap: 6 }}>{i < step ? <CheckCircle2 size={12} /> : i === step ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={12} />}{s}</p>)}
                </div>
              ) : (
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => generate(pack.id)} className="flex-1 text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5" style={{ backgroundColor: C.teal, color: '#fff', border: 'none', cursor: 'pointer' }}><Download size={12} /> Generate PDF</button>
                  <button onClick={() => setDoc(pack.id)} className="text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: C.text, border: `1px solid ${C.border}`, cursor: 'pointer' }}><FileText size={12} /> Preview</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'self' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl p-5" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-4"><h4 className="text-sm font-bold" style={{ color: C.text }}>RAG Self-Assessment</h4><button onClick={() => setDoc('summary')} className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: C.teal, color: '#fff', border: 'none', cursor: 'pointer' }}><Download size={12} /> Export self-assessment</button></div>
            <div className="space-y-2">
              {SELF_AREAS.map(a => { const r = ratings[a.area]; return (
                <div key={a.area} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}`, borderLeft: `4px solid ${RAG_META[r].color}` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold" style={{ color: C.text, width: 150 }}>{a.area}</span>
                    <div className="flex gap-1.5">{(['red', 'amber', 'green'] as Rag[]).map(x => <button key={x} onClick={() => setRatings(p => ({ ...p, [a.area]: x }))} title={RAG_META[x].desc} className="w-6 h-6 rounded-full" style={{ backgroundColor: RAG_META[x].color, opacity: r === x ? 1 : 0.22, border: r === x ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />)}</div>
                    <span className="text-[11px]" style={{ color: RAG_META[r].color, fontWeight: 600 }}>{RAG_META[r].desc}</span>
                    <span className="text-[10px] ml-auto" style={{ color: C.faint }}>Owner: {a.owner}</span>
                  </div>
                  <ul style={{ margin: '8px 0 0 162px', padding: 0, listStyle: 'none' }}>{a.evidence.map((e, i) => <li key={i} style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>• {e}</li>)}</ul>
                  {a.action && <p style={{ margin: '6px 0 0 162px', fontSize: 11, color: C.amber }}><AlertTriangle size={11} style={{ display: 'inline', marginRight: 4 }} />{a.action}</p>}
                </div>) })}
            </div>
          </div>
          <div className="rounded-xl p-5" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
            <h4 className="text-sm font-bold mb-3" style={{ color: C.text }}>Summary</h4>
            <div className="flex gap-2 mb-4">{(['green', 'amber', 'red'] as Rag[]).map(x => <div key={x} style={{ flex: 1, textAlign: 'center', padding: 10, borderRadius: 8, background: RAG_META[x].soft }}><p style={{ fontSize: 22, fontWeight: 800, color: RAG_META[x].color, margin: 0, fontFamily: 'Georgia, serif' }}>{Object.values(ratings).filter(r => r === x).length}</p><p style={{ fontSize: 9, fontWeight: 700, color: RAG_META[x].color, margin: 0, textTransform: 'uppercase' }}>{x}</p></div>)}</div>
            <p className="text-xs mb-3" style={{ color: C.muted, lineHeight: 1.6 }}>Ratings feed straight into the State Inspection Summary pack. Amber areas carry an owner and an action; complete the action and re-rate before inspection day.</p>
            <h5 className="text-xs font-bold mb-2" style={{ color: C.text }}>Open actions</h5>
            {SELF_AREAS.filter(a => a.action && ratings[a.area] !== 'green').map(a => <p key={a.area} style={{ fontSize: 11, color: C.body, margin: '0 0 6px', lineHeight: 1.5 }}><strong style={{ color: C.amber }}>{a.area}:</strong> {a.action}</p>)}
            {SELF_AREAS.filter(a => a.action && ratings[a.area] !== 'green').length === 0 && <p style={{ fontSize: 11, color: C.green }}>All areas green — no open actions.</p>}
          </div>
        </div>
      )}

      {tab === 'compliance' && (
        <div className="rounded-xl p-5" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-4"><h4 className="text-sm font-bold" style={{ color: C.text }}>Compliance Checklist</h4><span className="text-xs" style={{ color: C.dim }}>{compliant}/{COMPLIANCE_ITEMS.length} compliant</span></div>
          <Table head={['', 'Item', 'Owner', 'Last reviewed', 'Next due', 'Evidence', '']} rows={COMPLIANCE_ITEMS.map((c, i) => { const ok = c.status === 'ok' || reviewed[i]; return [
            <span style={{ color: ok ? C.green : C.amber, display: 'flex' }}>{ok ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}</span>,
            <span style={{ color: C.text, fontWeight: 600 }}>{c.item}</span>, c.owner, c.reviewed, <span style={{ color: ok ? C.body : C.amber, fontWeight: ok ? 400 : 700 }}>{c.due}</span>, <span style={{ fontSize: 11, color: C.muted }}>{c.evidence}</span>,
            c.status === 'warn' ? <button onClick={() => setReviewed(p => ({ ...p, [i]: !p[i] }))} style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: `1px solid ${reviewed[i] ? C.green : C.border}`, background: reviewed[i] ? C.greenSoft : 'transparent', color: reviewed[i] ? C.green : C.muted, cursor: 'pointer', whiteSpace: 'nowrap' }}>{reviewed[i] ? '✓ Closed' : 'Mark closed'}</button> : <span />,
          ] })} />
        </div>
      )}

      {tab === 'mock' && (
        <div className="space-y-3">
          <div className="rounded-xl p-5" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-bold" style={{ color: C.text }}>Mock Inspection — lines of enquiry</h4><span className="text-xs" style={{ color: C.dim }}>{MOCK_QUESTIONS.length} questions · click to expand</span></div>
            <div className="space-y-2">
              {MOCK_QUESTIONS.map((m, i) => (
                <div key={i} className="rounded-lg" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}` }}>
                  <button onClick={() => setOpenQ(openQ === i ? null : i)} className="w-full flex items-center gap-3 p-3 text-left" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <ChevronDown size={14} style={{ color: C.dim, transform: openQ === i ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                    <span className="text-xs font-bold flex-1" style={{ color: C.text }}>Q{i + 1}: {m.q}</span>
                    <Pill color={RATING_COLOR[m.rating]}>{m.rating}</Pill>
                  </button>
                  {openQ === i && (
                    <div style={{ padding: '0 14px 14px 41px' }}>
                      <p style={{ fontSize: 12, color: C.body, lineHeight: 1.7, margin: '0 0 8px' }}><strong style={{ color: C.dim }}>Model answer — </strong>{m.answer}</p>
                      <p style={{ fontSize: 11, color: C.muted, margin: '0 0 8px' }}><strong style={{ color: C.dim }}>Evidence: </strong>{m.evidence.join(' · ')}</p>
                      <button onClick={() => setDoc(m.pack)} className="text-[11px] font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: C.tealSoft, color: C.teal, border: 'none', cursor: 'pointer' }}>Open supporting pack →</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => generate('mock')} className="text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2" style={{ backgroundColor: '#C8960C', color: '#fff', border: 'none', cursor: 'pointer' }}>{generating === 'mock' ? <><Loader2 size={12} className="animate-spin" /> {steps[step]}</> : <><Download size={12} /> Generate Mock Inspection Report</>}</button>
        </div>
      )}

      {doc && (
        <DocViewer onClose={() => setDoc(null)}
          cat={doc === 'mock' ? 'Mock inspection report' : 'Evidence pack'}
          title={doc === 'mock' ? 'Mock Inspection Report' : packMeta?.title || ''}
          subtitle={`${SCHOOL} · ${DISTRICT} · ${GRADE} · Generated ${today()} · EEF 5/5 evidence rating`}>
          {doc === 'lang' && <LangPack />}
          {doc === 'progress' && <ProgressPack />}
          {doc === 'staff' && <StaffPack />}
          {doc === 'summary' && <SummaryPack ratings={ratings} />}
          {doc === 'mock' && <MockReport />}
        </DocViewer>
      )}
    </div>
  )
}
