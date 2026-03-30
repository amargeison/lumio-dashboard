'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

const S: React.CSSProperties = { backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%' }
const TEAL = '#0D9488'
const PURPLE = '#6C3FC5'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>{label}</label>{children}</div>
}

function Input({ label, placeholder, defaultValue, type = 'text' }: { label: string; placeholder?: string; defaultValue?: string; type?: string }) {
  return <Field label={label}><input type={type} defaultValue={defaultValue} placeholder={placeholder} style={S} /></Field>
}

function Select({ label, options }: { label: string; options: string[] }) {
  return <Field label={label}><select style={S}>{options.map(o => <option key={o}>{o}</option>)}</select></Field>
}

function Textarea({ label, placeholder, rows = 3 }: { label: string; placeholder?: string; rows?: number }) {
  return <Field label={label}><textarea placeholder={placeholder} rows={rows} className="resize-none" style={S} /></Field>
}

function DateInput({ label }: { label: string }) {
  return <Field label={label}><input type="date" style={{ ...S, colorScheme: 'dark' }} /></Field>
}

type ActionId = 'Send Email' | 'Send Slack' | 'Phone Call' | 'Book Meeting' | 'Team Events' | 'Claim Expenses' | 'Book Holiday' | 'Report Sickness'

const TITLES: Record<ActionId, { emoji: string; title: string }> = {
  'Send Email':       { emoji: '📧', title: 'Send Email' },
  'Send Slack':       { emoji: '💬', title: 'Send Slack Message' },
  'Phone Call':       { emoji: '📞', title: 'Log Phone Call' },
  'Book Meeting':     { emoji: '📅', title: 'Book Meeting' },
  'Team Events':      { emoji: '🎉', title: 'Create Team Event' },
  'Claim Expenses':   { emoji: '💷', title: 'Claim Expenses' },
  'Book Holiday':     { emoji: '🏖️', title: 'Book Holiday' },
  'Report Sickness':  { emoji: '🤒', title: 'Report Sickness' },
}

export default function OverviewActionModal({ action, onClose, onToast }: { action: string; onClose: () => void; onToast: (msg: string) => void }) {
  const config = TITLES[action as ActionId]
  if (!config) return null

  function submit(label: string) {
    onToast(`✓ ${label} submitted successfully`)
    onClose()
  }

  const btnStyle = (color: string): React.CSSProperties => ({ backgroundColor: color, color: '#F9FAFB', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' })
  const cancelStyle: React.CSSProperties = { backgroundColor: 'transparent', color: '#6B7280', padding: '10px 20px', borderRadius: 10, border: '1px solid #374151', fontSize: 14, fontWeight: 500, cursor: 'pointer' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full rounded-2xl" style={{ maxWidth: 480, backgroundColor: '#0D0E17', border: '1px solid #1F2937' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.emoji}</span>
            <h2 className="text-base font-bold" style={{ color: '#F9FAFB' }}>{config.title}</h2>
          </div>
          <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {action === 'Send Email' && <>
            <Input label="To" defaultValue="sophie.williams@apexconsulting.com" />
            <Input label="Subject" placeholder="Re: Q1 contract renewal" />
            <Textarea label="Message" placeholder="Hi Sophie,&#10;&#10;Just following up on our conversation..." />
          </>}

          {action === 'Send Slack' && <>
            <Select label="Channel" options={['#general', '#sales', '#support', '#marketing']} />
            <Textarea label="Message" placeholder="Hey team, quick update on..." />
          </>}

          {action === 'Phone Call' && <>
            <Input label="Contact" defaultValue="James Okafor" />
            <Input label="Number" defaultValue="+44 7700 900123" type="tel" />
            <Textarea label="Log Notes" placeholder="Discussed contract terms..." />
            <Select label="Duration" options={['5 min', '10 min', '15 min', '30 min', '45 min', '60 min']} />
          </>}

          {action === 'Book Meeting' && <>
            <Input label="Title" placeholder="Q1 Review with Apex Consulting" />
            <Input label="Attendees" placeholder="sophie.williams@apexconsulting.com" />
            <div className="grid grid-cols-2 gap-3">
              <DateInput label="Date" />
              <Select label="Time" options={['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00']} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Duration" options={['30 min', '45 min', '1 hour', '90 min']} />
              <Select label="Location" options={['Google Meet', 'Zoom', 'Teams', 'In Person']} />
            </div>
          </>}

          {action === 'Team Events' && <>
            <Input label="Event Name" placeholder="Q1 Team Lunch" />
            <div className="grid grid-cols-2 gap-3">
              <DateInput label="Date" />
              <Input label="Headcount" placeholder="12" type="number" />
            </div>
            <Field label="Budget">
              <div className="flex items-center gap-0">
                <span className="px-3 py-2 rounded-l-lg text-sm font-medium" style={{ backgroundColor: '#1F2937', color: '#9CA3AF', border: '1px solid #374151', borderRight: 'none' }}>£</span>
                <input placeholder="500" style={{ ...S, borderRadius: '0 8px 8px 0' }} />
              </div>
            </Field>
            <Textarea label="Notes" placeholder="Dietary requirements, venue preferences..." />
          </>}

          {action === 'Claim Expenses' && <>
            <Input label="Description" placeholder="Client lunch — Apex Consulting" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount">
                <div className="flex items-center gap-0">
                  <span className="px-3 py-2 rounded-l-lg text-sm font-medium" style={{ backgroundColor: '#1F2937', color: '#9CA3AF', border: '1px solid #374151', borderRight: 'none' }}>£</span>
                  <input type="number" placeholder="45.00" style={{ ...S, borderRadius: '0 8px 8px 0' }} />
                </div>
              </Field>
              <Select label="Category" options={['Travel', 'Meals', 'Equipment', 'Accommodation', 'Other']} />
            </div>
            <DateInput label="Date" />
            <Field label="Receipt">
              <button className="w-full py-3 rounded-lg text-sm font-medium transition-colors hover:bg-white/5" style={{ border: '1px dashed #374151', color: '#6B7280' }}>
                📎 Click to upload receipt
              </button>
            </Field>
          </>}

          {action === 'Book Holiday' && <>
            <div className="grid grid-cols-2 gap-3">
              <DateInput label="From" />
              <DateInput label="To" />
            </div>
            <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
              <p className="text-xs" style={{ color: '#0D9488' }}>📅 Days will be calculated automatically once dates are selected</p>
            </div>
            <Input label="Cover Arranged With" placeholder="e.g. James Okafor" />
            <Textarea label="Notes" placeholder="Any handover details..." />
          </>}

          {action === 'Report Sickness' && <>
            <div className="grid grid-cols-2 gap-3">
              <DateInput label="First Day of Absence" />
              <DateInput label="Expected Return" />
            </div>
            <Select label="Reason" options={['Illness', 'Medical Appointment', 'Family Emergency', 'Other']} />
            <Textarea label="Notes" placeholder="Optional — any details for your manager..." />
          </>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #1F2937' }}>
          <button onClick={onClose} style={cancelStyle}>Cancel</button>
          <button onClick={() => submit(config.title)} style={btnStyle(
            action === 'Report Sickness' ? '#EF4444' :
            action === 'Send Slack' || action === 'Team Events' ? PURPLE : TEAL
          )}>
            {action === 'Send Email' ? 'Send Email' :
             action === 'Send Slack' ? 'Send Message' :
             action === 'Phone Call' ? 'Log Call' :
             action === 'Book Meeting' ? 'Book Meeting' :
             action === 'Team Events' ? 'Create Event' :
             action === 'Claim Expenses' ? 'Submit Claim' :
             action === 'Book Holiday' ? 'Submit Request' :
             'Report Absence'}
          </button>
        </div>
      </div>
    </div>
  )
}
