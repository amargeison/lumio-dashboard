'use client'
import { useState } from 'react'

export default function SportsAdminSettings() {
  const [token, setToken] = useState('')
  const [saved, setSaved] = useState(false)

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: 0 }}>Settings</h1>
        <p style={{ color: '#475569', fontSize: 14, marginTop: 4 }}>Admin configuration</p>
      </div>

      <div style={{ maxWidth: 600 }}>
        <div style={{ background: '#0d1117', border: '1px solid #1F2937', borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Environment</h3>
          <p style={{ color: '#475569', fontSize: 13, marginBottom: 16 }}>Current deployment configuration.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Supabase URL', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Connected' : 'Not set'],
              ['Service Role Key', 'Configured (server-side)'],
              ['Anthropic API Key', 'Configured (server-side)'],
              ['Admin Token', 'Active'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1F293730' }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{k}</span>
                <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#0d1117', border: '1px solid #1F2937', borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Quick Links</h3>
          <p style={{ color: '#475569', fontSize: 13, marginBottom: 16 }}>External tools and dashboards.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Supabase Dashboard', 'https://supabase.com/dashboard'],
              ['Vercel Dashboard', 'https://vercel.com/dashboard'],
              ['Anthropic Console', 'https://console.anthropic.com'],
            ].map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                style={{ color: '#6C3FC5', fontSize: 13, textDecoration: 'none', padding: '6px 0' }}>
                {label} →
              </a>
            ))}
          </div>
        </div>

        <div style={{ background: '#0d1117', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 24 }}>
          <h3 style={{ color: '#ef4444', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Danger Zone</h3>
          <p style={{ color: '#475569', fontSize: 13, marginBottom: 16 }}>Destructive actions. Use with caution.</p>
          <button onClick={() => { localStorage.removeItem('sports_admin_token'); window.location.reload() }}
            style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
            Sign out of admin
          </button>
        </div>
      </div>
    </div>
  )
}
