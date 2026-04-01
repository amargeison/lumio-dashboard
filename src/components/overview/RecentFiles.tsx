'use client'

import { useState, useEffect } from 'react'
import { FolderOpen, FileText, FileSpreadsheet, Image, Film, File, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface FileItem {
  id: string
  name: string
  mime_type?: string
  modified_time?: string
  url?: string
  path?: string
  size?: number
  icon?: string
  source: string
}

interface StorageData {
  provider: string
  connected: boolean
  recent_files: any[]
  shared_files?: any[]
  total_files?: number
  storage_used?: number
}

const STORAGE_PROVIDERS = [
  { key: 'google_drive', label: 'Google Drive', color: '#4285F4', route: '/api/integrations/google/drive', integration: 'google' },
  { key: 'onedrive', label: 'OneDrive', color: '#0078D4', route: '/api/integrations/microsoft/onedrive', integration: 'microsoft' },
  { key: 'dropbox', label: 'Dropbox', color: '#0061FF', route: '/api/integrations/dropbox/snapshot', integration: 'dropbox' },
]

function getFileIcon(mimeType?: string, name?: string) {
  const mt = (mimeType || '').toLowerCase()
  const n = (name || '').toLowerCase()
  if (mt.includes('spreadsheet') || mt.includes('excel') || n.endsWith('.xlsx') || n.endsWith('.csv')) return <FileSpreadsheet size={14} />
  if (mt.includes('image') || n.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return <Image size={14} />
  if (mt.includes('video') || n.match(/\.(mp4|mov|avi|mkv)$/)) return <Film size={14} />
  if (mt.includes('document') || mt.includes('text') || mt.includes('pdf') || n.match(/\.(doc|docx|pdf|txt)$/)) return <FileText size={14} />
  return <File size={14} />
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function RecentFiles() {
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([])
  const [sharedFiles, setSharedFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [connectedProviders, setConnectedProviders] = useState<string[]>([])
  const [showShared, setShowShared] = useState(false)

  useEffect(() => {
    const connected = STORAGE_PROVIDERS.filter(p => typeof window !== 'undefined' && localStorage.getItem(`lumio_integration_${p.integration}`) === 'true')
    setConnectedProviders(connected.map(p => p.key))

    if (!connected.length) { setLoading(false); return }

    const token = localStorage.getItem('workspace_session_token') || ''
    Promise.all(
      connected.map(p =>
        fetch(p.route, { headers: { 'x-workspace-token': token } })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    ).then(results => {
      const allRecent: FileItem[] = []
      const allShared: FileItem[] = []

      for (const res of results) {
        if (!res || !res.connected) continue
        const source = res.provider as string
        const providerMeta = STORAGE_PROVIDERS.find(p => p.key === source)
        const label = providerMeta?.label || source

        if (Array.isArray(res.recent_files)) {
          for (const f of res.recent_files) {
            allRecent.push({ id: f.id, name: f.name, mime_type: f.mime_type, modified_time: f.modified_time, url: f.url || f.path, source: label })
          }
        }
        if (Array.isArray(res.shared_files)) {
          for (const f of res.shared_files) {
            allShared.push({ id: f.id, name: f.name, mime_type: f.mime_type, modified_time: f.modified_time, url: f.url || f.path, source: label })
          }
        }
      }

      // Sort by modified time descending
      allRecent.sort((a, b) => (b.modified_time || '').localeCompare(a.modified_time || ''))
      allShared.sort((a, b) => (b.modified_time || '').localeCompare(a.modified_time || ''))

      setRecentFiles(allRecent.slice(0, 10))
      setSharedFiles(allShared.slice(0, 10))
      setLoading(false)
    })
  }, [])

  if (!connectedProviders.length) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2 mb-3">
          <FolderOpen size={16} style={{ color: '#4285F4' }} />
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Recent Files</p>
        </div>
        <p className="text-xs" style={{ color: '#6B7280' }}>Connect Google Drive, OneDrive or Dropbox in Settings to see your recent files.</p>
      </div>
    )
  }

  const activeSources = STORAGE_PROVIDERS.filter(p => connectedProviders.includes(p.key))

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2">
          <FolderOpen size={16} style={{ color: '#4285F4' }} />
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Recent Files</p>
        </div>
        <div className="flex items-center gap-1.5">
          {activeSources.map(s => (
            <span key={s.key} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${s.color}20`, color: s.color, border: `1px solid ${s.color}40` }}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-4 space-y-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse rounded-lg" style={{ backgroundColor: '#1F2937', height: 40 }} />)}
        </div>
      ) : (
        <div className="p-4">
          {recentFiles.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: '#6B7280' }}>No recent files found.</p>
          ) : (
            <div className="space-y-1">
              {recentFiles.map(file => (
                <a
                  key={`${file.source}-${file.id}`}
                  href={file.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                  style={{ textDecoration: 'none', backgroundColor: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1F2937')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ color: '#6B7280' }}>{getFileIcon(file.mime_type, file.name)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: '#F9FAFB' }}>{file.name}</p>
                    <p className="text-[10px]" style={{ color: '#6B7280' }}>{timeAgo(file.modified_time)}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: '#1F293780', color: '#9CA3AF', border: '1px solid #374151' }}>
                    {file.source}
                  </span>
                </a>
              ))}
            </div>
          )}

          {sharedFiles.length > 0 && (
            <div className="mt-3" style={{ borderTop: '1px solid #1F2937', paddingTop: 12 }}>
              <button
                onClick={() => setShowShared(!showShared)}
                className="flex items-center gap-1.5 text-xs font-semibold w-full text-left px-1 py-1"
                style={{ color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showShared ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                Shared with me ({sharedFiles.length})
              </button>
              {showShared && (
                <div className="space-y-1 mt-1">
                  {sharedFiles.map(file => (
                    <a
                      key={`shared-${file.source}-${file.id}`}
                      href={file.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                      style={{ textDecoration: 'none', backgroundColor: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1F2937')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ color: '#6B7280' }}>{getFileIcon(file.mime_type, file.name)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: '#F9FAFB' }}>{file.name}</p>
                        <p className="text-[10px]" style={{ color: '#6B7280' }}>{timeAgo(file.modified_time)}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: '#1F293780', color: '#9CA3AF', border: '1px solid #374151' }}>
                        {file.source}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(66,133,244,0.12)', color: '#4285F4', border: '1px solid rgba(66,133,244,0.25)', textDecoration: 'none' }}>
              All Files <ArrowRight size={10} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
