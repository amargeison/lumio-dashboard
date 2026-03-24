'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Check, X, ArrowLeft, ArrowRight, Building2, CreditCard,
  Lock, Sparkles, Zap, Shield, Star, ChevronDown, Eye, EyeOff, Loader2
} from 'lucide-react'

// ─── Plans ────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 299,
    period: 'month',
    tagline: 'Perfect for single primary schools getting started',
    badge: null,
    color: '#0D9488',
    features: [
      'Full school portal (all departments)',
      'Up to 500 pupils',
      'Attendance & absence management',
      'School Office & Admin module',
      'SEND register & ISP tracker',
      'Safeguarding case log',
      'Pre & After School / Wraparound',
      'Parent communications',
      'CSV data import',
      '5 staff accounts',
      'Email support',
      'Lumio Workflows (3 automations)',
    ],
    notIncluded: [
      'Trust / MAT dashboard',
      'MIS direct integration',
      'Unlimited staff accounts',
      'Priority support',
      'Custom branding',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 599,
    period: 'month',
    tagline: 'For growing schools that need the full platform',
    badge: 'Most Popular',
    color: '#8B5CF6',
    features: [
      'Everything in Starter',
      'Unlimited pupils',
      'Unlimited staff accounts',
      'Full Insights — all 8 role views',
      'Trust / MAT dashboard',
      'Ofsted readiness dashboard',
      'SEND White Paper compliance module',
      'EHCP 20-week deadline tracker',
      'Governor meeting management',
      'MIS integration (Arbor, SIMS, Bromcom)',
      'Lumio Workflows (unlimited automations)',
      'Advanced reports & data exports',
      'Priority email & chat support',
      'Custom school branding',
    ],
    notIncluded: [
      'Dedicated account manager',
      'On-site training',
      'Multi-school trust pricing',
    ],
  },
  {
    id: 'trust',
    name: 'Trust',
    price: 1499,
    period: 'month',
    tagline: 'For multi-academy trusts managing multiple schools',
    badge: 'Best for MATs',
    color: '#F59E0B',
    features: [
      'Everything in Growth',
      'Up to 10 schools included',
      'Trust CEO & Director dashboard',
      'Cross-school RAG performance table',
      'Trust-wide SEND & safeguarding view',
      'Trust finance consolidated view',
      'School improvement plan tracking',
      'ATH 2025 compliance monitor',
      'Trust HR & workforce dashboard',
      'Estates & digital standards tracker',
      'Dedicated account manager',
      'On-site onboarding & training',
      'Custom SLA agreement',
      'API access',
    ],
    notIncluded: [],
  },
]

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = ['Choose Plan', 'School Details', 'Payment', 'Confirmation']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Input({ label, type = 'text', value, onChange, placeholder, required, suffix, hint }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; suffix?: string; hint?: string
}) {
  const [show, setShow] = useState(false)
  const inputType = type === 'password' ? (show ? 'text' : 'password') : type
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#D1D5DB' }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
          style={{ backgroundColor: '#0A0B11', border: '1px solid #374151', color: '#F9FAFB' }}
          onFocus={e => e.target.style.borderColor = '#0D9488'}
          onBlur={e => e.target.style.borderColor = '#374151'}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#6B7280' }}>{suffix}</span>}
        {type === 'password' && (
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShow(v => !v)} style={{ color: '#6B7280' }}>
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{hint}</p>}
    </div>
  )
}

function Select({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#D1D5DB' }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none appearance-none"
          style={{ backgroundColor: '#0A0B11', border: '1px solid #374151', color: value ? '#F9FAFB' : '#6B7280' }}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6B7280' }} />
      </div>
    </div>
  )
}

// ─── Step 1: Plan selection ───────────────────────────────────────────────────
function StepPlan({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#F9FAFB' }}>Choose your plan</h2>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>All plans include a 14-day free trial. No credit card charged until trial ends.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map(plan => {
          const isSelected = selected === plan.id
          return (
            <div key={plan.id}
              onClick={() => onSelect(plan.id)}
              className="rounded-2xl p-5 cursor-pointer transition-all relative"
              style={{
                backgroundColor: isSelected ? `${plan.color}10` : '#111318',
                border: isSelected ? `2px solid ${plan.color}` : '2px solid #1F2937',
                transform: isSelected ? 'scale(1.01)' : 'scale(1)',
              }}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap" style={{ backgroundColor: plan.color, color: '#F9FAFB' }}>{plan.badge}</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <p className="text-base font-bold" style={{ color: '#F9FAFB' }}>{plan.name}</p>
                {isSelected && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: plan.color }}><Check size={11} color="white" /></div>}
              </div>
              <div className="mb-3">
                <span className="text-3xl font-black" style={{ color: plan.color }}>£{plan.price.toLocaleString()}</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>/month</span>
              </div>
              <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>{plan.tagline}</p>
              <div className="flex flex-col gap-1.5">
                {plan.features.slice(0, 7).map(f => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={11} className="mt-0.5 flex-shrink-0" style={{ color: plan.color }} />
                    <p className="text-xs" style={{ color: '#D1D5DB' }}>{f}</p>
                  </div>
                ))}
                {plan.features.length > 7 && (
                  <p className="text-xs mt-1" style={{ color: plan.color }}>+{plan.features.length - 7} more features →</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {/* Annual discount nudge */}
      <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>💡 Save 20% with annual billing</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Switch to annual at any time from your settings. All plans include a 14-day free trial.</p>
        </div>
        <span className="text-xs rounded-lg px-3 py-1.5 font-semibold" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>Save 2 months</span>
      </div>
    </div>
  )
}

// ─── Step 2: School details ───────────────────────────────────────────────────
function StepDetails({ form, setForm }: { form: Record<string, string>; setForm: (f: Record<string, string>) => void }) {
  const set = (key: string) => (v: string) => setForm({ ...form, [key]: v })
  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#F9FAFB' }}>Your school details</h2>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>We use this to set up your portal. You can update everything later in Settings.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="School Name" value={form.schoolName} onChange={set('schoolName')} placeholder="e.g. Oakridge Primary School" required />
        </div>
        <Select label="School Phase" value={form.phase} onChange={set('phase')} required options={[
          { value: '', label: 'Select phase...' },
          { value: 'primary', label: 'Primary (Reception–Year 6)' },
          { value: 'secondary', label: 'Secondary (Year 7–11)' },
          { value: 'all-through', label: 'All-through (Reception–Year 11)' },
          { value: 'special', label: 'Special School' },
          { value: 'post-16', label: 'Post-16 / Sixth Form' },
        ]} />
        <Select label="School Type" value={form.schoolType} onChange={set('schoolType')} required options={[
          { value: '', label: 'Select type...' },
          { value: 'academy', label: 'Academy' },
          { value: 'free-school', label: 'Free School' },
          { value: 'community', label: 'Community School' },
          { value: 'voluntary-aided', label: 'Voluntary Aided' },
          { value: 'mat', label: 'Multi-Academy Trust' },
          { value: 'independent', label: 'Independent' },
        ]} />
        <Input label="Number of Pupils" value={form.pupils} onChange={set('pupils')} placeholder="e.g. 430" type="number" required />
        <Input label="Local Authority" value={form.la} onChange={set('la')} placeholder="e.g. Milton Keynes" required />
        <div className="sm:col-span-2">
          <Input label="School Address" value={form.address} onChange={set('address')} placeholder="Full address including postcode" required />
        </div>
        <Input label="URN (Unique Reference Number)" value={form.urn} onChange={set('urn')} placeholder="e.g. 110158" hint="Find your URN at get-information-schools.service.gov.uk" />
        <Input label="DfE Number" value={form.dfe} onChange={set('dfe')} placeholder="e.g. 931/4500" />
      </div>

      <div style={{ borderTop: '1px solid #1F2937', paddingTop: 20 }}>
        <p className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>Your account</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Your First Name" value={form.firstName} onChange={set('firstName')} placeholder="e.g. Sarah" required />
          <Input label="Your Last Name" value={form.lastName} onChange={set('lastName')} placeholder="e.g. Henley" required />
          <Input label="Your Role" value={form.role} onChange={set('role')} placeholder="e.g. Headteacher" required />
          <Input label="Work Email" type="email" value={form.email} onChange={set('email')} placeholder="sarah@school.sch.uk" required />
          <div className="sm:col-span-2">
            <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" required hint="Use a strong password — you can change it any time in settings." />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Payment ──────────────────────────────────────────────────────────
function StepPayment({ form, setForm, plan }: { form: Record<string, string>; setForm: (f: Record<string, string>) => void; plan: typeof PLANS[0] }) {
  const set = (key: string) => (v: string) => setForm({ ...form, [key]: v })

  // Format card number with spaces
  const formatCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  const formatExpiry = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 4)
    return clean.length >= 2 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Order summary */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl p-5 sticky top-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-4" style={{ color: '#F9FAFB' }}>Order Summary</p>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Lumio Schools — {plan.name}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Monthly subscription</p>
            </div>
            <p className="text-lg font-black" style={{ color: plan.color }}>£{plan.price}/mo</p>
          </div>
          <div className="flex flex-col gap-1.5 py-3 mb-3" style={{ borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
            {plan.features.slice(0, 5).map(f => (
              <div key={f} className="flex items-center gap-2">
                <Check size={10} style={{ color: plan.color, flexShrink: 0 }} />
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{f}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span style={{ color: '#9CA3AF' }}>Subtotal</span>
            <span style={{ color: '#D1D5DB' }}>£{plan.price.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm mb-3">
            <span style={{ color: '#22C55E' }}>14-day trial</span>
            <span style={{ color: '#22C55E' }}>Free</span>
          </div>
          <div className="flex items-center justify-between mb-4" style={{ borderTop: '1px solid #1F2937', paddingTop: 12 }}>
            <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Due today</span>
            <span className="text-xl font-black" style={{ color: '#22C55E' }}>£0.00</span>
          </div>
          <p className="text-xs text-center" style={{ color: '#4B5563' }}>
            Your card will be charged £{plan.price}/month after your 14-day trial. Cancel anytime.
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Lock size={11} style={{ color: '#6B7280' }} />
            <p className="text-xs" style={{ color: '#6B7280' }}>Secured by Stripe · 256-bit SSL</p>
          </div>
        </div>
      </div>

      {/* Payment form */}
      <div className="lg:col-span-3 flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: '#F9FAFB' }}>Payment details</h2>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Your 14-day free trial starts today. Nothing charged until {new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
        </div>

        {/* Card number */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#D1D5DB' }}>Card number <span style={{ color: '#EF4444' }}>*</span></label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={form.cardNumber}
              onChange={e => setForm({ ...form, cardNumber: formatCard(e.target.value) })}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: '#0A0B11', border: '1px solid #374151', color: '#F9FAFB' }}
              onFocus={e => e.target.style.borderColor = '#0D9488'}
              onBlur={e => e.target.style.borderColor = '#374151'}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              {['VISA', 'MC', 'AMEX'].map(c => (
                <span key={c} className="text-xs rounded px-1 font-bold" style={{ backgroundColor: '#1F2937', color: '#6B7280', fontSize: 8 }}>{c}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#D1D5DB' }}>Expiry date <span style={{ color: '#EF4444' }}>*</span></label>
            <input
              type="text"
              inputMode="numeric"
              value={form.expiry}
              onChange={e => setForm({ ...form, expiry: formatExpiry(e.target.value) })}
              placeholder="MM/YY"
              maxLength={5}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: '#0A0B11', border: '1px solid #374151', color: '#F9FAFB' }}
              onFocus={e => e.target.style.borderColor = '#0D9488'}
              onBlur={e => e.target.style.borderColor = '#374151'}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#D1D5DB' }}>CVV <span style={{ color: '#EF4444' }}>*</span></label>
            <input
              type="text"
              inputMode="numeric"
              value={form.cvv}
              onChange={e => setForm({ ...form, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              placeholder="123"
              maxLength={4}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: '#0A0B11', border: '1px solid #374151', color: '#F9FAFB' }}
              onFocus={e => e.target.style.borderColor = '#0D9488'}
              onBlur={e => e.target.style.borderColor = '#374151'}
            />
          </div>
        </div>

        <Input label="Name on card" value={form.cardName} onChange={set('cardName')} placeholder="e.g. Sarah Henley" required />
        <Input label="Billing postcode" value={form.postcode} onChange={set('postcode')} placeholder="e.g. MK9 1AA" required />

        {/* Terms */}
        <div className="flex items-start gap-3 rounded-xl p-3" style={{ backgroundColor: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.2)' }}>
          <input type="checkbox" checked={form.terms === 'true'} onChange={e => setForm({ ...form, terms: e.target.checked ? 'true' : '' })}
            className="mt-0.5 flex-shrink-0" style={{ accentColor: '#0D9488' }} />
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            I agree to the <Link href="/terms" className="underline" style={{ color: '#0D9488' }}>Terms of Service</Link> and <Link href="/privacy" className="underline" style={{ color: '#0D9488' }}>Privacy Policy</Link>. I understand my 14-day free trial starts today and my card will be charged £{plan.price}/month afterwards. I can cancel at any time.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Confirmation (building portal) ───────────────────────────────────
function StepConfirmation({ schoolName, slug, onComplete }: { schoolName: string; slug: string; onComplete: () => void }) {
  const [stage, setStage] = useState(0)
  const stages = [
    'Creating your school portal...',
    'Setting up your departments...',
    'Configuring SEND & Safeguarding modules...',
    'Activating Lumio Workflows...',
    'Applying your school branding...',
    'Portal ready! Redirecting you now...',
  ]

  useState(() => {
    const advance = (i: number) => {
      if (i < stages.length) {
        setTimeout(() => { setStage(i); advance(i + 1) }, i === stages.length - 1 ? 800 : 900)
      } else {
        setTimeout(onComplete, 600)
      }
    }
    advance(0)
  })

  const done = stage >= stages.length - 1

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0D9488, #0F766E)' }}>
          {done ? <Check size={36} color="white" /> : <Building2 size={36} color="white" className="animate-pulse" />}
        </div>
        {!done && (
          <div className="absolute inset-0 rounded-2xl animate-ping" style={{ backgroundColor: 'rgba(13,148,136,0.2)' }} />
        )}
      </div>

      <h2 className="text-2xl font-black mb-2" style={{ color: '#F9FAFB' }}>
        {done ? '🎉 Portal Ready!' : `Building ${schoolName}...`}
      </h2>
      <p className="text-sm mb-8" style={{ color: '#9CA3AF' }}>
        {done ? 'Your Lumio Schools portal is live and ready to use.' : 'This takes about 10 seconds — please wait.'}
      </p>

      <div className="w-full max-w-sm flex flex-col gap-2 text-left">
        {stages.map((s, i) => (
          <div key={s} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ backgroundColor: i <= stage ? 'rgba(13,148,136,0.08)' : '#111318', border: `1px solid ${i <= stage ? 'rgba(13,148,136,0.2)' : '#1F2937'}` }}>
            {i < stage ? <Check size={13} style={{ color: '#22C55E', flexShrink: 0 }} />
              : i === stage ? <Loader2 size={13} style={{ color: '#0D9488', flexShrink: 0 }} className="animate-spin" />
              : <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#1F2937' }} />}
            <p className="text-xs" style={{ color: i <= stage ? '#D1D5DB' : '#4B5563' }}>{s}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState('growth')
  const [error, setError] = useState('')
  const [form, setForm] = useState<Record<string, string>>({
    schoolName: '', phase: '', schoolType: '', pupils: '', la: '', address: '', urn: '', dfe: '',
    firstName: '', lastName: '', role: '', email: '', password: '',
    cardNumber: '', expiry: '', cvv: '', cardName: '', postcode: '', terms: '',
  })

  const plan = PLANS.find(p => p.id === selectedPlan) ?? PLANS[1]

  // Generate slug from school name
  const slug = form.schoolName
    ? form.schoolName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+$/, '') || 'my-school'
    : 'my-school'

  function validateStep() {
    if (step === 0) return true
    if (step === 1) {
      const required = ['schoolName', 'phase', 'schoolType', 'pupils', 'la', 'address', 'firstName', 'lastName', 'role', 'email', 'password']
      const missing = required.filter(k => !form[k])
      if (missing.length) { setError('Please fill in all required fields.'); return false }
      if (!form.email.includes('@')) { setError('Please enter a valid email address.'); return false }
      if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return false }
    }
    if (step === 2) {
      if (!form.cardNumber || form.cardNumber.replace(/\s/g, '').length < 16) { setError('Please enter a valid 16-digit card number.'); return false }
      if (!form.expiry || form.expiry.length < 5) { setError('Please enter a valid expiry date (MM/YY).'); return false }
      if (!form.cvv || form.cvv.length < 3) { setError('Please enter a valid CVV.'); return false }
      if (!form.cardName) { setError('Please enter the name on your card.'); return false }
      if (!form.postcode) { setError('Please enter your billing postcode.'); return false }
      if (form.terms !== 'true') { setError('Please accept the Terms of Service to continue.'); return false }
    }
    setError('')
    return true
  }

  function next() {
    if (!validateStep()) return
    setStep(s => s + 1)
  }

  function handleComplete() {
    // Mark this school as having an active portal (live portal will show empty states)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`lumio_school_${slug}_active`, 'true')
      localStorage.setItem(`lumio_school_${slug}_plan`, selectedPlan)
      localStorage.setItem(`lumio_school_${slug}_name`, form.schoolName)
      localStorage.setItem(`lumio_school_${slug}_owner`, `${form.firstName} ${form.lastName}`)
      localStorage.setItem(`lumio_school_${slug}_initials`, `${form.firstName[0] ?? ''}${form.lastName[0] ?? ''}`.toUpperCase())
    }
    router.push(`/schools/${slug}`)
  }

  const isLastFormStep = step === 2
  const isBuilding = step === 3

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#07080F' }}>
      {/* Top nav */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}>
            <Sparkles size={13} color="white" />
          </div>
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Lumio <span style={{ color: '#0D9488' }}>Schools</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <Lock size={12} style={{ color: '#6B7280' }} />
          <span className="text-xs" style={{ color: '#6B7280' }}>Secured checkout</span>
        </div>
      </div>

      {/* Step progress */}
      {!isBuilding && (
        <div className="flex items-center justify-center px-6 py-6">
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: i < step ? '#0D9488' : i === step ? '#0D9488' : '#1F2937',
                      color: i <= step ? '#F9FAFB' : '#6B7280',
                    }}>
                    {i < step ? <Check size={12} /> : i + 1}
                  </div>
                  <p className="text-xs mt-1 whitespace-nowrap" style={{ color: i === step ? '#0D9488' : '#6B7280' }}>{s}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="h-px w-12 mx-2 mb-4" style={{ backgroundColor: i < step ? '#0D9488' : '#1F2937' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        {step === 0 && <StepPlan selected={selectedPlan} onSelect={setSelectedPlan} />}
        {step === 1 && <StepDetails form={form} setForm={setForm} />}
        {step === 2 && <StepPayment form={form} setForm={setForm} plan={plan} />}
        {step === 3 && <StepConfirmation schoolName={form.schoolName || 'Your School'} slug={slug} onComplete={handleComplete} />}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 mt-4" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <X size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
            <p className="text-sm" style={{ color: '#FCA5A5' }}>{error}</p>
          </div>
        )}

        {/* Navigation buttons */}
        {!isBuilding && (
          <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid #1F2937' }}>
            {step > 0 ? (
              <button onClick={() => { setStep(s => s - 1); setError('') }}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }}>
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <Link href="/schools" className="flex items-center gap-2 text-sm" style={{ color: '#6B7280' }}>
                <ArrowLeft size={14} /> Back to Schools
              </Link>
            )}

            <button onClick={next}
              className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all"
              style={{ background: 'linear-gradient(135deg, #0D9488, #0F766E)', color: '#F9FAFB' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              {isLastFormStep ? (
                <><Lock size={14} /> Start Free Trial — £0 Today</>
              ) : (
                <>Continue <ArrowRight size={14} /></>
              )}
            </button>
          </div>
        )}

        {/* Trust signals */}
        {step === 2 && (
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {[
              { icon: <Lock size={13} />, label: 'SSL Encrypted' },
              { icon: <Shield size={13} />, label: 'GDPR Compliant' },
              { icon: <Star size={13} />, label: '14-day free trial' },
              { icon: <Zap size={13} />, label: 'Cancel anytime' },
            ].map(t => (
              <div key={t.label} className="flex items-center gap-1.5">
                <span style={{ color: '#0D9488' }}>{t.icon}</span>
                <span className="text-xs" style={{ color: '#6B7280' }}>{t.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
