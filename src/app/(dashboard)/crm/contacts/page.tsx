'use client'

import { useState, useEffect } from 'react'
import { useCRMWorkspaceId } from '@/hooks/useCRMWorkspaceId'
import ContactGrid from '@/components/crm/ContactGrid'
import ContactDrawer from '@/components/crm/ContactDrawer'
import AddContactModal from '@/components/crm/AddContactModal'
import type { CRMContact } from '@/lib/crm/types'

const DEMO_CONTACTS: CRMContact[] = [
  { id: 'dc1', workspace_id: '', first_name: 'Sarah', last_name: 'Mitchell', email: 'sarah@greenfield.edu', company: 'Greenfield Academy', job_title: 'Head of IT', phone: '+44 7700 900123', status: 'active', last_contacted: '2026-03-28', aria_score: 92, created_at: '' },
  { id: 'dc2', workspace_id: '', first_name: 'James', last_name: 'Harlow', email: 'james@oakridge.edu', company: 'Oakridge Schools Ltd', job_title: 'CFO', phone: '+44 7700 900456', status: 'active', last_contacted: '2026-03-25', aria_score: 78, created_at: '' },
  { id: 'dc3', workspace_id: '', first_name: 'Oliver', last_name: 'Bennett', email: 'oliver@bramblehill.org', company: 'Bramble Hill Trust', job_title: 'COO', phone: '+44 7700 900789', status: 'active', last_contacted: '2026-03-20', aria_score: 71, created_at: '' },
  { id: 'dc4', workspace_id: '', first_name: 'Raj', last_name: 'Patel', email: 'raj@hopscotch.edu', company: 'Hopscotch Learning', job_title: 'Director', phone: '+44 7700 901234', status: 'active', last_contacted: '2026-03-22', aria_score: 68, created_at: '' },
  { id: 'dc5', workspace_id: '', first_name: 'Sophie', last_name: 'Bell', email: 'sophie@crestview.edu', company: 'Crestview Academy', job_title: 'Head of School', phone: '+44 7700 901567', status: 'active', last_contacted: '2026-03-18', aria_score: 65, created_at: '' },
  { id: 'dc6', workspace_id: '', first_name: 'Dan', last_name: 'Marsh', email: 'dan@meadowbrook.edu', company: 'Meadowbrook Primary', job_title: 'Headteacher', phone: '+44 7700 901890', status: 'new', last_contacted: '2026-03-30', aria_score: 55, created_at: '' },
  { id: 'dc7', workspace_id: '', first_name: 'Marcus', last_name: 'Chen', email: 'marcus@starling.edu', company: 'Starling Schools', job_title: 'IT Lead', phone: '+44 7700 902123', status: 'new', last_contacted: '2026-03-15', aria_score: 48, created_at: '' },
  { id: 'dc8', workspace_id: '', first_name: 'Charlotte', last_name: 'Davies', email: 'charlotte@torch.edu', company: 'Torchbearer Trust', job_title: 'CEO', phone: '+44 7700 902456', status: 'active', last_contacted: '2026-03-29', aria_score: 95, created_at: '' },
  { id: 'dc9', workspace_id: '', first_name: 'Amara', last_name: 'Diallo', email: 'amara@fernview.edu', company: 'Fernview College', job_title: 'VP Education', phone: '+44 7700 902789', status: 'active', last_contacted: '2026-03-27', aria_score: 88, created_at: '' },
  { id: 'dc10', workspace_id: '', first_name: 'Rachel', last_name: 'Fox', email: 'rachel@lakewood.edu', company: 'Lakewood Schools', job_title: 'Deputy Head', phone: '+44 7700 903012', status: 'new', last_contacted: '2026-03-10', aria_score: 42, created_at: '' },
  { id: 'dc11', workspace_id: '', first_name: 'Tom', last_name: 'Wallace', email: 'tom@brightfields.edu', company: 'Brightfields MAT', job_title: 'Operations Director', phone: '+44 7700 903345', status: 'active', last_contacted: '2026-03-26', aria_score: 76, created_at: '' },
  { id: 'dc12', workspace_id: '', first_name: 'Priya', last_name: 'Kapoor', email: 'priya@whitestone.edu', company: 'Whitestone MAT', job_title: 'Business Manager', phone: '+44 7700 903678', status: 'active', last_contacted: '2026-03-24', aria_score: 82, created_at: '' },
]

export default function ContactsPage() {
  const workspaceId = useCRMWorkspaceId()
  const isDemoActive = typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true'
  const [contacts, setContacts] = useState<CRMContact[]>(isDemoActive && !workspaceId ? DEMO_CONTACTS : [])
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(!isDemoActive)

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

      <ContactGrid
        contacts={contacts}
        onContactClick={setSelectedContact}
        onAddClick={() => setShowAddModal(true)}
      />

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
