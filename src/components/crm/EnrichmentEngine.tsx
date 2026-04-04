'use client';

import React from 'react';

interface EnrichmentSource {
  icon: string;
  label: string;
  status: 'queued' | 'live' | 'done' | 'warn';
  detail: string;
}

interface EnrichmentEngineProps {
  sources: EnrichmentSource[];
}

const colors = {
  elevated: '#121320',
  border: '#1E2035',
  purple: '#6C3FC5',
  text: '#F1F3FA',
  muted: '#6B7299',
};

export default function EnrichmentEngine({ sources }: EnrichmentEngineProps) {
  const getBorderColor = (status: string) => {
    switch (status) {
      case 'live':
        return colors.purple;
      case 'done':
        return '#10B981';
      case 'warn':
        return '#F59E0B';
      default:
        return colors.border;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <span style={{ color: '#10B981', fontSize: '16px' }}>&#10003;</span>;
      case 'warn':
        return <span style={{ color: '#F59E0B', fontSize: '16px' }}>&#9888;</span>;
      case 'live':
        return (
          <span
            style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              border: `2px solid ${colors.purple}`,
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'enrichSpin 0.8s linear infinite',
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes enrichSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes enrichPulse {
          0%, 100% { box-shadow: 0 0 0px rgba(108, 63, 197, 0); }
          50% { box-shadow: 0 0 10px rgba(108, 63, 197, 0.25); }
        }
      `}} />
      <div className="grid grid-cols-2 gap-3">
        {sources.map((source, i) => (
          <div
            key={i}
            style={{
              backgroundColor: colors.elevated,
              border: `1px solid ${getBorderColor(source.status)}`,
              borderRadius: '8px',
              padding: '16px',
              transition: 'border-color 0.3s, box-shadow 0.3s',
              animation: source.status === 'live' ? 'enrichPulse 1.5s ease-in-out infinite' : 'none',
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '18px' }}>{source.icon}</span>
                <span
                  style={{
                    color: source.status === 'queued' ? colors.muted : colors.text,
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {source.label}
                </span>
              </div>
              {getStatusIcon(source.status)}
            </div>
            <p
              style={{
                color: colors.muted,
                fontSize: '12px',
                margin: 0,
                opacity: source.status === 'queued' ? 0.5 : 1,
              }}
            >
              {source.status === 'done'
                ? 'Complete'
                : source.status === 'warn'
                ? 'Limited data'
                : source.detail}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
