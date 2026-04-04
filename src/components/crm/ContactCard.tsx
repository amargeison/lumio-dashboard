'use client'

import React from 'react'
import type { CRMContact } from '@/lib/crm/types'
import { ARIAScoreRing } from './DealCard'

interface ContactCardProps {
  contact: CRMContact
  onClick: () => void
}

const tagStyles: Record<string, { bg: string; color: string; border?: string }> = {
  'Hot Lead': { bg: '#EF444420', color: '#EF4444', border: '#EF444440' },
  Warm: { bg: '#F59E0B20', color: '#F59E0B' },
  Cold: { bg: '#6B729920', color: '#6B7299' },
  Enterprise: { bg: '#8B5CF620', color: '#8B5CF6' },
  New: { bg: '#14B8A620', color: '#14B8A6' },
  'Decision Maker': { bg: '#22D3EE20', color: '#22D3EE' },
  Growth: { bg: '#10B98120', color: '#10B981' },
  Technical: { bg: '#EF444420', color: '#EF4444' },
  SMB: { bg: '#F59E0B20', color: '#F59E0B' },
}

function daysAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diff === 0) return 'Today'
  if (diff === 1) return '1 day ago'
  return `${diff} days ago`
}

export default function ContactCard({ contact, onClick }: ContactCardProps) {
  const emailIcon =
    contact.email_status === 'live'
      ? { symbol: '\u2713', color: '#10B981' }
      : contact.email_status === 'warning'
        ? { symbol: '\u26A0', color: '#F59E0B' }
        : contact.email_status === 'bounced'
          ? { symbol: '\u2717', color: '#EF4444' }
          : { symbol: '?', color: '#6B7299' }

  const linkedinIcon =
    contact.linkedin_status === 'found'
      ? { symbol: '\u2713', color: '#10B981' }
      : { symbol: '?', color: '#6B7299' }

  const companyIcon =
    contact.company_status === 'confirmed'
      ? { symbol: '\u2713', color: '#10B981' }
      : contact.company_status === 'warning'
        ? { symbol: '\u26A0', color: '#F59E0B' }
        : { symbol: '?', color: '#6B7299' }

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#0F1019',
        border: '1px solid #1E2035',
        borderRadius: 12,
        padding: 20,
        cursor: 'pointer',
        transition: 'border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = '#6C3FC5'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = '#1E2035'
      }}
    >
      {/* Top row: Avatar, Name, ARIA ring */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: contact.avatar_color || '#6C3FC5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F1F3FA',
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {contact.avatar_initials || contact.name?.slice(0, 2).toUpperCase()}
        </div>

        {/* Name */}
        <span
          style={{
            color: '#F1F3FA',
            fontWeight: 600,
            fontSize: 15,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {contact.name}
        </span>

        {/* ARIA ring */}
        <ARIAScoreRing score={contact.aria_score} size={36} />
      </div>

      {/* Role + Company */}
      <div style={{ fontSize: 13, marginBottom: 10 }}>
        <span style={{ color: '#6B7299' }}>{contact.role || 'No role'}</span>
        {contact.company_name && (
          <>
            <span style={{ color: '#6B7299' }}> at </span>
            <span style={{ color: '#0D9488', fontWeight: 500 }}>
              {contact.company_name}
            </span>
          </>
        )}
      </div>

      {/* Tags */}
      {contact.tags.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 10,
          }}
        >
          {contact.tags.map((tag) => {
            const style = tagStyles[tag] || {
              bg: '#1E2035',
              color: '#6B7299',
            }
            return (
              <span
                key={tag}
                style={{
                  backgroundColor: style.bg,
                  color: style.color,
                  border: style.border
                    ? `1px solid ${style.border}`
                    : '1px solid transparent',
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 9999,
                  fontWeight: 500,
                }}
              >
                {tag}
              </span>
            )
          })}
        </div>
      )}

      {/* Verification row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 12,
          marginBottom: 10,
          color: '#6B7299',
        }}
      >
        <span>
          {'\uD83D\uDCE7'}{' '}
          <span style={{ color: emailIcon.color }}>{emailIcon.symbol}</span>
        </span>
        <span>
          {'\uD83D\uDD17'}{' '}
          <span style={{ color: linkedinIcon.color }}>
            {linkedinIcon.symbol}
          </span>
        </span>
        <span>
          {'\uD83C\uDFE2'}{' '}
          <span style={{ color: companyIcon.color }}>
            {companyIcon.symbol}
          </span>
        </span>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
        }}
      >
        <span style={{ color: '#6B7299' }}>
          Last contacted: {daysAgo(contact.last_contacted_at)}
        </span>
        <span
          style={{
            background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
          }}
        >
          {'\u00A3'}{contact.deal_value.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
