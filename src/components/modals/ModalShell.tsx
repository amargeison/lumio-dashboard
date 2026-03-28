'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const inputStyle = { backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }
export const labelStyle = { color: '#9CA3AF' }

export function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
      {children} {required && <span style={{ color: '#EF4444' }}>*</span>}
    </label>
  )
}

export function PillSelector<T extends string>({ options, value, onChange, colors }: {
  options: T[]; value: T; onChange: (v: T) => void; colors?: Record<string, string>
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = value === opt
        const color = colors?.[opt] || '#0D9488'
        return (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: active ? `${color}33` : '#1F2937',
              border: `1px solid ${active ? color : '#374151'}`,
              color: active ? color : '#9CA3AF',
            }}>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export function CheckGroup({ options, selected, onToggle }: {
  options: string[]; selected: string[]; onToggle: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = selected.includes(opt)
        return (
          <button key={opt} type="button" onClick={() => onToggle(opt)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: active ? 'rgba(13,148,136,0.2)' : '#1F2937',
              border: `1px solid ${active ? '#0D9488' : '#374151'}`,
              color: active ? '#0D9488' : '#9CA3AF',
            }}>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

interface ModalShellProps {
  onClose: () => void
  onSubmit: () => void | Promise<void>
  title: string
  subtitle: string
  icon: LucideIcon
  iconColor?: string
  submitLabel: string
  submitIcon: LucideIcon
  children: React.ReactNode
}

export default function ModalShell({ onClose, onSubmit, title, subtitle, icon: Icon, iconColor = '#0D9488', submitLabel, submitIcon: SubmitIcon, children }: ModalShellProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      await onSubmit()
      setSuccess(true)
      setTimeout(() => onClose(), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
        <div className="flex flex-col items-center gap-3 rounded-2xl px-12 py-10"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
            <X size={0} />{/* force import */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Done!</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>Closing automatically...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-xl flex flex-col max-h-[92vh] rounded-2xl"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${iconColor}26` }}>
              <Icon size={15} style={{ color: iconColor }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-white/5" style={{ color: '#9CA3AF' }}><X size={18} /></button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {children}
          {error && <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#FCA5A5' }}>{error}</p>}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: loading ? 0.7 : 1 }}>
            {loading ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : <><SubmitIcon size={14} /> {submitLabel}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
