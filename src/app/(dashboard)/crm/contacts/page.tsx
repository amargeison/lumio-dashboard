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
        if (data.contacts.length === 0) {
          await seedDemoData(workspaceId!)
          data = await getCRMData(workspaceId!)
        }
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
      const newContact = await createContact(ws.id, contactData)
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
