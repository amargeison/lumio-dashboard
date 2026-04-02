'use client'

import { useState, useEffect } from 'react'
import { Search, Building2, Users, Clock, X, Check, Upload } from 'lucide-react'

const BG = '#0F1019'
const BORDER = '#1E2035'
const CARD = '#121320'
const PURPLE = '#8B5CF6'

interface Company { name: string; contactCount: number; industry: string; website: string; lastActivity: string }
interface DiscoveredCompany { company_name: string; website: string; industry: string; size: string; location: string; description: string; why_target: string; decision_maker_title: string; companies_house_number: string | null; confidence_score: number }

const DEMO_COMPANIES: Company[] = [
  { name: 'Apex Consulting', contactCount: 4, industry: 'Consulting', website: 'apex-consulting.co.uk', lastActivity: '2 hours ago' },
  { name: 'Meridian Trust', contactCount: 3, industry: 'Finance', website: 'meridiantrust.com', lastActivity: 'Yesterday' },
  { name: 'Sterling & Co', contactCount: 2, industry: 'Legal', website: 'sterlingco.co.uk', lastActivity: '3 days ago' },
  { name: 'Northern Digital', contactCount: 5, industry: 'Technology', website: 'northerndigital.io', lastActivity: 'Today' },
  { name: 'Metro Logistics', contactCount: 3, industry: 'Logistics', website: 'metrologistics.co.uk', lastActivity: '1 week ago' },
  { name: 'Oakridge Schools', contactCount: 2, industry: 'Education', website: 'oakridgeschools.org', lastActivity: '4 days ago' },
]

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Education', 'Legal', 'Manufacturing', 'Retail', 'Consulting', 'Real Estate', 'Construction', 'Media', 'Energy', 'Logistics']
const SIZES = ['Micro (1-9)', 'Small (10-49)', 'SME (50-249)', 'Mid-market (250-999)', 'Enterprise (1000+)', 'Any']
const REGIONS = ['London', 'South East', 'South West', 'Midlands', 'North West', 'North East', 'Yorkshire', 'East Anglia', 'Scotland', 'Wales', 'Northern Ireland', 'Global']

export default function CompaniesPage() {
  const [search, setSearch] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  // Wizard state
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedSize, setSelectedSize] = useState('Any')
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [discovering, setDiscovering] = useState(false)
  const [discovered, setDiscovered] = useState<DiscoveredCompany[]>([])
  const [selectedDiscovered, setSelectedDiscovered] = useState<Set<number>>(new Set())

  useEffect(() => {
    const demoActive = localStorage.getItem('lumio_demo_active') === 'true'
    const importedCompanies: Company[] = []
    try {
      const contacts = JSON.parse(localStorage.getItem('lumio_crm_contacts') || '[]')
      const companyMap = new Map<string, number>()
      contacts.forEach((c: { company?: string }) => { if (c.company) companyMap.set(c.company, (companyMap.get(c.company) || 0) + 1) })
      companyMap.forEach((count, name) => { importedCompanies.push({ name, contactCount: count, industry: '', website: '', lastActivity: 'Imported' }) })
    } catch { /* ignore */ }

    if (importedCompanies.length > 0) {
      setCompanies(demoActive ? [...importedCompanies, ...DEMO_COMPANIES] : importedCompanies)
    } else if (demoActive) {
      setCompanies(DEMO_COMPANIES)
    }
    setLoading(false)
  }, [])

  function toggleIndustry(i: string) { setSelectedIndustries(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]) }
  function toggleRegion(r: string) { setSelectedRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]) }
  function toggleSelected(i: number) { setSelectedDiscovered(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s }) }

  async function handleDiscover() {
    setDiscovering(true)
    try {
      const res = await fetch('/api/ai/discover-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industries: selectedIndustries, companySize: selectedSize, locations: selectedRegions }),
      })
      if (res.ok) {
        const data = await res.json()
        setDiscovered(data.companies || [])
        setWizardStep(4)
      }
    } catch { /* ignore */ }
    setDiscovering(false)
  }

  function handleImportSelected() {
    const newCompanies = Array.from(selectedDiscovered).map(i => discovered[i]).map(d => ({
      name: d.company_name, contactCount: 0, industry: d.industry, website: d.website, lastActivity: 'Just added',
    }))
    setCompanies(prev => [...newCompanies, ...prev])
    setShowWizard(false)
    setWizardStep(1)
    setDiscovered([])
    setSelectedDiscovered(new Set())
  }

  function resetWizard() { setWizardStep(1); setSelectedIndustries([]); setSelectedSize('Any'); setSelectedRegions([]); setDiscovered([]); setSelectedDiscovered(new Set()) }

  const filtered = companies.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.industry.toLowerCase().includes(search.toLowerCase()))

  if (loading) {
    return (<div className="space-y-4"><div className="h-10 rounded-xl animate-pulse" style={{ background: CARD }} /><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse rounded-xl" style={{ background: CARD, height: 140 }} />)}</div></div>)
  }

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl mb-6" style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.2), rgba(108,63,197,0.05))', border: '1px solid rgba(108,63,197,0.3)' }}>
          <Building2 size={36} style={{ color: PURPLE }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>No companies yet</h2>
        <p className="text-sm mb-6 text-center max-w-sm" style={{ color: '#9CA3AF' }}>Discover target companies with AI or import from a CSV file.</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => { resetWizard(); setShowWizard(true) }} className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-semibold" style={{ backgroundColor: PURPLE, color: '#F9FAFB' }}>
            <Search size={16} /> Find target companies
          </button>
          <a href="/settings" className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: '#9CA3AF', textDecoration: 'none' }}>
            <Upload size={16} /> Import from CSV
          </a>
        </div>
        {renderWizard()}
      </div>
    )
  }

  function renderWizard() {
    if (!showWizard) return null
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowWizard(false)}>
        <div className="rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <p className="text-sm font-bold" style={{ color: '#F1F3FA' }}>Find Target Companies — Step {Math.min(wizardStep, 4)}/4</p>
            <button onClick={() => setShowWizard(false)} style={{ color: '#6B7299' }}><X size={18} /></button>
          </div>
          <div className="p-6">
            {wizardStep === 1 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>What industries are you targeting?</p>
                <div className="flex flex-wrap gap-2">{INDUSTRIES.map(i => (
                  <button key={i} onClick={() => toggleIndustry(i)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: selectedIndustries.includes(i) ? PURPLE : CARD, color: selectedIndustries.includes(i) ? '#F9FAFB' : '#9CA3AF', border: `1px solid ${selectedIndustries.includes(i) ? PURPLE : BORDER}` }}>{i}</button>
                ))}</div>
                <button onClick={() => setWizardStep(2)} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: PURPLE, color: '#F9FAFB' }}>Next</button>
              </div>
            )}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Company size?</p>
                <div className="flex flex-wrap gap-2">{SIZES.map(s => (
                  <button key={s} onClick={() => { setSelectedSize(s); setWizardStep(3) }} className="px-4 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: selectedSize === s ? PURPLE : CARD, color: selectedSize === s ? '#F9FAFB' : '#9CA3AF', border: `1px solid ${selectedSize === s ? PURPLE : BORDER}` }}>{s}</button>
                ))}</div>
              </div>
            )}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Location?</p>
                <div className="flex flex-wrap gap-2">{REGIONS.map(r => (
                  <button key={r} onClick={() => toggleRegion(r)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: selectedRegions.includes(r) ? PURPLE : CARD, color: selectedRegions.includes(r) ? '#F9FAFB' : '#9CA3AF', border: `1px solid ${selectedRegions.includes(r) ? PURPLE : BORDER}` }}>{r}</button>
                ))}</div>
                <button onClick={handleDiscover} disabled={discovering} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: PURPLE, color: '#F9FAFB', opacity: discovering ? 0.5 : 1 }}>
                  {discovering ? 'Searching...' : 'Find Companies'}
                </button>
              </div>
            )}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>{discovered.length} companies found</p>
                  <span className="text-xs" style={{ color: '#6B7299' }}>{selectedDiscovered.size} selected</span>
                </div>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {discovered.map((c, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ backgroundColor: selectedDiscovered.has(i) ? 'rgba(139,92,246,0.08)' : CARD, border: `1px solid ${selectedDiscovered.has(i) ? PURPLE : BORDER}` }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold" style={{ color: '#F1F3FA' }}>{c.company_name}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: c.confidence_score >= 80 ? 'rgba(34,197,94,0.15)' : c.confidence_score >= 60 ? 'rgba(245,158,11,0.15)' : 'rgba(107,114,128,0.15)', color: c.confidence_score >= 80 ? '#22C55E' : c.confidence_score >= 60 ? '#F59E0B' : '#9CA3AF' }}>{c.confidence_score}%</span>
                          </div>
                          <p className="text-xs mb-1" style={{ color: '#8B5CF6' }}>{c.website}</p>
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: BORDER, color: '#9CA3AF' }}>{c.industry}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: BORDER, color: '#9CA3AF' }}>{c.size}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: BORDER, color: '#9CA3AF' }}>{c.location}</span>
                          </div>
                          <p className="text-xs" style={{ color: '#6B7299' }}>{c.why_target}</p>
                          <p className="text-xs mt-1" style={{ color: '#4B5563' }}>Decision maker: {c.decision_maker_title}</p>
                        </div>
                        <button onClick={() => toggleSelected(i)} className="shrink-0 flex items-center justify-center rounded-lg" style={{ width: 28, height: 28, backgroundColor: selectedDiscovered.has(i) ? PURPLE : CARD, border: `1px solid ${selectedDiscovered.has(i) ? PURPLE : BORDER}` }}>
                          {selectedDiscovered.has(i) && <Check size={14} style={{ color: '#F9FAFB' }} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={handleImportSelected} disabled={selectedDiscovered.size === 0} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: PURPLE, color: '#F9FAFB', opacity: selectedDiscovered.size === 0 ? 0.4 : 1 }}>
                  Import {selectedDiscovered.size} selected
                </button>
              </div>
            )}
          </div>
        </div>
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
        <a href="/crm/company-finder" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold" style={{ backgroundColor: PURPLE, color: '#F9FAFB', textDecoration: 'none' }}>
          <Search size={14} /> Company Finder
        </a>
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
      {renderWizard()}
    </div>
  )
}
