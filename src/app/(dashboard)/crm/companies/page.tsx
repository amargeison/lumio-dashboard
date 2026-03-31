'use client'

import { useState, useEffect } from 'react'
import { Search, Building2, Users, Clock } from 'lucide-react'

const BG = '#0F1019'
const BORDER = '#1E2035'
const CARD = '#121320'
const PURPLE = '#8B5CF6'

interface Company { name: string; contactCount: number; industry: string; website: string; lastActivity: string }

const DEMO_COMPANIES: Company[] = [
  { name: 'Apex Consulting', contactCount: 4, industry: 'Consulting', website: 'apex-consulting.co.uk', lastActivity: '2 hours ago' },
  { name: 'Meridian Trust', contactCount: 3, industry: 'Finance', website: 'meridiantrust.com', lastActivity: 'Yesterday' },
  { name: 'Sterling & Co', contactCount: 2, industry: 'Legal', website: 'sterlingco.co.uk', lastActivity: '3 days ago' },
  { name: 'Northern Digital', contactCount: 5, industry: 'Technology', website: 'northerndigital.io', lastActivity: 'Today' },
  { name: 'Metro Logistics', contactCount: 3, industry: 'Logistics', website: 'metrologistics.co.uk', lastActivity: '1 week ago' },
  { name: 'Oakridge Schools', contactCount: 2, industry: 'Education', website: 'oakridgeschools.org', lastActivity: '4 days ago' },
]

export default function CompaniesPage() {
  const [search, setSearch] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const demoActive = localStorage.getItem('lumio_demo_active') === 'true'

    // Extract unique companies from imported contacts
    const importedCompanies: Company[] = []
    try {
      const contacts = JSON.parse(localStorage.getItem('lumio_crm_contacts') || '[]')
      const companyMap = new Map<string, number>()
      contacts.forEach((c: { company?: string }) => {
        if (c.company) companyMap.set(c.company, (companyMap.get(c.company) || 0) + 1)
      })
      companyMap.forEach((count, name) => {
        importedCompanies.push({ name, contactCount: count, industry: '', website: '', lastActivity: 'Imported' })
      })
    } catch { /* ignore */ }

    if (importedCompanies.length > 0) {
      setCompanies(demoActive ? [...importedCompanies, ...DEMO_COMPANIES] : importedCompanies)
    } else if (demoActive) {
      setCompanies(DEMO_COMPANIES)
    }
    setLoading(false)
  }, [])

  const filtered = companies.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.industry.toLowerCase().includes(search.toLowerCase()))

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 rounded-xl animate-pulse" style={{ background: CARD }} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse rounded-xl" style={{ background: CARD, height: 140 }} />)}
        </div>
      </div>
    )
  }

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl mb-6" style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.2), rgba(108,63,197,0.05))', border: '1px solid rgba(108,63,197,0.3)' }}>
          <Building2 size={36} style={{ color: PURPLE }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>No companies yet</h2>
        <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>They'll appear when you add contacts with a company name.</p>
        <a href="/crm/contacts" className="rounded-xl px-6 py-3 text-sm font-semibold" style={{ backgroundColor: PURPLE, color: '#F9FAFB', textDecoration: 'none' }}>Go to Contacts</a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F1F3FA' }}>Companies</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7299' }}>{companies.length} companies</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
        <Search size={16} style={{ color: '#6B7299' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies..." className="bg-transparent outline-none flex-1 text-sm" style={{ color: '#F1F3FA' }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(company => (
          <div key={company.name} className="rounded-xl p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-lg" style={{ width: 40, height: 40, backgroundColor: 'rgba(139,92,246,0.12)' }}>
                  <Building2 size={18} style={{ color: PURPLE }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F1F3FA' }}>{company.name}</p>
                  {company.industry && <p className="text-xs" style={{ color: '#6B7299' }}>{company.industry}</p>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: '#6B7299' }}>
              <span className="inline-flex items-center gap-1"><Users size={12} /> {company.contactCount} contacts</span>
              <span className="inline-flex items-center gap-1"><Clock size={12} /> {company.lastActivity}</span>
            </div>
            {company.website && <p className="text-xs mt-2" style={{ color: '#8B5CF6' }}>{company.website}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
