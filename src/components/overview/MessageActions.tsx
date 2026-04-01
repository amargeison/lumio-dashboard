'use client'

import React, { useState } from 'react'
import { Reply, Forward, Star, FolderInput, Send, X, Loader2, Video, Trash2 } from 'lucide-react'

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('workspace_session_token') || '' : '' }

// ─── Email Actions ───────────────────────────────────────────────────────────

export function EmailActions({ msgId, source, senderEmail, subject, preview, onToast }: {
  msgId: string; source: string; senderEmail: string; subject: string; preview: string; onToast: (msg: string) => void
}) {
  const [action, setAction] = useState<'reply' | 'forward' | 'move' | null>(null)
  const [flagged, setFlagged] = useState(false)
  const [flagging, setFlagging] = useState(false)
  const [sending, setSending] = useState(false)
  const [to, setTo] = useState('')
  const [body, setBody] = useState('')

  const isOutlook = source === 'outlook'

  async function handleFlag() {
    if (!isOutlook) { onToast('Flagging only available for Outlook'); return }
    setFlagging(true)
    const next = !flagged
    setFlagged(next)
    const r = await fetch('/api/integrations/microsoft/mail/flag', {
      method: 'PATCH', headers: { 'x-workspace-token': getToken(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: msgId, flagged: next }),
    }).catch(() => null)
    if (r?.ok) onToast(next ? 'Email flagged' : 'Flag removed')
    else if (r?.status === 401) onToast('Reconnect Outlook in Settings')
    setFlagging(false)
  }

  async function handleSend() {
    setSending(true)
    const route = isOutlook ? '/api/integrations/microsoft/mail/send' : '/api/integrations/google/mail/send'
    const payload: Record<string, string> = { to: action === 'reply' ? senderEmail : to, subject: action === 'reply' ? `Re: ${subject}` : `Fwd: ${subject}`, body }
    if (action === 'reply' && isOutlook) (payload as Record<string, string>).replyToId = msgId
    const r = await fetch(route, {
      method: 'POST', headers: { 'x-workspace-token': getToken(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null)
    if (r?.ok) { onToast(action === 'reply' ? 'Reply sent' : 'Email forwarded'); setAction(null); setBody(''); setTo('') }
    else if (r?.status === 401) onToast(`Reconnect ${isOutlook ? 'Outlook' : 'Gmail'} in Settings`)
    else onToast('Failed to send')
    setSending(false)
  }

  async function handleMove(folder: string) {
    if (!isOutlook) { onToast('Move only available for Outlook'); return }
    const r = await fetch('/api/integrations/microsoft/mail/move', {
      method: 'POST', headers: { 'x-workspace-token': getToken(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: msgId, folder }),
    }).catch(() => null)
    if (r?.ok) onToast(`Email moved to ${folder}`)
    else if (r?.status === 401) onToast('Reconnect Outlook in Settings')
    else onToast('Failed to move')
    setAction(null)
  }

  return (
    <div className="mt-2">
      {/* Action buttons row */}
      <div className="flex items-center gap-1.5">
        <button onClick={() => setAction(action === 'reply' ? null : 'reply')} title="Reply" className="p-1.5 rounded-lg transition-colors" style={{ backgroundColor: action === 'reply' ? 'rgba(108,63,197,0.15)' : 'transparent', color: action === 'reply' ? '#A78BFA' : '#6B7280' }}>
          <Reply size={12} />
        </button>
        <button onClick={() => { setAction(action === 'forward' ? null : 'forward'); setBody(`\n\n--- Forwarded ---\n${preview}`) }} title="Forward" className="p-1.5 rounded-lg transition-colors" style={{ backgroundColor: action === 'forward' ? 'rgba(108,63,197,0.15)' : 'transparent', color: action === 'forward' ? '#A78BFA' : '#6B7280' }}>
          <Forward size={12} />
        </button>
        <button onClick={handleFlag} disabled={flagging} title={flagged ? 'Remove flag' : 'Flag'} className="p-1.5 rounded-lg transition-colors" style={{ color: flagged ? '#F59E0B' : '#6B7280' }}>
          {flagging ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} fill={flagged ? '#F59E0B' : 'none'} />}
        </button>
        {isOutlook && (
          <button onClick={() => setAction(action === 'move' ? null : 'move')} title="Move to folder" className="p-1.5 rounded-lg transition-colors" style={{ backgroundColor: action === 'move' ? 'rgba(108,63,197,0.15)' : 'transparent', color: action === 'move' ? '#A78BFA' : '#6B7280' }}>
            <FolderInput size={12} />
          </button>
        )}
      </div>

      {/* Inline composer */}
      {(action === 'reply' || action === 'forward') && (
        <div className="mt-2 rounded-lg p-3 space-y-2" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {action === 'forward' && (
            <input value={to} onChange={e => setTo(e.target.value)} placeholder="Recipient email" className="w-full text-xs rounded px-2.5 py-1.5 outline-none" style={{ backgroundColor: '#1A1D26', border: '1px solid rgba(255,255,255,0.1)', color: '#F9FAFB' }} />
          )}
          <div className="text-[10px] px-1" style={{ color: '#6B7280' }}>
            {action === 'reply' ? `To: ${senderEmail} · Re: ${subject}` : `Fwd: ${subject}`}
          </div>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} placeholder="Write your message..." className="w-full text-xs rounded px-2.5 py-1.5 outline-none resize-none" style={{ backgroundColor: '#1A1D26', border: '1px solid rgba(255,255,255,0.1)', color: '#F9FAFB' }} autoFocus />
          <div className="flex gap-2">
            <button onClick={handleSend} disabled={sending || (action === 'forward' && !to)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold" style={{ backgroundColor: '#7C3AED', color: '#fff', opacity: sending ? 0.6 : 1 }}>
              {sending ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />} {sending ? 'Sending...' : 'Send'}
            </button>
            <button onClick={() => { setAction(null); setBody(''); setTo('') }} className="px-2 py-1.5 rounded-lg text-[10px]" style={{ color: '#6B7280' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Move dropdown */}
      {action === 'move' && (
        <div className="mt-2 rounded-lg p-2 space-y-1" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {['Archive', 'Trash', 'Drafts'].map(f => (
            <button key={f} onClick={() => handleMove(f.toLowerCase())} className="w-full text-left px-2.5 py-1.5 rounded text-[10px] transition-colors" style={{ color: '#9CA3AF' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(108,63,197,0.1)'; e.currentTarget.style.color = '#F9FAFB' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}>
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Meeting Actions ─────────────────────────────────────────────────────────

export function MeetingActions({ eventId, title, startTime, joinUrl, source, onToast, onCancel }: {
  eventId: string; title: string; startTime: string; joinUrl: string | null
  source?: 'microsoft' | 'google'; onToast: (msg: string) => void; onCancel: () => void
}) {
  const [showForward, setShowForward] = useState(false)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)
  const [forwardTo, setForwardTo] = useState('')
  const [sending, setSending] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  async function handleForward() {
    if (!forwardTo) return
    setSending(true)
    if (source === 'microsoft') {
      const r = await fetch('/api/integrations/microsoft/calendar/forward', {
        method: 'POST', headers: { 'x-workspace-token': getToken(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, toEmail: forwardTo, comment: `I'd like to invite you to: ${title} at ${startTime}` }),
      }).catch(() => null)
      if (r?.ok) { onToast(`Invite sent to ${forwardTo}`); setShowForward(false); setForwardTo('') }
      else if (r?.status === 401) onToast('Reconnect Outlook Calendar in Settings')
      else onToast('Failed to forward')
    } else {
      onToast('Google Calendar forwarding coming soon')
    }
    setSending(false)
  }

  async function handleCancel() {
    setCancelling(true)
    if (source === 'microsoft') {
      const r = await fetch('/api/integrations/microsoft/calendar/delete', {
        method: 'DELETE', headers: { 'x-workspace-token': getToken(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      }).catch(() => null)
      if (r?.ok) { onToast('Meeting cancelled'); onCancel() }
      else if (r?.status === 401) onToast('Reconnect Outlook Calendar in Settings')
      else onToast('Failed to cancel')
    } else {
      onToast('Google Calendar cancellation coming soon')
    }
    setCancelling(false)
    setShowConfirmCancel(false)
  }

  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      {joinUrl && (
        <a href={joinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}>
          <Video size={10} /> Join
        </a>
      )}
      {!joinUrl && <span className="text-[9px] px-2 py-1 rounded-lg" style={{ color: '#4B5563', backgroundColor: 'rgba(255,255,255,0.03)' }} title="No online meeting link">No link</span>}

      <button onClick={() => setShowForward(!showForward)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold" style={{ backgroundColor: 'rgba(108,63,197,0.1)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.2)' }}>
        <Forward size={10} /> Forward
      </button>

      {!showConfirmCancel ? (
        <button onClick={() => setShowConfirmCancel(true)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          <Trash2 size={10} /> Cancel
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <button onClick={handleCancel} disabled={cancelling} className="px-2 py-1 rounded-lg text-[10px] font-semibold" style={{ backgroundColor: '#EF4444', color: '#fff', opacity: cancelling ? 0.6 : 1 }}>
            {cancelling ? <Loader2 size={10} className="animate-spin" /> : 'Confirm'}
          </button>
          <button onClick={() => setShowConfirmCancel(false)} className="px-2 py-1 rounded-lg text-[10px]" style={{ color: '#6B7280' }}>
            <X size={10} />
          </button>
        </div>
      )}

      {showForward && (
        <div className="flex items-center gap-1.5 ml-1">
          <input value={forwardTo} onChange={e => setForwardTo(e.target.value)} placeholder="email@..." className="text-[10px] rounded px-2 py-1 outline-none" style={{ backgroundColor: '#1A1D26', border: '1px solid rgba(255,255,255,0.1)', color: '#F9FAFB', width: 140 }} />
          <button onClick={handleForward} disabled={sending || !forwardTo} className="px-2 py-1 rounded-lg text-[10px] font-semibold" style={{ backgroundColor: '#7C3AED', color: '#fff', opacity: sending ? 0.6 : 1 }}>
            {sending ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
          </button>
        </div>
      )}
    </div>
  )
}
