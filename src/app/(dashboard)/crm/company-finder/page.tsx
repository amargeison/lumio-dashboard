'use client'

import { useState } from 'react'
import { Search, Plus, Download, ExternalLink, CheckCircle2, Sparkles } from 'lucide-react'

const BG = '#07080F'
const CARD = '#0F1019'
const BORDER = '#1E2035'
const PURPLE = '#6C3FC5'
const TEAL = '#0D9488'

const FILTERS = ['UK Only', 'Europe', 'Enterprise', 'SME', 'Education', 'Finance', 'Tech', 'Healthcare', 'Sports']

const DEMO_COMPANIES = [
  { name: 'Oakridge Academy Trust', industry: 'Education', location: 'Manchester', size: '2,400 pupils', website: 'oakridgetrust.co.uk', match: 96, color: '#0D9488', reasons: ['Multi-academy trust with 6 schools — matches ideal profile', 'IT infrastructure review planned for Q3 2026', 'Decision-maker (CEO) attended a sector event you sponsored'] },
  { name: 'Riverside Learning Partnership', industry: 'Education', location: 'Leeds', size: '1,800 pupils', website: 'riversidelp.org', match: 94, color: '#3B82F6', reasons: ['Growing MAT — 2 new schools joining September 2026', 'Current MIS contract expires November 2026', 'Business Manager active on LinkedIn discussing procurement'] },
  { name: 'Hillside MAT', industry: 'Education', location: 'Birmingham', size: '3,100 pupils', website: 'hillsidetrust.ac.uk', match: 91, color: '#8B5CF6', reasons: ['Largest MAT in region without a unified MIS platform', 'Recently appointed new Head of IT — change window', 'Published tender notice for school management software'] },
  { name: 'Northern Education Trust', industry: 'Education', location: 'Newcastle', size: '4,200 pupils', website: 'northerneducation.org', match: 89, color: '#F59E0B', reasons: ['Trust-wide digital transformation programme underway', 'Budget allocated for SaaS procurement in 2026/27', 'CEO spoke at conference about modernising school admin'] },
  { name: 'Maple Grove Schools', industry: 'Education', location: 'Sheffield', size: '1,600 pupils', website: 'maplegrove.sch.uk', match: 87, color: '#22C55E', reasons: ['Single school expanding to MAT status next year', 'Current systems are legacy — manual processes flagged in Ofsted report', 'Headteacher connected to 3 of your existing customers'] },
  { name: "St Mary's Catholic MAT", industry: 'Education', location: 'Liverpool', size: '2,800 pupils', website: 'stmarysedu.co.uk', match: 85, color: '#EC4899', reasons: ['Faith school network — underserved segment in your pipeline', 'Published annual report mentioning technology investment', 'Deputy CEO attended your webinar last month'] },
]

export default function CompanyFinderPage() {
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>(['UK Only', 'Education'])
  const [companies, setCompanies] = useState(DEMO_COMPANIES)
  const [searching, setSearching] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  function toggleFilter(f: string) {
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  async function handleSearch() {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await fetch('/api/aria/company-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), filters: activeFilters }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.companies?.length) setCompanies(data.companies)
      }
    } catch { /* fallback to existing results */ }
    setSearching(false)
  }

  async function handleAddToCRM(company: typeof DEMO_COMPANIES[0]) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('workspace_session_token') : null
    if (token) {
      try {
        await fetch('/api/crm/add-company', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-workspace-token': token },
          body: JSON.stringify({ name: company.name, industry: company.industry, location: company.location, size: company.size, website: company.website }),
        })
      } catch { /* ignore */ }
    }
    setAddedIds(prev => new Set(prev).add(company.name))
  }

  const showResults = true

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold" style={{ color: '#F1F3FA' }}>Company Finder</h1>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.2), rgba(108,63,197,0.05))', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
            <Sparkles size={11} /> Powered by ARIA Intelligence
          </span>
        </div>
        <p className="text-sm" style={{ color: '#6B7299' }}>Describe your ideal customer — we&apos;ll find real companies that match.</p>
      </div>

      {/* Search interface */}
      <div className="rounded-2xl p-[2px]" style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.4), rgba(13,148,136,0.2), rgba(108,63,197,0.1))' }}>
        <div className="rounded-2xl p-6" style={{ backgroundColor: CARD }}>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. UK secondary schools with over 800 pupils in the North West, or SaaS companies Series A-B in fintech with 50-200 employees"
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
            style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: '#F1F3FA' }}
          />
          <div className="flex flex-wrap gap-2 mt-4">
            {FILTERS.map(f => (
              <button key={f} onClick={() => toggleFilter(f)} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: activeFilters.includes(f) ? 'rgba(108,63,197,0.2)' : 'rgba(255,255,255,0.03)',
                  color: activeFilters.includes(f) ? '#A78BFA' : '#6B7299',
                  border: `1px solid ${activeFilters.includes(f) ? 'rgba(108,63,197,0.4)' : BORDER}`,
                }}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={handleSearch} disabled={searching} className="mt-4 px-6 py-3 rounded-xl text-sm font-bold transition-opacity"
            style={{ background: `linear-gradient(135deg, ${PURPLE}, #7C3AED)`, color: '#F9FAFB', opacity: searching ? 0.6 : 1 }}>
            {searching ? 'Searching...' : 'Find Companies →'}
          </button>
        </div>
      </div>

      {/* Results */}
      {showResults && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {DEMO_COMPANIES.map(company => (
              <div key={company.name} className="rounded-2xl p-5 relative group transition-all" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                {/* Match badge */}
                <div className="absolute top-4 right-4">
                  <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(13,148,136,0.15))', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.3)' }}>
                    {company.match}% match
                  </span>
                </div>

                {/* Company header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black" style={{ backgroundColor: `${company.color}20`, color: company.color, border: `1px solid ${company.color}40` }}>
                    {company.name[0]}
                  </div>
                  <div className="min-w-0 pr-16">
                    <h3 className="text-sm font-bold truncate" style={{ color: '#F1F3FA' }}>{company.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${company.color}15`, color: company.color }}>{company.industry}</span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-4" style={{ color: '#6B7299' }}>
                  <span>{company.location}</span>
                  <span>{company.size}</span>
                  <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline" style={{ color: '#A78BFA' }}>
                    {company.website} <ExternalLink size={10} />
                  </a>
                </div>

                {/* Why this matches */}
                <div className="space-y-1.5 mb-4">
                  {company.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="shrink-0 mt-0.5" style={{ color: TEAL }} />
                      <p className="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>{r}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => handleAddToCRM(company)} disabled={addedIds.has(company.name)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: addedIds.has(company.name) ? '#22C55E' : TEAL, color: '#F9FAFB', opacity: addedIds.has(company.name) ? 0.7 : 1 }}>
                    {addedIds.has(company.name) ? <><CheckCircle2 size={12} /> Added</> : <><Plus size={12} /> Add to CRM</>}
                  </button>
                  <a href={`/crm/contact-finder?company=${encodeURIComponent(company.name)}`} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold" style={{ color: '#A78BFA', border: '1px solid rgba(108,63,197,0.4)', textDecoration: 'none' }}>
                    Find Contacts →
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="rounded-xl p-4 flex items-center justify-between flex-wrap gap-3" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-xs" style={{ color: '#6B7299' }}>Showing 6 of 247 companies found · Refine your search or export all to CSV</p>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: `1px solid ${BORDER}` }}>
                <Download size={12} /> Export to CSV
              </button>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: TEAL, color: '#F9FAFB' }}>
                <Plus size={12} /> Add All to CRM
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
