'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DemoWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedSlug = localStorage.getItem('demo_company_slug')
    const storedName = localStorage.getItem('demo_company_name')
    if (!storedSlug) { router.push('/demo'); return }
    if (storedName) setCompanyName(storedName)
    // Set all dashboard pages as having data so the full portal loads
    const ALL_PAGES = ['overview','crm','sales','marketing','projects','hr','partners',
      'finance','insights','workflows','strategy','reports','settings','accounts',
      'support','success','trials','operations','it']
    ALL_PAGES.forEach(p => localStorage.setItem(`lumio_dashboard_${p}_hasData`, 'true'))
    localStorage.setItem('lumio_demo_active', 'true')
    setLoading(false)
  }, [slug, router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#07080F' }}>
      <p className="text-sm" style={{ color: '#9CA3AF' }}>Setting up your workspace...</p>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#07080F' }}>
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.3)' }}>
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-2xl font-black mb-2" style={{ color: '#F9FAFB' }}>
          {companyName ? `${companyName} is ready` : 'Your workspace is ready'}
        </h1>
        <p className="text-sm mb-8" style={{ color: '#9CA3AF' }}>
          Your 14-day free trial has started. Explore the full Lumio platform below.
        </p>
        <Link href="/overview" className="block w-full py-3 rounded-xl font-semibold text-sm mb-4" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
          Go to my dashboard →
        </Link>
        <p className="text-xs" style={{ color: '#6B7280' }}>
          Your demo workspace: lumiocms.com/demo/{slug}
        </p>
      </div>
    </div>
  )
}
