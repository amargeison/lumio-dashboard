'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from './useWorkspace'

/**
 * Returns the workspace ID for CRM pages.
 * Tries useWorkspace first, falls back to direct API call with session token.
 */
export function useCRMWorkspaceId(): string | null {
  const ws = useWorkspace()
  const [fallbackId, setFallbackId] = useState<string | null>(null)

  useEffect(() => {
    if (ws?.id || fallbackId) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('workspace_session_token') : null
    if (!token) return

    fetch('/api/workspace/status', { headers: { 'x-workspace-token': token } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.id) setFallbackId(d.id) })
      .catch(() => {})
  }, [ws?.id, fallbackId])

  return ws?.id || fallbackId
}
