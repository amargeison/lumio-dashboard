'use client'
import { useState } from 'react'
import { X } from 'lucide-react'

const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: '#0A0B10',
  border: '1px solid #374151',
  color: '#F9FAFB',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 14,
  outline: 'none',
  width: '100%',
}

type ModalProps = { onClose: () => void; onToast: (msg: string) => void; userName?: string; userDept?: string; userTitle?: string }

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
      <div style={{ background: '#111318', border: '1px solid #1F2937', borderRadius: 16, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
        {children}
      </div>
    </div>
  )
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #1F2937' }}>
      <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 600 }}>{title}</h2>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={20} /></button>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#9CA3AF', marginBottom: 6 }}>{children}</label>
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, background: value ? '#0D9488' : '#374151', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'left 0.2s' }} />
    </button>
  )
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <Label>{label}</Label>
      <Toggle value={value} onChange={onChange} />
    </div>
  )
}

function SubmitBtn({ label }: { label: string }) {
  return (
    <button type="submit" style={{ width: '100%', padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 600, background: '#0D9488', color: '#F9FAFB', border: 'none', cursor: 'pointer', marginTop: 12 }}>
      {label}
    </button>
  )
}

function Footer({ text }: { text: string }) {
  return <p style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>{text}</p>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}><Label>{label}</Label>{children}</div>
}

function Input({ value, onChange, type, placeholder, readOnly }: { value: string; onChange?: (v: string) => void; type?: string; placeholder?: string; readOnly?: boolean }) {
  return <input type={type || 'text'} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} readOnly={readOnly} style={{ ...INPUT_STYLE, ...(readOnly ? { opacity: 0.6, cursor: 'default' } : {}) }} />
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return <select value={value} onChange={e => onChange(e.target.value)} style={INPUT_STYLE}>{options.map(o => <option key={o} value={o}>{o}</option>)}</select>
}

function Textarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...INPUT_STYLE, resize: 'vertical' }} />
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function countWeekdays(from: string, to: string): number {
  if (!from || !to) return 0
  let count = 0
  const start = new Date(from)
  const end = new Date(to)
  const current = new Date(start)
  while (current <= end) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

function daysBetween(from: string, to: string): number {
  if (!from || !to) return 0
  const start = new Date(from)
  const end = new Date(to)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

/* ─── 1. ClaimExpenseModal ─── */

export function ClaimExpenseModal({ onClose, onToast }: ModalProps) {
  const [expenseType, setExpenseType] = useState('Travel')
  const [date, setDate] = useState(todayStr())
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [receiptAttached, setReceiptAttached] = useState(false)
  const [costCentre, setCostCentre] = useState('')
  const [approvedBy, setApprovedBy] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onToast(`Expense claim submitted — £${amount}`)
    onClose()
  }

  return (
    <Overlay>
      <Header title="Submit Expense Claim" onClose={onClose} />
      <form onSubmit={handleSubmit}>
        <Field label="Expense Type">
          <Select value={expenseType} onChange={setExpenseType} options={['Travel', 'Meals', 'Equipment', 'Training', 'Accommodation', 'Entertainment', 'Other']} />
        </Field>
        <Field label="Date">
          <Input type="date" value={date} onChange={setDate} />
        </Field>
        <Field label="Amount £">
          <Input type="number" value={amount} onChange={setAmount} placeholder="0.00" />
        </Field>
        <Field label="Description">
          <Input value={description} onChange={setDescription} />
        </Field>
        <div style={{ marginBottom: 12 }}>
          <ToggleRow label="Receipt attached?" value={receiptAttached} onChange={setReceiptAttached} />
        </div>
        <Field label="Project / Cost Centre (optional)">
          <Input value={costCentre} onChange={setCostCentre} placeholder="Optional" />
        </Field>
        <Field label="Approved By">
          <Input value={approvedBy} onChange={setApprovedBy} />
        </Field>
        <SubmitBtn label="Submit Claim" />
        <Footer text="Claims are processed within 5 working days" />
      </form>
    </Overlay>
  )
}

/* ─── 2. BookHolidayModal ─── */

export function BookHolidayModal({ onClose, onToast, userName, userDept, userTitle }: ModalProps) {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [holidayType, setHolidayType] = useState('Annual Leave')
  const [coverArranged, setCoverArranged] = useState(false)
  const [coverPerson, setCoverPerson] = useState('')
  const [notes, setNotes] = useState('')

  const totalDays = countWeekdays(fromDate, toDate)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onToast(`Holiday request submitted — ${totalDays} days`)
    onClose()
  }

  return (
    <Overlay>
      <Header title="Request Annual Leave" onClose={onClose} />
      {userName && (
        <div style={{ background: 'rgba(108,63,197,0.08)', border: '1px solid rgba(108,63,197,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#A78BFA' }}>
          {userName}{userTitle ? ` — ${userTitle}` : ''}{userDept ? ` (${userDept})` : ''}
        </div>
      )}
      <div style={{ background: 'rgba(13,148,136,0.12)', border: '1px solid #0D9488', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 13, color: '#5EEAD4' }}>
        You have 18 days remaining this year
      </div>
      <form onSubmit={handleSubmit}>
        <Field label="From Date">
          <Input type="date" value={fromDate} onChange={setFromDate} />
        </Field>
        <Field label="To Date">
          <Input type="date" value={toDate} onChange={setToDate} />
        </Field>
        <Field label="Total Days">
          <Input value={totalDays.toString()} readOnly />
        </Field>
        <Field label="Holiday Type">
          <Select value={holidayType} onChange={setHolidayType} options={['Annual Leave', 'TOIL', 'Unpaid Leave', 'Other']} />
        </Field>
        <div style={{ marginBottom: 12 }}>
          <ToggleRow label="Cover arranged?" value={coverArranged} onChange={setCoverArranged} />
        </div>
        {coverArranged && (
          <Field label="Cover Person">
            <Input value={coverPerson} onChange={setCoverPerson} />
          </Field>
        )}
        <Field label="Notes (optional)">
          <Textarea value={notes} onChange={setNotes} placeholder="Optional" />
        </Field>
        <SubmitBtn label="Submit Request" />
        <Footer text="Your manager will be notified and respond within 2 working days" />
      </form>
    </Overlay>
  )
}

/* ─── 3. ReportSicknessModal ─── */

export function ReportSicknessModal({ onClose, onToast, userName, userDept, userTitle }: ModalProps) {
  const [firstDay, setFirstDay] = useState(todayStr())
  const [expectedReturn, setExpectedReturn] = useState('')
  const [reason, setReason] = useState('Illness')
  const [spokenToManager, setSpokenToManager] = useState(false)
  const [managerName, setManagerName] = useState('')
  const [notes, setNotes] = useState('')

  const gap = daysBetween(firstDay, expectedReturn)
  const needsDoctorNote = gap > 7

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onToast('Absence reported — your manager has been notified')
    onClose()
  }

  return (
    <Overlay>
      <Header title="Report Absence" onClose={onClose} />
      {userName && (
        <div style={{ background: 'rgba(108,63,197,0.08)', border: '1px solid rgba(108,63,197,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#A78BFA' }}>
          {userName}{userTitle ? ` — ${userTitle}` : ''}{userDept ? ` (${userDept})` : ''}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <Field label="First Day of Absence">
          <Input type="date" value={firstDay} onChange={setFirstDay} />
        </Field>
        <Field label="Expected Return Date (optional)">
          <Input type="date" value={expectedReturn} onChange={setExpectedReturn} />
        </Field>
        <Field label="Reason">
          <Select value={reason} onChange={setReason} options={['Illness', 'Medical Appointment', 'Family Emergency', 'Mental Health', 'Other']} />
        </Field>
        <div style={{ marginBottom: 12 }}>
          <ToggleRow label="Have you spoken to your manager?" value={spokenToManager} onChange={setSpokenToManager} />
        </div>
        <Field label="Manager Name">
          <Input value={managerName} onChange={setManagerName} />
        </Field>
        {needsDoctorNote && (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid #F59E0B', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#FBBF24' }}>
            A doctor&#39;s note is required for absences over 7 days
          </div>
        )}
        <Field label="Notes (optional)">
          <Textarea value={notes} onChange={setNotes} placeholder="Optional" />
        </Field>
        <SubmitBtn label="Report Absence" />
        <Footer text="Your manager and HR will be notified automatically" />
      </form>
    </Overlay>
  )
}
