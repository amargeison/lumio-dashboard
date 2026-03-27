'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Check, X, ArrowLeft, ArrowRight, Building2, CreditCard,
  Lock, Sparkles, Zap, Shield, Star, ChevronDown, Eye, EyeOff,
  Loader2, Users, BarChart2, GitBranch, Globe, Layers
} from 'lucide-react'

// ─── Plans ─────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 599,
    period: 'month',
    tagline: 'For small teams getting started with automation.',
    badge: null,
    color: '#0D9488',
    highlight: false,
    features: [
      'Up to 3 departments',
      '20 active workflows',
      '5 integrations',
      'Read-only dashboard',
      '2,000 workflow runs/mo',
      'Email support (2-day SLA)',
      'CSV reports',
    ],
    notIncluded: [
      'AI-powered steps (Claude)',
      'API access',
      'Custom branding',
      'SSO & SCIM',
      'Dedicated account manager',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 1199,
    period: 'month',
    tagline: 'The complete solution for scaling businesses.',
    badge: 'Most Popular',
    color: '#8B5CF6',
    highlight: true,
    features: [
      '6 departments',
      '35 active workflows',
      '40+ integrations',
      'Read-only dashboard',
      'Dashboard Pro add-on (£199/mo)',
      '25,000 workflow runs/mo',
      'Priority support (8h SLA)',
      'CSV & API exports',
      'AI-powered steps (Claude)',
      'API access',
      'Custom branding',
    ],
    notIncluded: [
      'SSO & SCIM',
      'Dedicated account manager',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 2499,
    period: 'month',
    tagline: 'For multi-product organisations with complex data and compliance needs.',
    badge: 'Best Value',
    color: '#F59E0B',
    highlight: false,
    features: [
      'All 150 workflows, all 14 departments',
      'Full interactive dashboard (included)',
      'Multi-organisation view',
      'Unlimited workflow runs',
      '40+ integrations + custom',
      '4h SLA guarantee (contractual)',
      'Data residency options',
      'Full audit logs',
      'Custom integrations',
      'Onboarding & training sessions',
      'Security questionnaire & DPA',
    ],
    notIncluded: [],
  },
]

const STEPS = ['Choose Plan', 'Company Details', 'Payment', 'Building']

// ─── Form helpers ─────────────────────────────────────────────────────────────
function Input({ label, type = 'text', value, onChange, placeholder, required, hint }: {
  label: string; type?: string; value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean; hint?: string
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
          onFocus={e => e.target.style.borderColor = '#6C3FC5'}
          onBlur={e => e.target.style.borderColor = '#374151'}
        />
        {type === 'password' && (
          <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }}>
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{hint}</p>}
    </div>
  )
}

function SelectField({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#D1D5DB' }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none appearance-none"
          style={{ backgroundColor: '#0A0B11', border: '1px solid #374151', color: value ? '#F9FAFB' : '#6B7280' }}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6B7280' }} />
      </div>
    </div>
  )
}

// ─── Step 1: Plan ─────────────────────────────────────────────────────────────
function StepPlan({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-black mb-1" style={{ color: '#F9FAFB' }}>Choose your plan</h2>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>All plans include a 14-day free trial. No card charged until trial ends.</p>
      </div>

      {/* Feature icons */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: <Users size={16} />, label: 'CRM & Contacts', color: '#0D9488' },
          { icon: <BarChart2 size={16} />, label: 'Insights & Reports', color: '#8B5CF6' },
          { icon: <GitBranch size={16} />, label: 'Workflow Automation', color: '#F59E0B' },
          { icon: <Layers size={16} />, label: 'Project Management', color: '#EF4444' },
        ].map(f => (
          <div key={f.label} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <span style={{ color: f.color }}>{f.icon}</span>
            <p className="text-xs font-medium" style={{ color: '#D1D5DB' }}>{f.label}</p>
          </div>
        ))}
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
                border: `2px solid ${isSelected ? plan.color : '#1F2937'}`,
                transform: plan.highlight ? 'scale(1.02)' : 'scale(1)',
              }}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap" style={{ backgroundColor: plan.color, color: '#F9FAFB' }}>{plan.badge}</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <p className="text-base font-bold" style={{ color: '#F9FAFB' }}>{plan.name}</p>
                {isSelected && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: plan.color }}><Check size={11} color="white" /></div>}
              </div>
              <div className="mb-2">
                <span className="text-3xl font-black" style={{ color: plan.color }}>£{plan.price}</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>/month</span>
              </div>
              <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>{plan.tagline}</p>
              <div className="flex flex-col gap-1.5">
                {plan.features.slice(0, 8).map(f => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={11} className="mt-0.5 flex-shrink-0" style={{ color: plan.color }} />
                    <p className="text-xs" style={{ color: '#D1D5DB' }}>{f}</p>
                  </div>
                ))}
                {plan.features.length > 8 && (
                  <p className="text-xs mt-1" style={{ color: plan.color }}>+{plan.features.length - 8} more →</p>
                )}
                {plan.notIncluded.length > 0 && (
                  <div className="mt-2 pt-2" style={{ borderTop: '1px solid #1F2937' }}>
                    {plan.notIncluded.slice(0, 2).map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <X size={10} className="flex-shrink-0" style={{ color: '#4B5563' }} />
                        <p className="text-xs" style={{ color: '#4B5563' }}>{f}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>💡 Save 20% with annual billing</p>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Switch to annual at any time from Settings. 14-day free trial on all plans.</p>
        </div>
        <span className="text-xs rounded-lg px-3 py-1.5 font-semibold flex-shrink-0" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>Save 2 months</span>
      </div>
    </div>
  )
}

// ─── Step 2: Company details ──────────────────────────────────────────────────
function StepDetails({ form, setForm }: { form: Record<string, string>; setForm: (f: Record<string, string>) => void }) {
  const set = (key: string) => (v: string) => setForm({ ...form, [key]: v })
  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <div>
        <h2 className="text-2xl font-black mb-1" style={{ color: '#F9FAFB' }}>Your company details</h2>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>We use this to set up your workspace. Update everything later in Settings.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Company Name" value={form.companyName} onChange={set('companyName')} placeholder="e.g. Lumio Technologies Ltd" required />
        </div>
        <SelectField label="Industry" value={form.industry} onChange={set('industry')} required options={[
          { value: '', label: 'Select industry...' },
          { value: 'saas', label: 'SaaS / Software' },
          { value: 'edtech', label: 'EdTech' },
          { value: 'fintech', label: 'FinTech' },
          { value: 'ecommerce', label: 'E-commerce' },
          { value: 'consulting', label: 'Consulting' },
          { value: 'agency', label: 'Agency / Creative' },
          { value: 'healthcare', label: 'Healthcare' },
          { value: 'legal', label: 'Legal / Professional Services' },
          { value: 'property', label: 'Property / Real Estate' },
          { value: 'manufacturing', label: 'Manufacturing' },
          { value: 'charity', label: 'Charity / Non-profit' },
          { value: 'other', label: 'Other' },
        ]} />
        <SelectField label="Company Size" value={form.size} onChange={set('size')} required options={[
          { value: '', label: 'Select size...' },
          { value: '1-5', label: '1–5 employees' },
          { value: '6-20', label: '6–20 employees' },
          { value: '21-50', label: '21–50 employees' },
          { value: '51-200', label: '51–200 employees' },
          { value: '201-500', label: '201–500 employees' },
          { value: '500+', label: '500+ employees' },
        ]} />
        <Input label="Company Website" type="url" value={form.website} onChange={set('website')} placeholder="https://yourcompany.com" />
        <Input label="Company Phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+44 20 1234 5678" />
        <div className="sm:col-span-2">
          <Input label="Company Address" value={form.address} onChange={set('address')} placeholder="Full address including postcode" required />
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1F2937', paddingTop: 20 }}>
        <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Your account</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First Name" value={form.firstName} onChange={set('firstName')} placeholder="e.g. Arron" required />
          <Input label="Last Name" value={form.lastName} onChange={set('lastName')} placeholder="e.g. Margeison" required />
          <Input label="Your Role" value={form.role} onChange={set('role')} placeholder="e.g. CEO, Product Manager" required />
          <Input label="Work Email" type="email" value={form.email} onChange={set('email')} placeholder="you@yourcompany.com" required />
          <div className="sm:col-span-2">
            <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" required hint="You can change this any time in Settings." />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Payment ──────────────────────────────────────────────────────────
function StepPayment({ form, setForm, plan }: {
  form: Record<string, string>
  setForm: (f: Record<string, string>) => void
  plan: typeof PLANS[0]
}) {
  const set = (key: string) => (v: string) => setForm({ ...form, [key]: v })
  const formatCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  const formatExpiry = (v: string) => {
    const c = v.replace(/\D/g, '').slice(0, 4)
    return c.length >= 2 ? `${c.slice(0, 2)}/${c.slice(2)}` : c
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Order summary sidebar */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl p-5 sticky top-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-4" style={{ color: '#F9FAFB' }}>Order Summary</p>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Lumio — {plan.name}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Monthly subscription</p>
            </div>
            <p className="text-lg font-black flex-shrink-0" style={{ color: plan.color }}>£{plan.price}/mo</p>
          </div>
          <div className="flex flex-col gap-1.5 py-3 mb-3" style={{ borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
            {plan.features.slice(0, 6).map(f => (
              <div key={f} className="flex items-center gap-2">
                <Check size={10} style={{ color: plan.color, flexShrink: 0 }} />
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{f}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span style={{ color: '#9CA3AF' }}>Monthly</span>
            <span style={{ color: '#D1D5DB' }}>£{plan.price}</span>
          </div>
          <div className="flex justify-between text-sm mb-3">
            <span style={{ color: '#22C55E' }}>14-day trial</span>
            <span style={{ color: '#22C55E' }}>Free</span>
          </div>
          <div className="flex justify-between mb-4 pt-3" style={{ borderTop: '1px solid #1F2937' }}>
            <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Due today</span>
            <span className="text-xl font-black" style={{ color: '#22C55E' }}>£0.00</span>
          </div>
          <p className="text-xs text-center" style={{ color: '#4B5563' }}>Card charged £{plan.price}/month after trial ends. Cancel anytime.</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Lock size={11} style={{ color: '#6B7280' }} />
            <p className="text-xs" style={{ color: '#6B7280' }}>Secured by Stripe · 256-bit SSL</p>
          </div>
        </div>
      </div>

      {/* Payment form */}
      <div className="lg:col-span-3 flex flex-col gap-5">
        <div>
          <h2 className="text-2xl font-black mb-1" style={{ color: '#F9FAFB' }}>Payment details</h2>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            Free trial until {new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Nothing charged today.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#D1D5DB' }}>Card number <span style={{ color: '#EF4444' }}>*</span></label>
          <div className="relative">
            <input type="text" inputMode="numeric" value={form.cardNumber}
              onChange={e => setForm({ ...form, cardNumber: formatCard(e.target.value) })}
              placeholder="1234 5678 9012 3456" maxLength={19}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: '#0A0B11', border: '1px solid #374151', color: '#F9FAFB' }}
              onFocus={e => e.target.style.borderColor = '#6C3FC5'}
              onBlur={e => e.target.style.borderColor = '#374151'} />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              {['VISA', 'MC', 'AMEX'].map(c => (
                <span key={c} className="text-xs rounded px-1 font-bold" style={{ backgroundColor: '#1F2937', color: '#6B7280', fontSize: 8 }}>{c}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#D1D5DB' }}>Expiry <span style={{ color: '#EF4444' }}>*</span></label>
            <input type="text" inputMode="numeric" value={form.expiry}
              onChange={e => setForm({ ...form, expiry: formatExpiry(e.target.value) })}
              placeholder="MM/YY" maxLength={5}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: '#0A0B11', border: '1px solid #374151', color: '#F9FAFB' }}
              onFocus={e => e.target.style.borderColor = '#6C3FC5'}
              onBlur={e => e.target.style.borderColor = '#374151'} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#D1D5DB' }}>CVV <span style={{ color: '#EF4444' }}>*</span></label>
            <input type="text" inputMode="numeric" value={form.cvv}
              onChange={e => setForm({ ...form, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              placeholder="123" maxLength={4}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: '#0A0B11', border: '1px solid #374151', color: '#F9FAFB' }}
              onFocus={e => e.target.style.borderColor = '#6C3FC5'}
              onBlur={e => e.target.style.borderColor = '#374151'} />
          </div>
        </div>

        <Input label="Name on card" value={form.cardName} onChange={set('cardName')} placeholder="e.g. Arron Margeison" required />
        <Input label="Billing postcode" value={form.postcode} onChange={set('postcode')} placeholder="e.g. MK9 1AA" required />

        <div className="flex items-start gap-3 rounded-xl p-3" style={{ backgroundColor: 'rgba(108,63,197,0.06)', border: '1px solid rgba(108,63,197,0.2)' }}>
          <input type="checkbox" checked={form.terms === 'true'}
            onChange={e => setForm({ ...form, terms: e.target.checked ? 'true' : '' })}
            className="mt-0.5 flex-shrink-0" style={{ accentColor: '#6C3FC5' }} />
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            I agree to the <Link href="/terms" className="underline" style={{ color: '#6C3FC5' }}>Terms of Service</Link> and <Link href="/privacy" className="underline" style={{ color: '#6C3FC5' }}>Privacy Policy</Link>. I understand my 14-day free trial starts today and my card will be charged £{plan.price}/month afterwards. I can cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Building workspace ────────────────────────────────────────────
function StepBuilding({ companyName, slug, onComplete }: {
  companyName: string; slug: string; onComplete: () => void
}) {
  const [stage, setStage] = useState(0)
  const stages = [
    'Creating your workspace...',
    'Setting up CRM & contacts...',
    'Configuring sales pipeline...',
    'Activating HR & People module...',
    'Setting up insights & reports...',
    'Loading Workflows library...',
    'Applying your company branding...',
    'Workspace ready! Taking you there now...',
  ]

  useState(() => {
    const go = (i: number) => {
      if (i < stages.length) {
        setTimeout(() => { setStage(i); go(i + 1) }, i === stages.length - 1 ? 600 : 850)
      } else {
        setTimeout(onComplete, 500)
      }
    }
    go(0)
  })

  const done = stage >= stages.length - 1

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6C3FC5, #4F46E5)' }}>
          {done
            ? <Check size={36} color="white" />
            : <Building2 size={36} color="white" className="animate-pulse" />}
        </div>
        {!done && <div className="absolute inset-0 rounded-2xl animate-ping" style={{ backgroundColor: 'rgba(108,63,197,0.2)' }} />}
      </div>

      <h2 className="text-2xl font-black mb-2" style={{ color: '#F9FAFB' }}>
        {done ? '🎉 Workspace Ready!' : `Building ${companyName}...`}
      </h2>
      <p className="text-sm mb-8" style={{ color: '#9CA3AF' }}>
        {done ? 'Your Lumio workspace is live. Welcome aboard.' : 'Setting everything up — usually takes about 15 seconds.'}
      </p>

      <div className="w-full max-w-sm flex flex-col gap-2 text-left">
        {stages.map((s, i) => (
          <div key={s} className="flex items-center gap-3 rounded-lg px-3 py-2"
            style={{ backgroundColor: i <= stage ? 'rgba(108,63,197,0.08)' : '#111318', border: `1px solid ${i <= stage ? 'rgba(108,63,197,0.2)' : '#1F2937'}` }}>
            {i < stage
              ? <Check size={13} style={{ color: '#22C55E', flexShrink: 0 }} />
              : i === stage
              ? <Loader2 size={13} style={{ color: '#6C3FC5', flexShrink: 0 }} className="animate-spin" />
              : <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#1F2937' }} />}
            <p className="text-xs" style={{ color: i <= stage ? '#D1D5DB' : '#4B5563' }}>{s}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CompanyCheckoutPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState('growth')
  const [error, setError] = useState('')
  const [form, setForm] = useState<Record<string, string>>({
    companyName: '', industry: '', size: '', website: '', phone: '', address: '',
    firstName: '', lastName: '', role: '', email: '', password: '',
    cardNumber: '', expiry: '', cvv: '', cardName: '', postcode: '', terms: '',
  })

  const plan = PLANS.find(p => p.id === selectedPlan) ?? PLANS[1]

  const slug = form.companyName
    ? form.companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+$/, '') || 'my-company'
    : 'my-company'

  function validate() {
    setError('')
    if (step === 1) {
      const req = ['companyName', 'industry', 'size', 'address', 'firstName', 'lastName', 'role', 'email', 'password']
      if (req.some(k => !form[k])) { setError('Please fill in all required fields.'); return false }
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
    return true
  }

  function next() {
    if (!validate()) return
    setStep(s => s + 1)
  }

  function handleComplete() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumio_company_active', 'true')
      localStorage.setItem('lumio_company_name', form.companyName)
      localStorage.setItem('lumio_company_plan', selectedPlan)
      localStorage.setItem('lumio_company_initials',
        `${form.firstName[0] ?? ''}${form.lastName[0] ?? ''}`.toUpperCase())
      localStorage.setItem('lumio_company_industry', form.industry)
      localStorage.setItem('lumio_company_size', form.size)
      // Clear all hasData flags so every page starts empty
      const keys = Object.keys(localStorage).filter(k => k.startsWith('lumio_dashboard_'))
      keys.forEach(k => localStorage.removeItem(k))
    }
    router.push('/')
  }

  const isBuilding = step === 3

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#07080F' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #6C3FC5, #4F46E5)' }}>
            <Sparkles size={13} color="white" />
          </div>
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Lumio <span style={{ color: '#6C3FC5' }}>CRM</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <Lock size={12} style={{ color: '#6B7280' }} />
          <span className="text-xs" style={{ color: '#6B7280' }}>Secured checkout</span>
        </div>
      </div>

      {/* Step progress */}
      {!isBuilding && (
        <div className="flex items-center justify-center px-6 py-6">
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: i <= step ? '#6C3FC5' : '#1F2937', color: i <= step ? '#F9FAFB' : '#6B7280' }}>
                    {i < step ? <Check size={12} /> : i + 1}
                  </div>
                  <p className="text-xs mt-1 whitespace-nowrap" style={{ color: i === step ? '#6C3FC5' : '#6B7280' }}>{s}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="h-px w-12 mx-2 mb-4" style={{ backgroundColor: i < step ? '#6C3FC5' : '#1F2937' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        {step === 0 && <StepPlan selected={selectedPlan} onSelect={setSelectedPlan} />}
        {step === 1 && <StepDetails form={form} setForm={setForm} />}
        {step === 2 && <StepPayment form={form} setForm={setForm} plan={plan} />}
        {step === 3 && <StepBuilding companyName={form.companyName || 'Your Company'} slug={slug} onComplete={handleComplete} />}

        {error && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 mt-4"
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <X size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
            <p className="text-sm" style={{ color: '#FCA5A5' }}>{error}</p>
          </div>
        )}

        {!isBuilding && (
          <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid #1F2937' }}>
            {step > 0 ? (
              <button onClick={() => { setStep(s => s - 1); setError('') }}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
                style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }}>
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <Link href="/" className="flex items-center gap-2 text-sm" style={{ color: '#6B7280' }}>
                <ArrowLeft size={14} /> Back to home
              </Link>
            )}
            <button onClick={next}
              className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #6C3FC5, #4F46E5)', color: '#F9FAFB' }}>
              {step === 2
                ? <><Lock size={14} /> {plan.price > 0 ? `Start Lumio — £${plan.price} Today` : 'Start Free Trial — £0 Today'}</>
                : <>Continue <ArrowRight size={14} /></>}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {[
              { icon: <Lock size={13} />, label: 'SSL Encrypted' },
              { icon: <Shield size={13} />, label: 'GDPR Compliant' },
              { icon: <Star size={13} />, label: '14-day free trial' },
              { icon: <Zap size={13} />, label: 'Cancel anytime' },
            ].map(t => (
              <div key={t.label} className="flex items-center gap-1.5">
                <span style={{ color: '#6C3FC5' }}>{t.icon}</span>
                <span className="text-xs" style={{ color: '#6B7280' }}>{t.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
