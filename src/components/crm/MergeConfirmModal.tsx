'use client'

import { useState } from 'react'
import { X, AlertTriangle, Sparkles, Check } from 'lucide-react'

interface MergeConfirmModalProps {
  recordA: Record<string, unknown>
  recordB: Record<string, unknown>
  ariaReasoning?: string
  onConfirm: () => void
  onClose: () => void
}

export default function MergeConfirmModal({ recordA, recordB, ariaReasoning, onConfirm, onClose }: MergeConfirmModalProps) {
  const [winner, setWinner] = useState<'a' | 'b'>('a')
  const [mergeNotes, setMergeNotes] = useState('')
  const [confirming, setConfirming] = useState(false)

  const nameA = (recordA.name as string) || 'Record A'
  const nameB = (recordB.name as string) || 'Record B'

  const fieldsToCompare = ['name', 'email', 'phone', 'role', 'company_name', 'location', 'tags']
  const diffs = fieldsToCompare.filter((f: string) => {
    const a = recordA[f]
    const b = recordB[f]
    return JSON.stringify(a) !== JSON.stringify(b) && (a || b)
  })

  async function handleConfirm() {
    setConfirming(true)
    await new Promise((r: (v: void) => void) => setTimeout(r, 800))
    onConfirm()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><AlertTriangle size={16} style={{ color: '#F59E0B' }} /> Confirm Merge</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>

        {ariaReasoning && (
          <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <div className="flex items-center gap-1.5 mb-1"><Sparkles size={12} style={{ color: '#A78BFA' }} /><span className="text-xs font-semibold" style={{ color: '#A78BFA' }}>ARIA Analysis</span></div>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{ariaReasoning}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>Keep as primary record:</p>
          <div className="flex gap-2">
            <button onClick={() => setWinner('a')} className={`flex-1 p-3 rounded-lg text-xs font-medium ${winner === 'a' ? 'border-2' : 'border'}`} style={{ backgroundColor: '#0D1117', borderColor: winner === 'a' ? '#0D9488' : '#1F2937', color: winner === 'a' ? '#0D9488' : '#9CA3AF' }}>{nameA}</button>
            <button onClick={() => setWinner('b')} className={`flex-1 p-3 rounded-lg text-xs font-medium ${winner === 'b' ? 'border-2' : 'border'}`} style={{ backgroundColor: '#0D1117', borderColor: winner === 'b' ? '#0D9488' : '#1F2937', color: winner === 'b' ? '#0D9488' : '#9CA3AF' }}>{nameB}</button>
          </div>
        </div>

        {diffs.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>Fields that differ ({diffs.length}):</p>
            <div className="space-y-1">
              {diffs.map((f: string) => (
                <div key={f} className="flex items-center justify-between py-1.5 px-2 rounded" style={{ backgroundColor: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
                  <span className="text-xs font-medium text-amber-400">{f}</span>
                  <div className="flex gap-3 text-xs">
                    <span style={{ color: winner === 'a' ? '#0D9488' : '#6B7280' }}>{String(recordA[f] ?? '—')}</span>
                    <span style={{ color: winner === 'b' ? '#0D9488' : '#6B7280' }}>{String(recordB[f] ?? '—')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Merge notes (optional)</label>
          <textarea value={mergeNotes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMergeNotes(e.target.value)} rows={2} placeholder="Reason for merge..." className="w-full rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }} />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm" style={{ color: '#6B7280', border: '1px solid #1F2937' }}>Cancel</button>
          <button onClick={handleConfirm} disabled={confirming} className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: '#DC2626', color: '#fff', opacity: confirming ? 0.5 : 1 }}>
            {confirming ? 'Merging...' : <><Check size={14} /> Confirm Merge</>}
          </button>
        </div>
      </div>
    </div>
  )
}
