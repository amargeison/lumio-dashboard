'use client'

import { useState, useEffect } from 'react'
import { DEMO_STATS, getDemoStat, type DemoStatKey } from '@/lib/demoStats'

export function useDemoStats() {
  const [stats, setStats] = useState<Record<string, any>>(() => {
    const result: Record<string, any> = {}
    for (const key of Object.keys(DEMO_STATS)) {
      result[key] = getDemoStat(key as DemoStatKey)
    }
    return result
  })

  useEffect(() => {
    const handleChange = (e: Event) => {
      const { key, value } = (e as CustomEvent).detail
      setStats(prev => ({ ...prev, [key]: value }))
    }
    const handleReset = () => {
      const result: Record<string, any> = {}
      for (const key of Object.keys(DEMO_STATS)) {
        result[key] = DEMO_STATS[key as DemoStatKey]
      }
      setStats(result)
    }
    window.addEventListener('lumio-stat-changed', handleChange)
    window.addEventListener('lumio-stats-reset', handleReset)
    return () => {
      window.removeEventListener('lumio-stat-changed', handleChange)
      window.removeEventListener('lumio-stats-reset', handleReset)
    }
  }, [])

  return stats as typeof DEMO_STATS
}
