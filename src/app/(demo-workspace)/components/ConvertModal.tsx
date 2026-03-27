'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'choice' | 'payment' | 'processing' | 'done'
type DataChoice = 'keep' | 'fresh'

export default function ConvertModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('choice')
  const [dataChoice, setDataChoice] = useState<DataChoice>('keep')
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const sessionToken = typeof window !== 'undefined'
    ? localStorage.getItem('demo_session_token')
    : null

  function formatCard(val: string) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }
  function formatExpiry(val: string) {
    return val.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2')
  }

  const [newSlug, setNewSlug] = useState('')

  async function handlePayment() {
    setError('')
    setLoading(true)
    setStep('processing')
    try {
      if (dataChoice === 'fresh') {
        await fetch('/api/demo/wipe', {
          method: 'POST',
          headers: { 'x-demo-token': sessionToken || '' }
        })
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('lumio_dashboard_') || key.startsWith('lumio_demo')) {
            localStorage.removeItem(key)
          }
        })
      }
      const res = await fetch('/api/workspace/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-demo-token': sessionToken || '' },
        body: JSON.stringify({ merge: dataChoice === 'keep' }),
      })
      if (!res.ok) throw new Error('Conversion failed')
      const data = await res.json()
      if (data.session_token) {
        localStorage.setItem('workspace_session_token', data.session_token)
      }
      if (data.slug) {
        localStorage.setItem('workspace_slug', data.slug)
        // Copy company details to workspace keys
        const companyName = localStorage.getItem('demo_company_name')
        const userName = localStorage.getItem('demo_user_name')
        const logo = localStorage.getItem('demo_company_logo')
        if (companyName) localStorage.setItem('workspace_company_name', companyName)
        if (userName) localStorage.setItem('workspace_user_name', userName)
        if (logo) localStorage.setItem('workspace_company_logo', logo)
        setNewSlug(data.slug)
      }
      setStep('done')
    } catch {
      setError('Something went wrong. Please try again.')
      setStep('payment')
      setLoading(false)
    }
  }

  function handleDone() {
    const slug = newSlug || localStorage.getItem('workspace_slug') || localStorage.getItem('demo_company_slug')
    onClose()
    router.replace(slug ? `/${slug}` : '/demo')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-5">
          <h2 className="text-xl font-bold text-white">
            {step === 'done' ? '🎉 You\'re live!' : 'Go live with Lumio'}
          </h2>
          <p className="text-teal-100 text-sm mt-1">
            {step === 'choice' && 'What would you like to do with your demo data?'}
            {step === 'payment' && 'Complete your subscription — £49/month'}
            {step === 'processing' && 'Setting up your account...'}
            {step === 'done' && 'Your account is now active.'}
          </p>
        </div>

        <div className="p-6">

          {/* Step 1 — Keep or wipe */}
          {step === 'choice' && (
            <div className="space-y-4">
              {(['keep', 'fresh'] as DataChoice[]).map(choice => (
                <button
                  key={choice}
                  onClick={() => setDataChoice(choice)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    dataChoice === choice
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{choice === 'keep' ? '📦' : '✨'}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {choice === 'keep' ? 'Keep my demo data' : 'Start fresh'}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {choice === 'keep'
                          ? 'Transfer everything from your trial into your live account. Clean it up as you go.'
                          : 'Wipe all demo data and begin with a clean account. Perfect if you were just exploring.'}
                      </p>
                    </div>
                    {dataChoice === choice && (
                      <span className="text-teal-500 text-lg mt-0.5">✓</span>
                    )}
                  </div>
                </button>
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('payment')}
                  className="flex-1 py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Payment */}
          {step === 'payment' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center text-sm">
                <span className="text-gray-600">Lumio Business — Monthly</span>
                <span className="font-bold text-gray-900">£49 / month</span>
              </div>
              <div className="rounded-xl border-2 border-dashed border-teal-300 bg-teal-50 p-4 text-center">
                <p className="text-sm font-semibold text-teal-700">🧪 Test mode active</p>
                <p className="text-xs text-teal-600 mt-1">No payment required during testing. Click Pay to activate instantly.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('choice')} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition">Back</button>
                <button onClick={handlePayment} disabled={loading} className="flex-1 py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition disabled:opacity-60">
                  {loading ? 'Processing...' : 'Pay £49 →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Processing */}
          {step === 'processing' && (
            <div className="py-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-full border-4 border-teal-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-gray-500 text-sm">
                {dataChoice === 'fresh'
                  ? 'Clearing demo data and activating your account...'
                  : 'Converting your demo account to live...'}
              </p>
            </div>
          )}

          {/* Step 4 — Done */}
          {step === 'done' && (
            <div className="py-8 text-center space-y-4">
              <div className="text-5xl">🎉</div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">Welcome to Lumio!</p>
                <p className="text-gray-500 text-sm mt-1">
                  {dataChoice === 'keep'
                    ? 'Your demo data has been carried over. Your account is now live.'
                    : 'Your account is live and ready to go.'}
                </p>
              </div>
              <button
                onClick={handleDone}
                className="w-full py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition"
              >
                Go to my dashboard →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
