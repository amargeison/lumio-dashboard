'use client';

import React from 'react';

interface ReportsGridProps {
  stats: {
    winRate: number;
    forecast: number;
    velocity: number;
    savedValue: number;
  };
}

const colors = {
  card: '#0F1019',
  border: '#1E2035',
  text: '#F1F3FA',
  muted: '#6B7299',
};

const gradient = 'linear-gradient(135deg, #8B5CF6, #22D3EE)';

const formatCurrency = (value: number) =>
  '£' + value.toLocaleString('en-GB');

export default function ReportsGrid({ stats }: ReportsGridProps) {
  const cards = [
    {
      label: 'Win/Loss Rate',
      value: `${stats.winRate}%`,
      delta: '+8% vs Q4',
      deltaColor: '#10B981',
      sub: null,
    },
    {
      label: 'Q1 Revenue Forecast',
      value: formatCurrency(stats.forecast),
      delta: null,
      deltaColor: null,
      sub: 'ARIA predicted',
    },
    {
      label: 'Pipeline Velocity',
      value: `${stats.velocity} days`,
      delta: null,
      deltaColor: null,
      sub: 'avg deal cycle',
    },
    {
      label: 'Deals Saved by ARIA',
      value: String(stats.savedValue),
      delta: null,
      deltaColor: null,
      sub: 'ghost deals re-engaged',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <p style={{ color: colors.muted, fontSize: '13px', margin: '0 0 12px', fontWeight: 500 }}>
            {card.label}
          </p>
          <p
            style={{
              background: gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '32px',
              fontWeight: 800,
              margin: '0 0 8px',
              lineHeight: 1.1,
            }}
          >
            {card.value}
          </p>
          {card.delta && (
            <span
              style={{
                color: card.deltaColor || colors.muted,
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {card.delta}
            </span>
          )}
          {card.sub && (
            <span style={{ color: colors.muted, fontSize: '13px' }}>{card.sub}</span>
          )}
        </div>
      ))}
    </div>
  );
}
