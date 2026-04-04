'use client';

import React from 'react';

interface Insight {
  id: string;
  type: 'warning' | 'info' | 'signal' | 'tip';
  title: string;
  description: string;
  action_label: string | null;
  deal_value: number | null;
}

interface PipelineStats {
  winRate: number;
  atRiskValue: number;
  forecast: number;
}

interface ARIAInsightsPanelProps {
  insights: Insight[];
  pipelineStats: PipelineStats;
}

const colors = {
  card: '#0F1019',
  border: '#1E2035',
  text: '#F1F3FA',
  muted: '#6B7299',
  teal: '#0D9488',
};

const gradient = 'linear-gradient(135deg, #8B5CF6, #22D3EE)';

const typeConfig: Record<string, { color: string; emoji: string }> = {
  warning: { color: '#EF4444', emoji: '⚠️' },
  info: { color: '#8B5CF6', emoji: '💡' },
  signal: { color: '#0D9488', emoji: '📡' },
  tip: { color: '#F59E0B', emoji: '💫' },
};

const formatCurrency = (value: number) =>
  '£' + value.toLocaleString('en-GB');

export default function ARIAInsightsPanel({ insights, pipelineStats }: ARIAInsightsPanelProps) {
  const displayInsights = insights.slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      {/* Insight Cards */}
      {displayInsights.map((insight) => {
        const config = typeConfig[insight.type] || typeConfig.info;
        return (
          <div
            key={insight.id}
            style={{
              backgroundColor: colors.card,
              borderLeft: `3px solid ${config.color}`,
              borderRadius: '0 12px 12px 0',
              padding: '16px',
            }}
          >
            <div className="flex items-start gap-3">
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{config.emoji}</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ color: colors.text, fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>
                  {insight.title}
                </h4>
                {(insight.deal_value ?? 0) > 0 && (
                  <span
                    style={{
                      background: gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 700,
                      fontSize: '16px',
                    }}
                  >
                    {formatCurrency(insight.deal_value ?? 0)}
                  </span>
                )}
                <p style={{ color: colors.muted, fontSize: '13px', margin: '6px 0 8px', lineHeight: 1.5 }}>
                  {insight.description}
                </p>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.teal,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {insight.action_label} &rarr;
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Pipeline Pulse */}
      <div
        style={{
          backgroundColor: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <h4
          style={{
            color: colors.text,
            fontSize: '14px',
            fontWeight: 700,
            margin: '0 0 16px',
          }}
        >
          Pipeline Pulse
        </h4>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span style={{ color: colors.muted, fontSize: '13px' }}>Win Rate</span>
            <span style={{ color: '#10B981', fontSize: '18px', fontWeight: 700 }}>
              {pipelineStats.winRate}%
            </span>
          </div>
          <div
            style={{
              height: '1px',
              backgroundColor: colors.border,
            }}
          />
          <div className="flex items-center justify-between">
            <span style={{ color: colors.muted, fontSize: '13px' }}>At Risk</span>
            <span style={{ color: '#EF4444', fontSize: '18px', fontWeight: 700 }}>
              {formatCurrency(pipelineStats.atRiskValue)}
            </span>
          </div>
          <div
            style={{
              height: '1px',
              backgroundColor: colors.border,
            }}
          />
          <div className="flex items-center justify-between">
            <span style={{ color: colors.muted, fontSize: '13px' }}>Q1 Forecast</span>
            <span
              style={{
                background: gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              {formatCurrency(pipelineStats.forecast)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
