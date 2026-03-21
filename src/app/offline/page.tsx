'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>
      <div className="mb-8" style={{ fontSize: 64 }}>📡</div>
      <h1 className="text-3xl font-bold mb-3">You're offline</h1>
      <p className="text-base mb-8" style={{ color: '#6B7280', maxWidth: 360 }}>
        It looks like you've lost your connection. Check your network and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-lg text-sm font-semibold"
        style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
        Reconnect
      </button>
    </div>
  )
}
