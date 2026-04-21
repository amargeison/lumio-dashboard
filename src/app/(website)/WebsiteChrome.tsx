'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, Twitter, Linkedin, Github, ArrowUpRight } from 'lucide-react'
import { FootballNavDropdown, FOOTBALL_TIERS } from '@/app/(website)/components/FootballNavDropdown'

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

// Unified lumiocms.com nav while Business + Schools are behind coming-soon
// waitlists. Lumio Business / Lumio Schools both point at their waitlist
// pages; Lumio Sports opens the separate sports site in a new tab; About is
// the company-story page. Blog and deeper product nav intentionally excluded
// so there is a single path per product.
const BUSINESS_NAV: { label: string; href: string; badge?: string; external?: boolean }[] = [
  { label: 'Lumio Business', href: '/coming-soon/business' },
  { label: 'Lumio Schools',  href: '/coming-soon/schools'  },
  { label: 'Lumio Sports',   href: 'https://lumiosports.com', external: true },
  { label: 'About',          href: '/about' },
]

// `initial` seeds useState so the server render matches the actual host — no
// hydration flash on /sports when the request comes in on lumiosports.com.
// The useEffect is belt-and-braces for client-side route transitions where
// the server-passed initial value could drift (it won't in practice, since
// the hostname never changes mid-session).
function useIsSports(initial: boolean = false) {
  const [isSports, setIsSports] = useState(initial)
  useEffect(() => {
    setIsSports(window.location.hostname.includes('lumiosports'))
  }, [])
  return isSports
}

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

function Nav({ initialIsSportsHost }: { initialIsSportsHost: boolean }) {
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [betaBannerVisible, setBetaBannerVisible] = useState(false)
  const pathname = usePathname()
  const isSchools = pathname?.startsWith('/schools') ?? false
  const isFootball = pathname?.startsWith('/football') ?? false
  const isTennis = pathname?.startsWith('/tennis') ?? false
  const isSports = useIsSports(initialIsSportsHost)
  // The "Lumio is in early access — share feedback" banner used to sit on
  // lumiocms pages. It's a launch signal (implies live product) so we hide
  // it across both domains now. The state + dismiss hook remain in case we
  // reintroduce a per-site beta banner later.
  const showBetaBanner = false

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

  // Lumio Business + Schools are behind coming-soon waitlists on lumiocms.com,
  // so BUSINESS_NAV no longer contains Schools / CRM / Product / Pricing. The
  // old schools sub-nav expansion and href-rewrite chain is now dead weight —
  // SPORTS_NAV drives everything on lumiosports.com, and the isFootball filter
  // below is kept as a guard even though the labels it targets are already
  // gone from BUSINESS_NAV.
  const NAV_LINKS = isSports ? SPORTS_NAV : BUSINESS_NAV
  const navLinks = NAV_LINKS.filter(l => {
    if (isFootball && (l.label === 'Schools' || l.label === 'CRM' || l.label === 'SSO & Rostering')) return false
    return true
  })

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
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
        style={isSports ? { minHeight: 200 } : { display: 'flex', alignItems: 'center', padding: '12px 24px', width: '100%', boxSizing: 'border-box', overflow: 'hidden', minHeight: 96 }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" style={isSports ? { flexShrink: 0, overflow: 'visible' } : { flexShrink: 0, marginRight: isSchools ? 16 : 24, overflow: 'visible' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={isTennis ? '/tennis_transparent_logo.png' : isSports ? '/lumio_logo_ultra_clean.png' : '/lumio-transparent-new.png'} alt={isTennis ? 'Lumio Tennis' : isSports ? 'Lumio Sports' : 'Lumio'}
            className={isSports ? 'h-24 md:h-32 lg:h-40' : 'h-12 md:h-16 lg:h-20'}
            style={{ width: 'auto', maxHeight: 'none', objectFit: 'contain', display: 'block', flexShrink: 0 }} />
          {/* BETA pill removed on both domains — it was a launch signal. */}
        </Link>

        {/* Desktop nav */}
        <nav className={`hidden md:flex items-center ${isSports ? 'gap-2' : ''}`} style={isSports ? {} : isSchools ? { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 1, overflow: 'hidden' } : { display: 'flex', alignItems: 'center', gap: 16, flexShrink: 1, overflow: 'hidden' }}>
          {navLinks.map(l => {
            if (l.label === 'Football') {
              return (
                <FootballNavDropdown
                  key="football-dropdown"
                  scrolled={scrolled}
                  className={isSports ? 'px-2 py-2 text-sm font-semibold' : 'px-2 py-2 font-medium text-sm'}
                />
              )
            }
            const linkClassName = `flex items-center gap-1 rounded-lg transition-colors whitespace-nowrap ${isSports ? 'px-2 py-2 text-sm font-semibold' : isSchools ? 'px-2 py-2 font-medium' : 'px-2 py-2 font-medium'}`
            const external = (l as { external?: boolean }).external === true
            // Active route: on the business side we treat /coming-soon/business
            // as active when the user is on /home too, and /coming-soon/schools
            // as active only on its own path. External link is never active.
            const isActive = !external && (
              pathname === l.href ||
              (l.href !== '/' && pathname?.startsWith(l.href + '/')) ||
              (l.href === '/coming-soon/business' && (pathname === '/' || pathname === '/home'))
            )
            const baseColor = isActive ? '#F9FAFB' : '#9CA3AF'
            const linkStyle = {
              color: baseColor,
              ...(isSchools ? { fontSize: 13 } : isSports ? {} : { fontSize: 14 }),
              ...(isActive ? { textDecoration: 'underline', textUnderlineOffset: 6, textDecorationColor: '#0D9488', textDecorationThickness: 2 } : {}),
            }
            const inner = (
              <>
                {l.label}
                {external && <ArrowUpRight size={12} strokeWidth={2} style={{ opacity: 0.85 }} />}
                {(l as { badge?: string }).badge && (
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(139,92,246,0.2)', color: '#A78BFA', lineHeight: 1, boxShadow: '0 0 6px rgba(139,92,246,0.4)' }}>
                    {(l as { badge?: string }).badge}
                  </span>
                )}
              </>
            )
            if (external) {
              return (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                  className={linkClassName}
                  style={linkStyle}
                  onMouseEnter={e => { e.currentTarget.style.color = '#F9FAFB' }}
                  onMouseLeave={e => { e.currentTarget.style.color = baseColor }}>
                  {inner}
                </a>
              )
            }
            return (
              <Link key={l.label} href={l.href}
                className={linkClassName}
                style={linkStyle}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = baseColor }}>
                {inner}
              </Link>
            )
          })}
        </nav>

        {/* Desktop CTAs — sports-only. lumiocms removes Early Access / Free
            Trial / Sign In while products are in waitlist state; the nav
            links above already point to the waitlist pages. The isFootball
            branch preserves the existing /football/** CTAs on lumiosports. */}
        {isSports ? (
          <div className="hidden md:flex items-center" style={{ gap: 8, flexShrink: 0 }}>
            {isFootball ? (
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
            ) : (
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
            )}
            <Link href={isFootball ? '/login?type=football' : '/sports-login'}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
              style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#374151' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#1F2937' }}>
              Sign In
            </Link>
          </div>
        ) : null}

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
          {navLinks.map(l => {
            if (l.label === 'Football') {
              return (
                <div key="football-mobile">
                  <div className="flex items-center gap-2 text-sm font-medium py-2" style={{ color: '#9CA3AF' }}>
                    Football
                  </div>
                  <div className="flex flex-col gap-1 pl-3">
                    {FOOTBALL_TIERS.map(t => (
                      <Link key={t.href} href={t.href} onClick={() => setMobileOpen(false)}
                        className="py-2 flex flex-col" style={{ color: '#D1D5DB' }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{t.label}</span>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>{t.subtitle}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            }
            const badge = (l as { badge?: string }).badge && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>
                {(l as { badge?: string }).badge}
              </span>
            )
            if ((l as { external?: boolean }).external) {
              return (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm font-medium py-2" style={{ color: '#9CA3AF' }}>
                  {l.label}
                  <ArrowUpRight size={12} strokeWidth={2} style={{ opacity: 0.85 }} />
                  {badge}
                </a>
              )
            }
            return (
              <Link key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm font-medium py-2" style={{ color: '#9CA3AF' }}>
                {l.label}
                {badge}
              </Link>
            )
          })}
          {/* Mobile CTA block — sports-only. lumiocms has no CTAs in the
              mobile menu either; the 4 nav items already cover every entry
              point (Business / Schools waitlists, Sports external, About). */}
          {isSports && (
            <div className="flex flex-col gap-3 pt-2 border-t" style={{ borderColor: '#1F2937' }}>
              {isFootball ? (
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
              ) : (
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
              )}
              <Link href={isFootball ? '/login?type=football' : '/sports-login'}
                className="text-sm font-semibold py-2 text-center rounded-lg"
                style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}
                onClick={() => setMobileOpen(false)}>Sign In</Link>
            </div>
          )}
        </div>
      )}
    </header>
    {/* Legacy BookTrial / TrialType / EarlyAccess modals retired along with
        their trigger CTAs — the lumiocms waitlist flow is the
        /coming-soon/business and /coming-soon/schools pages. */}
  </>
  )
}


function Footer({ initialIsSportsHost }: { initialIsSportsHost: boolean }) {
  const isSports = useIsSports(initialIsSportsHost)

  // Business footer (lumiocms.com) mirrors the nav: Lumio Business + Schools
  // are behind coming-soon waitlists, so the old Product / Resources columns
  // would point at gated routes. Sports gets two columns of tour-style links
  // exactly as before.
  const BUSINESS_FOOTER_COL_A: { label: string; href: string; external?: boolean }[] = [
    { label: 'About',                href: '/about' },
    { label: 'Blog',                 href: '/blog'  },
    { label: 'Lumio Sports',         href: 'https://lumiosports.com', external: true },
  ]
  const BUSINESS_FOOTER_COL_B: { label: string; href: string }[] = [
    { label: 'Lumio Business (coming)', href: '/coming-soon/business' },
    { label: 'Lumio Schools (coming)',  href: '/coming-soon/schools'  },
  ]

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
              {isSports ? 'The operating system for professional sport.' : 'The AI operating system for sport, business and education.'}
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
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Company</p>
              {(isSports ? FOOTER_LINKS.slice(0, 3) : BUSINESS_FOOTER_COL_A).map(l => {
                if ((l as { external?: boolean }).external) {
                  return (
                    <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
                      className="block mb-3 text-sm transition-colors"
                      style={{ color: '#6B7280' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#F9FAFB' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#6B7280' }}>
                      {l.label}
                    </a>
                  )
                }
                return (
                  <Link key={l.label} href={l.href} className="block mb-3 text-sm transition-colors"
                    style={{ color: '#6B7280' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280' }}>
                    {l.label}
                  </Link>
                )
              })}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>
                {isSports ? 'Resources' : 'Products'}
              </p>
              {(isSports ? FOOTER_LINKS.slice(3) : BUSINESS_FOOTER_COL_B).map(l => (
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
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>
              {isSports ? 'Get started' : 'Stay in the loop'}
            </p>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
              {isSports
                ? 'See how Lumio Sports runs your club or career.'
                : 'Lumio Business opens its waitlist for founding customers in late 2026.'}
            </p>
            <Link href={isSports ? '/sports/try-demo' : '/coming-soon/business'}
              className="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              {isSports ? 'Try a demo →' : 'Join the waitlist →'}
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

export default function WebsiteChrome({ children, initialIsSportsHost }: { children: React.ReactNode; initialIsSportsHost: boolean }) {
  return (
    <>
      <Nav initialIsSportsHost={initialIsSportsHost} />
      <main style={{ backgroundColor: '#07080F', minHeight: '100vh' }}>
        {children}
      </main>
      <Footer initialIsSportsHost={initialIsSportsHost} />
    </>
  )
}
