'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Sparkles, Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface DuplicateMatch {
  id: string
  name: string
  email: string
  company_name: string
  score: number
  matchReasons: string[]
}

interface DedupeBannerProps {
  recordId: string
  recordType: 'contact' | 'company'
  recordData: Record<string, unknown>
}

// Demo duplicate detection — simulates API response
function detectDuplicates(recordData: Record<string, unknown>): DuplicateMatch[] {
  const name = (recordData.name as string) || ''
  const email = (recordData.email as string) || ''
  const company = (recordData.company_name as string) || ''

  // Simulate finding duplicates for specific demo contacts
  if (name.includes('Marcus') || email.includes('meridian')) {
    return [
      { id: 'dup-1', name: 'Marcus Chen', email: 'marcus@meridian.edu', company_name: 'Meridian Trust', score: 92, matchReasons: ['Same first name', 'Same domain', 'Similar company'] },
      { id: 'dup-2', name: 'Adam Cole', email: 'adam@meridian-college.edu', company_name: 'Meridian College', score: 68, matchReasons: ['Similar domain', 'Same sector'] },
    ]
  }
  if (company.includes('Oakridge') || company.includes('oakridge')) {
    return [
      { id: 'dup-3', name: 'Gary Stone', email: 'gary@oakridge.edu', company_name: 'Oakridge Schools Ltd', score: 87, matchReasons: ['Same company', 'Same domain'] },
    ]
  }
  return []
}

export default function DedupeBanner({ recordId, recordType, recordData }: DedupeBannerProps) {
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [verifying, setVerifying] = useState<string | null>(null)
  const [verified, setVerified] = useState<Record<string, { verdict: string; confidence: number; reasoning: string }>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showMerge, setShowMerge] = useState<string | null>(null)

  useEffect(() => {
    const found = detectDuplicates(recordData)
    setDuplicates(found)
  }, [recordId])

  async function handleVerify(dupId: string) {
    setVerifying(dupId)
    // Simulate ARIA verification
    await new Promise((r: (v: void) => void) => setTimeout(r, 1500))
    const dup = duplicates.find((d: DuplicateMatch) => d.id === dupId)
    const isSame = dup && dup.score >= 85
    setVerified((prev: Record<string, { verdict: string; confidence: number; reasoning: string }>) => ({
      ...prev,
      [dupId]: {
        verdict: isSame ? 'same' : 'different',
        confidence: isSame ? 94 : 72,
        reasoning: isSame
          ? `ARIA has determined with 94% confidence that these are the same ${recordType}. Both records share the same email domain, similar names, and overlapping company affiliations. Recommend merging — the newer record has more complete data.`
          : `ARIA has determined with 72% confidence that these are different ${recordType}s. While the domain is similar, the names and roles differ significantly. Recommend keeping both records separate.`
      }
    }))
    setVerifying(null)
  }

  function handleDismiss(dupId: string) {
    setDismissed((prev: Set<string>) => { const next = new Set(prev); next.add(dupId); return next })
  }

  function handleMerge(dupId: string) {
    // Simulate merge
    setDismissed((prev: Set<string>) => { const next = new Set(prev); next.add(dupId); return next })
    setShowMerge(null)
  }

  const visible = duplicates.filter((d: DuplicateMatch) => !dismissed.has(d.id))
  if (visible.length === 0) return null

  return (
    <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={14} style={{ color: '#F59E0B' }} />
        <span className="text-sm font-semibold" style={{ color: '#FBBF24' }}>{visible.length} possible duplicate{visible.length !== 1 ? 's' : ''} detected</span>
      </div>
      <div className="space-y-2">
        {visible.map((dup: DuplicateMatch) => (
          <div key={dup.id} className="rounded-lg p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{dup.name}</span>
                <span className="text-xs" style={{ color: '#6B7280' }}>{dup.email}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dup.score >= 85 ? 'bg-amber-600/20 text-amber-400' : 'bg-gray-700 text-gray-400'}`}>{dup.score}% match</span>
              </div>
              <button onClick={() => setExpanded(expanded === dup.id ? null : dup.id)} style={{ color: '#6B7280' }}>
                {expanded === dup.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {dup.matchReasons.map((r: string) => (
                <span key={r} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{r}</span>
              ))}
            </div>
            {expanded === dup.id && (
              <div className="mt-2 pt-2" style={{ borderTop: '1px solid #1F2937' }}>
                {verified[dup.id] && (
                  <div className="rounded-lg p-3 mb-2" style={{ backgroundColor: verified[dup.id].verdict === 'same' ? 'rgba(245,158,11,0.06)' : 'rgba(34,197,94,0.06)', border: `1px solid ${verified[dup.id].verdict === 'same' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles size={12} style={{ color: '#A78BFA' }} />
                      <span className="text-xs font-semibold" style={{ color: '#A78BFA' }}>ARIA Verdict: {verified[dup.id].verdict === 'same' ? 'Same record' : 'Different records'} ({verified[dup.id].confidence}%)</span>
                    </div>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{verified[dup.id].reasoning}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button onClick={() => handleVerify(dup.id)} disabled={!!verifying} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(124,58,237,0.12)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.3)' }}>
                    {verifying === dup.id ? <><Loader2 size={11} className="animate-spin" /> Checking...</> : <><Sparkles size={11} /> Verify with ARIA</>}
                  </button>
                  {verified[dup.id]?.verdict === 'same' && (
                    <button onClick={() => handleMerge(dup.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
                      <Check size={11} /> Merge
                    </button>
                  )}
                  <button onClick={() => handleDismiss(dup.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(107,114,128,0.12)', color: '#6B7280', border: '1px solid #374151' }}>
                    <X size={11} /> Not a duplicate
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
