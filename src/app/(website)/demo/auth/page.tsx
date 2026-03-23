'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, X, Loader2 } from 'lucide-react'

function AuthContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') || ''

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('No sign-in token found. Please request a new magic link.')
      return
    }

    async function verify() {
      try {
        const res = await fetch('/api/demo/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()

        if (!res.ok || data.error) {
          setStatus('error')
          setErrorMsg(data.error || 'This link has expired or has already been used.')
          return
        }

        // Persist session
        localStorage.setItem('demo_session_token', data.session_token)
        localStorage.setItem('demo_company_id',    data.company.id)
        localStorage.setItem('demo_company_name',  data.company.name)
        localStorage.setItem('demo_company_slug',  data.company.slug || data.company.id)
        localStorage.setItem('demo_user_email',    data.user.email)
        localStorage.setItem('demo_user_name',     data.user.name)

        setStatus('success')

        // Route: new users go to onboarding, returning go straight to workspace
        const dest = data.is_new_user
          ? '/demo/onboarding'
          : `/demo/${data.company.slug || data.company.id}`

        setTimeout(() => router.replace(dest), 1200)
      } catch {
        setStatus('error')
        setErrorMsg('Something went wrong. Please try again.')
      }
    }

    verify()
  }, [token, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>
      <div className="w-full max-w-sm text-center space-y-5">

        {/* Icon */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{
          backgroundColor:
            status === 'success' ? 'rgba(13,148,136,0.12)' :
            status === 'error'   ? 'rgba(239,68,68,0.1)'   :
            'rgba(108,63,197,0.12)',
        }}>
          {status === 'verifying' && <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#A78BFA' }} />}
          {status === 'success'   && <Check className="w-8 h-8 text-teal-400" />}
          {status === 'error'     && <X className="w-8 h-8 text-red-400" />}
        </div>

        {/* Copy */}
        {status === 'verifying' && (
          <>
            <h1 className="text-xl font-bold">Verifying your link…</h1>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Just a moment — checking your magic link.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className="text-xl font-bold">You&apos;re in.</h1>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Taking you to your workspace now…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-xl font-bold">Link expired</h1>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>{errorMsg}</p>
            <a href="/demo"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              Request a new link
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export default function DemoAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#07080F' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6C3FC5' }} />
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}
