'use client'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function BookDemoModal({ onClose }: Props) {
  function openBusiness() {
    window.open('https://calendly.com/lumiocms/30min', '_blank')
    onClose()
  }
  function openSchool() {
    window.open('https://calendly.com/lumiocms/lumio-schools', '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid #1F2937' }}>
          <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Who is this for?</h2>
          <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <button onClick={openBusiness} className="flex flex-col items-center gap-3 rounded-xl p-6 text-center transition-all" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D9488' }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937' }}>
            <span className="text-4xl">🏢</span>
            <span className="text-base font-bold" style={{ color: '#F9FAFB' }}>Business</span>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>CRM, HR, Sales, Operations and more</span>
          </button>
          <button onClick={openSchool} className="flex flex-col items-center gap-3 rounded-xl p-6 text-center transition-all" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D9488' }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937' }}>
            <span className="text-4xl">🏫</span>
            <span className="text-base font-bold" style={{ color: '#F9FAFB' }}>School</span>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>Attendance, safeguarding, staff, curriculum and more</span>
          </button>
        </div>
        <p className="px-6 pb-6 text-xs text-center" style={{ color: '#6B7280' }}>Both products are free for 14 days. No credit card required.</p>
      </div>
    </div>
  )
}
