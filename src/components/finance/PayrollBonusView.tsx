'use client'

import { useState } from 'react'
import { Wallet } from 'lucide-react'

// Payroll & Bonus Ledger. Payroll summary, bonus accruals (appearance / goal /
// promotion), image rights and statutory deductions (PAYE / NIC / pension).
// Shared; men's (blue) vs women's (pink). Demo only — illustrative.

type Variant = 'mens' | 'womens'
type Tab = 'payroll' | 'bonus' | 'image' | 'statutory'

interface Pay { group: string; headcount: number; gross: number }
interface Bonus { type: string; basis: string; accrued: number; paidYtd: number }
interface Image { player: string; annual: number; vehicle: string }
interface Stat2 { label: string; value: string }
interface Profile { accent: string; accentLt: string; clubName: string; money: (n: number) => string
  pay: Pay[]; bonus: Bonus[]; image: Image[]; statutory: Stat2[]; imageNote: string }

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', clubName: 'Oakridge FC',
  money: (n) => '£' + n.toLocaleString('en-GB') + 'k',
  pay: [
    { group: 'First-team players', headcount: 25, gross: 18200 },
    { group: 'Football staff (coaching/medical)', headcount: 32, gross: 3400 },
    { group: 'Academy', headcount: 28, gross: 1600 },
    { group: 'Commercial / operations', headcount: 57, gross: 2300 },
  ],
  bonus: [
    { type: 'Appearance bonuses', basis: 'Per matchday-squad inclusion', accrued: 620, paidYtd: 480 },
    { type: 'Goal / clean-sheet bonuses', basis: 'Per performance metric', accrued: 240, paidYtd: 195 },
    { type: 'Promotion bonus pool', basis: 'Triggered on promotion', accrued: 2800, paidYtd: 0 },
    { type: 'Loyalty / signing instalments', basis: 'Contractual schedule', accrued: 900, paidYtd: 600 },
  ],
  image: [
    { player: 'Dean Morris', annual: 420, vehicle: 'Image-rights company' },
    { player: 'Diego Santos', annual: 360, vehicle: 'Image-rights company' },
    { player: 'Sam Porter', annual: 180, vehicle: 'Image-rights company' },
  ],
  statutory: [
    { label: 'PAYE (income tax) — monthly', value: '£1.9m' },
    { label: 'Employer NIC — monthly', value: '£0.7m' },
    { label: 'Auto-enrolment pension', value: '£0.18m / mo' },
    { label: 'Apprenticeship levy', value: '£12k / mo' },
  ],
  imageNote: 'Image-rights payments to player service companies capped at HMRC-defended proportion of total remuneration; reviewed annually with advisers.',
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', clubName: 'Oakridge Women FC',
  money: (n) => '£' + n.toLocaleString('en-GB') + 'k',
  pay: [
    { group: 'First-team players', headcount: 24, gross: 1450 },
    { group: 'Football staff (coaching/medical)', headcount: 18, gross: 720 },
    { group: 'RTC / academy', headcount: 14, gross: 260 },
    { group: 'Commercial / operations', headcount: 12, gross: 360 },
  ],
  bonus: [
    { type: 'Appearance bonuses', basis: 'Per matchday-squad inclusion', accrued: 48, paidYtd: 36 },
    { type: 'Goal / clean-sheet bonuses', basis: 'Per performance metric', accrued: 22, paidYtd: 18 },
    { type: 'Promotion bonus pool', basis: 'Triggered on WSL promotion', accrued: 180, paidYtd: 0 },
    { type: 'Loyalty instalments', basis: 'Contractual schedule', accrued: 30, paidYtd: 20 },
  ],
  image: [
    { player: 'Jade Osei', annual: 24, vehicle: 'Image-rights company' },
    { player: 'Lucy Whitmore', annual: 18, vehicle: 'Image-rights company' },
  ],
  statutory: [
    { label: 'PAYE (income tax) — monthly', value: '£0.16m' },
    { label: 'Employer NIC — monthly', value: '£0.06m' },
    { label: 'Auto-enrolment pension', value: '£0.02m / mo' },
    { label: 'Apprenticeship levy', value: 'Below threshold' },
  ],
  imageNote: 'Image-rights arrangements modest at this level; capped at HMRC-defended proportion of total remuneration and reviewed annually.',
}

const C = { panel: '#0D1117', panelAlt: '#111318', border: '#1F2937', text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280', good: '#22C55E', amber: '#F59E0B' }
const TABS: [Tab, string][] = [['payroll', 'Payroll Summary'], ['bonus', 'Bonus Accruals'], ['image', 'Image Rights'], ['statutory', 'Statutory (PAYE/NIC)']]

export default function PayrollBonusView({ variant, club }: { variant: Variant; club?: { name?: string } | null }) {
  const p = variant === 'mens' ? MENS : WOMENS
  const name = club?.name || p.clubName
  const [tab, setTab] = useState<Tab>('payroll')
  const totalGross = p.pay.reduce((s, a) => s + a.gross, 0)
  const totalHead = p.pay.reduce((s, a) => s + a.headcount, 0)
  const bonusAccrued = p.bonus.reduce((s, b) => s + b.accrued, 0)
  const imageTotal = p.image.reduce((s, i) => s + i.annual, 0)

  const Stat = ({ label, value, col }: { label: string; value: string; col?: string }) => (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div><div className="text-xl font-black mt-1" style={{ color: col || C.text }}>{value}</div></div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><Wallet size={18} style={{ color: p.accent }} /> Payroll & Bonus Ledger</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — payroll by group, bonus accruals, image-rights payments and statutory deductions.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Annual gross payroll" value={p.money(totalGross)} col={C.accentLt} />
        <Stat label="Headcount (paid)" value={String(totalHead)} />
        <Stat label="Bonus accrued" value={p.money(bonusAccrued)} col={C.amber} />
        <Stat label="Image rights (annual)" value={p.money(imageTotal)} />
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? p.accent : 'transparent'}`, color: tab === id ? p.accentLt : C.text4 }}>{label}</button>))}
      </div>

      {tab === 'payroll' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Group', 'Headcount', 'Annual gross', 'Share'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.pay.map((a, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{a.group}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{a.headcount}</td><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: p.accentLt }}>{p.money(a.gross)}</td><td className="px-4 py-2.5"><div className="flex items-center gap-2"><div className="w-16 rounded-full h-1.5" style={{ background: C.border }}><div className="h-1.5 rounded-full" style={{ width: `${(a.gross / totalGross) * 100}%`, background: p.accent }} /></div><span className="text-[10px]" style={{ color: C.text4 }}>{Math.round((a.gross / totalGross) * 100)}%</span></div></td></tr>))}</tbody>
            <tfoot><tr style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-bold" style={{ color: C.text }}>Total</td><td className="px-4 py-2.5 font-bold" style={{ color: C.text }}>{totalHead}</td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: p.accentLt }}>{p.money(totalGross)}</td><td></td></tr></tfoot>
          </table>
        </div>
      )}

      {tab === 'bonus' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Bonus type', 'Basis', 'Accrued', 'Paid YTD'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.bonus.map((b, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{b.type}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{b.basis}</td><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: C.amber }}>{p.money(b.accrued)}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text3 }}>{p.money(b.paidYtd)}</td></tr>))}</tbody>
            <tfoot><tr style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-bold" style={{ color: C.text }}>Total accrued</td><td></td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: C.amber }}>{p.money(bonusAccrued)}</td><td></td></tr></tfoot>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Promotion bonus pool provided for but unpaid — a material contingent cost in any promotion scenario.</div>
        </div>
      )}

      {tab === 'image' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Player', 'Annual image-rights', 'Vehicle'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.image.map((m, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{m.player}</td><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: p.accentLt }}>{p.money(m.annual)}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{m.vehicle}</td></tr>))}</tbody>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>{p.imageNote}</div>
        </div>
      )}

      {tab === 'statutory' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          {p.statutory.map((s, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: i < p.statutory.length - 1 ? `1px solid ${C.border}80` : undefined }}>
              <span className="text-xs font-semibold" style={{ color: C.text2 }}>{s.label}</span>
              <span className="text-sm font-mono font-bold" style={{ color: p.accentLt }}>{s.value}</span>
            </div>
          ))}
          <div className="px-5 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Remitted to HMRC monthly via RTI. Pension auto-enrolment administered through the workplace scheme.</div>
        </div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Payroll figures, bonus accruals and image-rights values are invented demo values.
      </div>
    </div>
  )
}
