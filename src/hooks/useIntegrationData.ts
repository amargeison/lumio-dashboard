'use client'

import { useState, useEffect, useCallback } from 'react'

export interface IntegrationSnapshot {
  provider: string
  connected: boolean
  data: Record<string, any>
  error?: string
  lastSynced?: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCacheKey(provider: string) { return `lumio_snapshot_${provider}` }

function getCached(provider: string): IntegrationSnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(getCacheKey(provider))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - (parsed.lastSynced || 0) > CACHE_TTL) return null
    return parsed
  } catch { return null }
}

function setCache(provider: string, data: IntegrationSnapshot) {
  if (typeof window === 'undefined') return
  localStorage.setItem(getCacheKey(provider), JSON.stringify(data))
}

export function isIntegrationConnected(key: string): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(`lumio_integration_${key}`) === 'true'
}

export function getConnectedProviders(keys: string[]): string[] {
  return keys.filter(k => isIntegrationConnected(k))
}

export function useIntegrationSnapshot(provider: string, route: string) {
  const [snapshot, setSnapshot] = useState<IntegrationSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (force = false) => {
    if (!isIntegrationConnected(provider)) {
      setSnapshot({ provider, connected: false, data: {} })
      setLoading(false)
      return
    }

    if (!force) {
      const cached = getCached(provider)
      if (cached) { setSnapshot(cached); setLoading(false); return }
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('workspace_session_token') || ''
      const res = await fetch(route, { headers: { 'x-workspace-token': token } })
      if (res.status === 401) {
        setSnapshot({ provider, connected: true, data: {}, error: 'token_expired' })
      } else if (res.ok) {
        const data = await res.json()
        const snap: IntegrationSnapshot = { provider, connected: true, data, lastSynced: Date.now() }
        setSnapshot(snap)
        setCache(provider, snap)
      } else {
        setSnapshot({ provider, connected: true, data: {}, error: 'fetch_failed' })
      }
    } catch {
      setSnapshot({ provider, connected: true, data: {}, error: 'network_error' })
    } finally {
      setLoading(false)
    }
  }, [provider, route])

  useEffect(() => { fetchData() }, [fetchData])

  return { snapshot, loading, refresh: () => fetchData(true) }
}

export function useMultiIntegrationSnapshot(providers: { key: string; route: string }[]) {
  const [snapshots, setSnapshots] = useState<IntegrationSnapshot[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async (force = false) => {
    const connected = providers.filter(p => isIntegrationConnected(p.key))
    if (!connected.length) {
      setSnapshots([])
      setLoading(false)
      return
    }

    setLoading(true)
    const token = localStorage.getItem('workspace_session_token') || ''
    const results = await Promise.all(
      connected.map(async p => {
        if (!force) { const cached = getCached(p.key); if (cached) return cached }
        try {
          const res = await fetch(p.route, { headers: { 'x-workspace-token': token } })
          if (res.ok) {
            const data = await res.json()
            const snap: IntegrationSnapshot = { provider: p.key, connected: true, data, lastSynced: Date.now() }
            setCache(p.key, snap)
            return snap
          }
          return { provider: p.key, connected: true, data: {}, error: res.status === 401 ? 'token_expired' : 'fetch_failed' }
        } catch {
          return { provider: p.key, connected: true, data: {}, error: 'network_error' }
        }
      })
    )
    setSnapshots(results)
    setLoading(false)
  }, [providers])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { snapshots, loading, refresh: () => fetchAll(true), connectedCount: providers.filter(p => isIntegrationConnected(p.key)).length }
}
