'use client'
import { useState, useEffect } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

function getSupabase() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!) }

export default function AdminFootballClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') || '' : ''
  const [club, setClub] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/football?slug=${slug}`, { headers: { 'x-admin-token': token } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { const c = d?.clubs?.find((c: any) => c.slug === slug); if (c) { setClub(c); setNotes(c.notes || '') }; setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug, token])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: '#F5A623' }} /></div>
  if (!club) return <div className="text-center py-20"><p className="text-sm" style={{ color: '#6B7280' }}>Club not found</p></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}><ArrowLeft size={16} /></button>
        <div><h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{club.club_name}</h1><p className="text-xs" style={{ color: '#6B7280' }}>{club.tier} · Position: {club.league_position || '—'}</p></div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => router.push(`/demo/football/${slug}`)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(245,166,35,0.1)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)' }}><ExternalLink size={12} /> Impersonate</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ l: 'Plan', v: club.plan || 'Pro Club' }, { l: 'Status', v: club.status }, { l: 'Monthly', v: `£${(club.monthly_price || 5000).toLocaleString()}` }, { l: 'Health', v: `${club.health_score || 60}/100` }].map(s => (
          <div key={s.l} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><p className="text-xs" style={{ color: '#6B7280' }}>{s.l}</p><p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{s.v}</p></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Club Details</p>
          {[['Stadium', club.stadium], ['Capacity', club.capacity?.toLocaleString()], ['Director of Football', club.director_of_football], ['Head Coach', club.head_coach], ['Contact', club.contact_name], ['Email', club.contact_email], ['Created', club.created_at ? new Date(club.created_at).toLocaleDateString('en-GB') : '—']].map(([l, v]) => (
            <div key={l} className="flex justify-between py-1.5"><span className="text-xs" style={{ color: '#9CA3AF' }}>{l}</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{v || '—'}</span></div>
          ))}
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Admin Notes</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={6} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} placeholder="Add notes about this club..." />
        </div>
      </div>
    </div>
  )
}
