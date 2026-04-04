'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Link2, Users, Sparkles, ArrowRight } from 'lucide-react'

const OPTIONS = [
  {
    icon: Upload,
    iconBg: 'rgba(13,148,136,0.15)',
    iconColor: '#0D9488',
    title: 'Upload Your Own Data',
    desc: 'Import your files, spreadsheets, and documents',
    action: 'data',
  },
  {
    icon: Link2,
    iconBg: 'rgba(108,63,197,0.15)',
    iconColor: '#A78BFA',
    title: 'Connect Your Apps',
    desc: 'Sync Office 365, Slack, Google and more automatically',
    action: 'integrations',
  },
  {
    icon: Users,
    iconBg: 'rgba(96,165,250,0.15)',
    iconColor: '#60A5FA',
    title: 'Work With Your IT Team',
    desc: "We'll send your IT team full setup instructions",
    action: 'it',
  },
  {
    icon: Sparkles,
    iconBg: 'rgba(245,158,11,0.15)',
    iconColor: '#F59E0B',
    title: 'Explore With Demo Data',
    desc: 'Load sample data and explore — clear it any time',
    action: 'demo',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [toast, setToast] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleOption(action: string) {
    if (action === 'data') {
      router.push('/settings?tab=data')
    } else if (action === 'integrations') {
      router.push('/settings?tab=integrations')
    } else if (action === 'it') {
      setToast('Setup guide sent to your IT team \u2709\uFE0F')
      setTimeout(() => setToast(null), 3000)
    } else if (action === 'demo') {
      setLoading('demo')
      const token = localStorage.getItem('workspace_session_token')
      if (token) {
        await fetch('/api/onboarding/load-demo', {
          method: 'POST',
          headers: { 'x-workspace-token': token },
        }).catch(() => {})
        localStorage.setItem('lumio_demo_active', 'true')
        const allPages = ['overview','crm','sales','marketing','projects','hr','partners','finance','insights','workflows','strategy','reports','settings','inbox','calendar','analytics','accounts','support','success','trials','operations','it']
        allPages.forEach(k => localStorage.setItem(`lumio_dashboard_${k}_hasData`, 'true'))
      }
      setLoading(null)
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ backgroundColor: '#07080F' }}>
      <div className="w-full" style={{ maxWidth: 520 }}>
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm mb-8" style={{ color: '#6B7280' }}>
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="text-2xl font-bold mb-2" style={{ color: '#F9FAFB' }}>How would you like to start?</h1>
        <p className="text-sm mb-8" style={{ color: '#9CA3AF' }}>Choose one to get going — you can always change this later in Settings</p>

        <div className="space-y-3">
          {OPTIONS.map(opt => {
            const Icon = opt.icon
            const isLoading = loading === opt.action
            return (
              <button
                key={opt.action}
                onClick={() => handleOption(opt.action)}
                disabled={!!loading}
                className="w-full flex items-center gap-4 rounded-xl p-5 text-left transition-colors"
                style={{ backgroundColor: '#111318', border: '1px solid #1F2937', opacity: loading && !isLoading ? 0.5 : 1 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#374151' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937' }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: opt.iconBg }}>
                  <Icon size={20} style={{ color: opt.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{opt.title}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{opt.desc}</p>
                </div>
                {isLoading ? (
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>Loading...</span>
                ) : (
                  <ArrowRight size={16} style={{ color: '#4B5563', flexShrink: 0 }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
