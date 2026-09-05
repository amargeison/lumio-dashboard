'use client'

import { useState } from 'react'
import { X, ExternalLink, Download, FolderOpen, Play, FileText, Search } from 'lucide-react'
import {
  NELI_INTERVENTION_RESOURCES, WHOLE_CLASS_RESOURCES, TELTED_FILE_COUNT, TELTED_FOLDERS,
  portalDoc, portalFolder, portalDownload, type ResourceItem, type ResourceFile,
} from '@/data/telted/resources'

const C = { bg: 'var(--tt-card)', border: 'var(--tt-border)', text: 'var(--tt-text)', muted: 'var(--tt-muted)', dim: 'var(--tt-dim)', faint: 'var(--tt-faint)', teal: 'var(--tt-accent)', green: '#15803D' }

function ResourceCard({ r, onOpen }: { r: ResourceItem; onOpen: (r: ResourceItem) => void }) {
  const isAudio = r.files.some(f => f.kind === 'audio')
  return (
    <div className="rounded-xl overflow-hidden transition-all hover:-translate-y-0.5 flex flex-col" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderTop: `3px solid ${r.accent}` }}>
      <div className="p-5 flex-1">
        <div className="text-3xl mb-3 text-center">{r.icon}</div>
        <h4 className="text-sm font-bold mb-1.5" style={{ color: C.text }}>{r.title}</h4>
        <p className="text-xs leading-relaxed mb-3" style={{ color: C.muted }}>{r.desc}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${r.badgeColor}20`, color: r.badgeColor, border: `1px solid ${r.badgeColor}40` }}>{r.badge}</span>
          <span className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--tt-hover)', color: C.dim, border: `1px solid ${C.border}` }}>
            {r.files.length} {isAudio ? (r.files.length === 1 ? 'track' : 'tracks') : (r.files.length === 1 ? 'file' : 'files')}
          </span>
        </div>
      </div>
      <div className="flex" style={{ borderTop: `1px solid ${C.border}` }}>
        <button onClick={() => onOpen(r)} className="flex-1 py-2.5 text-xs font-semibold" style={{ backgroundColor: 'var(--tt-accent-soft)', color: C.teal, border: 'none', cursor: 'pointer' }}>
          {r.actionLabel || 'View Resource'}
        </button>
        <a href={r.files.length === 1 ? portalDoc(r.files[0].code) : portalFolder(r.folder)} target="_blank" rel="noreferrer" title={r.files.length === 1 ? 'Open in viewer' : 'Open folder in resource portal'}
          className="px-3 flex items-center justify-center" style={{ backgroundColor: 'var(--tt-accent-soft)', color: C.teal, borderLeft: `1px solid ${C.border}` }}>
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  )
}

function FileRow({ f }: { f: ResourceFile }) {
  const isAudio = f.kind === 'audio'
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--tt-hover)', border: `1px solid ${C.border}` }}>
      <span style={{ color: isAudio ? '#A78BFA' : C.teal, display: 'flex' }}>{isAudio ? <Play size={14} /> : <FileText size={14} />}</span>
      <span className="text-xs flex-1 truncate" style={{ color: C.text }}>{f.title}</span>
      <a href={portalDoc(f.code)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md" style={{ backgroundColor: C.teal, color: '#fff', textDecoration: 'none' }}>
        {isAudio ? <Play size={11} /> : <ExternalLink size={11} />} {isAudio ? 'Play' : 'Open'}
      </a>
      {!isAudio && (
        <a href={portalDownload(f.code)} target="_blank" rel="noreferrer" title="Download PDF" className="inline-flex items-center justify-center w-7 h-7 rounded-md" style={{ backgroundColor: 'var(--tt-border)', color: C.text }}>
          <Download size={12} />
        </a>
      )}
    </div>
  )
}

function ResourceModal({ r, onClose }: { r: ResourceItem; onClose: () => void }) {
  const [q, setQ] = useState('')
  const files = q ? r.files.filter(f => f.title.toLowerCase().includes(q.toLowerCase())) : r.files
  const groups = Array.from(new Set(files.map(f => f.group).filter(Boolean))) as string[]
  const isAudio = r.files.some(f => f.kind === 'audio')
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div className="rounded-2xl overflow-hidden flex flex-col" style={{ width: 600, maxWidth: '92vw', maxHeight: '88vh', backgroundColor: C.bg, border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
        <div style={{ background: `linear-gradient(135deg, ${C.green}, ${r.accent})`, padding: '18px 22px' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>🐻</div>
              <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>TEL Ted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>OxEd & Assessment</span>
              <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
            </div>
          </div>
          <h3 className="text-lg font-bold" style={{ color: '#fff', fontFamily: 'Georgia,serif' }}>{r.icon} {r.title}</h3>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{r.files.length} {isAudio ? 'audio tracks' : 'documents'} · {isAudio ? 'Streams in the OxEd player' : 'Opens in the OxEd secure viewer · print-ready PDF'}</p>
        </div>

        <div className="px-5 pt-4 pb-2 flex items-center gap-2">
          {r.files.length > 6 && (
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--tt-panel)', border: `1px solid ${C.border}` }}>
              <Search size={13} style={{ color: C.dim }} />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${r.files.length} ${isAudio ? 'tracks' : 'files'}…`} className="flex-1 bg-transparent outline-none text-xs" style={{ color: C.text }} />
            </div>
          )}
          <a href={portalFolder(r.folder)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--tt-border)', color: C.text, textDecoration: 'none', marginLeft: 'auto' }}>
            <FolderOpen size={12} /> Open folder in portal
          </a>
        </div>

        <div className="px-5 pb-5 overflow-y-auto flex flex-col gap-1.5" style={{ minHeight: 120 }}>
          {files.length === 0 && <p className="text-xs py-6 text-center" style={{ color: C.dim }}>No files match “{q}”.</p>}
          {groups.length > 0
            ? groups.map(g => (
                <div key={g} className="mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider mt-2 mb-1.5" style={{ color: C.dim }}>{g}</p>
                  <div className="flex flex-col gap-1.5">{files.filter(f => f.group === g).map(f => <FileRow key={f.code} f={f} />)}</div>
                </div>
              ))
            : files.map(f => <FileRow key={f.code} f={f} />)}
          {groups.length > 0 && files.some(f => !f.group) && (
            <div className="flex flex-col gap-1.5 mt-2">{files.filter(f => !f.group).map(f => <FileRow key={f.code} f={f} />)}</div>
          )}
        </div>

        <div className="px-5 py-3 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.faint }}>
          Licensed content · DRM-protected by OxEd & Assessment · You may be asked to sign in to the resource portal on first open
        </div>
      </div>
    </div>
  )
}

export default function TelTedResourceLibrary() {
  const [open, setOpen] = useState<ResourceItem | null>(null)
  const neliCount = NELI_INTERVENTION_RESOURCES.reduce((n, r) => n + r.files.length, 0)
  const wcCount = WHOLE_CLASS_RESOURCES.reduce((n, r) => n + r.files.length, 0)

  return (
    <div style={{ marginBottom: 28 }}>
      <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xl">📚</span>
            <h2 className="text-lg font-bold" style={{ color: C.text, fontFamily: 'Georgia,serif' }}>TEL Ted Digital Resource Library</h2>
          </div>
          <p className="text-sm" style={{ color: C.muted }}>Official digital resources from OxEd & Assessment · University of Oxford · CPD Certified · {TELTED_FILE_COUNT} files</p>
        </div>
        <a href={portalFolder(TELTED_FOLDERS.program)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg" style={{ backgroundColor: C.teal, color: '#fff', textDecoration: 'none' }}>
          <FolderOpen size={13} /> Open Resource Portal
        </a>
      </div>

      <div className="rounded-xl p-5 mb-5 mt-4" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.teal}` }}>
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span>📁</span>
            <h3 className="text-sm font-bold" style={{ color: C.text }}>TEL Ted: NELI Intervention</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--tt-accent-soft)', color: C.teal }}>{neliCount} files</span>
          </div>
          <a href={portalFolder(TELTED_FOLDERS.neli)} target="_blank" rel="noreferrer" className="text-[11px] font-semibold inline-flex items-center gap-1" style={{ color: C.teal }}>Browse folder <ExternalLink size={11} /></a>
        </div>
        <p className="text-xs mb-4" style={{ color: C.dim }}>Targeted small-group intervention resources for students with language difficulties — 20-week programme, Parts 1 & 2</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {NELI_INTERVENTION_RESOURCES.map(r => <ResourceCard key={r.id} r={r} onOpen={setOpen} />)}
        </div>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.green}` }}>
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span>📁</span>
            <h3 className="text-sm font-bold" style={{ color: C.text }}>TEL Ted: Whole Class</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(21,128,61,0.15)', color: '#4ADE80' }}>{wcCount} files</span>
          </div>
          <a href={portalFolder(TELTED_FOLDERS.wholeClass)} target="_blank" rel="noreferrer" className="text-[11px] font-semibold inline-flex items-center gap-1" style={{ color: C.teal }}>Browse folder <ExternalLink size={11} /></a>
        </div>
        <p className="text-xs mb-4" style={{ color: C.dim }}>Whole-class language enrichment resources for all students — slides, stories, songs, activity sheets and sequence cards</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {WHOLE_CLASS_RESOURCES.map(r => <ResourceCard key={r.id} r={r} onOpen={setOpen} />)}
        </div>
      </div>

      {open && <ResourceModal r={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
