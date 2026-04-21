'use client'

import { useState, type FormEvent } from 'react'

export type ComingSoonProps = {
  source: 'business' | 'schools'
  accent: string
  accentFaint: string
  accentBorder: string
  pill: string
  h1: string
  sub: string
  cards: { title: string; desc: string }[]
}

export default function ComingSoonPage(props: ComingSoonProps) {
  const { source, accent, accentFaint, accentBorder, pill, h1, sub, cards } = props

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [useCase, setUseCase] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setMessage('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, company, role, useCase, source }),
      })
      const data = await res.json().catch(() => ({} as { error?: string; message?: string }))
      if (!res.ok) {
        setStatus('error')
        setMessage(data?.error || 'Something went wrong. Please try again.')
        return
      }
      setStatus('success')
      setMessage(data?.message || "You're on the list.")
      setEmail(''); setName(''); setCompany(''); setRole(''); setUseCase('')
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#07080F', color: '#F9FAFB', paddingTop: 120, paddingBottom: 80 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>
        <section style={{ textAlign: 'center', marginBottom: 64 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: accent,
              backgroundColor: accentFaint,
              border: `1px solid ${accentBorder}`,
              marginBottom: 20,
            }}
          >
            {pill}
          </span>
          <h1 style={{ fontSize: 44, lineHeight: 1.1, fontWeight: 900, marginBottom: 18, maxWidth: 820, marginLeft: 'auto', marginRight: 'auto' }}>
            {h1}
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: '#9CA3AF', maxWidth: 680, margin: '0 auto 36px' }}>
            {sub}
          </p>

          <form
            onSubmit={onSubmit}
            style={{
              maxWidth: 560,
              margin: '0 auto',
              backgroundColor: '#0D1117',
              border: '1px solid #1F2937',
              borderRadius: 16,
              padding: 24,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <Field
                label="Work email"
                required
                type="email"
                value={email}
                onChange={setEmail}
                accent={accent}
                placeholder="you@company.com"
              />
              <Field
                label="Name"
                required
                value={name}
                onChange={setName}
                accent={accent}
                placeholder="Your name"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <Field
                label={source === 'schools' ? 'School / trust' : 'Company'}
                value={company}
                onChange={setCompany}
                accent={accent}
                placeholder={source === 'schools' ? 'Oakridge Primary' : 'Company name'}
              />
              <SelectField
                label="Role"
                value={role}
                onChange={setRole}
                accent={accent}
                options={
                  source === 'schools'
                    ? ['', 'Headteacher', 'Deputy / SLT', 'Business Manager', 'IT Lead', 'SENCO', 'MAT Exec', 'Other']
                    : ['', 'Founder / CEO', 'Director / COO', 'Operations', 'Sales', 'Marketing', 'Finance', 'HR', 'Other']
                }
              />
            </div>
            <TextareaField
              label={source === 'schools' ? 'What would be most useful? (optional)' : 'Use case (optional)'}
              value={useCase}
              onChange={setUseCase}
              accent={accent}
              placeholder={source === 'schools' ? 'e.g. cutting down on governor reporting admin' : 'e.g. replacing three disconnected tools'}
            />

            <button
              type="submit"
              disabled={status === 'submitting'}
              style={{
                marginTop: 14,
                width: '100%',
                padding: '13px 20px',
                backgroundColor: accent,
                color: '#F9FAFB',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: status === 'submitting' ? 'default' : 'pointer',
                opacity: status === 'submitting' ? 0.7 : 1,
              }}
            >
              {status === 'submitting' ? 'Adding you…' : 'Join the waitlist'}
            </button>

            {status === 'success' && (
              <p role="status" style={{ marginTop: 12, fontSize: 13, color: accent, textAlign: 'center' }}>
                ✓ {message}
              </p>
            )}
            {status === 'error' && (
              <p role="alert" style={{ marginTop: 12, fontSize: 13, color: '#F87171', textAlign: 'center' }}>
                {message}
              </p>
            )}
            <p style={{ marginTop: 12, fontSize: 11, color: '#6B7280', textAlign: 'center' }}>
              We'll only use this to let you know when we open up. No marketing spam.
            </p>
          </form>
        </section>

        <section>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {cards.map(c => (
              <div
                key={c.title}
                style={{
                  padding: 22,
                  backgroundColor: '#0D1117',
                  border: '1px solid #1F2937',
                  borderRadius: 14,
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#F9FAFB', marginBottom: 8 }}>{c.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: '#9CA3AF', margin: 0 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Field(props: {
  label: string
  value: string
  onChange: (v: string) => void
  accent: string
  placeholder?: string
  required?: boolean
  type?: string
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {props.label}{props.required && <span style={{ color: '#F87171' }}> *</span>}
      </span>
      <input
        type={props.type ?? 'text'}
        required={props.required}
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        style={{
          width: '100%',
          padding: '11px 13px',
          borderRadius: 8,
          border: '1px solid #1F2937',
          backgroundColor: '#0A0B10',
          color: '#F9FAFB',
          fontSize: 14,
          outline: 'none',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = props.accent }}
        onBlur={e => { e.currentTarget.style.borderColor = '#1F2937' }}
      />
    </label>
  )
}

function SelectField(props: {
  label: string
  value: string
  onChange: (v: string) => void
  accent: string
  options: string[]
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {props.label}
      </span>
      <select
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '11px 13px',
          borderRadius: 8,
          border: '1px solid #1F2937',
          backgroundColor: '#0A0B10',
          color: props.value ? '#F9FAFB' : '#6B7280',
          fontSize: 14,
          outline: 'none',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = props.accent }}
        onBlur={e => { e.currentTarget.style.borderColor = '#1F2937' }}
      >
        {props.options.map(o => (
          <option key={o} value={o} style={{ backgroundColor: '#0A0B10', color: '#F9FAFB' }}>
            {o || 'Select role…'}
          </option>
        ))}
      </select>
    </label>
  )
}

function TextareaField(props: {
  label: string
  value: string
  onChange: (v: string) => void
  accent: string
  placeholder?: string
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {props.label}
      </span>
      <textarea
        rows={3}
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        style={{
          width: '100%',
          padding: '11px 13px',
          borderRadius: 8,
          border: '1px solid #1F2937',
          backgroundColor: '#0A0B10',
          color: '#F9FAFB',
          fontSize: 14,
          outline: 'none',
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = props.accent }}
        onBlur={e => { e.currentTarget.style.borderColor = '#1F2937' }}
      />
    </label>
  )
}
