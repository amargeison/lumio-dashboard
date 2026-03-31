'use client'

import { useState, useEffect } from 'react'
import { useCRMWorkspaceId } from '@/hooks/useCRMWorkspaceId'
import ContactGrid from '@/components/crm/ContactGrid'
import ContactDrawer from '@/components/crm/ContactDrawer'
import AddContactModal from '@/components/crm/AddContactModal'
import type { CRMContact } from '@/lib/crm/types'

export default function ContactsPage() {
  const workspaceId = useCRMWorkspaceId()
  const [contacts, setContacts] = useState<CRMContact[]>([])
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return
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
