'use client'

import { useState, useEffect } from 'react'
import { useCRMWorkspaceId } from '@/hooks/useCRMWorkspaceId'
import ContactGrid from '@/components/crm/ContactGrid'
import ContactDrawer from '@/components/crm/ContactDrawer'
import AddContactModal from '@/components/crm/AddContactModal'
import DedupeBanner from '@/components/crm/DedupeBanner'
import type { CRMContact } from '@/lib/crm/types'

const DEMO_CONTACTS: CRMContact[] = [
  { id: 'dc1', tenant_id: '', name: 'Rachel Fox', email: 'rachel@greenfield.edu', phone: '+44 7700 900123', role: 'Head of IT', company_name: 'Greenfield Academy', company_id: null, linkedin_url: null, twitter_handle: null, location: 'London', bio: null, avatar_initials: 'RF', avatar_color: '#0D9488', aria_score: 92, email_status: 'live', linkedin_status: 'found', company_status: 'confirmed', tags: ['education', 'active'], deal_value: 45000, last_contacted_at: '2026-03-28', enriched_at: null, enrichment_data: {}, buying_signals: ['Opened pricing page'], created_at: '2026-01-15', updated_at: '2026-03-28' },
  { id: 'dc2', tenant_id: '', name: 'Gary Stone', email: 'gary@oakridge.edu', phone: '+44 7700 900456', role: 'CFO', company_name: 'Oakridge Schools Ltd', company_id: null, linkedin_url: null, twitter_handle: null, location: 'Bristol', bio: null, avatar_initials: 'GS', avatar_color: '#6D28D9', aria_score: 78, email_status: 'live', linkedin_status: 'found', company_status: 'confirmed', tags: ['education'], deal_value: 76000, last_contacted_at: '2026-03-25', enriched_at: null, enrichment_data: {}, buying_signals: [], created_at: '2026-02-01', updated_at: '2026-03-25' },
  { id: 'dc3', tenant_id: '', name: 'Ann Mehta', email: 'ann@torchbearer.edu', phone: '+44 7700 900789', role: 'CEO', company_name: 'Torchbearer Trust', company_id: null, linkedin_url: null, twitter_handle: null, location: 'Manchester', bio: null, avatar_initials: 'AM', avatar_color: '#EC4899', aria_score: 85, email_status: 'live', linkedin_status: 'found', company_status: 'confirmed', tags: ['trust', 'enterprise'], deal_value: 120000, last_contacted_at: '2026-03-20', enriched_at: null, enrichment_data: {}, buying_signals: ['Requested demo'], created_at: '2026-01-20', updated_at: '2026-03-20' },
  { id: 'dc4', tenant_id: '', name: 'Lee Dawson', email: 'lee@brightfields.edu', phone: '+44 7700 901234', role: 'Director', company_name: 'Brightfields MAT', company_id: null, linkedin_url: null, twitter_handle: null, location: 'Leeds', bio: null, avatar_initials: 'LD', avatar_color: '#F59E0B', aria_score: 68, email_status: 'live', linkedin_status: 'unknown', company_status: 'confirmed', tags: ['mat'], deal_value: 85000, last_contacted_at: '2026-03-22', enriched_at: null, enrichment_data: {}, buying_signals: [], created_at: '2026-02-10', updated_at: '2026-03-22' },
  { id: 'dc5', tenant_id: '', name: 'Maria Olsen', email: 'maria@starling.edu', phone: '+44 7700 901567', role: 'Head of School', company_name: 'Starling Schools', company_id: null, linkedin_url: null, twitter_handle: null, location: 'Edinburgh', bio: null, avatar_initials: 'MO', avatar_color: '#3B82F6', aria_score: 65, email_status: 'live', linkedin_status: 'found', company_status: 'confirmed', tags: ['education'], deal_value: 48000, last_contacted_at: '2026-03-18', enriched_at: null, enrichment_data: {}, buying_signals: [], created_at: '2026-02-15', updated_at: '2026-03-18' },
  { id: 'dc6', tenant_id: '', name: 'Jake Burns', email: 'jake@northpoint.edu', phone: '+44 7700 901890', role: 'Headteacher', company_name: 'Northpoint Primary', company_id: null, linkedin_url: null, twitter_handle: null, location: 'Birmingham', bio: null, avatar_initials: 'JB', avatar_color: '#EF4444', aria_score: 55, email_status: 'live', linkedin_status: 'not_found', company_status: 'confirmed', tags: ['primary'], deal_value: 28000, last_contacted_at: '2026-03-30', enriched_at: null, enrichment_data: {}, buying_signals: [], created_at: '2026-03-01', updated_at: '2026-03-30' },
  { id: 'dc7', tenant_id: '', name: 'Marcus Chen', email: 'marcus@meridian.edu', phone: '+44 7700 902123', role: 'CTO', company_name: 'Meridian Trust', company_id: null, linkedin_url: null, twitter_handle: null, location: 'London', bio: null, avatar_initials: 'MC', avatar_color: '#0EA5E9', aria_score: 88, email_status: 'live', linkedin_status: 'found', company_status: 'confirmed', tags: ['trust', 'tech'], deal_value: 95000, last_contacted_at: '2026-03-27', enriched_at: null, enrichment_data: {}, buying_signals: ['Visited SSO page'], created_at: '2026-01-10', updated_at: '2026-03-27' },
  { id: 'dc8', tenant_id: '', name: 'Priya Shah', email: 'priya@helix.edu', phone: '+44 7700 902456', role: 'COO', company_name: 'Helix Education', company_id: null, linkedin_url: null, twitter_handle: null, location: 'Nottingham', bio: null, avatar_initials: 'PS', avatar_color: '#15803D', aria_score: 71, email_status: 'live', linkedin_status: 'found', company_status: 'confirmed', tags: ['education'], deal_value: 62000, last_contacted_at: '2026-03-15', enriched_at: null, enrichment_data: {}, buying_signals: [], created_at: '2026-02-20', updated_at: '2026-03-15' },
  { id: 'dc9', tenant_id: '', name: 'Owen James', email: 'owen@calibre.edu', phone: '+44 7700 902789', role: 'VP Education', company_name: 'Calibre Learning', company_id: null, linkedin_url: null, twitter_handle: null, location: 'Cardiff', bio: null, avatar_initials: 'OJ', avatar_color: '#7C3AED', aria_score: 95, email_status: 'live', linkedin_status: 'found', company_status: 'confirmed', tags: ['enterprise'], deal_value: 175000, last_contacted_at: '2026-03-29', enriched_at: null, enrichment_data: {}, buying_signals: ['Downloaded whitepaper', 'Attended webinar'], created_at: '2025-12-01', updated_at: '2026-03-29' },
  { id: 'dc10', tenant_id: '', name: 'Nina Webb', email: 'nina@apex.edu', phone: '+44 7700 903012', role: 'Deputy Head', company_name: 'Apex Tutors', company_id: null, linkedin_url: null, twitter_handle: null, location: 'Oxford', bio: null, avatar_initials: 'NW', avatar_color: '#B45309', aria_score: 42, email_status: 'warning', linkedin_status: 'unknown', company_status: 'warning', tags: ['new'], deal_value: 18000, last_contacted_at: '2026-03-10', enriched_at: null, enrichment_data: {}, buying_signals: [], created_at: '2026-03-05', updated_at: '2026-03-10' },
  { id: 'dc11', tenant_id: '', name: 'Adam Cole', email: 'adam@meridian-college.edu', phone: '+44 7700 903345', role: 'Operations Director', company_name: 'Meridian College', company_id: null, linkedin_url: null, twitter_handle: null, location: 'Cambridge', bio: null, avatar_initials: 'AC', avatar_color: '#1D4ED8', aria_score: 76, email_status: 'live', linkedin_status: 'found', company_status: 'confirmed', tags: ['education'], deal_value: 55000, last_contacted_at: '2026-03-26', enriched_at: null, enrichment_data: {}, buying_signals: [], created_at: '2026-01-25', updated_at: '2026-03-26' },
  { id: 'dc12', tenant_id: '', name: 'Helen Park', email: 'helen@whitestone.edu', phone: '+44 7700 903678', role: 'Business Manager', company_name: 'Whitestone MAT', company_id: null, linkedin_url: null, twitter_handle: null, location: 'Liverpool', bio: null, avatar_initials: 'HP', avatar_color: '#C8960C', aria_score: 82, email_status: 'live', linkedin_status: 'found', company_status: 'confirmed', tags: ['mat', 'finance'], deal_value: 42000, last_contacted_at: '2026-03-24', enriched_at: null, enrichment_data: {}, buying_signals: ['Opened pricing email'], created_at: '2026-02-05', updated_at: '2026-03-24' },
]

export default function ContactsPage() {
  const workspaceId = useCRMWorkspaceId()
  const isDemoActive = typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true'
  const [contacts, setContacts] = useState<CRMContact[]>(isDemoActive && !workspaceId ? DEMO_CONTACTS : [])
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(!isDemoActive)
  const [activeTab, setActiveTab] = useState<'all' | 'duplicates'>('all')
  const [dupeCount, setDupeCount] = useState(0)

  useEffect(() => {
    if (!workspaceId) { if (isDemoActive) { setContacts(DEMO_CONTACTS); setLoading(false) }; return }
    async function load() {
      try {
        const { getCRMData, seedDemoData } = await import('@/lib/crm/actions')
        let data = await getCRMData(workspaceId!)
        const demoActive = typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true'
        if (data.contacts.length === 0 && demoActive) {
          await seedDemoData(workspaceId!)
          data = await getCRMData(workspaceId!)
        }
        // Also load imported contacts from localStorage
        try {
          const imported = JSON.parse(localStorage.getItem('lumio_crm_contacts') || '[]')
          if (imported.length) {
            const mapped = imported.map((c: any, i: number) => ({
              id: `imported-${i}`,
              workspace_id: workspaceId,
              first_name: c.first_name || '',
              last_name: c.last_name || '',
              email: c.email || '',
              company: c.company || '',
              phone: c.phone || '',
              job_title: c.job_title || '',
              tags: c.tags ? [c.tags] : [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              verified: false,
              health_score: null,
              deal_count: 0,
              total_value: 0,
            }))
            data.contacts = [...mapped, ...data.contacts]
          }
        } catch { /* ignore */ }
        setContacts(data.contacts)
      } catch (e) {
        console.error('Failed to load contacts:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [workspaceId])

  useEffect(() => {
    // Count contacts that have potential duplicates (demo: contacts with similar domains)
    const domains = contacts.map((c: CRMContact) => c.email?.split('@')[1] ?? '')
    const dupes = domains.filter((d: string, i: number) => d && domains.indexOf(d) !== i)
    setDupeCount(dupes.length > 0 ? Math.min(dupes.length + 1, 4) : 0)
  }, [contacts])

  async function handleSaveContact(contactData: Partial<CRMContact>) {
    if (!workspaceId) return
    try {
      const { createContact } = await import('@/lib/crm/actions')
      const newContact = await createContact(workspaceId!, contactData)
      if (newContact) {
        setContacts(prev => [newContact, ...prev])
      }
    } catch (e) {
      console.error('Failed to save contact:', e)
    }
    setShowAddModal(false)
  }

  async function handleReVerify(contactId: string) {
    const contact = contacts.find(c => c.id === contactId)
    if (!contact) return
    const token = localStorage.getItem('workspace_session_token')
    if (!token) return

    try {
      const res = await fetch('/api/crm/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-token': token },
        body: JSON.stringify({
          name: contact.name,
          email: contact.email,
          company: contact.company_name,
          role: contact.role,
        }),
      })
      const enrichment = await res.json()
      if (enrichment && !enrichment.error) {
        const { updateContact } = await import('@/lib/crm/actions')
        const updated: Partial<CRMContact> = {
          email_status: enrichment.emailStatus || contact.email_status,
          company_status: enrichment.companyStatus || contact.company_status,
          bio: enrichment.bio || contact.bio,
          buying_signals: enrichment.buyingSignals || contact.buying_signals,
          enriched_at: new Date().toISOString(),
          enrichment_data: enrichment,
        }
        await updateContact(contactId, updated)
        setContacts(prev => prev.map(c => c.id === contactId ? { ...c, ...updated } : c))
        if (selectedContact?.id === contactId) {
          setSelectedContact(prev => prev ? { ...prev, ...updated } : prev)
        }
      }
    } catch (e) {
      console.error('Re-verify failed:', e)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 50 }} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 220 }} />
          ))}
        </div>
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="relative flex flex-col items-center text-center max-w-md w-full">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl mb-6" style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.2), rgba(108,63,197,0.05))', border: '1px solid rgba(108,63,197,0.3)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>No contacts yet</h2>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: '#9CA3AF' }}>
            Discover contacts with AI, import via CSV, or add your first contact manually.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <button onClick={() => setShowAddModal(true)} className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-semibold" style={{ backgroundColor: '#7C3AED', color: '#F9FAFB' }}>
              Add your first contact
            </button>
            <a href="/crm/companies" className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF', textDecoration: 'none' }}>
              Find contacts via Company Discovery
            </a>
            <a href="/settings" className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF', textDecoration: 'none' }}>
              Import from CSV
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F1F3FA' }}>Contacts</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7299' }}>
            {contacts.length} contacts · {contacts.filter(c => c.email_status === 'live').length} verified
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('all')} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: activeTab === 'all' ? '#6C3FC5' : '#111318', color: activeTab === 'all' ? '#fff' : '#6B7280', border: activeTab === 'all' ? 'none' : '1px solid #1F2937' }}>
          All ({contacts.length})
        </button>
        <button onClick={() => setActiveTab('duplicates')} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: activeTab === 'duplicates' ? '#F59E0B' : '#111318', color: activeTab === 'duplicates' ? '#fff' : '#6B7280', border: activeTab === 'duplicates' ? 'none' : '1px solid #1F2937' }}>
          Duplicates {dupeCount > 0 ? `(${dupeCount})` : ''}
        </button>
      </div>

      {activeTab === 'duplicates' ? (
        <div className="space-y-3">
          {contacts.map((c: CRMContact) => (
            <DedupeBanner key={c.id} recordId={c.id} recordType="contact" recordData={c as unknown as Record<string, unknown>} />
          ))}
        </div>
      ) : (
        <ContactGrid
          contacts={contacts}
          onContactClick={setSelectedContact}
          onAddClick={() => setShowAddModal(true)}
        />
      )}

      <ContactDrawer
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onReVerify={handleReVerify}
      />

      <AddContactModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveContact}
        tenantId={workspaceId || ''}
      />
    </div>
  )
}
