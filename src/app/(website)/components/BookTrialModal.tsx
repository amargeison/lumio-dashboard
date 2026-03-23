'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X } from 'lucide-react'

export default function BookTrialModal({ onClose }: { onClose: () => void }) {
  const [step, setStep]       = useState<'form' | 'sent'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({ name: '', email: '', company: '', gdpr: false })

  function set(k: keyof typeof form, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.gdpr) { setError('Please accept the terms to continue.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/demo/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Something went wrong. Please try again.')
      }
      setStep('sent')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>

        {/* Header */}
        <div className="flex items-start justify-between p-6" style={{ borderBottom: '1px solid #1F2937' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>
              {step === 'form' ? 'Start your free trial' : 'Check your email'}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
              {step === 'form'
                ? '14 days free. No credit card. Auto-deleted after.'
                : `We've sent a link to ${form.email}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg transition-colors"
            style={{ color: '#6B7280' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F9FAFB')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}>
            <X size={18} />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={submit} className="p-6 space-y-4">
            {([
              { name: 'name',    label: 'Your name',    type: 'text',  placeholder: 'Sarah Chen'         },
              { name: 'email',   label: 'Work email',   type: 'email', placeholder: 'sarah@acmecorp.com' },
              { name: 'company', label: 'Company name', type: 'text',  placeholder: 'Acme Corp'          },
            ] as const).map(f => (
              <div key={f.name}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>{f.label}</label>
                <input
                  type={f.type}
                  required
                  value={form[f.name]}
                  onChange={e => set(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg px-3 py-2.5 text-sm transition-colors"
                  style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#0D9488')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#1F2937')}
                />
              </div>
            ))}

            {/* GDPR consent */}
            <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input type="checkbox" className="sr-only"
                    checked={form.gdpr} onChange={e => set('gdpr', e.target.checked)} />
                  <div className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: form.gdpr ? '#0D9488' : 'transparent',
                      borderColor: form.gdpr ? '#0D9488' : '#374151',
                    }}>
                    {form.gdpr && <Check size={10} style={{ color: '#fff' }} />}
                  </div>
                </div>
                <span className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
                  I agree to Lumio&apos;s{' '}
                  <Link href="/terms" className="underline" style={{ color: '#0D9488' }}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="underline" style={{ color: '#0D9488' }}>Privacy Policy</Link>.
                </span>
              </label>

              <div className="text-xs space-y-1.5" style={{ color: '#6B7280' }}>
                <p>
                  <span style={{ color: '#9CA3AF' }}>14-day trial:</span>{' '}
                  Your demo workspace and all data will be permanently deleted 14 days after creation. You&apos;ll receive a warning email on day 12.
                </p>
                <p>
                  <span style={{ color: '#9CA3AF' }}>AI processing:</span>{' '}
                  This product uses Claude by Anthropic to power automation features. By continuing, you acknowledge that demo content may be processed by Anthropic in accordance with their{' '}
                  <a href="https://www.anthropic.com/policies/usage" target="_blank" rel="noreferrer"
                    className="underline" style={{ color: '#0D9488' }}>usage policies</a>.
                </p>
                <p>
                  <span style={{ color: '#9CA3AF' }}>Data location:</span>{' '}
                  All data is stored in EU data centres (AWS eu-west-1) and processed under GDPR.
                </p>
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Sending magic link…' : 'Start free trial →'}
            </button>
          </form>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: 'rgba(13,148,136,0.12)' }}>
              <Check size={24} style={{ color: '#0D9488' }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: '#F9FAFB' }}>Magic link sent</p>
              <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
                Click the link in your email to open your trial workspace. It expires in 1 hour.
              </p>
            </div>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              Can&apos;t see it? Check your spam folder or{' '}
              <button onClick={() => setStep('form')} className="underline" style={{ color: '#0D9488' }}>
                try again
              </button>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
