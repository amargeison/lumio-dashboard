import Link from 'next/link'

export const metadata = { title: 'Lumio Schools — Pricing' }

const PLANS = [
  {
    name: 'Starter',
    price: '299',
    desc: 'Everything a single school needs to automate attendance, safeguarding, and cover.',
    features: [
      'AI Morning Briefing',
      'Attendance automation & parent SMS',
      'Safeguarding concern logger',
      'Supply cover automation',
      'Basic reporting dashboard',
      'Up to 10 staff users',
      'Email support',
    ],
    cta: 'Start Free Trial',
    ctaHref: '/schools/register',
    outline: true,
    featured: false,
  },
  {
    name: 'Growth',
    price: '599',
    desc: 'Advanced insights and integrations for schools serious about data-led improvement.',
    features: [
      'Everything in Starter',
      'Advanced analytics & trends',
      'Ofsted-ready export suite',
      'SEND pupil profiles',
      'Graduated approach tracking',
      'Unlimited staff users',
      'Governor reporting module',
      'Priority support & onboarding',
    ],
    cta: 'Start Free Trial',
    ctaHref: '/schools/register',
    outline: false,
    featured: true,
  },
  {
    name: 'Trust / Academies',
    price: '1,499',
    desc: 'Cross-school visibility and trust-wide analytics for Multi-Academy Trusts.',
    features: [
      'Everything in Growth',
      'Trust-wide dashboard',
      'Cross-school benchmarking',
      'MAT-level reporting',
      'Unlimited schools',
      'API access',
      'Dedicated account manager',
      'Custom onboarding & training',
    ],
    cta: 'Contact Sales',
    ctaHref: 'https://calendly.com/lumiocms/lumio-schools',
    outline: true,
    featured: false,
  },
]

const FAQ = [
  {
    q: 'Is there a per-pupil fee?',
    a: 'No. Our pricing is flat-rate per school, regardless of pupil numbers. A 200-pupil school pays the same as a 600-pupil school on the same plan.',
  },
  {
    q: "What's included in the free trial?",
    a: "Full access to all features on your chosen plan for 14 days. No credit card required. We'll help you set up and onboard your team during the trial.",
  },
  {
    q: 'Can we add more schools later?',
    a: "Yes. You can upgrade to the Trust plan at any time. We'll pro-rate the difference for the remainder of your billing year.",
  },
  {
    q: 'Is Lumio Schools GDPR compliant?',
    a: 'Yes. All data is stored on UK servers, processed in line with UK GDPR, and we provide a Data Processing Agreement (DPA) as standard. We never share or sell school data.',
  },
]

export default function SchoolsPricingPage() {
  return (
    <div style={{ backgroundColor: '#07080F', color: '#E8EDF4', minHeight: '100vh' }}>
      <div className="max-w-6xl mx-auto px-6 pt-36 pb-24">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#C8960C', letterSpacing: '0.22em' }}>
            Simple, Transparent Pricing
          </p>
          <h1 className="font-black mb-5" style={{ color: '#F9FAFB', fontSize: 'clamp(2rem, 4vw, 3.25rem)', lineHeight: 1.05 }}>
            Built for schools.<br /><em style={{ color: '#C8960C' }}>Priced fairly.</em>
          </h1>
          <p className="text-lg mx-auto max-w-xl leading-relaxed" style={{ color: '#9CA3AF' }}>
            No per-pupil fees. No hidden costs. One price covers your whole school — staff, workflows, and everything in between.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map(plan => (
            <div key={plan.name}
              className="relative flex flex-col gap-5 rounded-xl p-8"
              style={{
                background: plan.featured ? 'linear-gradient(160deg,#1B2E52,#111E35)' : '#111E35',
                border: `1px solid ${plan.featured ? '#C8960C' : '#1F3460'}`,
              }}>
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-black uppercase tracking-widest px-4 py-1 rounded-full"
                  style={{ background: '#C8960C', color: '#0C1A2E', whiteSpace: 'nowrap' }}>
                  Most Popular
                </div>
              )}
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#C8960C', letterSpacing: '0.12em' }}>
                {plan.name}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold" style={{ color: '#C8960C', fontSize: 24, alignSelf: 'flex-start', marginTop: 10 }}>£</span>
                <span className="font-black leading-none" style={{ color: '#F9FAFB', fontSize: 56, fontFamily: 'inherit' }}>{plan.price}</span>
                <span className="text-sm ml-1" style={{ color: '#6B7280' }}>/month</span>
              </div>
              <p className="text-sm leading-relaxed pb-4" style={{ color: '#9CA3AF', borderBottom: '1px solid #1F3460' }}>
                {plan.desc}
              </p>
              <ul className="flex flex-col gap-2.5 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: '#D1D5DB' }}>
                    <span className="font-bold mt-0.5" style={{ color: '#C8960C', flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.ctaHref}
                className="block text-center text-sm font-bold uppercase tracking-wider py-3 rounded-lg transition-colors mt-auto"
                style={plan.outline
                  ? { border: '1px solid #C8960C', color: '#C8960C', background: 'transparent' }
                  : { background: '#C8960C', color: '#0C1A2E' }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 rounded-xl p-8 mb-16 text-center"
          style={{ background: '#111E35', border: '1px solid #1F3460' }}>
          {[
            { num: '150+', label: 'Pre-built workflows' },
            { num: '14',   label: 'Day free trial' },
            { num: 'KCSiE', label: '2024 compliant' },
            { num: '99.9%', label: 'Uptime SLA' },
          ].map(s => (
            <div key={s.label}>
              <span className="block font-black leading-none mb-1" style={{ color: '#C8960C', fontSize: 36 }}>{s.num}</span>
              <span className="text-xs uppercase tracking-widest" style={{ color: '#6B7280' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-bold mb-8" style={{ color: '#F9FAFB' }}>Frequently Asked Questions</h2>
          <div className="flex flex-col">
            {FAQ.map(item => (
              <div key={item.q} className="py-6" style={{ borderTop: '1px solid #1F3460' }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#C8D8F0' }}>{item.q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
