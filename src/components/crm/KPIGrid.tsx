'use client';

import { PoundSterling, Briefcase, TrendingUp, Brain } from 'lucide-react';

interface KPIGridProps {
  pipelineValue: number;
  openDeals: number;
  winRate: number;
  ariaAccuracy: number;
}

const formatCurrency = (value: number) => {
  return '£' + value.toLocaleString('en-GB');
};

export default function KPIGrid({ pipelineValue, openDeals, winRate, ariaAccuracy }: KPIGridProps) {
  const cards = [
    {
      label: 'Pipeline Value',
      value: formatCurrency(pipelineValue),
      delta: '+12% vs last month',
      icon: PoundSterling,
    },
    {
      label: 'Open Deals',
      value: openDeals.toString(),
      delta: '+12% vs last month',
      icon: Briefcase,
    },
    {
      label: 'Win Rate',
      value: `${winRate}%`,
      delta: '+12% vs last month',
      icon: TrendingUp,
    },
    {
      label: 'ARIA Accuracy',
      value: `${ariaAccuracy}%`,
      delta: '+12% vs last month',
      icon: Brain,
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
      }}
      className="max-[768px]:!grid-cols-2"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            style={{
              backgroundColor: '#0F1019',
              border: '1px solid #1E2035',
              borderRadius: 12,
              padding: 20,
              position: 'relative',
              borderTop: '2px solid transparent',
              borderImage: 'linear-gradient(135deg, #8B5CF6, #22D3EE) 1',
              borderImageSlice: 1,
              borderImageWidth: '2px 0 0 0',
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span style={{ color: '#6B7299', fontSize: 12, fontWeight: 500 }}>
                  {card.label}
                </span>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2,
                  }}
                >
                  {card.value}
                </span>
                <span style={{ color: '#10B981', fontSize: 12, marginTop: 4 }}>
                  {card.delta}
                </span>
              </div>
              <Icon size={18} style={{ color: '#6B7299' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
