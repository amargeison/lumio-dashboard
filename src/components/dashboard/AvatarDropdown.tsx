'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  initials: string
  onConvert?: () => void
  /** Where to redirect after logout — defaults to '/' */
  logoutRedirect?: string
  /** localStorage keys to clear on logout — defaults to lumio_/demo_ prefixed keys */
  logoutClearKeys?: string[]
  /** Slug for settings navigation */
  settingsHref?: string
  /** Parent-controlled photo override — takes precedence over internal state */
  photoUrl?: string | null
}

export default function AvatarDropdown({ initials, onConvert, logoutRedirect = '/', logoutClearKeys, settingsHref, photoUrl }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [showGoLive, setShowGoLive] = useState(false)
  const [internalAvatarUrl, setAvatarUrl] = useState<string | null>(null)
  const avatarUrl = photoUrl ?? internalAvatarUrl
  const ref = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Sub-panels
  const [showProfile, setShowProfile] = useState(false)
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [showResetPw, setShowResetPw] = useState(false)

  // Profile form state
  const [profileFirst, setProfileFirst] = useState('')
  const [profileLast, setProfileLast] = useState('')
  const [profileTitle, setProfileTitle] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  // Change email state
  const [newEmail, setNewEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailSending, setEmailSending] = useState(false)

  // Reset password state
  const [resetSent, setResetSent] = useState(false)
  const [resetSending, setResetSending] = useState(false)

  useEffect(() => {
    const storedName = localStorage.getItem('lumio_user_name') || localStorage.getItem('workspace_user_name') || localStorage.getItem('lumio_company_name') || ''
    setName(storedName)
    setEmail(localStorage.getItem('lumio_user_email') || '')
    setShowGoLive(localStorage.getItem('lumio_demo_active') === 'true')

    // Populate profile form
    const parts = storedName.split(' ')
    setProfileFirst(parts[0] || '')
    setProfileLast(parts.slice(1).join(' ') || '')
    setProfileTitle(localStorage.getItem('lumio_user_title') || '')
    setProfilePhone(localStorage.getItem('lumio_user_phone') || '')

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
      const detail = (e as CustomEvent).detail
      const url = typeof detail === 'string' ? detail : detail?.url
      if (typeof url === 'string' && url) setAvatarUrl(url)
      else setAvatarUrl(null)
    }
    window.addEventListener('lumio-avatar-updated', onAvatarUpdated)
    return () => window.removeEventListener('lumio-avatar-updated', onAvatarUpdated)
  }, [])

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setShowProfile(false)
        setShowChangeEmail(false)
        setShowResetPw(false)
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setShowProfile(false)
        setShowChangeEmail(false)
        setShowResetPw(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  function handleLogout() {
    if (logoutClearKeys) {
      logoutClearKeys.forEach(k => {
        Object.keys(localStorage).filter(key => key.startsWith(k)).forEach(key => localStorage.removeItem(key))
      })
    } else {
      Object.keys(localStorage)
        .filter(k => k.startsWith('lumio_') || k.startsWith('demo_') || k.startsWith('workspace_'))
        .forEach(k => localStorage.removeItem(k))
    }
    router.push(logoutRedirect)
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

  async function handleSaveProfile() {
    setProfileSaving(true)
    const fullName = `${profileFirst} ${profileLast}`.trim()
    localStorage.setItem('lumio_user_name', fullName)
    localStorage.setItem('workspace_user_name', fullName)
    if (profileTitle) localStorage.setItem('lumio_user_title', profileTitle)
    if (profilePhone) localStorage.setItem('lumio_user_phone', profilePhone)
    setName(fullName)

    const token = localStorage.getItem('workspace_session_token')
    if (token) {
      try {
        await fetch('/api/workspace/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-workspace-token': token },
          body: JSON.stringify({ name: fullName, job_title: profileTitle, phone: profilePhone }),
        })
      } catch { /* best-effort */ }
    }
    setProfileSaving(false)
    setShowProfile(false)
  }

  async function handleChangeEmail() {
    if (!newEmail) return
    setEmailSending(true)
    const token = localStorage.getItem('workspace_session_token')
    if (token) {
      try {
        await fetch('/api/workspace/change-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-workspace-token': token },
          body: JSON.stringify({ email: newEmail }),
        })
      } catch { /* best-effort */ }
    }
    setEmailSending(false)
    setEmailSent(true)
  }

  async function handleResetPassword() {
    setResetSending(true)
    const token = localStorage.getItem('workspace_session_token')
    if (token) {
      try {
        await fetch('/api/workspace/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-workspace-token': token },
          body: JSON.stringify({ email }),
        })
      } catch { /* best-effort */ }
    }
    setResetSending(false)
    setResetSent(true)
  }

  const menuItemStyle = { color: '#9CA3AF' }
  const menuItemHover = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = 'rgba(31,41,55,0.5)'; e.currentTarget.style.color = '#F9FAFB' }
  const menuItemLeave = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#9CA3AF' }

  return (
    <div ref={ref} className="relative z-[100]">
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload} />
      <button
        onClick={() => { setOpen(v => !v); setShowProfile(false); setShowChangeEmail(false); setShowResetPw(false) }}
        className="flex items-center justify-center rounded-full text-xs font-bold transition-opacity hover:opacity-80 overflow-hidden"
        style={{ width: 36, height: 36, backgroundColor: avatarUrl ? 'transparent' : '#6C3FC5', color: '#F9FAFB', padding: 0, border: 'none', cursor: 'pointer' }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} onError={() => setAvatarUrl(null)} />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 rounded-xl shadow-xl"
          style={{ top: '100%', marginTop: 8, minWidth: 220, backgroundColor: '#111318', border: '1px solid #1F2937', zIndex: 100 }}>

          {/* ── Profile Edit Modal ── */}
          {showProfile && (
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Edit Profile</p>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center rounded-full overflow-hidden shrink-0"
                  style={{ width: 48, height: 48, backgroundColor: avatarUrl ? 'transparent' : '#6C3FC5', color: '#F9FAFB', fontSize: 14, fontWeight: 600 }}>
                  {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} /> : initials}
                </div>
                <button onClick={() => fileRef.current?.click()} className="text-xs px-2 py-1 rounded" style={{ color: '#0D9488', border: '1px solid #1F2937' }}>Change photo</button>
              </div>
              <div className="flex gap-2">
                <input value={profileFirst} onChange={e => setProfileFirst(e.target.value)} placeholder="First name" className="flex-1 text-sm rounded-lg px-2.5 py-1.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB' }} />
                <input value={profileLast} onChange={e => setProfileLast(e.target.value)} placeholder="Last name" className="flex-1 text-sm rounded-lg px-2.5 py-1.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB' }} />
              </div>
              <input value={profileTitle} onChange={e => setProfileTitle(e.target.value)} placeholder="Job title" className="w-full text-sm rounded-lg px-2.5 py-1.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB' }} />
              <input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="Phone number" className="w-full text-sm rounded-lg px-2.5 py-1.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB' }} />
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowProfile(false)} className="flex-1 text-xs py-1.5 rounded-lg" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>Cancel</button>
                <button onClick={handleSaveProfile} disabled={profileSaving} className="flex-1 text-xs py-1.5 rounded-lg font-semibold" style={{ backgroundColor: '#0D9488', color: '#fff', border: 'none', opacity: profileSaving ? 0.6 : 1 }}>{profileSaving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          )}

          {/* ── Change Email Panel ── */}
          {showChangeEmail && (
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Change Email</p>
              {emailSent ? (
                <div className="text-xs py-2" style={{ color: '#0D9488' }}>Verification email sent to {newEmail}</div>
              ) : (
                <>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Current: {email}</p>
                  <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="New email address" className="w-full text-sm rounded-lg px-2.5 py-1.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB' }} />
                  <div className="flex gap-2">
                    <button onClick={() => { setShowChangeEmail(false); setNewEmail(''); setEmailSent(false) }} className="flex-1 text-xs py-1.5 rounded-lg" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>Cancel</button>
                    <button onClick={handleChangeEmail} disabled={emailSending || !newEmail} className="flex-1 text-xs py-1.5 rounded-lg font-semibold" style={{ backgroundColor: '#0D9488', color: '#fff', border: 'none', opacity: (emailSending || !newEmail) ? 0.6 : 1 }}>{emailSending ? 'Sending...' : 'Confirm'}</button>
                  </div>
                </>
              )}
              {emailSent && <button onClick={() => { setShowChangeEmail(false); setNewEmail(''); setEmailSent(false) }} className="text-xs w-full py-1.5 rounded-lg" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>Close</button>}
            </div>
          )}

          {/* ── Reset Password Panel ── */}
          {showResetPw && (
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Reset Password</p>
              {resetSent ? (
                <>
                  <div className="text-xs py-2" style={{ color: '#0D9488' }}>Reset email sent to {email}</div>
                  <button onClick={() => { setShowResetPw(false); setResetSent(false) }} className="text-xs w-full py-1.5 rounded-lg" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>Close</button>
                </>
              ) : (
                <>
                  <p className="text-xs" style={{ color: '#6B7280' }}>We'll send a password reset link to {email}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowResetPw(false)} className="flex-1 text-xs py-1.5 rounded-lg" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>Cancel</button>
                    <button onClick={handleResetPassword} disabled={resetSending} className="flex-1 text-xs py-1.5 rounded-lg font-semibold" style={{ backgroundColor: '#0D9488', color: '#fff', border: 'none', opacity: resetSending ? 0.6 : 1 }}>{resetSending ? 'Sending...' : 'Send Reset Email'}</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Main Menu ── */}
          {!showProfile && !showChangeEmail && !showResetPw && (
            <>
              {/* User info header */}
              <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid #1F2937' }}>
                <div className="flex items-center justify-center rounded-full text-xs font-bold shrink-0 overflow-hidden"
                  style={{ width: 48, height: 48, backgroundColor: avatarUrl ? 'transparent' : '#6C3FC5', color: '#F9FAFB' }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} onError={() => setAvatarUrl(null)} />
                  ) : initials}
                </div>
                <div className="min-w-0">
                  {name  && <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{name}</p>}
                  {email && <p className="text-xs truncate" style={{ color: '#6B7280' }}>{email}</p>}
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button onClick={() => setShowProfile(true)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm" style={menuItemStyle} onMouseEnter={menuItemHover} onMouseLeave={menuItemLeave}>
                  <span>👤</span><span>My Profile</span>
                </button>
                <button onClick={() => { fileRef.current?.click() }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm" style={menuItemStyle} onMouseEnter={menuItemHover} onMouseLeave={menuItemLeave}>
                  <span>📷</span><span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
                <button onClick={() => { setShowChangeEmail(true); setEmailSent(false); setNewEmail('') }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm" style={menuItemStyle} onMouseEnter={menuItemHover} onMouseLeave={menuItemLeave}>
                  <span>✉️</span><span>Change Email</span>
                </button>
                <button onClick={() => { setShowResetPw(true); setResetSent(false) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm" style={menuItemStyle} onMouseEnter={menuItemHover} onMouseLeave={menuItemLeave}>
                  <span>🔒</span><span>Reset Password</span>
                </button>
                {settingsHref && (
                  <button onClick={() => { setOpen(false); router.push(settingsHref) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm" style={menuItemStyle} onMouseEnter={menuItemHover} onMouseLeave={menuItemLeave}>
                    <span>⚙️</span><span>Settings</span>
                  </button>
                )}
              </div>

              {showGoLive && onConvert && (
                <>
                  <div className="mx-3 h-px" style={{ backgroundColor: '#1F2937' }} />
                  <div className="py-1">
                    <button onClick={() => { setOpen(false); onConvert() }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm" style={{ color: '#0D9488' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(13,148,136,0.08)' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '' }}>
                      <span>🚀</span><span>Go Live</span>
                    </button>
                  </div>
                </>
              )}

              <div className="mx-3 h-px" style={{ backgroundColor: '#1F2937' }} />

              {/* Log out */}
              <div className="py-1">
                <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm" style={{ color: '#9CA3AF' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#EF4444' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#9CA3AF' }}>
                  <span>🚪</span><span>Log out</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
