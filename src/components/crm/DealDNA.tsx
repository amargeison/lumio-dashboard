'use client'

import React from 'react'
import type { CRMDeal } from '@/lib/crm/types'

interface DealDNAProps {
  deal: CRMDeal | null
}

interface Signal {
  label: string
  key: 'engagement_score' | 'stakeholder_score' | 'momentum_score' | 'risk_score'
  color: string
  tooltip: string
}

const signals: Signal[] = [
  {
    label: 'Engagement Score',
    key: 'engagement_score',
    color: '#8B5CF6',
    tooltip:
      'Measures email opens, replies, meeting attendance and overall responsiveness from the prospect.',
  },
  {
    label: 'Stakeholder Coverage',
    key: 'stakeholder_score',
    color: '#0D9488',
    tooltip:
      'Tracks how many decision-makers and influencers are engaged in the deal thread.',
  },
  {
    label: 'Deal Momentum',
    key: 'momentum_score',
    color: '#22D3EE',
    tooltip:
      'Indicates how quickly the deal is progressing through pipeline stages relative to average.',
  },
  {
    label: 'Risk Index',
    key: 'risk_score',
    color: '#EF4444',
    tooltip:
      'Flags potential blockers like stalled conversations, competitor mentions and budget concerns.',
  },
]

function SignalBar({
  label,
  value,
  color,
  tooltip,
}: {
  label: string
  value: number
  color: string
  tooltip: string
}) {
  return (
    <div style={{ flex: 1, minWidth: 200 }} title={tooltip}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span style={{ color: '#F1F3FA', fontSize: 13, fontWeight: 500 }}>
          {label}
        </span>
        <span style={{ color, fontSize: 13, fontWeight: 700 }}>
          {value}
          <span style={{ color: '#6B7299', fontWeight: 400 }}>/100</span>
        </span>
      </div>
      <div
        style={{
          backgroundColor: '#1E2035',
          borderRadius: 9999,
          height: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: 9999,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
      <div
        style={{
          color: '#6B7299',
          fontSize: 11,
          marginTop: 4,
          fontStyle: 'italic',
        }}
      >
        {tooltip}
      </div>
    </div>
  )
}

export default function DealDNA({ deal }: DealDNAProps) {
  return (
    <div
      style={{
        backgroundColor: '#0F1019',
        border: '1px solid #1E2035',
        borderRadius: 12,
        padding: 24,
      }}
    >
      <h3
        style={{
          background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 700,
          fontSize: 18,
          marginBottom: 20,
          marginTop: 0,
        }}
      >
        Deal DNA
      </h3>

      {!deal ? (
        <p style={{ color: '#6B7299', fontSize: 14, margin: 0 }}>
          Select a deal to view its DNA analysis
        </p>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          {signals.map((s) => (
            <SignalBar
              key={s.key}
              label={s.label}
              value={deal[s.key]}
              color={s.color}
              tooltip={s.tooltip}
            />
          ))}
        </div>
      )}
    </div>
  )
}
