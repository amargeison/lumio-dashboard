'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Twitter, Linkedin, Github } from 'lucide-react'

const NAV_LINKS: { label: string; href: string; badge?: string }[] = [
  { label: 'Product',      href: '/product'  },
  { label: 'Workflows',    href: '/product#workflows' },
  { label: 'CRM',          href: '/crm',              badge: 'Soon' },
  { label: 'Integrations', href: '/product#integrations' },
  { label: 'Pricing',      href: '/pricing'  },
  { label: 'About',        href: '/about'    },
]

const FOOTER_LINKS = [
  { label: 'Product',  href: '/product'  },
  { label: 'Pricing',  href: '/pricing'  },
  { label: 'About',    href: '/about'    },
  { label: 'Blog',     href: '#'         },
  { label: 'Docs',     href: '#'         },
  { label: 'Status',   href: '#'         },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy',  href: '#' },
  { label: 'Terms of Service',href: '#' },
  { label: 'Cookie Policy',   href: '#' },
]

function Nav() {
  const [scrolled, setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
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
          <Image src="/lumio-logo-primary.png" alt="Lumio" width={160} height={160}
            style={{ height: 120, width: 'auto' }} priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(l => (
            <Link key={l.label} href={l.href}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-base font-semibold transition-colors"
              style={{ color: '#9CA3AF' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#9CA3AF' }}>
              {l.label}
              {l.badge && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA', lineHeight: 1 }}>
                  {l.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/dashboard"
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#374151' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#1F2937' }}>
            Login
          </Link>
          <Link href="/demo"
            className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0F766E' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0D9488' }}>
            Book a Demo
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
          {NAV_LINKS.map(l => (
            <Link key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-medium py-2" style={{ color: '#9CA3AF' }}>
              {l.label}
              {l.badge && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>
                  {l.badge}
                </span>
              )}
            </Link>
          ))}
          <div className="flex flex-col gap-3 pt-2 border-t" style={{ borderColor: '#1F2937' }}>
            <Link href="/dashboard" className="text-sm font-medium py-2 text-center rounded-lg"
              style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>Login</Link>
            <Link href="/demo" className="text-sm font-semibold py-2 text-center rounded-lg"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Book a Demo</Link>
          </div>
        </div>
      )}
    </header>
  )
}

function Footer() {
  return (
    <footer style={{ backgroundColor: '#07080F', borderTop: '1px solid #1F2937' }}>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Image src="/lumio-logo-primary.png" alt="Lumio" width={80} height={80}
              style={{ width: 72, height: 'auto', marginBottom: 16 }} />
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
              Book a Demo →
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
