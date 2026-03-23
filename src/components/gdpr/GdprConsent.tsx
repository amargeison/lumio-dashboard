'use client'

import Link from 'next/link'

interface GdprConsentProps {
  processingConsent: boolean
  onProcessingConsentChange: (value: boolean) => void
  marketingConsent: boolean
  onMarketingConsentChange: (value: boolean) => void
  companyName?: string
  purposeStatement: string
  retentionPeriod: string
  lawfulBasis: 'consent' | 'contract' | 'legitimate_interest'
  showDataTransferNotice?: boolean
  showDemoNotice?: boolean
}

export default function GdprConsent({
  processingConsent,
  onProcessingConsentChange,
  marketingConsent,
  onMarketingConsentChange,
  companyName = 'Lumio Ltd',
  purposeStatement,
  retentionPeriod,
  lawfulBasis,
  showDataTransferNotice = false,
  showDemoNotice = false,
}: GdprConsentProps) {
  const lawfulBasisText = {
    consent: 'You are providing explicit consent under UK GDPR Article 6(1)(a)',
    contract: 'Processing is necessary for the performance of a contract under UK GDPR Article 6(1)(b)',
    legitimate_interest: 'Processing is based on legitimate interests under UK GDPR Article 6(1)(f)',
  }[lawfulBasis]

  return (
    <div className="space-y-3 pt-3 border-t border-white/10">
      {showDemoNotice && (
        <div className="bg-amber-600/5 border border-amber-500/15 rounded-xl px-4 py-3 mb-1">
          <p className="text-xs text-amber-300 font-semibold mb-1">⏱ Demo data deletion notice</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Your demo workspace and all associated data will be{' '}
            <strong className="text-white">permanently deleted after {retentionPeriod}</strong>.
            This includes your company profile, any uploaded files, and all workflow data.
            You will receive a reminder email 2 days before deletion.
            To keep your data, upgrade to a paid subscription before expiry.
          </p>
        </div>
      )}

      {showDataTransferNotice && (
        <div className="bg-blue-600/5 border border-blue-500/15 rounded-xl px-4 py-3 mb-1">
          <p className="text-xs text-blue-300 font-semibold mb-1">🌍 International data transfer notice</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Lumio uses Anthropic&apos;s Claude API (USA) to power AI features. Data processed through AI workflows
            may be temporarily transmitted to Anthropic&apos;s servers under their{' '}
            <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
              Data Processing Agreement
            </a>
            . Anthropic does not retain or train on this data.
            Primary data storage remains in the UK (AWS eu-west-2, London).
          </p>
        </div>
      )}

      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={processingConsent}
            onChange={e => onProcessingConsentChange(e.target.checked)}
            className="peer sr-only"
            id="gdpr-processing"
          />
          <div className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all ${
            processingConsent
              ? 'bg-purple-600 border-purple-600'
              : 'border-white/30 group-hover:border-white/50'
          }`}>
            {processingConsent && <span className="text-white text-xs leading-none">✓</span>}
          </div>
        </div>
        <span className="text-xs text-gray-400 leading-relaxed">
          I agree that <strong className="text-gray-300">{companyName}</strong> may process my personal data to {purposeStatement}.{' '}
          Data will be retained for <strong className="text-gray-300">{retentionPeriod}</strong> and then securely deleted.
          I have the right to access, correct, or delete my data at any time by emailing{' '}
          <a href="mailto:privacy@lumiocms.com" className="text-purple-400 hover:text-purple-300">privacy@lumiocms.com</a>{' '}
          or using our{' '}
          <Link href="/data-deletion" className="text-purple-400 hover:text-purple-300 underline">data deletion form</Link>.{' '}
          <span className="text-gray-600">({lawfulBasisText})</span>{' '}
          <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</Link>{' '}·{' '}
          <Link href="/terms" className="text-purple-400 hover:text-purple-300 underline">Terms</Link> *
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={e => onMarketingConsentChange(e.target.checked)}
            className="peer sr-only"
            id="gdpr-marketing"
          />
          <div className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all ${
            marketingConsent
              ? 'bg-purple-600 border-purple-600'
              : 'border-white/30 group-hover:border-white/50'
          }`}>
            {marketingConsent && <span className="text-white text-xs leading-none">✓</span>}
          </div>
        </div>
        <span className="text-xs text-gray-400 leading-relaxed">
          I&apos;m happy for {companyName} to send me occasional product updates, tips, and relevant offers.
          I can unsubscribe at any time.{' '}
          <span className="text-gray-600">(Optional · UK GDPR Article 6(1)(a))</span>
        </span>
      </label>

      <div className="pt-2">
        <p className="text-xs text-gray-700 leading-relaxed">
          {companyName} is registered with the Information Commissioner&apos;s Office (ICO) as a data controller.
          {' '}Your data is stored in the UK (AWS eu-west-2, London) and never sold to third parties.
          {' '}For the full list of sub-processors, see our{' '}
          <Link href="/privacy#sub-processors" className="text-gray-600 underline hover:text-gray-500">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
