export function loadDemoData(pageKey = 'overview') {
  if (typeof window === 'undefined') return
  localStorage.setItem(`lumio_dashboard_${pageKey}_hasData`, 'true')
  window.location.reload()
}

// Attach to window for browser console access during development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as unknown as Record<string, unknown>).loadDemoData = loadDemoData
}
