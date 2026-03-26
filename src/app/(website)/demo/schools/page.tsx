'use client'
import Link from 'next/link'

export default function SchoolsDemoPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20" style={{ backgroundColor: '#07080F' }}>
      <div className="max-w-2xl w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}>
            <span className="text-white text-xl">🏫</span>
          </div>
          <span className="text-xl font-black" style={{ color: '#F9FAFB' }}>Lumio <span style={{ color: '#0D9488' }}>Schools</span></span>
        </div>
        <h1 className="text-4xl font-black mb-4" style={{ color: '#F9FAFB' }}>Your school, fully connected.</h1>
        <p className="text-lg mb-10" style={{ color: '#9CA3AF' }}>Attendance, safeguarding, staff management, curriculum, workflows and AI briefings — all in one place. Built for headteachers and school leaders.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link href="/demo/schools/oakridge-primary" className="px-8 py-4 rounded-xl font-bold text-base" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Try Lumio Schools Free →
          </Link>
          <Link href="/schools" className="px-8 py-4 rounded-xl font-bold text-base" style={{ backgroundColor: 'transparent', color: '#9CA3AF', border: '1px solid #1F2937' }}>
            Learn more
          </Link>
        </div>
        <p className="text-sm" style={{ color: '#6B7280' }}>14 days free · No credit card · Auto-deleted after trial</p>
        <p className="text-sm mt-4" style={{ color: '#6B7280' }}>Already have an account? <Link href="/login" style={{ color: '#0D9488' }}>Sign in</Link></p>
      </div>
    </div>
  )
}
