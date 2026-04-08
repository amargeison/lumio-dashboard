import React from 'react'

export default function LumioFCCrest({ size = 48 }: { size?: number }) {
  const primary = 'var(--club-primary, #6C63FF)'
  const secondary = 'var(--club-secondary, #FFFFFF)'
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 100 120"
      role="img"
      aria-label="Lumio FC crest"
    >
      <defs>
        <clipPath id="lfc-shield-clip">
          <path d="M10 10 Q10 4 16 4 L84 4 Q90 4 90 10 L90 60 Q90 92 50 116 Q10 92 10 60 Z" />
        </clipPath>
      </defs>
      <path
        d="M10 10 Q10 4 16 4 L84 4 Q90 4 90 10 L90 60 Q90 92 50 116 Q10 92 10 60 Z"
        style={{ fill: primary, stroke: secondary }}
        strokeWidth="3"
      />
      <path
        d="M10 36 L90 36 L90 44 L10 44 Z"
        style={{ fill: secondary }}
        clipPath="url(#lfc-shield-clip)"
      />
      <text
        x="50"
        y="72"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="26"
        style={{ fill: secondary }}
        letterSpacing="1"
      >
        LFC
      </text>
      <g transform="translate(50 92)">
        <circle r="9" style={{ fill: secondary, stroke: primary }} strokeWidth="1.5" />
        <polygon
          points="0,-5 4.76,-1.55 2.94,4.05 -2.94,4.05 -4.76,-1.55"
          style={{ fill: primary }}
        />
        <line x1="0" y1="-5" x2="0" y2="-9" style={{ stroke: primary }} strokeWidth="1" />
        <line x1="4.76" y1="-1.55" x2="8.55" y2="-2.78" style={{ stroke: primary }} strokeWidth="1" />
        <line x1="2.94" y1="4.05" x2="5.29" y2="7.28" style={{ stroke: primary }} strokeWidth="1" />
        <line x1="-2.94" y1="4.05" x2="-5.29" y2="7.28" style={{ stroke: primary }} strokeWidth="1" />
        <line x1="-4.76" y1="-1.55" x2="-8.55" y2="-2.78" style={{ stroke: primary }} strokeWidth="1" />
      </g>
    </svg>
  )
}
