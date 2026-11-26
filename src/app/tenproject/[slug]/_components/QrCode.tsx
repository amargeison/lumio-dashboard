'use client'

// A QR code drawn in the browser (no outside service sees what it encodes).
import React, { useEffect, useState } from 'react'

export default function QrCode({ value, size = 160, label }: { value: string; size?: number; label?: string }) {
  const [svg, setSvg] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    import('qrcode').then(m => m.default.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })).then(s => { if (live) setSvg(s) }).catch(() => { if (live) setSvg(null) })
    return () => { live = false }
  }, [value])
  return <div role="img" aria-label={label ?? 'QR code'} style={{ width: size, height: size, background: '#fff' }} dangerouslySetInnerHTML={svg ? { __html: svg.replace('<svg ', `<svg width="${size}" height="${size}" `) } : undefined} />
}
