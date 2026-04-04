'use client'

import { useState } from 'react'
import { Building2, ChevronDown, ChevronRight, Users, MapPin, Mail, Phone, Heart, ExternalLink, Calendar, Search } from 'lucide-react'

const CRM_ACCOUNTS = [
  { id:'hc-001',type:'parent',accountType:'Holding Company',tag:'GROUP',tagColor:'#6C3FC5',name:'Meridian Capital Group',sector:'Financial Services',location:'London, UK',size:'4 subsidiaries \u00B7 840 employees',contact:'Richard Harlow, Group CEO',email:'r.harlow@meridiancapital.co.uk',phone:'020 7946 0000',status:'Active Customer',statusColor:'#10B981',arr:'\u00A348,000/yr',since:'Mar 2024',health:94,children:[
    { id:'hc-001-a',name:'Meridian Asset Management',type:'Subsidiary',employees:220,location:'London',contact:'Claire Sutton',status:'Live',health:96,tier:'Enterprise' },
    { id:'hc-001-b',name:'Meridian Private Equity',type:'Subsidiary',employees:85,location:'London',contact:'Tom Ashworth',status:'Live',health:92,tier:'Business' },
    { id:'hc-001-c',name:'Meridian Ventures',type:'Subsidiary',employees:40,location:'Manchester',contact:'Priya Kapoor',status:'Trial',health:71,tier:'Pro' },
    { id:'hc-001-d',name:'Meridian Wealth Advisory',type:'Subsidiary',employees:120,location:'Edinburgh',contact:'James Okafor',status:'Live',health:88,tier:'Business' },
  ]},
  { id:'nhs-001',type:'parent',accountType:'NHS Trust',tag:'NHS',tagColor:'#0D9488',name:'Northgate University Hospitals NHS Trust',sector:'Healthcare',location:'Newcastle, North East',size:'3 hospitals \u00B7 6,400 staff',contact:'Dr Amanda Price, Chief Digital Officer',email:'a.price@northgate.nhs.uk',phone:'0191 456 7890',status:'Prospect',statusColor:'#3B82F6',arr:'TBD',since:'Jan 2026',health:58,children:[
    { id:'nhs-001-a',name:'Northgate Royal Infirmary',type:'Hospital',employees:3200,location:'Newcastle City Centre',contact:'Mrs K. Mitchell',status:'Pilot',health:74,tier:'Enterprise' },
    { id:'nhs-001-b',name:'Northgate Community Hospital',type:'Hospital',employees:1800,location:'Gateshead',contact:'Mr D. Lee',status:'Prospect',health:52,tier:'TBD' },
    { id:'nhs-001-c',name:'Northgate Mental Health Centre',type:'Clinic',employees:640,location:'Sunderland',contact:'Ms R. Patel',status:'Prospect',health:48,tier:'TBD' },
  ]},
  { id:'ret-001',type:'parent',accountType:'Retail Chain',tag:'RETAIL',tagColor:'#F59E0B',name:'Greenleaf Home & Garden',sector:'Retail',location:'Bristol (HQ)',size:'24 stores \u00B7 1,200 staff',contact:'Sophie Henriksen, Head of Operations',email:'s.henriksen@greenleaf.co.uk',phone:'0117 456 7800',status:'Active Customer',statusColor:'#10B981',arr:'\u00A328,800/yr',since:'Jun 2024',health:87,children:[
    { id:'ret-001-a',name:'Greenleaf \u2014 Bristol Cabot Circus',type:'Store',employees:62,location:'Bristol',contact:'Mr P. Walsh',status:'Live',health:91,tier:'Business' },
    { id:'ret-001-b',name:'Greenleaf \u2014 Bath',type:'Store',employees:44,location:'Bath',contact:'Ms T. Clarke',status:'Live',health:88,tier:'Business' },
    { id:'ret-001-c',name:'Greenleaf \u2014 Cardiff',type:'Store',employees:58,location:'Cardiff',contact:'Mr A. Evans',status:'Live',health:84,tier:'Business' },
    { id:'ret-001-d',name:'Greenleaf \u2014 Exeter',type:'Store',employees:38,location:'Exeter',contact:'Mrs J. Moore',status:'Trial',health:69,tier:'Pro' },
    { id:'ret-001-e',name:'Greenleaf \u2014 Plymouth',type:'Store',employees:41,location:'Plymouth',contact:'Mr S. James',status:'Live',health:86,tier:'Business' },
  ]},
  { id:'law-001',type:'parent',accountType:'Law Firm',tag:'LEGAL',tagColor:'#1B3A6B',name:'Ashworth & Partners LLP',sector:'Legal',location:'London (Head Office)',size:'5 offices \u00B7 340 staff',contact:'Victoria Drummond, COO',email:'v.drummond@ashworthpartners.co.uk',phone:'020 7946 1234',status:'Active Customer',statusColor:'#10B981',arr:'\u00A336,000/yr',since:'Oct 2024',health:91,children:[
    { id:'law-001-a',name:'Ashworth London \u2014 Corporate',type:'Department',employees:140,location:'City of London',contact:'Mr C. Pemberton',status:'Live',health:94,tier:'Enterprise' },
    { id:'law-001-b',name:'Ashworth London \u2014 Litigation',type:'Department',employees:80,location:'City of London',contact:'Ms N. Osei',status:'Live',health:90,tier:'Business' },
    { id:'law-001-c',name:'Ashworth Manchester',type:'Office',employees:60,location:'Manchester',contact:'Mr R. Hughes',status:'Live',health:88,tier:'Business' },
    { id:'law-001-d',name:'Ashworth Leeds',type:'Office',employees:38,location:'Leeds',contact:'Ms P. Singh',status:'Live',health:92,tier:'Business' },
    { id:'law-001-e',name:'Ashworth Dubai',type:'Office',employees:22,location:'Dubai, UAE',contact:'Mr A. Al-Rashid',status:'Trial',health:65,tier:'Pro' },
  ]},
  { id:'fra-001',type:'parent',accountType:'Franchise Network',tag:'FRAN',tagColor:'#EF4444',name:'FitCore Gym Group',sector:'Health & Fitness',location:'Birmingham (Franchisor)',size:'31 locations \u00B7 280 staff',contact:'Mark Trevithick, Franchise Director',email:'m.trevithick@fitcore.co.uk',phone:'0121 345 6789',status:'Active Customer',statusColor:'#10B981',arr:'\u00A318,600/yr',since:'Feb 2025',health:83,children:[
    { id:'fra-001-a',name:'FitCore Birmingham \u2014 Edgbaston',type:'Franchise',employees:14,location:'Birmingham',contact:'Ms L. Sharma',status:'Live',health:89,tier:'Pro' },
    { id:'fra-001-b',name:'FitCore Coventry',type:'Franchise',employees:11,location:'Coventry',contact:'Mr D. Brown',status:'Live',health:82,tier:'Pro' },
    { id:'fra-001-c',name:'FitCore Wolverhampton',type:'Franchise',employees:9,location:'Wolverhampton',contact:'Ms C. Williams',status:'Live',health:78,tier:'Pro' },
    { id:'fra-001-d',name:'FitCore Leicester',type:'Franchise',employees:12,location:'Leicester',contact:'Mr J. Patel',status:'Trial',health:62,tier:'Starter' },
  ]},
  { id:'mat-001',type:'parent',accountType:'Multi-Academy Trust',tag:'MAT',tagColor:'#8B5CF6',name:'Oakfield Learning Trust',sector:'Education',location:'Birmingham, West Midlands',size:'5 academies \u00B7 3,200 pupils',contact:'Sarah Hammond, CEO',email:'shammond@oakfieldtrust.org',phone:'0121 456 7890',status:'Active Customer',statusColor:'#10B981',arr:'\u00A314,400/yr',since:'Sep 2024',health:92,children:[
    { id:'mat-001-a',name:'Oakfield Primary \u2014 Erdington',type:'Academy',employees:48,location:'Erdington',contact:'Mrs J. Patel',status:'Live',health:94,tier:'Business' },
    { id:'mat-001-b',name:'Oakfield Primary \u2014 Handsworth',type:'Academy',employees:42,location:'Handsworth',contact:'Mr D. Singh',status:'Live',health:88,tier:'Business' },
    { id:'mat-001-c',name:'Oakfield Secondary \u2014 Sutton',type:'Academy',employees:120,location:'Sutton Coldfield',contact:'Mr R. Clarke',status:'Live',health:91,tier:'Enterprise' },
    { id:'mat-001-d',name:'Oakfield Sixth Form',type:'Academy',employees:64,location:'City Centre',contact:'Ms T. Williams',status:'Trial',health:72,tier:'Pro' },
  ]},
  { id:'sta-001',type:'standalone',accountType:'Independent Business',tag:'SME',tagColor:'#6B7280',name:'Bramblewood Studio',sector:'Creative Agency',location:'Brighton, East Sussex',size:'1 location \u00B7 28 staff',contact:'Charlie Harrington, MD',email:'c.harrington@bramblewood.studio',phone:'01273 456 789',status:'Active Customer',statusColor:'#10B981',arr:'\u00A34,800/yr',since:'Nov 2024',health:96,children:[] },
]

const allTags = ['all', ...Array.from(new Set(CRM_ACCOUNTS.map(a => a.tag)))]
const totalSites = CRM_ACCOUNTS.reduce((a, c) => a + c.children.length, 0)
const activeCount = CRM_ACCOUNTS.filter(a => a.status === 'Active Customer').length
const totalARR = CRM_ACCOUNTS.reduce((a, c) => { const m = c.arr.match(/[\d,]+/); return a + (m ? parseInt(m[0].replace(/,/g, '')) : 0) }, 0)

const tierColors: Record<string, { bg: string; color: string }> = {
  Enterprise: { bg: 'rgba(139,92,246,0.12)', color: '#A78BFA' },
  Business: { bg: 'rgba(59,130,246,0.12)', color: '#60A5FA' },
  Pro: { bg: 'rgba(13,148,136,0.12)', color: '#0D9488' },
  Starter: { bg: 'rgba(107,114,128,0.12)', color: '#9CA3AF' },
  TBD: { bg: 'rgba(107,114,128,0.08)', color: '#6B7280' },
}

export default function CRMAccountsPage() {
  const [filterType, setFilterType] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedChild, setSelectedChild] = useState<any>(null)
  const [selectedParent, setSelectedParent] = useState<any>(null)
  const [search, setSearch] = useState('')

  const filtered = CRM_ACCOUNTS.filter(a => {
    if (filterType !== 'all' && a.tag !== filterType) return false
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.children.some(c => c.name.toLowerCase().includes(search.toLowerCase()))) return false
    return true
  })

  function toggleExpand(id: string) { setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }) }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2"><Building2 size={20} style={{ color: '#0D9488' }} /> CRM Accounts</h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{CRM_ACCOUNTS.length} parent accounts &middot; {totalSites} sites &middot; {activeCount} active &middot; &pound;{totalARR.toLocaleString()}/yr ARR</p>
          </div>
        </div>

        {/* Filter + Search */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {allTags.map(tag => (
            <button key={tag} onClick={() => setFilterType(tag)} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${filterType === tag ? 'bg-purple-600 border-purple-600 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'}`}>
              {tag === 'all' ? 'All' : tag}
            </button>
          ))}
          <div className="flex-1" />
          <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts..." className="bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white outline-none w-64" /></div>
        </div>

        <div className="flex gap-6">
          {/* Left: Account Tree */}
          <div className="flex-1 space-y-2">
            {filtered.map(account => (
              <div key={account.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937', backgroundColor: '#111318' }}>
                {/* Parent row */}
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => { toggleExpand(account.id); setSelectedChild(null); setSelectedParent(account) }}>
                  {account.children.length > 0 ? (
                    expanded.has(account.id) ? <ChevronDown size={14} className="text-gray-500 shrink-0" /> : <ChevronRight size={14} className="text-gray-500 shrink-0" />
                  ) : <div className="w-3.5" />}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: account.tagColor + '20', color: account.tagColor }}>{account.tag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{account.name}</p>
                    <p className="text-xs truncate" style={{ color: '#6B7280' }}>{account.sector} &middot; {account.location}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: account.statusColor + '15', color: account.statusColor }}>{account.status}</span>
                  <div className="w-16 shrink-0">
                    <div className="flex items-center gap-1"><Heart size={10} style={{ color: account.health >= 80 ? '#10B981' : account.health >= 60 ? '#F59E0B' : '#EF4444' }} /><span className="text-xs font-bold" style={{ color: account.health >= 80 ? '#10B981' : account.health >= 60 ? '#F59E0B' : '#EF4444' }}>{account.health}</span></div>
                    <div className="h-1 rounded-full mt-0.5" style={{ backgroundColor: '#1F2937' }}><div className="h-full rounded-full" style={{ width: `${account.health}%`, backgroundColor: account.health >= 80 ? '#10B981' : account.health >= 60 ? '#F59E0B' : '#EF4444' }} /></div>
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: '#F9FAFB' }}>{account.arr}</span>
                </div>
                {/* Children */}
                {expanded.has(account.id) && account.children.length > 0 && (
                  <div style={{ borderTop: '1px solid #1F2937' }}>
                    {account.children.map(child => (
                      <div key={child.id} onClick={() => { setSelectedChild(child); setSelectedParent(account) }} className={`flex items-center gap-3 pl-10 pr-4 py-2.5 cursor-pointer transition-colors ${selectedChild?.id === child.id ? 'bg-purple-600/10' : 'hover:bg-white/[0.02]'}`} style={{ borderBottom: '1px solid #1A1D27' }}>
                        <span className="text-xs" style={{ color: '#6B7280' }}>{child.type}</span>
                        <p className="flex-1 text-sm truncate" style={{ color: '#D1D5DB' }}>{child.name}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ ...(tierColors[child.tier] || tierColors.TBD) }}>{child.tier}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: child.status === 'Live' ? 'rgba(16,185,129,0.12)' : child.status === 'Trial' ? 'rgba(245,158,11,0.12)' : child.status === 'Pilot' ? 'rgba(59,130,246,0.12)' : 'rgba(107,114,128,0.08)', color: child.status === 'Live' ? '#10B981' : child.status === 'Trial' ? '#F59E0B' : child.status === 'Pilot' ? '#3B82F6' : '#6B7280' }}>{child.status}</span>
                        <div className="w-10 shrink-0"><div className="h-1 rounded-full" style={{ backgroundColor: '#1F2937' }}><div className="h-full rounded-full" style={{ width: `${child.health}%`, backgroundColor: child.health >= 80 ? '#10B981' : child.health >= 60 ? '#F59E0B' : '#EF4444' }} /></div></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right: Detail Panel */}
          <div className="w-80 shrink-0">
            {selectedChild && selectedParent ? (
              <div className="rounded-xl p-5 space-y-4 sticky top-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div>
                  <button onClick={() => { setSelectedChild(null) }} className="text-xs mb-2 block" style={{ color: '#6B7280' }}>&larr; {selectedParent.name}</button>
                  <h3 className="text-base font-bold" style={{ color: '#F9FAFB' }}>{selectedChild.name}</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{selectedChild.type} &middot; {selectedChild.location}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#0A0B10' }}><div className="text-lg font-black" style={{ color: '#F9FAFB' }}>{selectedChild.employees}</div><div className="text-[10px]" style={{ color: '#6B7280' }}>Employees</div></div>
                  <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#0A0B10' }}><div className="text-lg font-black" style={{ color: selectedChild.status === 'Live' ? '#10B981' : '#F59E0B' }}>{selectedChild.status}</div><div className="text-[10px]" style={{ color: '#6B7280' }}>Status</div></div>
                  <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#0A0B10' }}><div className="text-lg font-black" style={{ color: selectedChild.health >= 80 ? '#10B981' : selectedChild.health >= 60 ? '#F59E0B' : '#EF4444' }}>{selectedChild.health}</div><div className="text-[10px]" style={{ color: '#6B7280' }}>Health</div></div>
                </div>
                <div className="space-y-2">
                  {[{ l: 'Contact', v: selectedChild.contact }, { l: 'Tier', v: selectedChild.tier }, { l: 'Sector', v: selectedParent.sector }, { l: 'Parent', v: selectedParent.name }].map(r => (
                    <div key={r.l} className="flex justify-between text-xs" style={{ borderBottom: '1px solid #1F2937', paddingBottom: 6 }}><span style={{ color: '#6B7280' }}>{r.l}</span><span className="font-medium" style={{ color: '#F9FAFB' }}>{r.v}</span></div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1" style={{ backgroundColor: '#0D9488', color: '#fff' }}><Mail size={12} /> Contact</button>
                  <button className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1" style={{ backgroundColor: '#1F2937', color: '#D1D5DB' }}><ExternalLink size={12} /> Portal</button>
                  <button className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1" style={{ backgroundColor: '#1F2937', color: '#D1D5DB' }}><Calendar size={12} /> Book</button>
                </div>
              </div>
            ) : selectedParent ? (
              <div className="rounded-xl p-5 space-y-4 sticky top-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: selectedParent.tagColor + '20', color: selectedParent.tagColor }}>{selectedParent.accountType}</span>
                  <h3 className="text-base font-bold mt-2" style={{ color: '#F9FAFB' }}>{selectedParent.name}</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{selectedParent.sector} &middot; {selectedParent.location}</p>
                </div>
                <div className="space-y-2">
                  {[{ l: 'Size', v: selectedParent.size }, { l: 'Contact', v: selectedParent.contact }, { l: 'ARR', v: selectedParent.arr }, { l: 'Since', v: selectedParent.since }, { l: 'Status', v: selectedParent.status }].map(r => (
                    <div key={r.l} className="flex justify-between text-xs" style={{ borderBottom: '1px solid #1F2937', paddingBottom: 6 }}><span style={{ color: '#6B7280' }}>{r.l}</span><span className="font-medium" style={{ color: '#F9FAFB' }}>{r.v}</span></div>
                  ))}
                </div>
                <div className="flex items-center gap-1"><Heart size={12} style={{ color: selectedParent.health >= 80 ? '#10B981' : '#F59E0B' }} /><span className="text-sm font-bold" style={{ color: selectedParent.health >= 80 ? '#10B981' : '#F59E0B' }}>{selectedParent.health}</span><div className="flex-1 h-1.5 rounded-full ml-2" style={{ backgroundColor: '#1F2937' }}><div className="h-full rounded-full" style={{ width: `${selectedParent.health}%`, backgroundColor: selectedParent.health >= 80 ? '#10B981' : '#F59E0B' }} /></div></div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1" style={{ backgroundColor: '#0D9488', color: '#fff' }}><Mail size={12} /> Contact</button>
                  <button className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1" style={{ backgroundColor: '#1F2937', color: '#D1D5DB' }}><Phone size={12} /> Call</button>
                </div>
                {selectedParent.children.length > 0 && <p className="text-xs" style={{ color: '#6B7280' }}>{selectedParent.children.length} {selectedParent.children[0]?.type?.toLowerCase() || 'site'}s &mdash; click to expand</p>}
              </div>
            ) : (
              <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <Building2 size={24} className="mx-auto mb-2" style={{ color: '#374151' }} />
                <p className="text-sm" style={{ color: '#6B7280' }}>Select an account to see details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
