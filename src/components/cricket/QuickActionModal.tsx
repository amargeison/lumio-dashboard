'use client'

import { useEffect, useState } from 'react'

// ──────────────────────────────────────────────────────────────────────────
// QuickActionModal — shared modal for cricket Quick Actions.
//
// Two variants:
//   - kind='ai'   : hits /api/ai/cricket/quick-action, streams response
//                   into a styled card. Spinner while waiting, loud error
//                   + retry on failure.
//   - kind='form' : renders fields, on submit fires a toast and closes.
//                   No backend call.
// ──────────────────────────────────────────────────────────────────────────

export type FormField =
  | { kind: 'text';     id: string; label: string; placeholder?: string; defaultValue?: string }
  | { kind: 'textarea'; id: string; label: string; placeholder?: string; defaultValue?: string; rows?: number }
  | { kind: 'select';   id: string; label: string; options: string[]; defaultValue?: string }
  | { kind: 'number';   id: string; label: string; placeholder?: string; defaultValue?: string }

export type AIAction = {
  type:     'team-selection' | 'toss-advisor' | 'sponsor-post' | 'press-statement' | 'agent-brief' | 'match-prep' | 'innings-brief'
  fields?:  FormField[]        // optional pre-call form (e.g. Press Statement needs topic)
  context?: Record<string, unknown> // default context merged with field values
}

export type QuickActionSpec =
  | { kind: 'ai';   id: string; title: string; icon: string; color: string; description?: string; ai: AIAction }
  | { kind: 'form'; id: string; title: string; icon: string; color: string; description?: string; fields: FormField[]; submitLabel?: string }

const C = {
  bg: '#07080F', card: '#0F1629', cardAlt: '#111827', border: 'rgba(255,255,255,0.07)',
  text: '#F1F5F9', muted: '#94A3B8', dim: '#475569',
  purple: '#8B5CF6', purpleDim: 'rgba(139,92,246,0.15)',
  teal: '#14B8A6', tealDim: 'rgba(20,184,166,0.15)',
  amber: '#F59E0B', amberDim: 'rgba(245,158,11,0.15)',
  green: '#10B981', greenDim: 'rgba(16,185,129,0.15)',
  red: '#EF4444', redDim: 'rgba(239,68,68,0.15)',
}

function FieldInput({ field, value, onChange }: { field: FormField; value: string; onChange: (v:string)=>void }) {
  const base: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 6,
    border: `1px solid ${C.border}`, background: C.cardAlt,
    color: C.text, fontSize: 13,
  }
  if (field.kind === 'textarea') {
    return (
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder}
        rows={field.rows ?? 3} style={{ ...base, fontFamily: 'inherit', resize: 'vertical' }} />
    )
  }
  if (field.kind === 'select') {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} style={base}>
        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }
  return (
    <input type={field.kind === 'number' ? 'number' : 'text'}
      value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder}
      style={base} />
  )
}

export default function QuickActionModal({ spec, onClose }: { spec: QuickActionSpec | null; onClose: () => void }) {
  const [values, setValues]       = useState<Record<string, string>>({})
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [response, setResponse]   = useState<string | null>(null)
  const [meta, setMeta]           = useState<{ latencyMs?:number; tokens?:{input:number;output:number} } | null>(null)
  const [toastText, setToastText] = useState<string | null>(null)

  // Seed defaults whenever a new action is opened
  useEffect(() => {
    if (!spec) return
    const fields = spec.kind === 'ai' ? (spec.ai.fields ?? []) : spec.fields
    const next: Record<string, string> = {}
    for (const f of fields) next[f.id] = f.defaultValue ?? (f.kind === 'select' ? (f.options[0] ?? '') : '')
    setValues(next)
    setLoading(false)
    setError(null)
    setResponse(null)
    setMeta(null)
    setToastText(null)
  }, [spec])

  // Close on Esc
  useEffect(() => {
    if (!spec) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [spec, onClose])

  if (!spec) return null

  const aiFields   = spec.kind === 'ai' ? (spec.ai.fields ?? []) : []
  const formFields = spec.kind === 'form' ? spec.fields : []

  async function runAI() {
    if (spec?.kind !== 'ai') return
    setLoading(true); setError(null); setResponse(null); setMeta(null)
    try {
      const res = await fetch('/api/ai/cricket/quick-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: spec.ai.type, context: { ...(spec.ai.context ?? {}), ...values } }),
      })
      const data = await res.json()
      if (!res.ok) {
        const extra = res.status === 429
          ? ` Retry in ${data?.retryInSec ?? '—'}s.`
          : res.status === 503
          ? ''
          : ''
        throw new Error((data?.error || 'AI call failed.') + extra)
      }
      setResponse(data.response || '(empty response)')
      setMeta({ latencyMs: data.latencyMs, tokens: data.tokens })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI call failed.')
    } finally {
      setLoading(false)
    }
  }

  function submitForm() {
    if (spec?.kind !== 'form') return
    setToastText(`✓ ${spec.title} logged`)
    // Auto-close after the toast has been visible briefly
    setTimeout(() => { setToastText(null); onClose() }, 1400)
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:620, maxHeight:'85vh', background:C.card, border:`1px solid ${spec.color}55`, borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10, background:`${spec.color}12` }}>
          <span style={{ fontSize:20 }}>{spec.icon}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:700, color:spec.color, display:'flex', alignItems:'center', gap:6 }}>
              {spec.title}
              {spec.kind === 'ai' && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, background:spec.color, color:'#fff', fontWeight:700 }}>AI</span>}
            </div>
            {spec.description && <div style={{ fontSize:11, color:C.dim }}>{spec.description}</div>}
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:C.muted, fontSize:20, cursor:'pointer', padding:'0 6px', lineHeight:1 }} aria-label="Close">×</button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 18px', display:'flex', flexDirection:'column', gap:12 }}>
          {/* AI inputs (optional) */}
          {spec.kind === 'ai' && aiFields.length > 0 && !response && !loading && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {aiFields.map(f => (
                <div key={f.id}>
                  <label style={{ display:'block', fontSize:10, color:C.dim, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{f.label}</label>
                  <FieldInput field={f} value={values[f.id] ?? ''} onChange={v => setValues(m => ({ ...m, [f.id]: v }))} />
                </div>
              ))}
            </div>
          )}

          {/* AI loading */}
          {spec.kind === 'ai' && loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', border:`3px solid ${C.border}`, borderTopColor:spec.color, animation:'spin 0.9s linear infinite' }} />
              <div style={{ fontSize:12, color:C.muted }}>Thinking… this takes a few seconds.</div>
              <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* AI error */}
          {spec.kind === 'ai' && error && (
            <div style={{ padding:14, borderRadius:8, background:C.redDim, border:`1px solid ${C.red}55` }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.red, marginBottom:4 }}>⚠ AI call failed</div>
              <div style={{ fontSize:12, color:C.text, lineHeight:1.5 }}>{error}</div>
              <button onClick={runAI} style={{ marginTop:10, padding:'6px 14px', borderRadius:6, border:'none', background:C.red, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>Retry</button>
            </div>
          )}

          {/* AI response */}
          {spec.kind === 'ai' && response && !loading && (
            <div>
              <div style={{ padding:16, borderRadius:10, background:C.cardAlt, border:`1px solid ${spec.color}33`, fontSize:13, lineHeight:1.7, color:C.text, whiteSpace:'pre-wrap' }}>
                {response}
              </div>
              {meta && (
                <div style={{ marginTop:8, fontSize:10, color:C.dim, display:'flex', gap:10 }}>
                  <span>{meta.latencyMs}ms</span>
                  {meta.tokens && <span>in {meta.tokens.input} · out {meta.tokens.output} tokens</span>}
                  <span>· claude-sonnet-4</span>
                </div>
              )}
              <div style={{ marginTop:12, display:'flex', gap:8 }}>
                <button onClick={runAI} style={{ padding:'7px 14px', borderRadius:6, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, fontSize:12, fontWeight:600, cursor:'pointer' }}>Regenerate</button>
                <button onClick={() => { navigator.clipboard?.writeText(response).catch(()=>{}); setToastText('✓ Copied to clipboard'); setTimeout(()=>setToastText(null), 1500) }}
                  style={{ padding:'7px 14px', borderRadius:6, border:'none', background:spec.color, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>Copy</button>
              </div>
            </div>
          )}

          {/* Form fields */}
          {spec.kind === 'form' && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {formFields.map(f => (
                <div key={f.id}>
                  <label style={{ display:'block', fontSize:10, color:C.dim, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{f.label}</label>
                  <FieldInput field={f} value={values[f.id] ?? ''} onChange={v => setValues(m => ({ ...m, [f.id]: v }))} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / action bar */}
        <div style={{ padding:'12px 18px', borderTop:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, background:C.cardAlt }}>
          <div style={{ fontSize:10, color:C.dim, minHeight:16 }}>
            {toastText ? <span style={{ color:C.green }}>{toastText}</span>
              : spec.kind === 'ai' ? 'Live LLM call · rate-limited'
              : 'Local only · no backend call'}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ padding:'7px 14px', borderRadius:6, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, fontSize:12, cursor:'pointer' }}>
              {response || toastText ? 'Close' : 'Cancel'}
            </button>
            {spec.kind === 'ai' && !response && (
              <button onClick={runAI} disabled={loading}
                style={{ padding:'7px 18px', borderRadius:6, border:'none', background:loading ? C.border : spec.color, color:'#fff', fontSize:12, fontWeight:700, cursor: loading ? 'wait' : 'pointer' }}>
                {loading ? 'Thinking…' : 'Generate'}
              </button>
            )}
            {spec.kind === 'form' && !toastText && (
              <button onClick={submitForm}
                style={{ padding:'7px 18px', borderRadius:6, border:'none', background:spec.color, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                {spec.submitLabel ?? 'Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
