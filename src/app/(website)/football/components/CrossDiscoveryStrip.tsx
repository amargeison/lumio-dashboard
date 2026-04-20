import Link from 'next/link'

type TierKey = 'pro' | 'non-league' | 'grassroots'

const COPY: Record<TierKey, { lead: string; links: { href: string; label: string }[] }> = {
  'pro': {
    lead: 'Not a pro club?',
    links: [
      { href: '/football/non-league',  label: 'See Lumio for Non-League →' },
      { href: '/football/grassroots',  label: 'Or Grassroots →' },
    ],
  },
  'non-league': {
    lead: 'Different level?',
    links: [
      { href: '/football/pro',         label: 'Premier League or EFL — See Lumio Pro →' },
      { href: '/football/grassroots',  label: 'Amateur side — See Grassroots →' },
    ],
  },
  'grassroots': {
    lead: 'Stepping up?',
    links: [
      { href: '/football/non-league',  label: 'Non-League club — See Lumio Non-League →' },
      { href: '/football/pro',         label: 'Pro club — See Lumio Pro →' },
    ],
  },
}

export function CrossDiscoveryStrip({ tier }: { tier: TierKey }) {
  const { lead, links } = COPY[tier]
  return (
    <section
      style={{
        padding: '32px 24px',
        backgroundColor: '#0A0C14',
        borderTop: '1px solid #1F2937',
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          backgroundColor: '#0D1117',
          border: '1px solid #1F2937',
          borderRadius: 14,
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600 }}>{lead}</span>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', flex: 1 }}>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontSize: 13,
                color: '#F1C40F',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
