'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWorkspace } from '@/hooks/useWorkspace'
import { ArrowLeft, Mail, Phone, MapPin, Linkedin, Building2, Calendar } from 'lucide-react'
import type { CRMContact, CRMActivity } from '@/lib/crm/types'

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ws = useWorkspace()
  const [contact, setContact] = useState<CRMContact | null>(null)
  const [activities, setActivities] = useState<CRMActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ws?.id || !params.id) return
    async function load() {
      try {
        const { getCRMData } = await import('@/lib/crm/actions')
        const data = await getCRMData(ws!.id)
        const found = data.contacts.find((c: CRMContact) => c.id === params.id)
        if (found) {
          setContact(found)
          setActivities(data.activities.filter((a: CRMActivity) => a.contact_id === found.id))
        }
      } catch (e) {
        console.error('Failed to load contact:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [ws?.id, params.id])

  if (loading) {
    return <div className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 400 }} />
  }

  if (!contact) {
    return (
      <div className="text-center py-20">
        <p style={{ color: '#6B7299' }}>Contact not found</p>
        <button onClick={() => router.push('/crm/contacts')} className="mt-4 text-sm" style={{ color: '#8B5CF6' }}>
          Back to contacts
        </button>
      </div>
    )
  }

  const tagColors: Record<string, { bg: string; text: string }> = {
    'Hot Lead': { bg: '#EF444420', text: '#EF4444' },
    'Warm': { bg: '#F59E0B20', text: '#F59E0B' },
    'Cold': { bg: '#6B729920', text: '#6B7299' },
    'Enterprise': { bg: '#8B5CF620', text: '#8B5CF6' },
    'New': { bg: '#14B8A620', text: '#14B8A6' },
    'Decision Maker': { bg: '#22D3EE20', text: '#22D3EE' },
    'Growth': { bg: '#10B98120', text: '#10B981' },
    'Technical': { bg: '#EF444420', text: '#EF4444' },
    'SMB': { bg: '#F59E0B20', text: '#F59E0B' },
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back button */}
      <button
        onClick={() => router.push('/crm/contacts')}
        className="flex items-center gap-2 text-sm transition-colors"
        style={{ color: '#6B7299' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#F1F3FA' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#6B7299' }}
      >
        <ArrowLeft size={16} /> Back to contacts
      </button>

      {/* Header card */}
      <div className="rounded-xl p-6" style={{ background: '#0F1019', border: '1px solid #1E2035' }}>
        <div className="flex items-start gap-4">
          <div
            className="flex items-center justify-center rounded-full text-lg font-bold shrink-0"
            style={{
              width: 56, height: 56,
              background: contact.avatar_color || '#6C3FC5',
              color: '#F1F3FA',
            }}
          >
            {contact.avatar_initials || contact.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: '#F1F3FA' }}>{contact.name}</h1>
            <p className="text-sm mt-1">
              <span style={{ color: '#6B7299' }}>{contact.role}</span>
              {contact.company_name && (
                <span style={{ color: '#0D9488' }}> at {contact.company_name}</span>
              )}
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {(contact.tags || []).map(tag => (
                <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    background: tagColors[tag]?.bg || '#1E2035',
                    color: tagColors[tag]?.text || '#6B7299',
                  }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          {/* ARIA Score */}
          <div className="shrink-0">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#1E2035" strokeWidth="4" />
              <circle cx="28" cy="28" r="22" fill="none"
                stroke={contact.aria_score >= 80 ? '#10B981' : contact.aria_score >= 60 ? '#8B5CF6' : '#EF4444'}
                strokeWidth="4"
                strokeDasharray={`${(contact.aria_score / 100) * 138.23} 138.23`}
                strokeLinecap="round" transform="rotate(-90 28 28)" />
              <text x="28" y="28" textAnchor="middle" dominantBaseline="central"
                fill="#F1F3FA" fontSize="14" fontWeight="700">{contact.aria_score}</text>
            </svg>
            <p className="text-xs text-center mt-1" style={{ color: '#6B7299' }}>ARIA</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact info */}
        <div className="rounded-xl p-6" style={{ background: '#0F1019', border: '1px solid #1E2035' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#F1F3FA' }}>Contact Information</h3>
          <div className="space-y-3">
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail size={14} style={{ color: '#6B7299' }} />
                <span className="text-sm" style={{ color: '#F1F3FA' }}>{contact.email}</span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: contact.email_status === 'live' ? '#10B98120' : '#F59E0B20',
                    color: contact.email_status === 'live' ? '#10B981' : '#F59E0B',
                  }}>
                  {contact.email_status === 'live' ? '✓ Live' : '⚠ ' + contact.email_status}
                </span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone size={14} style={{ color: '#6B7299' }} />
                <span className="text-sm" style={{ color: '#F1F3FA' }}>{contact.phone}</span>
              </div>
            )}
            {contact.linkedin_url && (
              <div className="flex items-center gap-3">
                <Linkedin size={14} style={{ color: '#6B7299' }} />
                <span className="text-sm" style={{ color: '#8B5CF6' }}>{contact.linkedin_url}</span>
              </div>
            )}
            {contact.location && (
              <div className="flex items-center gap-3">
                <MapPin size={14} style={{ color: '#6B7299' }} />
                <span className="text-sm" style={{ color: '#F1F3FA' }}>{contact.location}</span>
              </div>
            )}
            {contact.company_name && (
              <div className="flex items-center gap-3">
                <Building2 size={14} style={{ color: '#6B7299' }} />
                <span className="text-sm" style={{ color: '#F1F3FA' }}>{contact.company_name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: contact.company_status === 'confirmed' ? '#10B98120' : '#F59E0B20',
                    color: contact.company_status === 'confirmed' ? '#10B981' : '#F59E0B',
                  }}>
                  {contact.company_status === 'confirmed' ? '✓ Confirmed' : '⚠ ' + contact.company_status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Verification + Intelligence */}
        <div className="rounded-xl p-6" style={{ background: '#0F1019', border: '1px solid #1E2035' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#F1F3FA' }}>ARIA Verification</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3" style={{ background: '#121320' }}>
              <p className="text-xs" style={{ color: '#6B7299' }}>Email</p>
              <p className="text-sm font-medium" style={{ color: contact.email_status === 'live' ? '#10B981' : '#F59E0B' }}>
                {contact.email_status === 'live' ? '✓ Deliverable' : '⚠ Check required'}
              </p>
            </div>
            <div className="rounded-lg p-3" style={{ background: '#121320' }}>
              <p className="text-xs" style={{ color: '#6B7299' }}>LinkedIn</p>
              <p className="text-sm font-medium" style={{ color: contact.linkedin_status === 'found' ? '#10B981' : '#6B7299' }}>
                {contact.linkedin_status === 'found' ? '✓ Found' : '? Unknown'}
              </p>
            </div>
            <div className="rounded-lg p-3" style={{ background: '#121320' }}>
              <p className="text-xs" style={{ color: '#6B7299' }}>Company</p>
              <p className="text-sm font-medium" style={{ color: contact.company_status === 'confirmed' ? '#10B981' : '#F59E0B' }}>
                {contact.company_status === 'confirmed' ? '✓ Confirmed' : '⚠ Check'}
              </p>
            </div>
            <div className="rounded-lg p-3" style={{ background: '#121320' }}>
              <p className="text-xs" style={{ color: '#6B7299' }}>Social</p>
              <p className="text-sm font-medium" style={{ color: contact.twitter_handle ? '#10B981' : '#6B7299' }}>
                {contact.twitter_handle ? '✓ Active' : '? Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {contact.bio && (
        <div className="rounded-xl p-6" style={{ background: '#0F1019', border: '1px solid #1E2035' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#F1F3FA' }}>ARIA Bio</h3>
          <p className="text-sm italic" style={{ color: '#9CA3AF' }}>{contact.bio}</p>
        </div>
      )}

      {/* Buying Signals */}
      {contact.buying_signals && contact.buying_signals.length > 0 && (
        <div className="rounded-xl p-6" style={{ background: '#0F1019', border: '1px solid #1E2035' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#F1F3FA' }}>Buying Signals & Triggers</h3>
          <div className="flex flex-wrap gap-2">
            {contact.buying_signals.map((signal, i) => {
              const isWarning = signal.includes('⚠')
              return (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                  style={{
                    background: isWarning ? '#F59E0B15' : '#0D948815',
                    color: isWarning ? '#F59E0B' : '#14B8A6',
                    border: `1px solid ${isWarning ? '#F59E0B30' : '#0D948830'}`,
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: isWarning ? '#F59E0B' : '#14B8A6' }} />
                  {signal}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      <div className="rounded-xl p-6" style={{ background: '#0F1019', border: '1px solid #1E2035' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#F1F3FA' }}>Activity Timeline</h3>
        {activities.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: '#6B7299' }}>No activity recorded yet</p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 10).map(activity => {
              const icons: Record<string, string> = { call: '📞', email: '✉️', note: '📝', meeting: '📅', task: '✅', enrichment: '🔍', aria_alert: '⚡' }
              return (
                <div key={activity.id} className="flex items-start gap-3 py-2" style={{ borderBottom: '1px solid #1E2035' }}>
                  <span className="text-sm">{icons[activity.type] || '📋'}</span>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: '#F1F3FA' }}>{activity.title}</p>
                    {activity.body && <p className="text-xs mt-0.5" style={{ color: '#6B7299' }}>{activity.body}</p>}
                  </div>
                  <span className="text-xs shrink-0" style={{ color: '#6B7299' }}>
                    {new Date(activity.created_at).toLocaleDateString()}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
