'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  UserPlus, Plus, X, Loader2, CheckCircle2, AlertTriangle,
  ChevronRight, ChevronLeft, Users, Mail, Phone,
  ShieldCheck, Utensils, Heart, BookOpen, BadgeCheck,
  GraduationCap, Home,
} from 'lucide-react'
import { PageShell, SectionCard, StatCard } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'
import Link from 'next/link'

// ─── Supabase ──────────────────────────────────────────────────────────────────

function useSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PupilRecord {
  id: string
  first_name: string
  last_name: string
  year_group: string
  start_date: string
  status: string
  has_send: boolean
  is_lac: boolean
  eligible_fsm: boolean
  contact1_name: string
  created_at: string
  admission_number: string | null
}

interface AdmissionResult {
  status: string
  id: string | null
  admission_number: string
  pupil_name: string
  year_group: string
  start_date: string
  triggers: {
    welcome_email: boolean
    notify_class_teacher: boolean
    notify_senco: boolean
    notify_dsl: boolean
    notify_office_fsm: boolean
    schedule_induction: boolean
  }
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const YEAR_GROUPS = [
  'Nursery', 'Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4',
  'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11',
]

const RELATIONS = ['Mother', 'Father', 'Guardian', 'Carer', 'Grandparent', 'Other']

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Nut-free', 'Gluten-free', 'Dairy-free']

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const steps = [
    { n: 1, label: 'Pupil & Family' },
    { n: 2, label: 'Medical & SEND' },
    { n: 3, label: 'Confirm' },
  ]
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all`}
              style={{
                backgroundColor: step >= s.n ? '#0D9488' : 'rgba(55,65,81,0.5)',
                color: step >= s.n ? '#F9FAFB' : '#6B7280',
              }}>
              {step > s.n ? <CheckCircle2 size={14} /> : s.n}
            </div>
            <span className="text-xs whitespace-nowrap hidden sm:block"
              style={{ color: step >= s.n ? '#0D9488' : '#6B7280' }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="w-16 h-px mx-2 mb-4 sm:mb-0"
              style={{ backgroundColor: step > s.n ? '#0D9488' : '#374151' }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Admission Modal ──────────────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void
  onAdmitted: (pupil: PupilRecord, result: AdmissionResult) => void
}

interface FormData {
  // Step 1: Pupil
  first_name: string
  last_name: string
  preferred_name: string
  date_of_birth: string
  gender: string
  year_group: string
  start_date: string
  previous_school: string
  // Address
  address_line1: string
  town_city: string
  postcode: string
  // Contacts
  contact1_name: string
  contact1_relation: string
  contact1_phone: string
  contact1_email: string
  contact2_name: string
  contact2_relation: string
  contact2_phone: string
  contact2_email: string
  // Step 2: Medical
  medical_conditions: string
  medications: string
  dietary_requirements: string[]
  allergies: string
  gp_name: string
  gp_phone: string
  has_send: boolean
  send_details: string
  is_lac: boolean
  lac_details: string
  has_eal: boolean
  eal_language: string
  eligible_fsm: boolean
  pupil_premium: boolean
}

const EMPTY_FORM: FormData = {
  first_name: '', last_name: '', preferred_name: '', date_of_birth: '', gender: '',
  year_group: '', start_date: '', previous_school: '',
  address_line1: '', town_city: '', postcode: '',
  contact1_name: '', contact1_relation: '', contact1_phone: '', contact1_email: '',
  contact2_name: '', contact2_relation: '', contact2_phone: '', contact2_email: '',
  medical_conditions: '', medications: '', dietary_requirements: [], allergies: '',
  gp_name: '', gp_phone: '',
  has_send: false, send_details: '', is_lac: false, lac_details: '',
  has_eal: false, eal_language: '', eligible_fsm: false, pupil_premium: false,
}

function AdmissionModal({ onClose, onAdmitted }: ModalProps) {
  const [step, setStep]         = useState(1)
  const [form, setForm]         = useState<FormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')
  const [result, setResult]     = useState<AdmissionResult | null>(null)

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  function toggleDiet(opt: string) {
    setForm(prev => ({
      ...prev,
      dietary_requirements: prev.dietary_requirements.includes(opt)
        ? prev.dietary_requirements.filter(d => d !== opt)
        : [...prev.dietary_requirements, opt],
    }))
  }

  function validateStep1(): string {
    if (!form.first_name.trim()) return 'First name is required.'
    if (!form.last_name.trim()) return 'Last name is required.'
    if (!form.date_of_birth) return 'Date of birth is required.'
    if (!form.year_group) return 'Year group is required.'
    if (!form.start_date) return 'Start date is required.'
    if (!form.contact1_name.trim()) return 'Primary contact name is required.'
    return ''
  }

  function handleNext() {
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
    }
    setError('')
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/workflows/school/admission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          dietary_requirements: form.dietary_requirements,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }

      const r = data as AdmissionResult
      setResult(r)
      onAdmitted({
        id: r.id ?? crypto.randomUUID(),
        first_name: form.first_name,
        last_name: form.last_name,
        year_group: form.year_group,
        start_date: form.start_date,
        status: 'Pending',
        has_send: form.has_send,
        is_lac: form.is_lac,
        eligible_fsm: form.eligible_fsm,
        contact1_name: form.contact1_name,
        created_at: new Date().toISOString(),
        admission_number: r.admission_number,
      }, r)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen
  if (result) {
    const t = result.triggers
    const actions = [
      t.welcome_email       && { icon: Mail,      label: 'Welcome email sent to parents' },
      t.notify_class_teacher && { icon: GraduationCap, label: `Class teacher notified${form.year_group ? ` (${form.year_group})` : ''}` },
      t.notify_senco        && { icon: Heart,      label: 'SENCO notified — SEND support required' },
      t.notify_dsl          && { icon: ShieldCheck, label: 'DSL notified — Looked After Child' },
      t.notify_office_fsm   && { icon: Utensils,   label: 'Office notified — Free School Meals eligible' },
      t.schedule_induction  && { icon: BookOpen,   label: 'Induction meeting scheduled' },
    ].filter(Boolean) as { icon: React.ElementType; label: string }[]

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <div className="w-full max-w-md rounded-2xl p-7" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>
              <CheckCircle2 size={28} style={{ color: '#0D9488' }} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Pupil Admitted</h3>
              <p className="text-sm mt-1" style={{ color: '#0D9488', fontWeight: 600 }}>{result.admission_number}</p>
              <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
                {result.pupil_name} · {result.year_group} · starts {new Date(result.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            <div className="w-full rounded-xl p-4 text-left" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>Actions triggered</p>
              <div className="flex flex-col gap-2">
                {actions.map(({ icon: Icon, label }, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Icon size={13} style={{ color: '#0D9488' }} />
                    <span className="text-sm" style={{ color: '#D1D5DB' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={onClose}
              className="w-full rounded-lg py-2.5 text-sm font-semibold"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  const field = (label: string, node: React.ReactNode, required?: boolean) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>
        {label}{required && ' *'}
      </label>
      {node}
    </div>
  )

  const input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props}
      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
      style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB', colorScheme: 'dark', ...props.style }} />
  )

  const select = (props: React.SelectHTMLAttributes<HTMLSelectElement>, children: React.ReactNode) => (
    <select {...props}
      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
      style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }}>
      {children}
    </select>
  )

  const toggle = (label: string, sublabel: string, checked: boolean, onChange: (v: boolean) => void, accent = '#0D9488') => (
    <div className="flex items-center justify-between rounded-lg px-4 py-3"
      style={{ backgroundColor: checked ? `${accent}10` : 'rgba(55,65,81,0.2)', border: `1px solid ${checked ? accent + '40' : '#374151'}` }}>
      <div>
        <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{sublabel}</p>
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className="relative h-6 w-11 rounded-full transition-colors shrink-0 ml-4"
        style={{ backgroundColor: checked ? accent : '#374151' }}>
        <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? '1.375rem' : '0.125rem' }} />
      </button>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-xl rounded-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: '#1F2937' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <UserPlus size={18} style={{ color: '#0D9488' }} />
              <h2 className="text-base font-semibold" style={{ color: '#F9FAFB' }}>New Pupil Admission</h2>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-gray-800">
            <X size={16} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center px-6 pt-5 pb-2">
          <StepIndicator step={step} />
        </div>

        <div className="px-6 pb-6 max-h-[65vh] overflow-y-auto">
          {/* ── STEP 1: Pupil & Family ───────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-4 pt-2">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>Pupil Details</p>
              <div className="grid grid-cols-2 gap-4">
                {field('First Name', input({ value: form.first_name, onChange: e => set('first_name', e.target.value), placeholder: 'First name' }), true)}
                {field('Last Name', input({ value: form.last_name, onChange: e => set('last_name', e.target.value), placeholder: 'Last name' }), true)}
              </div>
              {field('Preferred Name', input({ value: form.preferred_name, onChange: e => set('preferred_name', e.target.value), placeholder: 'If different from first name' }))}
              <div className="grid grid-cols-2 gap-4">
                {field('Date of Birth', input({ type: 'date', value: form.date_of_birth, onChange: e => set('date_of_birth', e.target.value) }), true)}
                {field('Gender', select({ value: form.gender, onChange: e => set('gender', e.target.value) },
                  <><option value="">Select…</option>{GENDERS.map(g => <option key={g} value={g}>{g}</option>)}</>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {field('Year Group', select({ value: form.year_group, onChange: e => set('year_group', e.target.value) },
                  <><option value="">Select…</option>{YEAR_GROUPS.map(y => <option key={y} value={y}>{y}</option>)}</>
                ), true)}
                {field('Start Date', input({ type: 'date', value: form.start_date, onChange: e => set('start_date', e.target.value) }), true)}
              </div>
              {field('Previous School', input({ value: form.previous_school, onChange: e => set('previous_school', e.target.value), placeholder: 'Name of previous school (if applicable)' }))}

              <div className="pt-1">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>Home Address</p>
                <div className="flex flex-col gap-3">
                  {field('Address Line 1', input({ value: form.address_line1, onChange: e => set('address_line1', e.target.value), placeholder: 'Street address' }))}
                  <div className="grid grid-cols-2 gap-4">
                    {field('Town / City', input({ value: form.town_city, onChange: e => set('town_city', e.target.value) }))}
                    {field('Postcode', input({ value: form.postcode, onChange: e => set('postcode', e.target.value.toUpperCase()), style: { textTransform: 'uppercase' } }))}
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>Primary Contact *</p>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-4">
                    {field('Name', input({ value: form.contact1_name, onChange: e => set('contact1_name', e.target.value), placeholder: 'Full name' }), true)}
                    {field('Relationship', select({ value: form.contact1_relation, onChange: e => set('contact1_relation', e.target.value) },
                      <><option value="">Select…</option>{RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}</>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {field('Phone', input({ type: 'tel', value: form.contact1_phone, onChange: e => set('contact1_phone', e.target.value), placeholder: '07…' }))}
                    {field('Email', input({ type: 'email', value: form.contact1_email, onChange: e => set('contact1_email', e.target.value), placeholder: 'email@example.com' }))}
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>Secondary Contact</p>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-4">
                    {field('Name', input({ value: form.contact2_name, onChange: e => set('contact2_name', e.target.value), placeholder: 'Full name' }))}
                    {field('Relationship', select({ value: form.contact2_relation, onChange: e => set('contact2_relation', e.target.value) },
                      <><option value="">Select…</option>{RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}</>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {field('Phone', input({ type: 'tel', value: form.contact2_phone, onChange: e => set('contact2_phone', e.target.value), placeholder: '07…' }))}
                    {field('Email', input({ type: 'email', value: form.contact2_email, onChange: e => set('contact2_email', e.target.value), placeholder: 'email@example.com' }))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Medical & SEND ────────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-4 pt-2">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>Medical Information</p>
              {field('Medical Conditions',
                <textarea value={form.medical_conditions} onChange={e => set('medical_conditions', e.target.value)}
                  rows={2} placeholder="Asthma, epilepsy, diabetes…"
                  className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
              )}
              {field('Medications',
                <textarea value={form.medications} onChange={e => set('medications', e.target.value)}
                  rows={2} placeholder="Name, dosage, frequency…"
                  className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
              )}
              {field('Allergies', input({ value: form.allergies, onChange: e => set('allergies', e.target.value), placeholder: 'Nuts, dairy, latex…' }))}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Dietary Requirements</label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(opt => {
                    const sel = form.dietary_requirements.includes(opt)
                    return (
                      <button key={opt} type="button" onClick={() => toggleDiet(opt)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: sel ? 'rgba(13,148,136,0.2)' : 'rgba(55,65,81,0.4)',
                          color: sel ? '#0D9488' : '#9CA3AF',
                          border: `1px solid ${sel ? '#0D9488' : '#374151'}`,
                        }}>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {field('GP Name', input({ value: form.gp_name, onChange: e => set('gp_name', e.target.value), placeholder: 'Dr…' }))}
                {field('GP Phone', input({ type: 'tel', value: form.gp_phone, onChange: e => set('gp_phone', e.target.value) }))}
              </div>

              <p className="text-xs font-semibold uppercase tracking-widest pt-2" style={{ color: '#6B7280' }}>Additional Needs & Flags</p>

              {toggle('SEND Support Required', 'Special Educational Needs or Disability', form.has_send, v => set('has_send', v), '#8B5CF6')}
              {form.has_send && (
                <textarea value={form.send_details} onChange={e => set('send_details', e.target.value)}
                  rows={2} placeholder="EHC plan, IEP, type of support needed…"
                  className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
              )}

              {toggle('Looked After Child (LAC)', 'Child in care — DSL will be notified', form.is_lac, v => set('is_lac', v), '#EF4444')}
              {form.is_lac && (
                <textarea value={form.lac_details} onChange={e => set('lac_details', e.target.value)}
                  rows={2} placeholder="Local authority, social worker details…"
                  className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
              )}

              {toggle('English as Additional Language', 'EAL support may be required', form.has_eal, v => set('has_eal', v))}
              {form.has_eal && (
                input({ value: form.eal_language, onChange: e => set('eal_language', e.target.value), placeholder: 'Home language / languages spoken' })
              )}

              {toggle('Free School Meals Eligible', 'Office will be notified to process application', form.eligible_fsm, v => set('eligible_fsm', v), '#F59E0B')}
              {toggle('Pupil Premium', 'Eligible for pupil premium funding', form.pupil_premium, v => set('pupil_premium', v))}
            </div>
          )}

          {/* ── STEP 3: Confirmation ─────────────────────────────────────────── */}
          {step === 3 && (
            <div className="flex flex-col gap-4 pt-2">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>Confirm Admission</p>

              <div className="rounded-xl p-4" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: '#9CA3AF' }}>Pupil</span>
                    <span className="font-medium" style={{ color: '#F9FAFB' }}>
                      {form.first_name} {form.last_name}
                      {form.preferred_name ? ` (${form.preferred_name})` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#9CA3AF' }}>Date of Birth</span>
                    <span style={{ color: '#F9FAFB' }}>
                      {form.date_of_birth ? new Date(form.date_of_birth).toLocaleDateString('en-GB') : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#9CA3AF' }}>Year Group</span>
                    <span style={{ color: '#F9FAFB' }}>{form.year_group || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#9CA3AF' }}>Start Date</span>
                    <span style={{ color: '#F9FAFB' }}>
                      {form.start_date ? new Date(form.start_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#9CA3AF' }}>Primary Contact</span>
                    <span style={{ color: '#F9FAFB' }}>{form.contact1_name}{form.contact1_relation ? ` (${form.contact1_relation})` : ''}</span>
                  </div>
                  {form.contact1_email && (
                    <div className="flex justify-between">
                      <span style={{ color: '#9CA3AF' }}>Contact Email</span>
                      <span style={{ color: '#F9FAFB' }}>{form.contact1_email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Flags */}
              {(form.has_send || form.is_lac || form.has_eal || form.eligible_fsm || form.pupil_premium) && (
                <div className="flex flex-wrap gap-2">
                  {form.has_send      && <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>SEND</span>}
                  {form.is_lac        && <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>LAC</span>}
                  {form.has_eal       && <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#60A5FA' }}>EAL</span>}
                  {form.eligible_fsm  && <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>FSM</span>}
                  {form.pupil_premium && <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488' }}>PP</span>}
                </div>
              )}

              {/* Actions that will trigger */}
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>Will trigger on submit</p>
                <div className="flex flex-col gap-2">
                  {form.contact1_email && (
                    <div className="flex items-center gap-2"><Mail size={12} style={{ color: '#0D9488' }} /><span className="text-xs" style={{ color: '#D1D5DB' }}>Welcome email to {form.contact1_name}</span></div>
                  )}
                  <div className="flex items-center gap-2"><GraduationCap size={12} style={{ color: '#0D9488' }} /><span className="text-xs" style={{ color: '#D1D5DB' }}>Class teacher notified</span></div>
                  {form.has_send && <div className="flex items-center gap-2"><Heart size={12} style={{ color: '#8B5CF6' }} /><span className="text-xs" style={{ color: '#D1D5DB' }}>SENCO notified</span></div>}
                  {form.is_lac   && <div className="flex items-center gap-2"><ShieldCheck size={12} style={{ color: '#EF4444' }} /><span className="text-xs" style={{ color: '#D1D5DB' }}>DSL notified (LAC)</span></div>}
                  {form.eligible_fsm && <div className="flex items-center gap-2"><Utensils size={12} style={{ color: '#F59E0B' }} /><span className="text-xs" style={{ color: '#D1D5DB' }}>Office notified (FSM application)</span></div>}
                  <div className="flex items-center gap-2"><BookOpen size={12} style={{ color: '#0D9488' }} /><span className="text-xs" style={{ color: '#D1D5DB' }}>Induction meeting scheduled</span></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 mt-4"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertTriangle size={14} style={{ color: '#EF4444' }} />
              <p className="text-xs" style={{ color: '#FCA5A5' }}>{error}</p>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex gap-3 pt-5">
            {step === 1 ? (
              <button type="button" onClick={onClose}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                style={{ backgroundColor: 'rgba(55,65,81,0.4)', color: '#9CA3AF', border: '1px solid #374151' }}>
                Cancel
              </button>
            ) : (
              <button type="button" onClick={() => { setStep(s => s - 1); setError('') }}
                className="flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium"
                style={{ backgroundColor: 'rgba(55,65,81,0.4)', color: '#9CA3AF', border: '1px solid #374151' }}>
                <ChevronLeft size={14} /> Back
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Admitting…</> : 'Confirm Admission'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Flag badges ───────────────────────────────────────────────────────────────

function FlagBadges({ record }: { record: PupilRecord }) {
  return (
    <div className="flex flex-wrap gap-1">
      {record.has_send      && <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>SEND</span>}
      {record.is_lac        && <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>LAC</span>}
      {record.eligible_fsm  && <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>FSM</span>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, { bg: string; color: string }> = {
    'Pending': { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
    'Active':  { bg: 'rgba(13,148,136,0.12)', color: '#0D9488' },
    'Withdrawn': { bg: 'rgba(107,114,128,0.12)', color: '#9CA3AF' },
  }
  const c = colours[status] ?? colours['Pending']
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}>{status}</span>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdmissionPage() {
  const supabase = useSupabase()
  const [showModal, setShowModal]       = useState(false)
  const [pupils, setPupils]             = useState<PupilRecord[]>([])
  const [loading, setLoading]           = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [sendCount, setSendCount]       = useState(0)
  const [lacCount, setLacCount]         = useState(0)
  const [totalCount, setTotalCount]     = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('school_pupils')
          .select('id, first_name, last_name, year_group, start_date, status, has_send, is_lac, eligible_fsm, contact1_name, created_at, admission_number')
          .order('created_at', { ascending: false })
          .limit(50)

        if (data) {
          const records = data as PupilRecord[]
          setPupils(records)
          setPendingCount(records.filter(p => p.status === 'Pending').length)
          setSendCount(records.filter(p => p.has_send).length)
          setLacCount(records.filter(p => p.is_lac).length)
          setTotalCount(records.length)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  function handleAdmitted(pupil: PupilRecord) {
    setPupils(prev => [pupil, ...prev])
    setPendingCount(c => c + 1)
    setTotalCount(c => c + 1)
    if (pupil.has_send) setSendCount(c => c + 1)
    if (pupil.is_lac) setLacCount(c => c + 1)
  }

  const stats = [
    {
      label: 'Pending Admissions',
      value: String(pendingCount),
      trend: pendingCount > 0 ? 'awaiting activation' : 'all clear',
      trendDir: pendingCount > 0 ? 'up' as const : 'down' as const,
      trendGood: pendingCount === 0,
      icon: UserPlus,
      sub: 'not yet started',
    },
    {
      label: 'SEND Pupils',
      value: String(sendCount),
      trend: 'require support',
      trendDir: 'up' as const,
      trendGood: false,
      icon: Heart,
      sub: 'SENCO notified',
    },
    {
      label: 'Looked After',
      value: String(lacCount),
      trend: lacCount > 0 ? 'DSL notified' : 'none recorded',
      trendDir: 'up' as const,
      trendGood: lacCount === 0,
      icon: ShieldCheck,
      sub: 'LAC in register',
    },
    {
      label: 'Total on Roll',
      value: String(loading ? '…' : totalCount),
      trend: 'admitted',
      trendDir: 'up' as const,
      trendGood: true,
      icon: Users,
      sub: 'all records',
    },
  ]

  const upcomingPupils = pupils.filter(p => new Date(p.start_date) >= new Date())
  const recentPupils   = pupils.filter(p => new Date(p.start_date) < new Date())

  return (
    <PageShell>
      {/* Sub-navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/school-office"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ backgroundColor: 'rgba(107,114,128,0.1)', color: '#9CA3AF', border: '1px solid #374151' }}>
          <ChevronLeft size={11} /> School Office
        </Link>
        <ChevronRight size={12} style={{ color: '#374151' }} />
        <span className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
          style={{ backgroundColor: 'rgba(13,148,136,0.08)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.2)' }}>
          <UserPlus size={12} /> New Pupil Admissions
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>New Pupil Admissions</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            Register new pupils — family details, medical needs, and SEND flags trigger the right notifications automatically
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0F766E' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0D9488' }}>
          <Plus size={15} />
          Admit Pupil
        </button>
      </div>

      {/* Stats */}
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      {/* Upcoming starters */}
      <SectionCard title={`Upcoming Starters (${upcomingPupils.length})`}>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin" style={{ color: '#9CA3AF' }} />
          </div>
        ) : upcomingPupils.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <UserPlus size={28} style={{ color: '#374151' }} />
            <p className="text-sm" style={{ color: '#9CA3AF' }}>No upcoming admissions</p>
            <button onClick={() => setShowModal(true)} className="text-xs font-medium" style={{ color: '#0D9488' }}>
              Admit a new pupil →
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#1F2937' }}>
            {upcomingPupils.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>
                      {p.first_name} {p.last_name}
                    </span>
                    {p.admission_number && (
                      <span className="text-xs" style={{ color: '#0D9488' }}>{p.admission_number}</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    {p.year_group} · starts {new Date(p.start_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}Contact: {p.contact1_name}
                  </p>
                  <FlagBadges record={p} />
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Recent admissions */}
      {recentPupils.length > 0 && (
        <SectionCard title="Recent Admissions">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937' }}>
                  {['Pupil', 'Ref', 'Year', 'Started', 'Flags', 'Status'].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
                {recentPupils.map(p => (
                  <tr key={p.id}>
                    <td className="py-3 pr-4 text-sm font-medium" style={{ color: '#F9FAFB' }}>
                      {p.first_name} {p.last_name}
                    </td>
                    <td className="py-3 pr-4 text-xs" style={{ color: '#0D9488' }}>{p.admission_number ?? '—'}</td>
                    <td className="py-3 pr-4 text-xs" style={{ color: '#9CA3AF' }}>{p.year_group}</td>
                    <td className="py-3 pr-4 text-xs whitespace-nowrap" style={{ color: '#9CA3AF' }}>
                      {new Date(p.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 pr-4"><FlagBadges record={p} /></td>
                    <td className="py-3"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Workflow guide */}
      <SectionCard title="How Admission Works">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { step: '1', title: 'Pupil & Family', desc: 'Enter pupil details, home address, and primary/secondary contact information.', icon: Home },
            { step: '2', title: 'Medical & SEND', desc: 'Record medical conditions, dietary needs, and flag SEND / LAC / FSM / EAL as needed.', icon: Heart },
            { step: '3', title: 'Auto-Notify', desc: 'On submit: welcome email sent, class teacher notified, SENCO/DSL/office alerted as required.', icon: BadgeCheck },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="rounded-xl p-4" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>{step}</span>
                <Icon size={14} style={{ color: '#0D9488' }} />
                <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {showModal && <AdmissionModal onClose={() => setShowModal(false)} onAdmitted={handleAdmitted} />}
    </PageShell>
  )
}
