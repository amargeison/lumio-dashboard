'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock, Building2 } from 'lucide-react'

export default function SchoolTrialEndedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center mb-2">
          <Image src="/lumio-logo-primary.png" alt="Lumio" width={320} height={160} style={{ width: 160, height: 'auto' }} />
        </div>

        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <Clock size={28} style={{ color: '#F59E0B' }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}>
              <Building2 size={12} color="white" />
            </div>
            <span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>Lumio <span style={{ color: '#0D9488' }}>Schools</span></span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Your 14-day trial has ended</h1>
          <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
            Your school workspace has been removed. Everything you experienced during your trial is still available — pick a plan to get your school back on Lumio.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/schools/pricing"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
          >
            See plans &amp; pricing <ArrowRight size={15} />
          </Link>

          <Link
            href="/schools/register"
            className="flex items-center justify-center w-full py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: 'transparent', border: '1px solid #1F2937', color: '#9CA3AF' }}
          >
            Start a new trial
          </Link>

          <p className="text-xs pt-2" style={{ color: '#4B5563' }}>
            Or <Link href="/schools/login" className="underline" style={{ color: '#9CA3AF' }}>sign in with a different account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
