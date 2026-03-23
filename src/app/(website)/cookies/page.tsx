import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy — Lumio',
  description: 'How Lumio uses cookies and similar technologies.',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#07080F' }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-black mb-4">Cookie Policy</h1>
          <p className="text-gray-400">Last updated: January 2025 · Lumio Ltd</p>
        </div>

        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">What are cookies?</h2>
            <p>
              Cookies are small text files placed on your device when you visit a website. They help websites remember
              information about your visit, like your preferences and login state. Lumio uses cookies in compliance
              with the UK Privacy and Electronic Communications Regulations (PECR) and UK GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4">Cookies we use</h2>
            <div className="space-y-4">
              <div className="bg-green-600/5 border border-green-500/15 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-white">Essential cookies</h3>
                  <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full">Always active</span>
                </div>
                <p className="text-gray-400 text-xs mb-3">These cookies are required for Lumio to function. They cannot be disabled.</p>
                <div className="space-y-2 text-xs">
                  {[
                    { name: 'sb-[ref]-auth-token', purpose: 'Supabase authentication session', duration: 'Session / 1 week' },
                    { name: 'lumio_cookie_consent', purpose: 'Stores your cookie preferences', duration: '1 year' },
                    { name: '__Host-*', purpose: 'Security and CSRF protection', duration: 'Session' },
                  ].map(cookie => (
                    <div key={cookie.name} className="flex gap-4 py-2 border-b border-white/5">
                      <code className="text-green-400 font-mono flex-shrink-0 w-48">{cookie.name}</code>
                      <span className="text-gray-400 flex-1">{cookie.purpose}</span>
                      <span className="text-gray-600 flex-shrink-0">{cookie.duration}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-purple-600/5 border border-purple-500/15 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-white">Analytics cookies</h3>
                  <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full">Optional</span>
                </div>
                <p className="text-gray-400 text-xs mb-3">
                  Help us understand how Lumio is used so we can improve the product. No personal data is shared with third parties.
                </p>
                <div className="space-y-2 text-xs">
                  {[
                    { name: '_lumio_session', purpose: 'Anonymous session analytics', duration: '30 days' },
                  ].map(cookie => (
                    <div key={cookie.name} className="flex gap-4 py-2 border-b border-white/5">
                      <code className="text-purple-400 font-mono flex-shrink-0 w-48">{cookie.name}</code>
                      <span className="text-gray-400 flex-1">{cookie.purpose}</span>
                      <span className="text-gray-600 flex-shrink-0">{cookie.duration}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/3 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-white">Marketing cookies</h3>
                  <span className="text-xs bg-gray-600/20 text-gray-400 px-2 py-0.5 rounded-full">Optional · Off by default</span>
                </div>
                <p className="text-gray-400 text-xs">
                  Used to show relevant Lumio content across the web. We never share data with advertising networks or sell your data.
                  Currently not in use — this section will be updated if marketing cookies are added.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Managing your preferences</h2>
            <p className="mb-3">
              When you first visit Lumio, we ask for your cookie preferences via the banner at the bottom of the screen.
              You can change your preferences at any time by clearing your browser&apos;s local storage for lumiocms.com
              and refreshing the page.
            </p>
            <p>
              You can also manage cookies through your browser settings. Note that disabling essential cookies
              will prevent Lumio from working correctly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Third-party cookies</h2>
            <p>
              Lumio does not use third-party advertising cookies or tracking pixels. Our sub-processors
              (Supabase, Vercel) may set technical cookies required for their services. See our{' '}
              <Link href="/privacy#sub-processors" className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</Link>{' '}
              for the full list of sub-processors.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Contact us</h2>
            <p>
              Questions about our cookie use?{' '}
              <a href="mailto:privacy@lumiocms.com" className="text-purple-400 hover:text-purple-300">privacy@lumiocms.com</a>
            </p>
          </section>

          <div className="pt-6 border-t border-white/10 text-xs text-gray-600">
            <p>Lumio Ltd · privacy@lumiocms.com · UK PECR and GDPR compliant</p>
          </div>
        </div>
      </div>
    </div>
  )
}
