import Link from 'next/link'
import type { Metadata } from 'next'

// The support page the App Store listing points to (Apple asks for one), and
// a plain answer to the questions coaches and families ask most.

export const metadata: Metadata = {
  title: 'Lumio Tennis Coach support',
  description: 'Help with signing in, notifications, the iPhone app, and your data.',
}

const QA: { q: string; a: React.ReactNode }[] = [
  {
    q: 'How do I sign in?',
    a: <>Enter your email and we send you a six-digit code; there is no password to remember. Coaches sign in with the address they signed up with. Players and parents sign in with the address their coach invited.</>,
  },
  {
    q: 'I am a player or parent and my email is not recognised',
    a: <>Your coach adds you. Ask them to send an invite to the address you want to use, then sign in with that address.</>,
  },
  {
    q: 'Can I try it without an account?',
    a: <>Yes. On the iPhone app’s sign-in screen, tap <strong className="text-gray-200">Explore the demo</strong>. It is a full coaching academy with sample data, and nothing you do in it reaches a real academy.</>,
  },
  {
    q: 'Notifications',
    a: <>The app asks once, after you sign in. To change your mind, open the iPhone’s Settings, then Notifications, then Lumio Coach. Signing out on the phone stops them too.</>,
  },
  {
    q: 'Paying for lessons',
    a: <>Payments for lessons, groups and trips go to your coach through Stripe. Questions about a charge or a refund are for your coach, who can refund it from their account.</>,
  },
  {
    q: 'Deleting your account or your data',
    a: <>Use the <Link href="/data-deletion" className="text-sky-400 underline">data request form</Link>, or email us. A player’s lesson history belongs to their coach’s academy, so we confirm with the coach before removing it.</>,
  },
]

export default function TennisCoachSupport() {
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#07080F' }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Lumio Tennis Coach</p>
        <h1 className="text-4xl font-black mb-4">Support</h1>
        <p className="text-gray-400 mb-10">
          Email <a href="mailto:hello@lumiosports.com?subject=Lumio%20Tennis%20Coach%20support" className="text-sky-400 underline">hello@lumiosports.com</a> and
          we will reply within one working day.
        </p>
        <div className="space-y-6">
          {QA.map(x => (
            <section key={x.q} className="border-t border-white/10 pt-5">
              <h2 className="text-base font-bold text-white mb-2">{x.q}</h2>
              <p className="text-sm text-gray-400 leading-relaxed">{x.a}</p>
            </section>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-12">
          <Link href="/privacy" className="underline">Privacy policy</Link> · <Link href="/terms" className="underline">Terms</Link>
        </p>
      </div>
    </div>
  )
}
