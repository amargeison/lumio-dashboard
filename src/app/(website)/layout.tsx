'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, Twitter, Linkedin, Github } from 'lucide-react'
import BookTrialModal from '@/app/(website)/components/BookTrialModal'
import TrialTypeModal from '@/app/(website)/components/TrialTypeModal'

const NAV_LINKS: { label: string; href: string; badge?: string }[] = [
  { label: 'Product',      href: '/product'  },
  { label: 'Workflows',    href: '/product#workflows' },
  { label: 'Schools',      href: '/schools' },
  { label: 'Sports',       href: '/sports' },
  { label: 'CRM',          href: '/lumio-crm' },
  { label: 'Integrations', href: '/product#integrations' },
  { label: 'Pricing',      href: '/pricing'  },
  { label: 'About',        href: '/about'    },
  { label: 'Blog',         href: '/blog'     },
]

const SCHOOLS_EXTRA_LINKS = [
  { label: 'Features', href: '/schools/features' },
  { label: 'SSO & Rostering', href: '/schools/sso' },
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
  const pathname = usePathname()
  const isSchools = pathname?.startsWith('/schools') ?? false
  const isFootball = pathname?.startsWith('/football') ?? false

  const baseLinks = isSchools
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
      }
      return l
    })

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(7,8,15,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(31,41,55,0.6)' : '1px solid transparent',
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2" style={{ minHeight: 100 }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/lumio-transparent-new.png" alt="Lumio" width={360} height={180}
            style={{ width: 180, height: 'auto', objectFit: 'contain' }} priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0">
          {navLinks.map(l => (
            <Link key={l.label} href={l.href}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
              style={{ color: '#9CA3AF' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#9CA3AF' }}>
              {l.label}
              {(l as any).badge && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA', lineHeight: 1 }}>
                  {(l as any).badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {isFootball ? (
            <Link href="/book-demo"
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#0F766E' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#0D9488' }}>
              Book a Demo
            </Link>
          ) : isSchools ? (
            <Link href="/demo/schools/oakridge-primary"
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
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
          {isFootball ? (
            <Link href="/book-demo"
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
              style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#7C3AED' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#6C3FC5' }}>
              Request Access
            </Link>
          ) : (
            <Link href={isSchools ? '/schools/checkout' : '/buy'}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
              style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#7C3AED' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#6C3FC5' }}>
              Buy Now
            </Link>
          )}
          <Link href={isSchools ? '/login?type=school' : isFootball ? '/login?type=football' : '/login'}
            className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
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
            {isFootball ? (
              <Link href="/book-demo"
                className="text-sm font-semibold py-2 text-center rounded-lg"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
                onClick={() => setMobileOpen(false)}>Book a Demo</Link>
            ) : isSchools ? (
              <Link href="/demo/schools/oakridge-primary"
                className="text-sm font-semibold py-2 text-center rounded-lg"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
                onClick={() => setMobileOpen(false)}>Free School Trial</Link>
            ) : (
              <button onClick={() => { setMobileOpen(false); setShowTypeModal(true) }}
                className="text-sm font-semibold py-2 text-center rounded-lg"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Free 14 day trial</button>
            )}
            {isFootball ? (
              <Link href="/book-demo"
                className="text-sm font-semibold py-2 text-center rounded-lg"
                style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
                onClick={() => setMobileOpen(false)}>Request Access</Link>
            ) : (
              <Link href={isSchools ? '/schools/checkout' : '/buy'}
                className="text-sm font-semibold py-2 text-center rounded-lg"
                style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
                onClick={() => setMobileOpen(false)}>Buy Now</Link>
            )}
            <Link href={isSchools ? '/login?type=school' : isFootball ? '/login?type=football' : '/login'}
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
  </>
  )
}

function Footer() {
  return (
    <footer style={{ backgroundColor: '#07080F', borderTop: '1px solid #1F2937' }}>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Image src="/lumio-transparent-new.png" alt="Lumio" width={200} height={100}
              style={{ width: 100, height: 'auto', objectFit: 'contain', marginBottom: 16 }} />
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
