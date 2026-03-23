'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

export default function EnterpriseSSOPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  const handleSSO = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotFound(false)
    setLoading(true)

    const ssoIdentifier = domain.includes('@') ? domain.split('@')[1] : domain

    try {
      const { data, error } = await supabase.auth.signInWithSSO({
        domain: ssoIdentifier,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })

      if (error) {
        if (error.message.includes('no SSO provider')) {
          setNotFound(true)
        } else {
          setError(error.message)
        }
        setLoading(false)
        return
      }

      if (data?.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <nav className="px-8 py-5 flex items-center justify-between border-b border-white/5">
        <Link href="/" className="font-black text-xl tracking-widest text-white">LUMIO</Link>
        <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">← Back to sign in</Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-purple-600/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
              🏢
            </div>
            <h1 className="text-2xl font-black mb-2">Enterprise SSO</h1>
            <p className="text-gray-500 text-sm">Sign in with your company&apos;s identity provider (Okta, Azure AD, OneLogin)</p>
          </div>

          <form onSubmit={handleSSO} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Work email or company domain
              </label>
              <input
                type="text"
                required
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="you@company.com or company.com"
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm"
              />
              <p className="text-xs text-gray-600 mt-1.5">We&apos;ll look up your organisation&apos;s SSO settings</p>
            </div>

            {error && (
              <div className="bg-red-600/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {notFound && (
              <div className="bg-amber-600/10 border border-amber-500/20 rounded-xl px-4 py-3">
                <p className="text-sm text-amber-300 mb-2">No SSO configuration found for this domain.</p>
                <p className="text-xs text-gray-500">
                  Enterprise SSO is available on the Enterprise plan. To set up SSO for your organisation, contact{' '}
                  <a href="mailto:hello@lumiocms.com" className="text-purple-400 underline">hello@lumiocms.com</a>.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !domain}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-500 disabled:opacity-40 transition-colors"
            >
              {loading ? '⏳ Looking up your organisation...' : 'Continue with SSO →'}
            </button>
          </form>

          <div className="mt-8">
            <p className="text-xs text-gray-600 text-center mb-3">Supported identity providers</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'Okta', logo: '🔐' },
                { name: 'Azure AD', logo: '📘' },
                { name: 'OneLogin', logo: '🔑' },
                { name: 'Google Workspace', logo: '🔵' },
                { name: 'Ping Identity', logo: '🏓' },
                { name: 'Auth0', logo: '🔒' },
              ].map(p => (
                <div key={p.name} className="bg-white/3 border border-white/[0.08] rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{p.logo}</div>
                  <div className="text-xs text-gray-500">{p.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              ← Back to standard sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
