'use client';

import React from 'react';

const colors = {
  card: '#0F1019',
  elevated: '#121320',
  border: '#1E2035',
  text: '#F1F3FA',
  muted: '#6B7299',
  purple: '#6C3FC5',
  purpleLight: '#8B5CF6',
  teal: '#0D9488',
  tealBright: '#22D3EE',
};

const gradient = 'linear-gradient(135deg, #8B5CF6, #22D3EE)';

interface Competitor {
  name: string;
  score: number;
  price: string;
  isLumio?: boolean;
}

const competitors: Competitor[] = [
  { name: 'Salesforce', score: 4, price: '£200+/u/mo' },
  { name: 'HubSpot', score: 5, price: '£90+/u/mo' },
  { name: 'Pipedrive', score: 6, price: '£14-79/u/mo' },
  { name: 'Zoho CRM', score: 5, price: '£12-45/u/mo' },
  { name: 'Lumio CRM', score: 10, price: '£49/u/mo', isLumio: true },
];

const featureTiles = [
  { emoji: '⚡', title: 'ARIA Intelligence', desc: 'AI that thinks like your best sales rep' },
  { emoji: '🔍', title: 'Auto-Enrichment', desc: 'Name + email → full 360° profile in 6 seconds' },
  { emoji: '📡', title: 'Buying Signal Radar', desc: 'Know when prospects are ready before they tell you' },
  { emoji: '⚠', title: 'Ghost Deal Detection', desc: '£381k saved this year' },
  { emoji: '🤖', title: 'Zero Data Entry', desc: 'CRM that fills itself' },
  { emoji: '🚀', title: 'Live in 48 Hours', desc: 'From signup to pipeline in one session' },
];

function ScoreBar({ score, isLumio }: { score: number; isLumio?: boolean }) {
  const pct = score * 10;
  return (
    <div
      style={{
        width: '100%',
        height: '6px',
        backgroundColor: colors.border,
        borderRadius: '3px',
        overflow: 'hidden',
        marginTop: '8px',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: '3px',
          background: isLumio ? gradient : colors.muted,
          transition: 'width 0.6s ease',
        }}
      />
    </div>
  );
}

export default function CompetitorScorecard() {
  return (
    <div>
      {/* Competitor Cards */}
      <div className="grid grid-cols-5 gap-4" style={{ marginBottom: '40px' }}>
        {competitors.map((comp) => {
          const cardInner = (
            <div
              style={{
                backgroundColor: colors.card,
                border: comp.isLumio ? 'none' : `1px solid ${colors.border}`,
                borderRadius: comp.isLumio ? '11px' : '12px',
                padding: '24px',
                height: '100%',
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
                <h3 style={{ color: colors.text, fontSize: '15px', fontWeight: 700, margin: 0 }}>
                  {comp.name}
                </h3>
                {comp.isLumio && (
                  <span
                    style={{
                      background: gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    &#10003; Gold Standard
                  </span>
                )}
              </div>
              <p style={{ color: colors.muted, fontSize: '13px', margin: '4px 0 16px' }}>
                {comp.price}
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  style={{
                    fontSize: '36px',
                    fontWeight: 800,
                    lineHeight: 1,
                    ...(comp.isLumio
                      ? {
                          background: gradient,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }
                      : { color: colors.text }),
                  }}
                >
                  {comp.score}
                </span>
                <span style={{ color: colors.muted, fontSize: '16px', fontWeight: 600 }}>/10</span>
              </div>
              <ScoreBar score={comp.score} isLumio={comp.isLumio} />
            </div>
          );

          if (comp.isLumio) {
            return (
              <div
                key={comp.name}
                style={{
                  background: gradient,
                  borderRadius: '12px',
                  padding: '1px',
                }}
              >
                {cardInner}
              </div>
            );
          }

          return (
            <div key={comp.name}>
              {cardInner}
            </div>
          );
        })}
      </div>

      {/* Why Lumio Section */}
      <h3
        style={{
          color: colors.text,
          fontSize: '20px',
          fontWeight: 700,
          marginBottom: '20px',
          textAlign: 'center',
        }}
      >
        Why Lumio Leaves Everyone in the Dust
      </h3>

      <div className="grid grid-cols-3 gap-4">
        {featureTiles.map((tile, i) => (
          <div
            key={i}
            style={{
              backgroundColor: colors.elevated,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '10px' }}>
              {tile.emoji}
            </span>
            <h4 style={{ color: colors.text, fontSize: '14px', fontWeight: 700, margin: '0 0 6px' }}>
              {tile.title}
            </h4>
            <p style={{ color: colors.muted, fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
              {tile.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
