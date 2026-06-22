import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Lumio',
  description: 'The terms governing your use of Lumio Sports and Lumio CMS.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#07080F' }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-black mb-4">Terms of Service</h1>
          <p className="text-gray-400">Last updated: June 2026 · Lumio Ltd</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Agreement to these terms</h2>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) are a legal agreement between you and Lumio Ltd
              (&ldquo;Lumio&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), a company registered in England and Wales. They govern
              your access to and use of the Lumio Sports and Lumio CMS websites, portals, applications and related services
              (together, the &ldquo;Service&rdquo;). By creating an account, accessing a demo, or otherwise using the Service,
              you agree to these Terms. If you are using the Service on behalf of a club, academy or organisation, you confirm
              you have authority to bind that organisation to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. The Service</h2>
            <p>
              Lumio provides software for sports clubs, academies and coaches to manage fixtures, sessions, players, bookings,
              communications, payments and related activities. Features vary by sport, plan and configuration, and we may add,
              change or remove features over time. Some features are offered as previews or beta and may change or be withdrawn.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Accounts and eligibility</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>You must be at least 18 years old to create an account.</li>
              <li>You must provide accurate information and keep your account details up to date.</li>
              <li>You are responsible for keeping your login credentials secure and for all activity under your account.</li>
              <li>You must notify us promptly at <a href="mailto:hello@lumiocms.com" className="text-purple-400 hover:text-purple-300">hello@lumiocms.com</a> of any suspected unauthorised use.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Subscriptions, billing and cancellation</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Paid plans are billed in advance on a recurring basis (monthly or as otherwise stated at sign-up) via our payment processor, Stripe.</li>
              <li>Subscriptions renew automatically until cancelled. You can cancel at any time; cancellation takes effect at the end of the current billing period.</li>
              <li>Except where required by law, fees already paid are non-refundable.</li>
              <li>We may change pricing on renewal with reasonable prior notice.</li>
              <li>Demo and free-tier workspaces may have limits and may be reset or deleted as described in our documentation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Acceptable use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Use the Service for any unlawful purpose or in breach of any applicable law or regulation;</li>
              <li>Upload content that is unlawful, harmful, infringing, or that you do not have the right to share;</li>
              <li>Attempt to gain unauthorised access to the Service, other accounts, or our systems;</li>
              <li>Probe, scan, scrape, overload or disrupt the Service or its infrastructure;</li>
              <li>Reverse engineer or copy the Service except to the extent permitted by law;</li>
              <li>Resell or provide the Service to third parties except as expressly permitted.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Your data and responsibilities</h2>
            <p>
              You retain ownership of the content and data you and your members add to the Service (&ldquo;Customer Data&rdquo;).
              You grant us a licence to host and process Customer Data solely to provide and improve the Service, as described in
              our <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</Link>.
            </p>
            <p className="mt-2">
              Where you use the Service to process personal data about your players, members, parents or staff, you are the data
              controller for that data and we act as your processor. You are responsible for having a lawful basis and any required
              consents to process that data, including in respect of children. Where your activities involve minors, you are
              responsible for safeguarding, parental consent, and complying with the rules of your governing body. You must not
              upload special-category or children&apos;s data beyond what is necessary and lawful for your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Connected accounts (Google, Microsoft, Apple)</h2>
            <p>
              The Service lets you optionally connect a third-party email and calendar account (such as Google, Microsoft or
              Apple iCloud) so that bookings can sync and messages can be sent from your own address. By connecting an account you
              authorise Lumio to access that account on your behalf for those purposes, and you confirm you are permitted to do so.
            </p>
            <p className="mt-2">
              Your use of those third-party services remains subject to their own terms. You can disconnect a connected account at
              any time from your settings, which revokes Lumio&apos;s stored access for that account. Lumio&apos;s use of information
              received from Google APIs adheres to the{' '}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                Google API Services User Data Policy
              </a>, including the Limited Use requirements. We use connected-account data only to provide the features you enable,
              and we do not sell it or use it for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Intellectual property</h2>
            <p>
              The Service, including its software, design, branding and content (excluding Customer Data), is owned by Lumio or its
              licensors and is protected by intellectual property laws. We grant you a limited, non-exclusive, non-transferable
              right to use the Service in accordance with these Terms. All rights not expressly granted are reserved.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Availability and preview features</h2>
            <p>
              We aim to keep the Service available but do not guarantee uninterrupted or error-free operation, and we may carry out
              maintenance from time to time. Some features (including AI-assisted features) are provided on an evolving basis and
              their outputs may contain errors; you are responsible for reviewing outputs before relying on them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Disclaimers</h2>
            <p>
              To the fullest extent permitted by law, the Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
              without warranties of any kind, whether express or implied, including implied warranties of satisfactory quality,
              fitness for a particular purpose and non-infringement. Nothing in these Terms excludes liability that cannot lawfully
              be excluded.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, Lumio will not be liable for any indirect, incidental, special or
              consequential loss, or for loss of profits, revenue, data or goodwill. Our total aggregate liability arising out of or
              in connection with the Service in any 12-month period is limited to the greater of (a) the fees you paid to us in that
              period or (b) £100. We do not exclude or limit liability for death or personal injury caused by negligence, fraud, or
              any other liability that cannot be excluded under English law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">12. Indemnity</h2>
            <p>
              You agree to indemnify Lumio against claims, losses and reasonable costs arising from your breach of these Terms, your
              misuse of the Service, or your Customer Data infringing the rights of, or causing harm to, a third party.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">13. Suspension and termination</h2>
            <p>
              You may stop using the Service and close your account at any time. We may suspend or terminate access if you breach
              these Terms, if required by law, or to protect the Service or other users. On termination, your right to use the
              Service ends; we may delete Customer Data after a reasonable period in line with our Privacy Policy, and you should
              export anything you wish to keep beforehand.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">14. Changes to these terms</h2>
            <p>
              We may update these Terms from time to time. If we make material changes we will take reasonable steps to notify you,
              for example by email or in-product notice. Your continued use of the Service after changes take effect constitutes
              acceptance of the updated Terms. The &ldquo;last updated&rdquo; date above shows when these Terms were last revised.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">15. Governing law and disputes</h2>
            <p>
              These Terms and any dispute arising from them are governed by the laws of England and Wales, and the courts of England
              and Wales have exclusive jurisdiction, except that if you are a consumer you may benefit from mandatory protections of
              the law of your country of residence.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">16. Contact</h2>
            <p>
              Questions about these Terms can be sent to{' '}
              <a href="mailto:hello@lumiocms.com" className="text-purple-400 hover:text-purple-300">hello@lumiocms.com</a>.
              See also our <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</Link>{' '}
              and <Link href="/cookies" className="text-purple-400 hover:text-purple-300 underline">Cookie Policy</Link>.
            </p>
          </section>

          <div className="pt-6 border-t border-white/10 text-xs text-gray-600">
            <p>Lumio Ltd · hello@lumiocms.com · Registered in England and Wales</p>
          </div>
        </div>
      </div>
    </div>
  )
}
