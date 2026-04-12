'use client'

export default function SportsAdminEvents() {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: 0 }}>Activity</h1>
        <p style={{ color: '#475569', fontSize: 14, marginTop: 4 }}>Event tracking and usage analytics</p>
      </div>

      <div style={{ background: '#0d1117', border: '1px solid #1F2937', borderRadius: 12, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
        <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Activity tracking coming soon</h2>
        <p style={{ color: '#475569', fontSize: 14, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
          Activity tracking will appear here once athletes use their portals. Events fire automatically on AI calls, quick actions, page views, and settings changes.
        </p>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['AI Calls', 'Quick Actions', 'Page Views', 'Logins', 'Settings Changes'].map(t => (
            <span key={t} style={{ background: '#1F2937', color: '#94a3b8', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 500 }}>{t}</span>
          ))}
        </div>
        <p style={{ color: '#374151', fontSize: 12, marginTop: 24 }}>
          Run supabase/migrations/088_sports_admin.sql to enable event tracking tables.
        </p>
      </div>
    </div>
  )
}
