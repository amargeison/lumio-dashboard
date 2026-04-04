'use client'

import React from 'react'
import type { CRMDeal } from '@/lib/crm/types'

interface DealCardProps {
  deal: CRMDeal
  isDragging?: boolean
}

function ARIAScoreRing({
  score,
  size = 32,
}: {
  score: number
  size?: number
}) {
  const radius = (size - 4) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color =
    score >= 80 ? '#10B981' : score >= 60 ? '#8B5CF6' : '#EF4444'

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#1E2035"
        strokeWidth={2.5}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray={`${progress} ${circumference - progress}`}
        strokeDashoffset={circumference / 4}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.4s ease' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={size * 0.32}
        fontWeight={600}
      >
        {score}
      </text>
    </svg>
  )
}

export { ARIAScoreRing }

export default function DealCard({ deal, isDragging }: DealCardProps) {
  const borderStyle = isDragging
    ? '2px solid transparent'
    : '1px solid #1E2035'

  return (
    <div
      style={{
        backgroundColor: '#0F1019',
        border: borderStyle,
        borderRadius: 8,
        padding: 16,
        cursor: 'grab',
        position: 'relative',
        ...(isDragging
          ? {
              backgroundImage:
                'linear-gradient(#0F1019, #0F1019), linear-gradient(135deg, #8B5CF6, #22D3EE)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
            }
          : {}),
      }}
    >
      {/* Top row: Title + ARIA ring */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            color: '#F1F3FA',
            fontWeight: 600,
            fontSize: 14,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {deal.title}
        </span>
        <ARIAScoreRing score={deal.aria_score} size={32} />
      </div>

      {/* Contact name */}
      {deal.contact_name && (
        <div
          style={{
            color: '#6B7299',
            fontSize: 12,
            marginBottom: 8,
          }}
        >
          {deal.contact_name}
        </div>
      )}

      {/* Deal value */}
      <div
        style={{
          background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 700,
          fontSize: 16,
          marginBottom: 8,
        }}
      >
        {'\u00A3'}{deal.value.toLocaleString()}
      </div>

      {/* Bottom badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* Days in stage pill */}
        <span
          style={{
            backgroundColor: '#1E2035',
            color: '#6B7299',
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 9999,
          }}
        >
          {deal.days_in_stage}d in stage
        </span>

        {/* Stale warning */}
        {deal.days_in_stage > 25 && (
          <span
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#F59E0B',
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 9999,
              fontWeight: 600,
            }}
          >
            ⚠ Stale
          </span>
        )}

        {/* High close signal */}
        {deal.aria_score >= 90 && (
          <span
            style={{
              backgroundColor: 'rgba(13, 148, 136, 0.15)',
              color: '#14B8A6',
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 9999,
              fontWeight: 600,
            }}
          >
            ⚡ High close
          </span>
        )}
      </div>
    </div>
  )
}
