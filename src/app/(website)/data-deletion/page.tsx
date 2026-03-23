'use client'

import { useState } from 'react'
import Link from 'next/link'

type RequestType = 'delete_all' | 'delete_account' | 'delete_demo' | 'access_request' | 'correction'

const REQUEST_TYPES: { value: RequestType; label: string; desc: string }[] = [
  { value: 'delete_all', label: 'Delete all my data', desc: 'Permanently delete everything Lumio holds about me' },
  { value: 'delete_account', label: 'Delete my account', desc: 'Cancel subscription and delete my account and data' },
  { value: 'delete_demo', label: 'Delete my demo workspace', desc: 'Immediately delete my 14-day trial workspace' },
  { value: 'access_request', label: 'Subject Access Request', desc: 'Send me a copy of all data Lumio holds about me' },
  { value: 'correction', label: 'Correct my data', desc: 'Update or correct inaccurate personal data' },
]

export default function DataDeletionPage() {
  const [requestType, setRequestType] = useState<RequestType>('delete_all')
  const [email, setEmail] = useState('')
  const [details, setDetails] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reference, setReference] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/gdpr/delete-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType, email, details, submittedAt: new Date().toISOString() }),
    })
    const data = await res.json()
    setLoading(false)
    setReference(data.reference || `GDPR-${Date.now().toString(36).toUpperCase()}`)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#07080F' }}>
      <nav className="px-8 py-5 flex items-center justify-between border-b border-white/5">
        <Link href="/" className="font-black text-xl tracking-widest text-white">LUMIO</Link>
        <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-3">Data &amp; Privacy Requests</h1>
          <p className="text-gray-400 leading-relaxed">
            Under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018,
            you have rights over your personal data. Use this form to exercise those rights.
            We will respond within <strong className="text-white">30 calendar days</strong>.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-200 mb-3 text-sm">Your rights under UK GDPR</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                {[
                  'Right of access (Article 15)',
                  'Right to rectification (Article 16)',
                  'Right to erasure (Article 17)',
                  'Right to restrict processing (Article 18)',
                  'Right to data portability (Article 20)',
                  'Right to object (Article 21)',
                ].map(r => (
                  <div key={r} className="flex items-start gap-1.5">
                    <span className="text-purple-400 flex-shrink-0 mt-0.5">•</span>
                    {r}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">What would you like to do?</label>
              <div className="space-y-2">
                {REQUEST_TYPES.map(rt => (
                  <label key={rt.value} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    requestType === rt.value ? 'border-purple-500 bg-purple-600/10' : 'border-white/10 bg-white/3 hover:border-white/20'
                  }`}>
                    <input
                      type="radio"
                      name="requestType"
                      value={rt.value}
                      checked={requestType === rt.value}
                      onChange={() => setRequestType(rt.value)}
                      className="mt-1 flex-shrink-0 accent-purple-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-gray-200">{rt.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{rt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Your email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="The email address associated with your Lumio account"
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Additional details <span className="text-gray-600 font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Any additional context about your request..."
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-500 disabled:opacity-40 transition-colors"
            >
              {loading ? '⏳ Submitting request...' : 'Submit Request'}
            </button>

            <p className="text-xs text-gray-600 text-center">
              We will verify your identity before processing the request and respond within 30 days.
              For urgent requests, contact <a href="mailto:privacy@lumiocms.com" className="text-purple-400">privacy@lumiocms.com</a> directly.
            </p>
          </form>
        ) : (
          <div className="bg-green-600/10 border border-green-500/20 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h3 className="text-xl font-bold text-white mb-2">Request received</h3>
            <p className="text-gray-400 text-sm mb-4">
              We&apos;ve recorded your request and will respond to <strong className="text-white">{email}</strong> within 30 calendar days.
            </p>
            <div className="bg-white/5 rounded-xl p-4 text-left text-sm text-gray-400 mb-4">
              <div className="font-semibold text-gray-300 mb-2">Reference: {reference}</div>
              <div>Request type: {REQUEST_TYPES.find(r => r.value === requestType)?.label}</div>
              <div>Submitted: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div>Response due by: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
            <Link href="/" className="text-purple-400 text-sm hover:text-purple-300 underline">Return to homepage</Link>
          </div>
        )}
      </div>
    </div>
  )
}
