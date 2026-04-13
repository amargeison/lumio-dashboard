'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, Twitter, Linkedin, Github } from 'lucide-react'
import BookTrialModal from '@/app/(website)/components/BookTrialModal'
import TrialTypeModal from '@/app/(website)/components/TrialTypeModal'

const SPORTS_NAV: { label: string; href: string; badge?: string }[] = [
  { label: 'Product',    href: '/sports-product' },
  { label: 'Our AI',     href: '/ai' },
  { label: 'Football',   href: '/football' },
  { label: 'Womens FC',  href: '/womens-football' },
  { label: 'Rugby',      href: '/rugby' },
  { label: 'Cricket',    href: '/cricket' },
  { label: 'Tennis',     href: '/tennis' },
  { label: 'Golf',       href: '/golf' },
  { label: 'Boxing',     href: '/boxing' },
  { label: 'Darts',      href: '/darts' },
  { label: 'Pricing',    href: '/pricing-sports' },
  { label: 'About',      href: '/about' },
  { label: 'Blog',       href: '/blog' },
]

const BUSINESS_NAV: { label: string; href: string; badge?: string }[] = [
  { label: 'Product',      href: '/product' },
  { label: 'Workflows',    href: '/product#workflows' },
  { label: 'Schools',      href: '/schools' },
  { label: 'CRM',          href: '/lumio-crm' },
  { label: 'Integrations', href: '/product#integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'About',        href: '/about' },
  { label: 'Blog',         href: '/blog' },
]

function useIsSports() {
  const [isSports, setIsSports] = useState(false)
  useEffect(() => {
    setIsSports(window.location.hostname.includes('lumiosports'))
  }, [])
  return isSports
}

const SCHOOLS_EXTRA_LINKS = [
  { label: 'Features', href: '/schools/features' },
  { label: 'SSO & Rostering', href: '/schools/sso' },
  { label: 'Integrations', href: '/schools/integrations' },
]

const FOOTER_LINKS = [
  { label: 'Product',  href: '/product'  },
  { label: 'Pricing',  href: '/pricing'  },
  { label: 'About',    href: '/about'    },
  { label: 'Blog',     href: '/blog'     },
  { label: 'Docs',     href: '#'         },
  { label: 'Status',   href: '#'         },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy',  href: '/privacy' },
  { label: 'Terms of Service',href: '/terms'   },
  { label: 'Cookie Policy',   href: '/cookies' },
]

function Nav() {
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showTrial, setShowTrial] = useState(false)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [showEarlyAccess, setShowEarlyAccess] = useState(false)
  const [betaBannerVisible, setBetaBannerVisible] = useState(false)
  const pathname = usePathname()
  const isSchools = pathname?.startsWith('/schools') ?? false
  const isFootball = pathname?.startsWith('/football') ?? false
  const isTennis = pathname?.startsWith('/tennis') ?? false
  const isSports = useIsSports()
  const showBetaBanner = !isSports && betaBannerVisible

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem('lumio_beta_banner_dismissed')) {
      setBetaBannerVisible(true)
    }
  }, [])

  function dismissBetaBanner() {
    try { localStorage.setItem('lumio_beta_banner_dismissed', 'true') } catch {}
    setBetaBannerVisible(false)
  }

  const NAV_LINKS = isSports ? SPORTS_NAV : BUSINESS_NAV
  const baseLinks = isSchools && NAV_LINKS.some(l => l.label === 'Schools')
    ? [...NAV_LINKS.slice(0, NAV_LINKS.findIndex(l => l.label === 'Schools') + 1), ...SCHOOLS_EXTRA_LINKS, ...NAV_LINKS.slice(NAV_LINKS.findIndex(l => l.label === 'Schools') + 1)]
    : NAV_LINKS
  const navLinks = baseLinks
    .filter(l => {
      if (isSchools && (l.label === 'CRM' || l.label === 'Sports')) return false
      if (isFootball && (l.label === 'Schools' || l.label === 'CRM')) return false
      return true
    })
    .filter(l => {
      // Remove SSO & Rostering from football pages (it's a schools-only feature)
      if (isFootball && l.label === 'SSO & Rostering') return false
      return true
    })
    .map(l => {
      if (isSchools) {
        if (l.label === 'Product')      return { ...l, href: '/schools/product' }
        if (l.label === 'Pricing')      return { ...l, href: '/schools/pricing' }
        if (l.label === 'Workflows')    return { ...l, href: '/schools/workflows' }
        if (l.label === 'Integrations') return { ...l, href: '/schools/integrations' }
        if (l.label === 'About')        return { ...l, href: '/schools/about' }
      }
      return l
    })

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const openHandler = () => setShowEarlyAccess(true)
    window.addEventListener('lumio-open-early-access', openHandler)
    return () => window.removeEventListener('lumio-open-early-access', openHandler)
  }, [])

  return (
    <>
    {showBetaBanner && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 40,
          backgroundColor: '#0D9488',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '0 16px',
          zIndex: 51,
          fontSize: 13,
        }}
      >
        <span>🚀 Lumio is in early access — your feedback shapes the product.</span>
        <a
          href="mailto:hello@lumiocms.com?subject=Lumio%20Feedback"
          style={{ color: '#FFFFFF', textDecoration: 'underline', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          Share feedback &rarr;
        </a>
        <button
          type="button"
          onClick={dismissBetaBanner}
          aria-label="Dismiss beta banner"
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.85,
          }}
        >
          <X size={16} />
        </button>
      </div>
    )}
    <header
      className="fixed left-0 right-0 z-50 transition-all duration-300"
      style={{
        top: showBetaBanner ? 40 : 0,
        backgroundColor: scrolled ? 'rgba(7,8,15,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(31,41,55,0.6)' : '1px solid transparent',
      }}
    >
      <div
        className={`w-full mx-auto flex max-w-7xl items-center ${isSports ? 'px-6 py-2 justify-between' : ''}`}
        style={isSports ? { minHeight: 100 } : { display: 'flex', alignItems: 'center', padding: '12px 24px', width: '100%', boxSizing: 'border-box', overflow: 'hidden', minHeight: 80 }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" style={isSports ? { flexShrink: 0, overflow: 'visible' } : { flexShrink: 0, marginRight: isSchools ? 16 : 24, overflow: 'visible' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={isTennis ? '/tennis_transparent_logo.png' : isSports ? '/lumio_logo_ultra_clean.png' : '/lumio-transparent-new.png'} alt={isTennis ? 'Lumio Tennis' : isSports ? 'Lumio Sports' : 'Lumio'}
            style={{ height: isSports ? '112px' : '72px', width: 'auto', maxHeight: 'none', objectFit: 'contain', display: 'block', flexShrink: 0 }} />
          {!isSports && !isSchools && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              color: '#0D9488',
              border: '1px solid #0D9488',
              borderRadius: 4,
              padding: '1px 5px',
              marginLeft: 6,
              verticalAlign: 'middle',
            }}>
              BETA
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className={`hidden md:flex items-center ${isSports ? 'gap-2' : ''}`} style={isSports ? {} : isSchools ? { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 1, overflow: 'hidden' } : { display: 'flex', alignItems: 'center', gap: 16, flexShrink: 1, overflow: 'hidden' }}>
          {navLinks.map(l => (
            <Link key={l.label} href={l.href}
              className={`flex items-center gap-1 rounded-lg transition-colors whitespace-nowrap ${isSports ? 'px-2 py-2 text-sm font-semibold' : isSchools ? 'px-2 py-2 font-medium' : 'px-2 py-2 font-medium'}`}
              style={{ color: '#9CA3AF', ...(isSchools ? { fontSize: 13 } : isSports ? {} : { fontSize: 14 }) }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#9CA3AF' }}>
              {l.label}
              {(l as any).badge && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(139,92,246,0.2)', color: '#A78BFA', lineHeight: 1, boxShadow: '0 0 6px rgba(139,92,246,0.4)' }}>
                  {(l as any).badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center" style={isSports ? { gap: 8, flexShrink: 0 } : { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>
          {!isSports && (
            <button
              type="button"
              onClick={() => setShowEarlyAccess(true)}
              style={{
                color: '#0D9488',
                border: '1px solid #0D9488',
                borderRadius: 20,
                padding: isSchools ? '4px 12px' : '6px 16px',
                fontSize: isSchools ? 13 : 14,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                marginRight: 4,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(13,148,136,0.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
            >
              Early Access
            </button>
          )}
          {isSports ? (
            <>
              <Link href="/sports-signup"
                className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                style={{ backgroundColor: '#8B5CF6', color: '#F9FAFB' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#7C3AED' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#8B5CF6' }}>
                Apply for founding access
              </Link>
              <Link href="/sports/try-demo"
                className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                style={{ backgroundColor: 'transparent', color: '#F9FAFB', border: '1px solid rgba(255,255,255,0.2)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}>
                Try a demo
              </Link>
            </>
          ) : isFootball ? (
            <>
              <Link href="/book-demo"
                className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#0F766E' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#0D9488' }}>
                Book a Demo
              </Link>
              <Link href="/book-demo"
                className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
                style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#7C3AED' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#6C3FC5' }}>
                Request Access
              </Link>
            </>
          ) : isSchools ? (
            <Link href="/signup?portal=schools"
              className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#0F766E' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#0D9488' }}>
              Free School Trial
            </Link>
          ) : (
            <button onClick={() => setShowTypeModal(true)}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0F766E' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0D9488' }}>
              Free 14 day trial
            </button>
          )}
          <Link href={isSchools ? '/login?type=school' : isFootball ? '/login?type=football' : isSports ? '/sports-login' : '/login'}
            className={isSchools ? 'px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors' : 'px-4 py-2 text-sm font-semibold rounded-lg transition-colors'}
            style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#1F2937' }}>
            Sign In
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 rounded-lg" style={{ color: '#9CA3AF' }}
          onClick={() => setMobileOpen(v => !v)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t px-6 py-4 flex flex-col gap-4"
          style={{ backgroundColor: '#07080F', borderColor: '#1F2937' }}>
          {navLinks.map(l => (
            <Link key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-medium py-2" style={{ color: '#9CA3AF' }}>
              {l.label}
              {(l as any).badge && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>
                  {(l as any).badge}
                </span>
              )}
            </Link>
          ))}
          <div className="flex flex-col gap-3 pt-2 border-t" style={{ borderColor: '#1F2937' }}>
            {isSports ? (
              <>
                <Link href="/sports-signup"
                  className="text-sm font-semibold py-2 text-center rounded-lg"
                  style={{ backgroundColor: '#8B5CF6', color: '#F9FAFB' }}
                  onClick={() => setMobileOpen(false)}>Apply for founding access</Link>
                <Link href="/sports/try-demo"
                  className="text-sm font-semibold py-2 text-center rounded-lg"
                  style={{ backgroundColor: 'transparent', color: '#F9FAFB', border: '1px solid rgba(255,255,255,0.2)' }}
                  onClick={() => setMobileOpen(false)}>Try a demo</Link>
              </>
            ) : isFootball ? (
              <>
                <Link href="/book-demo"
                  className="text-sm font-semibold py-2 text-center rounded-lg"
                  style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
                  onClick={() => setMobileOpen(false)}>Book a Demo</Link>
                <Link href="/book-demo"
                  className="text-sm font-semibold py-2 text-center rounded-lg"
                  style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
                  onClick={() => setMobileOpen(false)}>Request Access</Link>
              </>
            ) : isSchools ? (
              <Link href="/signup?portal=schools"
                className="text-sm font-semibold py-2 text-center rounded-lg"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
                onClick={() => setMobileOpen(false)}>Free School Trial</Link>
            ) : (
              <button onClick={() => { setMobileOpen(false); setShowTypeModal(true) }}
                className="text-sm font-semibold py-2 text-center rounded-lg"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Free 14 day trial</button>
            )}
            <Link href={isSchools ? '/login?type=school' : isFootball ? '/login?type=football' : isSports ? '/sports-login' : '/login'}
              className="text-sm font-semibold py-2 text-center rounded-lg"
              style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}
              onClick={() => setMobileOpen(false)}>Sign In</Link>
          </div>
        </div>
      )}
    </header>

    {showTrial && (
      <BookTrialModal onClose={() => setShowTrial(false)} />
    )}
    {showTypeModal && (
      <TrialTypeModal
        onClose={() => setShowTypeModal(false)}
      />
    )}
    {showEarlyAccess && (
      <EarlyAccessModal isSchools={isSchools} onClose={() => setShowEarlyAccess(false)} />
    )}
  </>
  )
}

function EarlyAccessModal({ isSchools, onClose }: { isSchools: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const TEAL = '#0D9488'
  const TEAL_FAINT = 'rgba(13,148,136,0.08)'
  const TEAL_BORDER = 'rgba(13,148,136,0.35)'

  const copy = isSchools
    ? {
        h2: '6 months free for your school.',
        paragraphs: [
          "Lumio for Schools is new. We know it. And we'd rather be honest about that than pretend we have 500 schools already using it.",
          "We're looking for a small number of schools — primary, secondary, or MAT — who are fed up with overpriced, over-promised edtech and want to try something different.",
          "Sign up and get 6 months completely free. No commitment. No contract. No sales team breathing down your neck. At the end, all we ask is an honest case study and the chance to keep working with you — so we can build exactly what your school actually needs.",
        ],
        pills: [
          '6 months free — no card required',
          "We fix things that week, not 'on the roadmap'",
          'No lock-in, no exit fees',
        ],
        fine: 'Only 5 school spots remaining · No credit card · Cancel anytime',
        signupHref: '/signup?portal=schools',
        subject: 'Early Access Application — Schools',
      }
    : {
        h2: '6 months free. No catch.',
        paragraphs: [
          "Lumio is new. We're not going to pretend otherwise. We're looking for a small number of forward-thinking businesses who want to be part of shaping it — not just using it.",
          'Sign up and get 6 months completely free. No commitment. No contract. No pushy sales calls. At the end, all we ask is an honest case study and the chance to keep working with you to make Lumio exactly what your business needs.',
          "If something doesn't work — we'll fix it. If you want a feature — we'll build it. That's the deal.",
        ],
        pills: [
          '6 months free — no card required',
          'We build what you ask for',
          'Cancel anytime, no questions',
        ],
        fine: 'Only 10 spots remaining · No credit card · Cancel anytime',
        signupHref: '/signup',
        subject: 'Early Access Application',
      }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const mailto = `mailto:hello@lumiocms.com?subject=${encodeURIComponent(copy.subject)}&body=${encodeURIComponent(
      `I'd like to apply for the Lumio early access programme.\n\nEmail: ${email}\n`
    )}`
    window.location.href = mailto
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#0D1117',
          border: `1px solid ${TEAL_BORDER}`,
          borderRadius: 18,
          padding: 32,
          position: 'relative',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(13,148,136,0.15)',
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: '#6B7280',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#F9FAFB' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6B7280' }}
        >
          <X size={20} />
        </button>

        {/* Eyebrow */}
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: TEAL, marginBottom: 12, textTransform: 'uppercase' }}>
          Early Access Programme
        </p>

        {/* H2 */}
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#F9FAFB', marginBottom: 16, lineHeight: 1.15 }}>
          {copy.h2}
        </h2>

        {/* Body */}
        <div style={{ marginBottom: 20 }}>
          {copy.paragraphs.map((p, i) => (
            <p key={i} style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.65, marginBottom: i === copy.paragraphs.length - 1 ? 0 : 12 }}>
              {p}
            </p>
          ))}
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {copy.pills.map(p => (
            <span
              key={p}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                color: TEAL,
                backgroundColor: TEAL_FAINT,
                border: `1px solid ${TEAL_BORDER}`,
              }}
            >
              {p}
            </span>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="email"
            required
            placeholder="Enter your work email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #1F2937',
              backgroundColor: '#0A0B10',
              color: '#F9FAFB',
              fontSize: 14,
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = TEAL }}
            onBlur={e => { e.currentTarget.style.borderColor = '#1F2937' }}
          />
          <button
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '13px 20px',
              backgroundColor: TEAL,
              color: '#F9FAFB',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#0F766E' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = TEAL }}
          >
            Apply for early access
          </button>
          <Link
            href={copy.signupHref}
            onClick={onClose}
            style={{
              textAlign: 'center',
              fontSize: 13,
              color: '#9CA3AF',
              textDecoration: 'underline',
              padding: '4px 0',
            }}
          >
            Or sign up directly →
          </Link>
        </form>

        {/* Fine print */}
        <p style={{ fontSize: 11, color: '#6B7280', marginTop: 16, textAlign: 'center' }}>
          {copy.fine}
        </p>
      </div>
    </div>
  )
}

function Footer() {
  const isSports = useIsSports()
  return (
    <footer style={{ backgroundColor: '#07080F', borderTop: '1px solid #1F2937' }}>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={isSports ? '/lumio_logo_ultra_clean.png' : '/lumio-transparent-new.png'} alt={isSports ? 'Lumio Sports' : 'Lumio'}
              style={{ width: '200px', height: 'auto', objectFit: 'contain', display: 'block', marginBottom: 16 }} />
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#6B7280' }}>
              Your business, fully connected.
            </p>
            <div className="flex items-center gap-3">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a key={i} href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                  style={{ backgroundColor: '#111318', color: '#6B7280' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280' }}>
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-2 grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Product</p>
              {FOOTER_LINKS.slice(0, 3).map(l => (
                <Link key={l.label} href={l.href} className="block mb-3 text-sm transition-colors"
                  style={{ color: '#6B7280' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280' }}>
                  {l.label}
                </Link>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Resources</p>
              {FOOTER_LINKS.slice(3).map(l => (
                <Link key={l.label} href={l.href} className="block mb-3 text-sm transition-colors"
                  style={{ color: '#6B7280' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280' }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Get started</p>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>See how Lumio can connect your business in under 30 minutes.</p>
            <Link href="/demo"
              className="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              Start free trial →
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          style={{ borderTop: '1px solid #1F2937' }}>
          <p className="text-xs" style={{ color: '#4B5563' }}>© Lumio 2025. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {LEGAL_LINKS.map(l => (
              <Link key={l.label} href={l.href} className="text-xs transition-colors"
                style={{ color: '#4B5563' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#9CA3AF' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#4B5563' }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main style={{ backgroundColor: '#07080F', minHeight: '100vh' }}>
        {children}
      </main>
      <Footer />
    </>
  )
}
