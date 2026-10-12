'use client'

// Sport Network reference content for the tab: starts on the verified
// baseline (so it renders instantly and offline), then swaps in the stored
// copy from /api/impact/sport-network if that's newer. update() asks the
// server to re-check gov.uk / DfE / YST and refreshes the panel.

import { useCallback, useEffect, useState } from 'react'
import { SPORT_NETWORK_BASELINE, type SportNetworkContent } from '@/data/impact/sport-network'

export function useSportNetwork() {
  const [content, setContent] = useState<SportNetworkContent>(SPORT_NETWORK_BASELINE)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/impact/sport-network')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled && d?.content) setContent(d.content) })
      .catch(() => { /* keep the baseline */ })
    return () => { cancelled = true }
  }, [])

  const update = useCallback(async () => {
    setUpdating(true); setMessage(null)
    try {
      const res = await fetch('/api/impact/sport-network', { method: 'POST' })
      const d = await res.json().catch(() => null)
      if (d?.content) setContent(d.content)
      if (!res.ok) setMessage(d?.error ?? 'Update failed — showing the last verified content.')
      else setMessage(d?.refreshed ? 'Updated from GOV.UK / DfE / Youth Sport Trust.' : (d?.note ?? 'Already up to date.'))
    } catch {
      setMessage('Update failed — showing the last verified content.')
    } finally {
      setUpdating(false)
    }
  }, [])

  return { content, updating, message, update }
}
