import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Lumio',
  description: 'How Lumio collects, processes, and protects your personal data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#07080F' }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-black mb-4">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: January 2025 · Lumio Ltd</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Who we are</h2>
            <p>
              Lumio Ltd (&ldquo;Lumio&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is a company registered in England and Wales.
              We are the data controller for personal data collected through lumiocms.com and app.lumiocms.com.
              We are registered with the Information Commissioner&apos;s Office (ICO) as a data controller.
            </p>
            <p className="mt-2">
              Contact: <a href="mailto:privacy@lumiocms.com" className="text-purple-400 hover:text-purple-300">privacy@lumiocms.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. What data we collect</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><strong className="text-gray-300">Account data:</strong> name, work email address, company name</li>
              <li><strong className="text-gray-300">Usage data:</strong> pages visited, features used, session duration (anonymised)</li>
              <li><strong className="text-gray-300">Technical data:</strong> IP address (hashed), browser type, device type</li>
              <li><strong className="text-gray-300">Communications:</strong> emails you send to us, support tickets</li>
              <li><strong className="text-gray-300">Payment data:</strong> processed by Stripe — we do not store card details</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. How we use your data</h2>
            <div className="space-y-3">
              {[
                { basis: 'Contract (Article 6(1)(b))', use: 'To provide, maintain, and improve the Lumio service' },
                { basis: 'Consent (Article 6(1)(a))', use: 'To send marketing emails (only where you have opted in)' },
                { basis: 'Legitimate interests (Article 6(1)(f))', use: 'To detect fraud, ensure security, and improve product features' },
                { basis: 'Legal obligation (Article 6(1)(c))', use: 'To comply with UK law, tax obligations, and respond to legal requests' },
              ].map(({ basis, use }) => (
                <div key={basis} className="bg-white/3 border border-white/10 rounded-xl p-4">
                  <div className="text-xs font-semibold text-purple-400 mb-1">{basis}</div>
                  <div className="text-sm text-gray-300">{use}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. AI processing (Anthropic)</h2>
            <div className="bg-blue-600/5 border border-blue-500/15 rounded-xl p-4">
              <p>
                Lumio uses Anthropic&apos;s Claude API to power AI automation features. When you use AI-powered workflows,
                data from those workflows may be temporarily processed by Anthropic&apos;s servers in the USA.
                This transfer is covered by Anthropic&apos;s{' '}
                <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                  Data Processing Agreement
                </a>
                {' '}and UK GDPR Article 46 safeguards (Standard Contractual Clauses).
                Anthropic does not retain or train on your data.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Data storage and retention</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>All primary data is stored in the UK (AWS eu-west-2, London)</li>
              <li>Demo workspace data is deleted automatically after 14 days</li>
              <li>Account data is retained for the duration of your subscription plus 30 days</li>
              <li>Anonymised analytics data may be retained for up to 2 years</li>
            </ul>
          </section>

          <section id="sub-processors">
            <h2 className="text-lg font-bold text-white mb-3">6. Sub-processors</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4 text-gray-400 font-semibold">Processor</th>
                    <th className="text-left py-2 pr-4 text-gray-400 font-semibold">Purpose</th>
                    <th className="text-left py-2 text-gray-400 font-semibold">Location</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  {[
                    ['Supabase / AWS', 'Database and authentication', 'UK (eu-west-2)'],
                    ['Vercel', 'Application hosting', 'EU'],
                    ['Anthropic', 'AI processing (Claude API)', 'USA (SCCs applied)'],
                    ['Resend', 'Transactional email', 'USA (SCCs applied)'],
                    ['Stripe', 'Payment processing', 'USA (SCCs applied)'],
                  ].map(([processor, purpose, location]) => (
                    <tr key={processor} className="border-b border-white/5">
                      <td className="py-2 pr-4 font-medium text-gray-300">{processor}</td>
                      <td className="py-2 pr-4">{purpose}</td>
                      <td className="py-2">{location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Your rights</h2>
            <p className="mb-3">Under UK GDPR, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400">
              <li>Access the personal data we hold about you (Article 15)</li>
              <li>Have inaccurate data corrected (Article 16)</li>
              <li>Have your data erased in certain circumstances (Article 17)</li>
              <li>Restrict processing of your data (Article 18)</li>
              <li>Receive your data in a portable format (Article 20)</li>
              <li>Object to processing based on legitimate interests (Article 21)</li>
              <li>Withdraw consent at any time (where processing is based on consent)</li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, use our{' '}
              <Link href="/data-deletion" className="text-purple-400 hover:text-purple-300 underline">data request form</Link>{' '}
              or email <a href="mailto:privacy@lumiocms.com" className="text-purple-400 hover:text-purple-300">privacy@lumiocms.com</a>.
              We will respond within 30 calendar days.
            </p>
            <p className="mt-3">
              You also have the right to lodge a complaint with the ICO:{' '}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">ico.org.uk</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Cookies</h2>
            <p>
              We use essential cookies for authentication and security, and optional analytics cookies.
              See our <Link href="/cookies" className="text-purple-400 hover:text-purple-300 underline">Cookie Policy</Link> for full details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. We will notify you of significant changes by email.
              The &ldquo;last updated&rdquo; date at the top of this page always shows when it was last revised.
            </p>
          </section>

          <div className="pt-6 border-t border-white/10 text-xs text-gray-600">
            <p>Lumio Ltd · privacy@lumiocms.com · Registered in England and Wales</p>
            <p className="mt-1">Registered with the Information Commissioner&apos;s Office (ICO)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
