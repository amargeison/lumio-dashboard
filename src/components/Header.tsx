'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Bell, Menu } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const [initials, setInitials] = useState('AM')
  const [companyName, setCompanyName] = useState('Lumio')
  useEffect(() => {
    const storedInitials = localStorage.getItem('lumio_company_initials')
    if (storedInitials) setInitials(storedInitials)
    const storedName = localStorage.getItem('lumio_company_name')
    if (storedName) setCompanyName(storedName)
  }, [])

  return (
    <header
      className="fixed top-0 right-0 z-30 flex h-16 items-center justify-between px-4 md:px-6"
      style={{
        left: 0,
        backgroundColor: '#07080F',
        borderBottom: '1px solid #1F2937',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          className="flex items-center justify-center rounded-lg p-2 transition-colors md:hidden"
          style={{ color: '#9CA3AF' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#111318'
            e.currentTarget.style.color = '#F9FAFB'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#9CA3AF'
          }}
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>

        {/* Lumio logo — desktop */}
        <Link href="https://lumiocms.com" className="hidden md:flex items-center" target="_blank" rel="noreferrer">
          <Image src="/lumio-transparent-new.png" alt="Lumio" width={90} height={24} className="opacity-80 hover:opacity-100 transition-opacity" />
        </Link>

        {/* Divider */}
        <div className="hidden md:block h-5 w-px md:ml-1" style={{ backgroundColor: '#1F2937' }} />

        {/* Workspace identity — offset for sidebar on desktop */}
        <div className="flex items-center gap-2 md:pl-[200px]">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold shrink-0"
            style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
          >
            {companyName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <span className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{companyName}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="relative flex items-center justify-center rounded-lg p-2 transition-colors"
          style={{ color: '#9CA3AF' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#111318'
            e.currentTarget.style.color = '#F9FAFB'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#9CA3AF'
          }}
          aria-label="Notifications"
        >
          <Bell size={18} strokeWidth={1.75} />
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
            style={{ backgroundColor: '#0D9488' }}
          />
        </button>

        {/* User avatar */}
        <button
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors"
          style={{ color: '#9CA3AF' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#111318'
            e.currentTarget.style.color = '#F9FAFB'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#9CA3AF'
          }}
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
            style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
          >
            {initials}
          </div>
          <span className="hidden sm:block">{initials}</span>
        </button>
      </div>
    </header>
  )
}
