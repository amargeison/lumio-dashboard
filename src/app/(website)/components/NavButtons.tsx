'use client'

import Link from 'next/link'

export default function NavButtons() {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-sm font-medium transition-colors"
        style={{ color: '#9CA3AF' }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#9CA3AF' }}
      >
        Sign in
      </Link>
      <Link
        href="/demo"
        className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
        style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0F766E' }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0D9488' }}
      >
        Start free trial
      </Link>
    </div>
  )
}
