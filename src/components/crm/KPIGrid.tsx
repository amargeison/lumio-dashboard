'use client';

import { PoundSterling, Briefcase, TrendingUp, Brain, BarChart3, DollarSign } from 'lucide-react';

interface KPIGridProps {
  pipelineValue: number;
  openDeals: number;
  winRate: number;
  ariaAccuracy: number;
  avgDealSize?: number;
  revenueThisMonth?: number;
}

const formatCurrency = (value: number) => {
  return '£' + value.toLocaleString('en-GB');
};

export default function KPIGrid({ pipelineValue, openDeals, winRate, ariaAccuracy, avgDealSize, revenueThisMonth }: KPIGridProps) {
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
      label: 'Win Rate 30d',
      value: `${winRate}%`,
      delta: '+4% vs last month',
      icon: TrendingUp,
    },
    ...(avgDealSize != null ? [{
      label: 'Avg Deal Size',
      value: formatCurrency(avgDealSize),
      delta: '+8% vs last month',
      icon: BarChart3,
    }] : []),
    ...(revenueThisMonth != null ? [{
      label: 'Revenue This Month',
      value: formatCurrency(revenueThisMonth),
      delta: '+15% vs last month',
      icon: DollarSign,
    }] : []),
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
        gridTemplateColumns: `repeat(${cards.length}, 1fr)`,
        gap: 12,
      }}
      className="max-[1024px]:!grid-cols-3 max-[768px]:!grid-cols-2"
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
