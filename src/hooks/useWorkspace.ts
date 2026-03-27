'use client'

import { useState, useEffect } from 'react'

export interface WorkspaceInfo {
  id: string
  slug: string
  company_name: string
  owner_name: string
  owner_email: string
  demo_data_active: boolean
}

let _cache: WorkspaceInfo | null = null
let _promise: Promise<WorkspaceInfo | null> | null = null

/**
 * Returns the current business workspace info (id, slug, demo_data_active, etc.)
 * by validating the workspace_session_token stored in localStorage.
 * Result is cached so multiple components share a single API call.
 */
export function useWorkspace(): WorkspaceInfo | null {
  const [ws, setWs] = useState<WorkspaceInfo | null>(_cache)

  useEffect(() => {
    if (_cache) {
      setWs(_cache)
      return
    }

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('workspace_session_token')
      : null
    if (!token) return

    if (!_promise) {
      _promise = fetch('/api/workspace/status', {
        headers: { 'x-workspace-token': token },
      })
        .then(r => (r.ok ? r.json() : null))
        .then(d => {
          if (d) _cache = d as WorkspaceInfo
          return _cache
        })
        .catch(() => null)
    }

    _promise.then(d => d && setWs(d))
  }, [])

  return ws
}

/** Invalidate the cached workspace info (e.g. after toggling demo data). */
export function invalidateWorkspaceCache() {
  _cache = null
  _promise = null
}
