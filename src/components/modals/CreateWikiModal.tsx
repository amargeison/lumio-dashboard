'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB',
  borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%',
}

export default function CreateWikiModal({ onClose, onToast }: { onClose: () => void; onToast: (msg: string) => void }) {
  const [form, setForm] = useState({ title: '', category: 'technical', content: '', tags: '', visibility: 'all' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onToast('Wiki article published')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full rounded-2xl" style={{ maxWidth: 500, backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Create Wiki Article</h2>
          <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required style={INPUT_STYLE} placeholder="How to reset a user's password" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Category *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={INPUT_STYLE}>
                <option value="technical">Technical</option>
                <option value="hr">HR</option>
                <option value="operations">Operations</option>
                <option value="product">Product</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Visible to</label>
              <select value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))} style={INPUT_STYLE}>
                <option value="all">All staff</option>
                <option value="managers">Managers only</option>
                <option value="it">IT only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Content *</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required rows={5} className="resize-none" style={INPUT_STYLE} placeholder="Write your article content..." />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Tags</label>
            <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} style={INPUT_STYLE} placeholder="password, reset, admin (comma separated)" />
          </div>

          <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Publish to Wiki →
          </button>
        </form>
      </div>
    </div>
  )
}
