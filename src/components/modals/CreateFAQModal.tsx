'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB',
  borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%',
}

export default function CreateFAQModal({ onClose, onToast }: { onClose: () => void; onToast: (msg: string) => void }) {
  const [form, setForm] = useState({ question: '', answer: '', category: 'general', tags: '', isPublic: false })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onToast('FAQ published')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full rounded-2xl" style={{ maxWidth: 480, backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Create FAQ</h2>
          <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Question *</label>
            <input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} required style={INPUT_STYLE} placeholder="How do I reset my password?" />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Answer *</label>
            <textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} required rows={4} className="resize-none" style={INPUT_STYLE} placeholder="Write the answer..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Category *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={INPUT_STYLE}>
                <option value="billing">Billing</option>
                <option value="technical">Technical</option>
                <option value="hr">HR</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Tags</label>
              <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} style={INPUT_STYLE} placeholder="password, login" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Show publicly</span>
            <button type="button" onClick={() => setForm(f => ({ ...f, isPublic: !f.isPublic }))}
              className="relative rounded-full transition-colors" style={{ width: 40, height: 22, backgroundColor: form.isPublic ? '#0D9488' : '#374151' }}>
              <span className="absolute rounded-full bg-white transition-transform" style={{ width: 16, height: 16, top: 3, left: form.isPublic ? 21 : 3 }} />
            </button>
          </div>

          <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Publish FAQ →
          </button>
        </form>
      </div>
    </div>
  )
}
