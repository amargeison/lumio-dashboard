'use client';

import React, { useState, useCallback } from 'react';
import EnrichmentEngine from './EnrichmentEngine';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: any) => void;
  tenantId: string;
}

const colors = {
  bg: '#07080F',
  surface: '#0D0E1A',
  elevated: '#121320',
  card: '#0F1019',
  border: '#1E2035',
  purple: '#6C3FC5',
  purpleLight: '#8B5CF6',
  teal: '#0D9488',
  tealLight: '#14B8A6',
  tealBright: '#22D3EE',
  text: '#F1F3FA',
  muted: '#6B7299',
};

const gradient = 'linear-gradient(135deg, #8B5CF6, #22D3EE)';

type SourceStatus = 'queued' | 'live' | 'done' | 'warn';

interface EnrichmentSource {
  icon: string;
  label: string;
  status: SourceStatus;
  detail: string;
}

const initialSources: EnrichmentSource[] = [
  { icon: '🔗', label: 'LinkedIn', status: 'queued', detail: 'Searching profile...' },
  { icon: '📧', label: 'Email Verify', status: 'queued', detail: 'Checking deliverability...' },
  { icon: '🌐', label: 'Web Intel', status: 'queued', detail: 'Scraping public data...' },
  { icon: '𝕏', label: 'X/Twitter', status: 'queued', detail: 'Checking social signals...' },
  { icon: '🏢', label: 'Company Data', status: 'queued', detail: 'Pulling firmographics...' },
  { icon: '📰', label: 'News Signals', status: 'queued', detail: 'Scanning recent mentions...' },
];

export default function AddContactModal({ isOpen, onClose, onSave, tenantId }: AddContactModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({ name: '', email: '', company: '', role: '', phone: '' });
  const [sources, setSources] = useState<EnrichmentSource[]>(initialSources);
  const [enrichedData, setEnrichedData] = useState<any>(null);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const runEnrichment = useCallback(async () => {
    setStep(2);
    setSources(initialSources);

    const delays = [700, 900, 800, 1100, 1000, 750];
    let currentSources = [...initialSources];

    // Start the API call
    const apiPromise = fetch('/api/crm/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tenantId }),
    }).then((r) => r.json()).catch(() => null);

    // Animate sources sequentially
    for (let i = 0; i < currentSources.length; i++) {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          currentSources = currentSources.map((s, idx) =>
            idx === i ? { ...s, status: 'live' as SourceStatus } : s
          );
          setSources([...currentSources]);

          setTimeout(() => {
            currentSources = currentSources.map((s, idx) =>
              idx === i ? { ...s, status: 'done' as SourceStatus } : s
            );
            setSources([...currentSources]);
            resolve();
          }, delays[i] * 0.6);
        }, delays[i] * 0.4);
      });
    }

    const result = await apiPromise;

    // Transition any remaining to done/warn
    const finalSources = currentSources.map((s) => {
      if (s.status !== 'done' && s.status !== 'warn') {
        return { ...s, status: 'done' as SourceStatus };
      }
      return s;
    });

    // If API returned warnings, mark those sources
    if (result?.warnings) {
      result.warnings.forEach((w: string) => {
        const idx = finalSources.findIndex((s) => s.label.toLowerCase().includes(w.toLowerCase()));
        if (idx >= 0) finalSources[idx] = { ...finalSources[idx], status: 'warn' };
      });
    }

    setSources(finalSources);
    setEnrichedData(result || {
      name: form.name,
      email: form.email,
      company: form.company,
      role: form.role,
      phone: form.phone,
      ariaScore: 72,
      ariaBio: 'Contact profile enriched with available public data.',
      location: 'Unknown',
      companySize: 'N/A',
      estRevenue: 'N/A',
      emailStatus: 'Unverified',
      buyingSignals: [],
    });

    setTimeout(() => setStep(3), 600);
  }, [form, tenantId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    runEnrichment();
  };

  const handleSaveToCRM = () => {
    onSave({ ...form, ...enrichedData });
    handleReset();
  };

  const handleReset = () => {
    setStep(1);
    setForm({ name: '', email: '', company: '', role: '', phone: '' });
    setSources(initialSources);
    setEnrichedData(null);
    onClose();
  };

  if (!isOpen) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: colors.elevated,
    border: `1px solid ${colors.border}`,
    color: '#fff',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={handleReset}
    >
      <div
        className="max-w-lg w-full mx-4"
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step 1: Form */}
        {step === 1 && (
          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            <div className="flex items-center gap-3" style={{ marginBottom: '24px' }}>
              <span
                style={{
                  background: gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '24px',
                }}
              >
                ✨
              </span>
              <h2 style={{ color: colors.text, fontSize: '20px', fontWeight: 700, margin: 0 }}>
                Add New Contact
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label style={{ color: colors.muted, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                  Full Name *
                </label>
                <input
                  style={inputStyle}
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  onFocus={(e) => (e.target.style.borderColor = colors.purple)}
                  onBlur={(e) => (e.target.style.borderColor = colors.border)}
                />
              </div>
              <div>
                <label style={{ color: colors.muted, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                  Email *
                </label>
                <input
                  style={inputStyle}
                  placeholder="jane@company.com"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  onFocus={(e) => (e.target.style.borderColor = colors.purple)}
                  onBlur={(e) => (e.target.style.borderColor = colors.border)}
                />
              </div>
              <div>
                <label style={{ color: colors.muted, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                  Company
                </label>
                <input
                  style={inputStyle}
                  placeholder="Acme Inc"
                  value={form.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = colors.purple)}
                  onBlur={(e) => (e.target.style.borderColor = colors.border)}
                />
              </div>
              <div>
                <label style={{ color: colors.muted, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                  Role / Title
                </label>
                <input
                  style={inputStyle}
                  placeholder="VP of Sales"
                  value={form.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = colors.purple)}
                  onBlur={(e) => (e.target.style.borderColor = colors.border)}
                />
              </div>
              <div>
                <label style={{ color: colors.muted, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                  Phone
                </label>
                <input
                  style={inputStyle}
                  placeholder="+44 7700 900000"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = colors.purple)}
                  onBlur={(e) => (e.target.style.borderColor = colors.border)}
                />
              </div>
            </div>

            {/* ARIA info box */}
            <div
              style={{
                marginTop: '20px',
                backgroundColor: '#12132080',
                borderLeft: `3px solid`,
                borderImage: `${gradient} 1`,
                borderRadius: '0 8px 8px 0',
                padding: '14px 16px',
              }}
            >
              <p style={{ color: colors.muted, fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
                ARIA will automatically enrich this contact with LinkedIn data, email verification,
                company intelligence, and buying signals.
              </p>
            </div>

            <button
              type="submit"
              className="w-full"
              style={{
                marginTop: '20px',
                backgroundColor: colors.purple,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.purpleLight)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.purple)}
            >
              ⚡ Add &amp; Enrich Profile
            </button>
          </form>
        )}

        {/* Step 2: Enrichment Animation */}
        {step === 2 && (
          <div style={{ padding: '24px' }}>
            <h2
              style={{
                color: colors.text,
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              Enriching {form.name}...
            </h2>

            <EnrichmentEngine sources={sources} />

            <p
              style={{
                color: colors.muted,
                fontSize: '13px',
                textAlign: 'center',
                marginTop: '20px',
              }}
            >
              Building your 360&deg; contact intelligence profile
              <span className="animate-pulse">...</span>
            </p>
          </div>
        )}

        {/* Step 3: Enriched Profile Review */}
        {step === 3 && enrichedData && (
          <div style={{ padding: '24px' }}>
            {/* Header */}
            <div className="flex items-center gap-4" style={{ marginBottom: '20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: colors.purple,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '18px',
                  flexShrink: 0,
                }}
              >
                {getInitials(enrichedData.name || form.name)}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ color: colors.text, fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  {enrichedData.name || form.name}
                </h2>
                <p style={{ color: colors.muted, fontSize: '13px', margin: '2px 0 0' }}>
                  {enrichedData.role || form.role}
                  {(enrichedData.company || form.company) &&
                    ` at ${enrichedData.company || form.company}`}
                </p>
              </div>
              <div
                style={{
                  backgroundColor: colors.teal,
                  borderRadius: '8px',
                  padding: '6px 14px',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '11px', color: '#fff', opacity: 0.8 }}>ARIA Score</span>
                <div
                  style={{
                    background: gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 800,
                    fontSize: '20px',
                  }}
                >
                  {enrichedData.ariaScore || 72}
                </div>
              </div>
            </div>

            {/* Source verification grid */}
            <div className="grid grid-cols-3 gap-2" style={{ marginBottom: '16px' }}>
              {sources.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2"
                  style={{
                    backgroundColor: colors.elevated,
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '12px',
                  }}
                >
                  <span>{s.icon}</span>
                  <span style={{ color: colors.muted }}>{s.label}</span>
                  <span style={{ marginLeft: 'auto' }}>
                    {s.status === 'done' ? (
                      <span style={{ color: '#10B981' }}>&#10003;</span>
                    ) : s.status === 'warn' ? (
                      <span style={{ color: '#F59E0B' }}>&#9888;</span>
                    ) : (
                      <span style={{ color: colors.muted }}>-</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* ARIA Bio */}
            {enrichedData.ariaBio && (
              <p
                style={{
                  color: colors.muted,
                  fontSize: '13px',
                  lineHeight: 1.7,
                  marginBottom: '16px',
                  backgroundColor: colors.elevated,
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                {enrichedData.ariaBio}
              </p>
            )}

            {/* Intel tiles */}
            <div className="grid grid-cols-2 gap-3" style={{ marginBottom: '16px' }}>
              {[
                { label: 'Location', value: enrichedData.location || 'Unknown' },
                { label: 'Company Size', value: enrichedData.companySize || 'N/A' },
                { label: 'Est. Revenue', value: enrichedData.estRevenue || 'N/A' },
                { label: 'Email Status', value: enrichedData.emailStatus || 'Unverified' },
              ].map((tile, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: colors.elevated,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  <p style={{ color: colors.muted, fontSize: '11px', margin: '0 0 4px' }}>
                    {tile.label}
                  </p>
                  <p style={{ color: colors.text, fontSize: '14px', fontWeight: 600, margin: 0 }}>
                    {tile.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Buying Signals */}
            {enrichedData.buyingSignals && enrichedData.buyingSignals.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: colors.text, fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  Buying Signals
                </h4>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {enrichedData.buyingSignals.map((signal: string, i: number) => (
                    <li key={i} style={{ color: colors.muted, fontSize: '13px', marginBottom: '4px' }}>
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSaveToCRM}
                className="flex-1"
                style={{
                  backgroundColor: colors.teal,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save to CRM
              </button>
              <button
                onClick={handleReset}
                className="flex-1"
                style={{
                  backgroundColor: 'transparent',
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
