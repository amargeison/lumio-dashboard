import React from 'react'

interface Props {
  clubName: string
  clubCrest?: React.ReactNode
  reportTitle: string
  reportSubtitle?: string
  generatedAt?: string
  reportId?: string
  primaryColour?: string
  isDemo?: boolean
}

export default function PDFHeader({
  clubName,
  clubCrest,
  reportTitle,
  reportSubtitle,
  generatedAt,
  reportId,
  primaryColour = '#6C63FF',
  isDemo = false,
}: Props) {
  const when = generatedAt ?? new Date().toLocaleString('en-GB')
  return (
    <div className="pdf-header" style={{ borderBottomColor: primaryColour }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4mm' }}>
        {clubCrest && <div style={{ width: 40, height: 40 }}>{clubCrest}</div>}
        <div>
          <h1 className="pdf-club-name">{clubName}</h1>
          <p className="pdf-report-title" style={{ color: primaryColour }}>{reportTitle}</p>
          {reportSubtitle && <p className="pdf-report-subtitle">{reportSubtitle}</p>}
        </div>
      </div>
      <div>
        <p className="pdf-lumio-mark" style={{ color: primaryColour }}>Powered by Lumio</p>
        <p className="pdf-generated-at">Generated: {when}</p>
        {reportId && <p className="pdf-generated-at">Report ID: {reportId}</p>}
        {isDemo && (
          <p className="pdf-footer" style={{ color: '#ef4444', fontWeight: 600, marginTop: 4 }}>
            Demo Data — Not for Distribution
          </p>
        )}
      </div>
    </div>
  )
}
