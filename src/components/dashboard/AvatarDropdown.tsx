'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Props {
  initials: string
  onConvert?: () => void
}

export default function AvatarDropdown({ initials, onConvert }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [showGoLive, setShowGoLive] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    setName(localStorage.getItem('lumio_company_name') || '')
    setEmail(localStorage.getItem('lumio_user_email') || '')
    setShowGoLive(localStorage.getItem('lumio_demo_active') === 'true')
    // Load avatar — instant from localStorage cache
    const cached = localStorage.getItem('lumio_user_photo')
    if (cached && !cached.startsWith('data:')) setAvatarUrl(cached)
    const userEmail = localStorage.getItem('lumio_user_email')
    if (userEmail) {
      const staffPhoto = localStorage.getItem(`lumio_staff_photo_${userEmail}`)
      if (staffPhoto && !staffPhoto.startsWith('data:')) setAvatarUrl(staffPhoto)
    }
    // Always fetch from Supabase in background to confirm/update avatar
    const wsToken = localStorage.getItem('workspace_session_token')
    if (wsToken) {
      fetch('/api/workspace/status', { headers: { 'x-workspace-token': wsToken } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.user_avatar_url) {
            setAvatarUrl(data.user_avatar_url)
            localStorage.setItem('lumio_user_photo', data.user_avatar_url)
            if (data.owner_email) localStorage.setItem(`lumio_staff_photo_${data.owner_email}`, data.user_avatar_url)
          }
        })
        .catch(() => {})
    }
    // Listen for avatar updates
    function onAvatarUpdated(e: Event) {
      const url = (e as CustomEvent).detail
      if (url) setAvatarUrl(url)
      else setAvatarUrl(null)
    }
    window.addEventListener('lumio-avatar-updated', onAvatarUpdated)
    return () => window.removeEventListener('lumio-avatar-updated', onAvatarUpdated)
  }, [])

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function handleLogout() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('lumio_') || k.startsWith('demo_'))
      .forEach(k => localStorage.removeItem(k))
    router.push('/')
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) return
    const blobUrl = URL.createObjectURL(file)
    setAvatarUrl(blobUrl)
    const token = localStorage.getItem('workspace_session_token')
    const userEmail = localStorage.getItem('lumio_user_email')
    if (!token || !userEmail) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('email', userEmail)
    try {
      const res = await fetch('/api/workspace/upload-profile-photo', { method: 'POST', headers: { 'x-workspace-token': token }, body: fd })
      const data = await res.json()
      if (data.url) {
        setAvatarUrl(data.url)
        localStorage.setItem('lumio_user_photo', data.url)
        localStorage.setItem(`lumio_staff_photo_${userEmail}`, data.url)
        window.dispatchEvent(new CustomEvent('lumio-avatar-updated', { detail: data.url }))
      }
      URL.revokeObjectURL(blobUrl)
    } catch {
      setAvatarUrl(null)
      URL.revokeObjectURL(blobUrl)
    }
  }

  async function handleRemovePhoto() {
    const userEmail = localStorage.getItem('lumio_user_email')
    if (userEmail) {
      localStorage.removeItem(`lumio_staff_photo_${userEmail}`)
    }
    localStorage.removeItem('lumio_user_photo')
    setAvatarUrl(null)
    window.dispatchEvent(new CustomEvent('lumio-avatar-updated', { detail: null }))
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative z-[9999]">
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload} />
      <button
        onClick={() => setOpen(v => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-opacity hover:opacity-80 overflow-hidden"
        style={{ backgroundColor: avatarUrl ? 'transparent' : '#0D9488', color: '#F9FAFB', padding: 0 }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} onError={() => setAvatarUrl(null)} />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 z-[9999] w-52 rounded-xl py-1 shadow-xl"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>

          {/* User info with larger avatar */}
          <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold shrink-0 overflow-hidden"
              style={{ backgroundColor: avatarUrl ? 'transparent' : '#0D9488', color: '#F9FAFB' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} onError={() => setAvatarUrl(null)} />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              {name  && <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{name}</p>}
              {email && <p className="text-xs truncate" style={{ color: '#6B7280' }}>{email}</p>}
            </div>
          </div>

          {/* Nav items */}
          <div className="py-1">
            <button
              onClick={() => { fileRef.current?.click(); setOpen(false) }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm"
              style={{ color: '#9CA3AF' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(13,148,136,0.08)'; e.currentTarget.style.color = '#F9FAFB' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#9CA3AF' }}>
              <span>📷</span>
              <span>{avatarUrl ? 'Change photo' : 'Upload photo'}</span>
            </button>
            {avatarUrl && (
              <button
                onClick={handleRemovePhoto}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm"
                style={{ color: '#9CA3AF' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#EF4444' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#9CA3AF' }}>
                <span>🗑️</span>
                <span>Remove photo</span>
              </button>
            )}
            {[
              { emoji: '👤', label: 'Profile & Settings',        href: '/settings' },
              { emoji: '🔔', label: 'Notification preferences',  href: '/settings#notifications' },
              { emoji: '❓', label: 'Help & Support',            href: '/about' },
            ].map(item => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm"
                style={{ color: '#9CA3AF' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(13,148,136,0.08)'; e.currentTarget.style.color = '#F9FAFB' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#9CA3AF' }}>
                <span>{item.emoji}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            ))}

            {showGoLive && onConvert && (
              <button
                onClick={() => { setOpen(false); onConvert() }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm"
                style={{ color: '#0D9488' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(13,148,136,0.08)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '' }}>
                <span>🚀</span>
                <span>Go Live</span>
              </button>
            )}
          </div>

          <div className="mx-3 h-px" style={{ backgroundColor: '#1F2937' }} />

          {/* Log out */}
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm"
              style={{ color: '#9CA3AF' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#EF4444' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = ''; (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF' }}>
              <span>🚪</span>
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
