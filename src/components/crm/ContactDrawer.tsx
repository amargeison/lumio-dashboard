'use client'

import React, { useState } from 'react'
import type { CRMContact } from '@/lib/crm/types'
import { ARIAScoreRing } from './DealCard'

interface ContactDrawerProps {
  contact: CRMContact | null
  onClose: () => void
  onReVerify: (contactId: string) => void
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string | null }) {
  if (!value) return null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        borderBottom: '1px solid #1E2035',
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div>
        <div style={{ color: '#6B7299', fontSize: 11 }}>{label}</div>
        <div style={{ color: '#F1F3FA', fontSize: 13 }}>{value}</div>
      </div>
    </div>
  )
}

export default function ContactDrawer({
  contact,
  onClose,
  onReVerify,
}: ContactDrawerProps) {
  const [verifyState, setVerifyState] = useState<'idle' | 'checking' | 'done'>('idle')

  if (!contact) return null

  const handleReVerify = () => {
    setVerifyState('checking')
    onReVerify(contact.id)
    setTimeout(() => setVerifyState('done'), 2000)
  }

  const verificationItems = [
    {
      label: 'Email deliverability',
      ok: contact.email_status === 'live',
      warn: contact.email_status === 'warning',
      okText: '\u2713 Live',
      warnText: '\u26A0 Check',
    },
    {
      label: 'LinkedIn profile',
      ok: contact.linkedin_status === 'found',
      warn: false,
      okText: '\u2713 Found',
      warnText: '? Unknown',
    },
    {
      label: 'Still at company',
      ok: contact.company_status === 'confirmed',
      warn: contact.company_status === 'warning',
      okText: '\u2713 Confirmed',
      warnText: '\u26A0 Check',
    },
    {
      label: 'Social presence',
      ok: !!contact.twitter_handle,
      warn: false,
      okText: '\u2713 Active',
      warnText: '? Unknown',
    },
  ]

  const hasWarnings = verificationItems.some((v) => v.warn || (!v.ok && !v.warn))

  const actionButtons = [
    { icon: '\u2709', label: 'Email' },
    { icon: '\uD83D\uDCDE', label: 'Call' },
    { icon: '\u270F', label: 'Note' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 49,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 370,
          height: '100%',
          backgroundColor: '#0D0E1A',
          borderLeft: '1px solid #1E2035',
          zIndex: 50,
          overflowY: 'auto',
          animation: 'slideIn 0.3s ease forwards',
        }}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Sticky header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#0D0E1A',
            zIndex: 1,
            padding: '20px 20px 16px',
            borderBottom: '1px solid #1E2035',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: contact.avatar_color || '#6C3FC5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F1F3FA',
                fontWeight: 700,
                fontSize: 15,
                flexShrink: 0,
              }}
            >
              {contact.avatar_initials || contact.name?.slice(0, 2).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: '#F1F3FA',
                  fontWeight: 600,
                  fontSize: 16,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {contact.name}
              </div>
              <div style={{ color: '#6B7299', fontSize: 12 }}>
                {contact.role}
                {contact.company_name && (
                  <>
                    {' at '}
                    <span style={{ color: '#0D9488' }}>{contact.company_name}</span>
                  </>
                )}
              </div>
            </div>

            <ARIAScoreRing score={contact.aria_score} size={40} />

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#6B7299',
                fontSize: 20,
                cursor: 'pointer',
                padding: 4,
                lineHeight: 1,
              }}
            >
              {'\u2715'}
            </button>
          </div>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {actionButtons.map((btn) => (
              <button
                key={btn.label}
                style={{
                  flex: 1,
                  backgroundColor: '#1E2035',
                  border: 'none',
                  borderRadius: 8,
                  color: '#F1F3FA',
                  padding: '10px 0',
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 18 }}>{btn.icon}</span>
                <span>{btn.label}</span>
              </button>
            ))}
          </div>

          {/* ARIA Verification */}
          <div
            style={{
              backgroundColor: '#0F1019',
              border: '1px solid #1E2035',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h4
              style={{
                color: '#F1F3FA',
                fontSize: 14,
                fontWeight: 600,
                marginTop: 0,
                marginBottom: 12,
              }}
            >
              ARIA Verification
            </h4>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}
            >
              {verificationItems.map((item) => (
                <div
                  key={item.label}
                  style={{
                    backgroundColor: '#121320',
                    borderRadius: 8,
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ color: '#6B7299', fontSize: 11, marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div
                    style={{
                      color: item.ok ? '#10B981' : item.warn ? '#F59E0B' : '#6B7299',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {item.ok ? item.okText : item.warnText}
                  </div>
                </div>
              ))}
            </div>

            {hasWarnings && (
              <div
                style={{
                  color: '#F59E0B',
                  fontSize: 12,
                  marginTop: 10,
                  padding: '6px 10px',
                  backgroundColor: '#F59E0B10',
                  borderRadius: 6,
                }}
              >
                Some verification checks need attention
              </div>
            )}

            <button
              onClick={handleReVerify}
              disabled={verifyState === 'checking'}
              style={{
                width: '100%',
                marginTop: 12,
                backgroundColor: verifyState === 'done' ? '#10B98120' : '#6C3FC5',
                border: 'none',
                borderRadius: 8,
                color: verifyState === 'done' ? '#10B981' : '#F1F3FA',
                padding: '10px 0',
                fontSize: 13,
                fontWeight: 600,
                cursor: verifyState === 'checking' ? 'wait' : 'pointer',
              }}
            >
              {verifyState === 'idle'
                ? 'Re-verify now'
                : verifyState === 'checking'
                  ? 'Checking...'
                  : '\u2713 Up to date'}
            </button>
          </div>

          {/* Contact Info */}
          <div
            style={{
              backgroundColor: '#0F1019',
              border: '1px solid #1E2035',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h4
              style={{
                color: '#F1F3FA',
                fontSize: 14,
                fontWeight: 600,
                marginTop: 0,
                marginBottom: 8,
              }}
            >
              Contact Info
            </h4>
            <InfoRow icon={'\uD83D\uDCE7'} label="Email" value={contact.email} />
            <InfoRow icon={'\uD83D\uDCDE'} label="Phone" value={contact.phone} />
            <InfoRow icon={'\uD83D\uDD17'} label="LinkedIn" value={contact.linkedin_url} />
            <InfoRow icon={'\uD83D\uDCCD'} label="Location" value={contact.location} />
          </div>

          {/* Company Intelligence */}
          {contact.enrichment_data && (
            <div
              style={{
                backgroundColor: '#0F1019',
                border: '1px solid #1E2035',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <h4
                style={{
                  color: '#F1F3FA',
                  fontSize: 14,
                  fontWeight: 600,
                  marginTop: 0,
                  marginBottom: 12,
                }}
              >
                Company Intelligence
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    backgroundColor: '#121320',
                    borderRadius: 8,
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ color: '#6B7299', fontSize: 11, marginBottom: 4 }}>
                    Headcount
                  </div>
                  <div style={{ color: '#F1F3FA', fontSize: 14, fontWeight: 600 }}>
                    {contact.enrichment_data.companySize || 'N/A'}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: '#121320',
                    borderRadius: 8,
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ color: '#6B7299', fontSize: 11, marginBottom: 4 }}>
                    Revenue
                  </div>
                  <div style={{ color: '#F1F3FA', fontSize: 14, fontWeight: 600 }}>
                    {contact.enrichment_data.companyRevenue || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ARIA Bio */}
          {contact.bio && (
            <div
              style={{
                backgroundColor: '#121320',
                border: '1px solid #1E2035',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <h4
                style={{
                  color: '#F1F3FA',
                  fontSize: 14,
                  fontWeight: 600,
                  marginTop: 0,
                  marginBottom: 8,
                }}
              >
                ARIA Bio
              </h4>
              <p
                style={{
                  color: '#6B7299',
                  fontSize: 13,
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {contact.bio}
              </p>
            </div>
          )}

          {/* Buying Signals */}
          {contact.buying_signals.length > 0 && (
            <div
              style={{
                backgroundColor: '#0F1019',
                border: '1px solid #1E2035',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <h4
                style={{
                  color: '#F1F3FA',
                  fontSize: 14,
                  fontWeight: 600,
                  marginTop: 0,
                  marginBottom: 12,
                }}
              >
                Buying Signals
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {contact.buying_signals.map((signal, i) => {
                  const isWarning = signal.includes('\u26A0')
                  return (
                    <span
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: '#121320',
                        border: '1px solid #1E2035',
                        borderRadius: 9999,
                        padding: '4px 12px',
                        fontSize: 12,
                        color: '#F1F3FA',
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: isWarning ? '#F59E0B' : '#14B8A6',
                          display: 'inline-block',
                        }}
                      />
                      {signal}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div
            style={{
              backgroundColor: '#0F1019',
              border: '1px solid #1E2035',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h4
              style={{
                color: '#F1F3FA',
                fontSize: 14,
                fontWeight: 600,
                marginTop: 0,
                marginBottom: 12,
              }}
            >
              Activity Timeline
            </h4>
            <p style={{ color: '#6B7299', fontSize: 13, margin: 0 }}>
              No activity yet
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
