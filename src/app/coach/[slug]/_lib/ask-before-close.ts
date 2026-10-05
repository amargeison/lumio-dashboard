'use client'

// Tapping the dark area beside a pop-up form closes it. On a phone that area is
// a 16px strip next to where the thumb scrolls, so a form somebody had half
// filled in closed by accident and everything typed was gone.
//
// A form that has not been touched still closes at once. One that has been
// changed asks first. The Cancel button and the ✕ are deliberate, so they do
// not go through here.
//
//   const closeOutside = useAskBeforeClose(JSON.stringify([name, email, …]), onClose)
//   <div onClick={e => { if (e.target === e.currentTarget) closeOutside() }}>
//
// `snapshot` is every value the form holds, as one string. It is compared with
// what it was when the form opened.

import { useRef } from 'react'

export function useAskBeforeClose(snapshot: string, onClose: () => void): () => void {
  const opened = useRef(snapshot)
  return () => {
    if (opened.current === snapshot || window.confirm('Close without saving? What you have typed will be lost.')) onClose()
  }
}
