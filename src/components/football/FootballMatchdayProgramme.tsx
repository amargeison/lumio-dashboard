'use client'

import React, { useEffect, useState } from 'react'
import {
  Sparkles, BookOpen, Eye, Share2, Download, X, ChevronLeft, ChevronRight,
  Check, Image as ImageIcon, Link2, QrCode, Loader2, Pencil, FileText,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────
// Women's — Matchday Programme builder.
//
// AI workflow (demo-safe, canned — no real API): one click drafts every
// section from the fixture, then the user toggles sections, swaps photos
// and previews a full-screen flip-book programme they can share.
//
// Built for grassroots / women's clubs with no design team. Fixture:
// Lumio Sports FC vs Greyfield Town · Sat 03 May 2026 · League One.
// ─────────────────────────────────────────────────────────────────────────

const C = {
  card:     '#0D1117',
  cardAlt:  '#111318',
  border:   '#1F2937',
  borderHi: '#374151',
  text:     '#F9FAFB',
  text2:    '#D1D5DB',
  text3:    '#9CA3AF',
  text4:    '#6B7280',
  green:    '#22C55E',
  gold:     '#D4A056',
}

const ISSUE = { no: 39, price: '£3', date: 'Sat 12 Apr 2026', ko: '15:00', comp: 'EFL League One · MD-39', venue: 'Lumio Park' }
const CREST = '/badges/oakridge_fc_crest.svg'

// ─── Builder sections (map to programme pages) ───────────────────────────
type Section = { id: string; title: string; pages: number; photos: number; on: boolean }
const INITIAL_SECTIONS: Section[] = [
  { id: 'cover',     title: 'Front cover',                pages: 1, photos: 1, on: true },
  { id: 'welcome',   title: 'Chair’s welcome',            pages: 1, photos: 1, on: true },
  { id: 'notes',     title: "Manager’s notes",            pages: 1, photos: 1, on: true },
  { id: 'teamnews',  title: 'Team news & injury update',  pages: 1, photos: 0, on: true },
  { id: 'opponents', title: 'Today’s opponents',          pages: 1, photos: 1, on: true },
  { id: 'teams',     title: 'Today’s teams (line-ups)',   pages: 1, photos: 0, on: true },
  { id: 'tactics',   title: 'How we’ll play',             pages: 1, photos: 0, on: true },
  { id: 'spotlight', title: 'Player spotlight',           pages: 1, photos: 1, on: true },
  { id: 'table',     title: 'League table',               pages: 1, photos: 0, on: true },
  { id: 'numbers',   title: 'By the numbers',             pages: 1, photos: 0, on: true },
  { id: 'fixtures',  title: 'Fixtures & results',         pages: 1, photos: 0, on: true },
  { id: 'history',   title: 'On this day',                pages: 1, photos: 0, on: true },
  { id: 'community', title: 'Around the club',            pages: 1, photos: 2, on: true },
  { id: 'academy',   title: 'Academy focus',              pages: 1, photos: 1, on: true },
  { id: 'fanzone',   title: 'Fan zone',                   pages: 1, photos: 1, on: true },
  { id: 'juniors',   title: 'Young supporters',           pages: 1, photos: 0, on: true },
  { id: 'sponsors',  title: 'Our sponsors',               pages: 1, photos: 0, on: true },
  { id: 'back',      title: 'Back cover',                 pages: 1, photos: 1, on: true },
]

const BUILD_STEPS = [
  'Pulling fixture, squad & league data…',
  'Writing the chair’s welcome & manager’s notes…',
  'Building both line-ups & the opposition profile…',
  'Selecting club photos & sponsor artwork…',
  'Laying out the pages & charts…',
  'Finalising your programme…',
]

export default function FootballMatchdayProgramme({ accent = '#003DA5' }: { accent?: string }) {
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS)
  const [built, setBuilt] = useState(false)
  const [building, setBuilding] = useState(false)
  const [step, setStep] = useState(0)
  const [preview, setPreview] = useState(false)
  const [share, setShare] = useState(false)

  const toggle = (id: string) => setSections(s => s.map(x => x.id === id ? { ...x, on: !x.on } : x))
  const onCount = sections.filter(s => s.on).length
  const totalPages = sections.filter(s => s.on).reduce((a, s) => a + s.pages, 0)
  const totalPhotos = sections.filter(s => s.on).reduce((a, s) => a + s.photos, 0)

  const build = () => {
    setBuilding(true); setStep(0)
  }
  useEffect(() => {
    if (!building) return
    if (step >= BUILD_STEPS.length) { setBuilding(false); setBuilt(true); return }
    const id = setTimeout(() => setStep(s => s + 1), 650)
    return () => clearTimeout(id)
  }, [building, step])

  return (
    <div style={{ color: C.text }}>
      {/* Header */}
      <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen size={18} style={{ color: accent }} />
              <span className="text-lg font-bold" style={{ color: C.text }}>Matchday Programme</span>
              {built && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${C.green}22`, color: C.green }}>READY</span>}
            </div>
            <div className="text-[11.5px] mt-1" style={{ color: C.text3 }}>
              Issue #{ISSUE.no} · Lumio Sports FC vs Greyfield Town · {ISSUE.date} · {ISSUE.comp}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!built ? (
              <button onClick={build} disabled={building}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-70"
                style={{ backgroundColor: accent, color: '#fff' }}>
                {building ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {building ? 'Building…' : 'Build my programme'}
              </button>
            ) : (
              <>
                <button onClick={() => { setPreview(true) }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: accent, color: '#fff' }}>
                  <Eye size={15} /> Preview
                </button>
                <button onClick={() => setShare(true)} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: C.cardAlt, color: C.text2, border: `1px solid ${C.border}` }}>
                  <Share2 size={15} /> Share
                </button>
              </>
            )}
          </div>
        </div>

        {/* build progress */}
        {building && (
          <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: `${accent}10`, border: `1px solid ${accent}33` }}>
            <div className="flex items-center gap-2 text-[12.5px] font-medium" style={{ color: C.text }}>
              <Loader2 size={14} className="animate-spin" style={{ color: accent }} />
              {BUILD_STEPS[Math.min(step, BUILD_STEPS.length - 1)]}
            </div>
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.cardAlt }}>
              <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${(step / BUILD_STEPS.length) * 100}%`, backgroundColor: accent }} />
            </div>
          </div>
        )}

        {/* stats once built */}
        {built && !building && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: 'Pages', v: String(totalPages) },
              { l: 'Sections', v: `${onCount}/${sections.length}` },
              { l: 'Photos', v: String(totalPhotos) },
              { l: 'Format', v: 'A5 · flip-book' },
            ].map((x, i) => (
              <div key={i} className="rounded-xl p-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{x.l}</div>
                <div className="text-lg font-bold mt-0.5 tnum" style={{ color: C.text }}>{x.v}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pre-build explainer / section list */}
      {!built && !building && (
        <div className="rounded-2xl p-6 mb-5 text-center" style={{ backgroundColor: C.card, border: `1px dashed ${C.borderHi}` }}>
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: `${accent}1a`, border: `1px solid ${accent}44` }}>
            <Sparkles size={24} style={{ color: accent }} />
          </div>
          <div className="text-base font-bold" style={{ color: C.text }}>Let Lumio build your matchday programme</div>
          <p className="text-[12.5px] mt-1.5 max-w-md mx-auto" style={{ color: C.text3 }}>
            One click pulls in the fixture, squads, league table and recent results, writes the welcome and manager’s notes, lays out the opposition, sponsors and a young-supporters page — a full 14-page programme, ready to share online. Edit anything after.
          </p>
        </div>
      )}

      {/* Section builder */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.text3 }}>Programme sections</span>
          <span className="text-[11px]" style={{ color: C.text4 }}>{built ? 'tap to include / exclude · drag photos to swap' : 'these will be generated'}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sections.map((sec, i) => (
            <div key={sec.id} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5" style={{ backgroundColor: C.cardAlt, border: `1px solid ${sec.on ? C.border : '#16181d'}`, opacity: sec.on ? 1 : 0.5 }}>
              <button onClick={() => built && toggle(sec.id)} disabled={!built}
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: sec.on ? accent : 'transparent', border: `1px solid ${sec.on ? accent : C.borderHi}` }}>
                {sec.on && <Check size={13} color="#fff" />}
              </button>
              <span className="w-6 text-[11px] font-mono flex-shrink-0" style={{ color: C.text4 }}>{String(i + 1).padStart(2, '0')}</span>
              <span className="flex-1 text-[12.5px] truncate" style={{ color: C.text }}>{sec.title}</span>
              {sec.photos > 0 && (
                <span className="flex items-center gap-1 text-[10px]" style={{ color: C.text4 }}><ImageIcon size={11} /> {sec.photos}</span>
              )}
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: built ? `${C.green}1e` : C.card, color: built ? C.green : C.text4 }}>
                {built ? 'Ready' : 'Pending'}
              </span>
              {built && <Pencil size={12} style={{ color: C.text4 }} />}
            </div>
          ))}
        </div>
      </div>

      {preview && <FlipBook accent={accent} sections={sections} onClose={() => setPreview(false)} onShare={() => { setPreview(false); setShare(true) }} />}
      {share && <SharePanel accent={accent} onClose={() => setShare(false)} />}
    </div>
  )
}

// ─── Share panel ─────────────────────────────────────────────────────────
function SharePanel({ accent, onClose }: { accent: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const link = 'lumiosports.com/p/oakridge-women/hartwell-0305'
  return (
    <>
      <div className="fixed inset-0 z-[120]" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[121] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6"
        style={{ width: 'min(460px, 92vw)', backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Share2 size={16} style={{ color: accent }} /><span className="font-bold" style={{ color: C.text }}>Share programme</span></div>
          <button onClick={onClose} style={{ color: C.text4 }}><X size={18} /></button>
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
          <Link2 size={14} style={{ color: C.text4 }} />
          <span className="flex-1 text-[12px] truncate" style={{ color: C.text2 }}>{link}</span>
          <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }}
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: accent, color: '#fff' }}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: QrCode, l: 'QR code for the ground' },
            { icon: Download, l: 'Download PDF / print' },
            { icon: Share2, l: 'Post to socials' },
            { icon: FileText, l: 'Email to season tickets' },
          ].map((x, i) => {
            const Icon = x.icon
            return (
              <button key={i} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-medium text-left"
                style={{ backgroundColor: C.cardAlt, color: C.text2, border: `1px solid ${C.border}` }}>
                <Icon size={14} style={{ color: accent }} /> {x.l}
              </button>
            )
          })}
        </div>
        <p className="text-[10px] mt-3" style={{ color: C.text4 }}>Demo — sharing is illustrative; no link is published and no file is generated.</p>
      </div>
    </>
  )
}

// ─── Editorial design system (Bold editorial · cream paper) ─────────────
const P = {
  paper:   '#F7F2E8',
  paper2:  '#EFE6D4',
  ink:     '#1A1016',
  ink2:    '#4A3A42',
  muted:   '#8C7884',
  line:    '#DCCFB8',
  claret:  '#0A2A5E',
  claret2: '#1B4FA0',
  pink:    '#003DA5',
  gold:    '#A87B2E',
  goldHi:  '#CBA24B',
  cream:   '#F2E9D8',
}
const PROG_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;0,900;1,500;1,600&family=Inter:wght@400;500;600;700;800&display=swap');
.prog-sans{font-family:'Inter',system-ui,-apple-system,Segoe UI,sans-serif}
.prog-serif{font-family:'Playfair Display',Georgia,'Times New Roman',serif}
`

function Grain({ opacity = 0.05 }: { opacity?: number }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity, mixBlendMode: 'multiply' }} aria-hidden>
      <filter id="progGrain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /></filter>
      <rect width="100%" height="100%" filter="url(#progGrain)" />
    </svg>
  )
}

// ─── Flip-book ───────────────────────────────────────────────────────────
function FlipBook({ accent, sections, onClose, onShare }: { accent: string; sections: Section[]; onClose: () => void; onShare: () => void }) {
  const pages = buildPages(accent, sections)
  const [page, setPage] = useState(0)
  const total = pages.length
  const go = (d: number) => setPage(p => Math.max(0, Math.min(total - 1, p + d)))
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [total])
  return (
    <div className="fixed inset-0 z-[120] flex flex-col" style={{ background: 'radial-gradient(140% 100% at 50% 0%, #06122E 0%, #0a0509 70%)' }}>
      <style>{PROG_CSS}</style>
      {/* toolbar */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(203,162,75,0.18)' }}>
        <div className="flex items-center gap-2 prog-sans text-[13px] font-semibold" style={{ color: P.cream }}>
          <BookOpen size={16} style={{ color: P.goldHi }} /> Official Matchday Programme · Issue #{ISSUE.no}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onShare} className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg prog-sans" style={{ background: 'rgba(255,255,255,0.06)', color: P.cream, border: '1px solid rgba(203,162,75,0.25)' }}><Share2 size={13} /> Share</button>
          <button className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg prog-sans" style={{ background: 'rgba(255,255,255,0.06)', color: P.cream, border: '1px solid rgba(203,162,75,0.25)' }}><Download size={13} /> PDF</button>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: P.cream, border: '1px solid rgba(203,162,75,0.25)' }}><X size={16} /></button>
        </div>
      </div>

      {/* stage */}
      <div className="flex-1 flex items-center justify-center gap-5 px-4 overflow-hidden">
        <button onClick={() => go(-1)} disabled={page === 0} className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-25 transition" style={{ background: 'rgba(255,255,255,0.05)', color: P.cream, border: '1px solid rgba(203,162,75,0.3)' }}><ChevronLeft size={20} /></button>
        <div className="h-full py-6 flex items-center" style={{ maxWidth: 580, width: '100%' }}>
          <div className="w-full overflow-hidden flex flex-col" style={{ aspectRatio: '0.707', maxHeight: '100%', borderRadius: 4, boxShadow: '0 40px 90px rgba(0,0,0,0.65), 0 0 0 1px rgba(203,162,75,0.2)' }}>
            {pages[page]}
          </div>
        </div>
        <button onClick={() => go(1)} disabled={page === total - 1} className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-25 transition" style={{ background: 'rgba(255,255,255,0.05)', color: P.cream, border: '1px solid rgba(203,162,75,0.3)' }}><ChevronRight size={20} /></button>
      </div>

      {/* counter */}
      <div className="flex items-center justify-center gap-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(203,162,75,0.18)' }}>
        <span className="text-[11px] prog-sans" style={{ color: 'rgba(242,233,216,0.6)' }}>Page {page + 1} / {total}</span>
        <div className="flex items-center gap-1">
          {pages.map((_, i) => (
            <button key={i} onClick={() => setPage(i)} className="rounded-full transition-all" style={{ width: i === page ? 20 : 6, height: 6, backgroundColor: i === page ? P.goldHi : 'rgba(242,233,216,0.25)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Editorial primitives ────────────────────────────────────────────────
function Eyebrow({ children, color }: { children: React.ReactNode; color: string }) {
  return <div className="text-[10px] font-bold uppercase tracking-[0.3em] prog-sans mb-3" style={{ color }}>{children}</div>
}
function PaperPage({ runningHead, folio, accent, dark, children }: { runningHead: string; folio: string; accent: string; dark?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden prog-sans" style={{ background: dark ? '#0A1F45' : P.paper, color: dark ? P.cream : P.ink }}>
      <Grain opacity={dark ? 0.08 : 0.045} />
      <div className="flex-1 overflow-y-auto px-7 pt-6 pb-2 relative">{children}</div>
      <div className="px-7 py-2.5 flex items-center justify-between text-[8px] uppercase tracking-[0.22em] relative" style={{ borderTop: `1px solid ${dark ? 'rgba(203,162,75,0.25)' : P.line}`, color: dark ? 'rgba(242,233,216,0.55)' : P.muted }}>
        <span>Lumio Sports FC</span><span style={{ color: dark ? P.goldHi : accent }}>{runningHead}</span><span>{folio}</span>
      </div>
    </div>
  )
}
function EditorialPhoto({ label, h = 150, src }: { label: string; h?: number; src?: string }) {
  const [err, setErr] = useState(false)
  const showImg = !!src && !err
  return (
    <figure className="relative w-full overflow-hidden" style={{ height: h, border: `1px solid ${P.line}` }}>
      {showImg ? (<>
        <img src={src} alt={label} onError={() => setErr(true)} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${P.claret}bb, #06122Eaa)`, mixBlendMode: 'multiply' }} />
      </>) : (<>
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${P.claret2} 0%, ${P.claret} 45%, #06122E 100%)` }} />
        <img src={CREST} alt="" aria-hidden className="absolute" style={{ width: h * 1.15, height: h * 1.15, right: -h * 0.18, top: -h * 0.16, opacity: 0.14, filter: 'brightness(3) saturate(0.3)' }} />
      </>)}
      <Grain opacity={0.1} />
      <figcaption className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center gap-2" style={{ background: 'linear-gradient(transparent, rgba(20,8,14,0.82))' }}>
        <span style={{ width: 16, height: 1, background: P.goldHi, flexShrink: 0 }} />
        <span className="prog-serif italic text-[10.5px]" style={{ color: P.cream }}>{label}</span>
      </figcaption>
    </figure>
  )
}
function Lockup({ name, tier }: { name: string; tier: string }) {
  const mono = name.split(/[\s—–-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('')
  return (
    <div className="flex items-center gap-3 px-3.5 py-3" style={{ border: `1px solid ${P.line}`, background: '#FBF7EE' }}>
      <div className="w-11 h-11 flex items-center justify-center prog-serif font-bold flex-shrink-0" style={{ background: P.ink, color: P.cream, fontSize: 15, letterSpacing: '0.02em' }}>{mono}</div>
      <div className="min-w-0">
        <div className="prog-serif font-bold text-[13.5px] leading-tight truncate" style={{ color: P.ink }}>{name}</div>
        <div className="text-[8px] uppercase tracking-[0.22em] mt-0.5" style={{ color: P.gold }}>{tier}</div>
      </div>
    </div>
  )
}
function SponsorLogo({ name, tier, file }: { name: string; tier: string; file: string }) {
  const [err, setErr] = useState(false)
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-3 py-4" style={{ border: `1px solid ${P.line}`, background: '#FBF7EE' }}>
      {!err
        ? <img src={`/programme/sponsors/${file}.svg`} alt={name} onError={() => setErr(true)} style={{ height: 30, maxWidth: '92%', objectFit: 'contain' }} />
        : <div className="prog-serif font-bold text-[13.5px]" style={{ color: P.ink }}>{name}</div>}
      <div className="text-[8px] uppercase tracking-[0.22em]" style={{ color: P.gold }}>{tier}</div>
    </div>
  )
}
function DropCap({ text, accent }: { text: string; accent: string }) {
  const first = text.charAt(0); const rest = text.slice(1)
  return (
    <p className="prog-sans text-[12px] leading-relaxed" style={{ color: P.ink2 }}>
      <span className="prog-serif float-left mr-2 mt-1" style={{ fontSize: 50, lineHeight: 0.78, fontWeight: 800, color: accent }}>{first}</span>{rest}
    </p>
  )
}
function PullQuote({ children, accent }: { children: React.ReactNode; accent: string }) {
  return <blockquote className="prog-serif my-4 pl-4 text-[15.5px] italic leading-snug" style={{ borderLeft: `3px solid ${P.goldHi}`, color: accent }}>{children}</blockquote>
}
function GoldRule() { return <div className="my-3 flex items-center gap-2"><div style={{ height: 2, width: 28, background: P.goldHi }} /><div style={{ height: 1, flex: 1, background: P.line }} /></div> }
function SubHead({ children, accent }: { children: React.ReactNode; accent: string }) {
  return <div className="text-[9.5px] font-bold uppercase tracking-[0.2em] mt-5 mb-2" style={{ color: accent }}>{children}</div>
}
function StatStrip({ items, accent }: { items: [string, string][]; accent: string }) {
  return (
    <div className="grid gap-2 mt-1" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map(([v, l], i) => (
        <div key={i} className="text-center py-2" style={{ border: `1px solid ${P.line}`, background: '#FBF7EE' }}>
          <div className="prog-serif text-[17px] font-black" style={{ color: accent }}>{v}</div>
          <div className="text-[7.5px] uppercase tracking-[0.13em] mt-0.5" style={{ color: P.gold }}>{l}</div>
        </div>
      ))}
    </div>
  )
}
function CompareRow({ a, label, b, accent }: { a: number; label: string; b: number; accent: string }) {
  const total = a + b || 1
  return (
    <div>
      <div className="flex items-baseline justify-between mb-0.5">
        <span className="prog-serif text-[12px] font-bold" style={{ color: accent }}>{a}</span>
        <span className="prog-sans text-[8.5px] font-semibold uppercase tracking-[0.12em]" style={{ color: P.muted }}>{label}</span>
        <span className="prog-serif text-[12px] font-bold" style={{ color: P.ink }}>{b}</span>
      </div>
      <div className="flex h-1.5 gap-0.5"><div style={{ width: `${(a / total) * 100}%`, background: accent }} /><div style={{ width: `${(b / total) * 100}%`, background: P.goldHi }} /></div>
    </div>
  )
}
function MiniLegend({ a, b, accent }: { a: string; b: string; accent: string }) {
  return (
    <div className="flex items-center justify-center gap-4 mt-1.5 text-[8.5px]" style={{ color: P.muted }}>
      <span className="flex items-center gap-1"><span style={{ width: 9, height: 9, background: accent, display: 'inline-block' }} />{a}</span>
      <span className="flex items-center gap-1"><span style={{ width: 9, height: 9, background: P.goldHi, display: 'inline-block' }} />{b}</span>
    </div>
  )
}
function ColChart({ data, accent, h = 64 }: { data: { label: string; a: number; b?: number }[]; accent: string; h?: number }) {
  const max = Math.max(...data.flatMap(d => [d.a, d.b ?? 0]), 1)
  return (
    <div className="flex items-end justify-between gap-1.5" style={{ height: h }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1" style={{ height: '100%' }}>
          <div className="w-full flex items-end justify-center gap-0.5" style={{ height: '100%' }}>
            <div style={{ width: d.b !== undefined ? '42%' : '64%', height: `${(d.a / max) * 100}%`, background: accent, minHeight: 2 }} />
            {d.b !== undefined && <div style={{ width: '42%', height: `${((d.b ?? 0) / max) * 100}%`, background: P.goldHi, minHeight: 2 }} />}
          </div>
          <span className="text-[7.5px] prog-sans" style={{ color: P.muted }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}
function MiniBars({ data, accent }: { data: { label: string; value: number }[]; accent: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-24 text-[10px] prog-sans flex-shrink-0" style={{ color: P.ink2 }}>{d.label}</span>
          <div className="flex-1 h-3.5" style={{ background: '#EFE6D4' }}><div className="h-3.5 flex items-center justify-end pr-1" style={{ width: `${(d.value / max) * 100}%`, background: accent, minWidth: 18 }}><span className="text-[8px] font-bold" style={{ color: P.cream }}>{d.value}</span></div></div>
        </div>
      ))}
    </div>
  )
}
function Donut({ pct, label, color }: { pct: number; label: string; color: string }) {
  const r = 26, circ = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center">
      <svg width="62" height="62" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#EFE6D4" strokeWidth="7" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(pct / 100) * circ} ${circ}`} transform="rotate(-90 32 32)" />
        <text x="32" y="37" textAnchor="middle" fontFamily="Playfair Display, Georgia, serif" fontSize="15" fontWeight="800" fill="#1A1016">{pct}</text>
      </svg>
      <span className="text-[8px] uppercase tracking-[0.12em] mt-1 text-center" style={{ color: P.gold }}>{label}</span>
    </div>
  )
}

// ─── Build pages (editorial) ─────────────────────────────────────────────
function buildPages(accent: string, sections: Section[]): React.ReactNode[] {
  const on = (id: string) => sections.find(s => s.id === id)?.on
  const pages: React.ReactNode[] = []
  const P_ = (n: React.ReactNode) => pages.push(n)

  // 1 — COVER
  if (on('cover')) P_(
    <div key="cover" className="flex-1 flex flex-col relative overflow-hidden prog-sans" style={{ background: `linear-gradient(165deg, #1B4FA0 0%, ${P.claret} 40%, #06122E 100%)`, color: P.cream }}>
      <div className="absolute inset-3" style={{ border: `1px solid rgba(203,162,75,0.4)` }} />
      <img src={CREST} alt="" aria-hidden className="absolute" style={{ width: 360, height: 360, right: -70, top: 150, opacity: 0.13, filter: 'brightness(3) saturate(0.3)' }} />
      <div className="absolute top-0 left-0 right-0 overflow-hidden" style={{ height: '44%' }}>
        <img src="/programme/mens-cover-hero.jpg" alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 25%' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,18,46,0.15) 0%, rgba(27,79,160,0.25) 55%, #0A2A5E 100%)' }} />
      </div>
      <Grain opacity={0.09} />
      <div className="relative flex flex-col h-full px-8 py-9">
        <div className="text-center">
          <div className="text-[9.5px] font-bold tracking-[0.4em]" style={{ color: 'rgba(242,233,216,0.85)' }}>OFFICIAL MATCHDAY PROGRAMME</div>
          <div className="mx-auto my-3" style={{ height: 1, width: 70, background: P.goldHi }} />
          <div className="flex items-center justify-center gap-3">
            <img src={CREST} alt="" style={{ width: 34, height: 34 }} />
            <div className="prog-serif text-left leading-[0.92]" style={{ fontSize: 20, fontWeight: 800 }}>LUMIO<br />SPORTS FC</div>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center text-center">
          <div className="text-[10px] font-semibold tracking-[0.3em] mb-3" style={{ color: P.goldHi }}>{ISSUE.comp}</div>
          <div className="prog-serif" style={{ fontSize: 44, fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.01em' }}>Oakridge</div>
          <div className="prog-serif italic" style={{ fontSize: 17, color: P.goldHi, margin: '6px 0' }}>versus</div>
          <div className="prog-serif" style={{ fontSize: 44, fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.01em' }}>Greyfield</div>
          <div className="mx-auto mt-5" style={{ height: 1, width: 120, background: 'rgba(203,162,75,0.5)' }} />
          <div className="text-[11.5px] mt-4 tracking-wide" style={{ color: 'rgba(242,233,216,0.92)' }}>{ISSUE.date}</div>
          <div className="text-[11.5px] tracking-wide" style={{ color: 'rgba(242,233,216,0.92)' }}>Kick-off {ISSUE.ko} · {ISSUE.venue}</div>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-[9px]" style={{ color: 'rgba(242,233,216,0.7)' }}>In association with<br /><b className="prog-serif text-[12px]" style={{ color: P.cream }}>Apex Performance</b></div>
          <div className="text-right px-3 py-1.5" style={{ background: P.goldHi, color: '#06122E' }}>
            <div className="text-[8px] font-bold tracking-widest">ISSUE #{ISSUE.no}</div>
            <div className="prog-serif text-[20px] font-black leading-none">{ISSUE.price}</div>
          </div>
        </div>
      </div>
    </div>
  )

  // 2 — CONTENTS
  P_(
    <PaperPage key="contents" runningHead="Contents" folio={String(pages.length + 1).padStart(2, '0')} accent={accent}>
      <Eyebrow color={accent}>Inside this issue</Eyebrow>
      <div className="prog-serif mb-2" style={{ fontSize: 26, fontWeight: 800, color: P.ink, lineHeight: 1 }}>Contents</div>
      <GoldRule />
      <div className="flex flex-col mt-2">
        {sections.filter(s => s.on && s.id !== 'cover').map((s, i) => (
          <div key={s.id} className="flex items-baseline gap-3 py-2" style={{ borderBottom: `1px solid ${P.line}` }}>
            <span className="prog-serif text-[14px] w-7" style={{ color: accent, fontWeight: 700 }}>{String(i + 2).padStart(2, '0')}</span>
            <span className="flex-1 prog-serif text-[14px]" style={{ color: P.ink }}>{s.title}</span>
            <span className="text-[10px]" style={{ color: P.muted }}>—</span>
          </div>
        ))}
      </div>
      <div className="mt-5 prog-serif italic text-[12px] leading-relaxed" style={{ color: P.ink2 }}>
        Welcome to Lumio Park. Thank you to our supporters, partners and the matchday team — and to you, for backing the women&apos;s game.
      </div>
    </PaperPage>
  )

  // 3 — CHAIR'S WELCOME
  if (on('welcome')) P_(
    <PaperPage key="welcome" runningHead="Chair’s welcome" folio={String(pages.length + 1).padStart(2, '0')} accent={accent}>
      <Eyebrow color={accent}>Chair’s welcome</Eyebrow>
      <h1 className="prog-serif" style={{ fontSize: 27, fontWeight: 800, color: P.ink, lineHeight: 1.02 }}>A warm welcome to Lumio Park</h1>
      <GoldRule />
      <div className="my-3"><EditorialPhoto label="David Ellison — Chair" h={120} src="/programme/mens-chair.jpg" /></div>
      <DropCap accent={accent} text="Good afternoon and a very warm welcome to Greyfield Town — their players, staff and supporters — for today’s League One fixture. It has been a season of real progress on and off the pitch: record season-ticket numbers, a thriving academy and a community programme reaching more youngsters than ever before." />
      <PullQuote accent={accent}>“Today is a chance to push for the points that matter.”</PullQuote>
      <p className="prog-sans text-[12px] leading-relaxed" style={{ color: P.ink2 }}>Thank you for being here and for backing the team. Enjoy the game.</p>
      <div className="prog-serif italic text-[13px] mt-3" style={{ color: accent }}>— David Ellison, Chair</div>
      <SubHead accent={accent}>The season so far</SubHead>
      <StatStrip accent={accent} items={[['3rd', 'Position'], ['36', 'Points'], ['+18', 'Goal diff'], ['2,140', 'Members']]} />
      <div className="mt-3 px-3 py-2.5 text-[11px]" style={{ background: `${accent}0e`, borderLeft: `3px solid ${P.goldHi}`, color: P.ink2 }}>
        <b className="prog-serif" style={{ color: P.ink }}>Did you know?</b> Today is Lumio Sports’s 250th league fixture since the club turned fully professional in 2019.
      </div>
    </PaperPage>
  )

  // 4 — MANAGER'S NOTES
  if (on('notes')) P_(
    <PaperPage key="notes" runningHead="Manager’s notes" folio={String(pages.length + 1).padStart(2, '0')} accent={accent}>
      <Eyebrow color={accent}>Manager’s notes</Eyebrow>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden" style={{ background: `linear-gradient(135deg, ${P.claret2}, ${P.claret})` }}>
          <img src="/programme/mens-manager.jpg" alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        </div>
        <div><div className="prog-serif text-[16px] font-bold" style={{ color: P.ink }}>Mark Sturridge</div><div className="text-[9.5px] uppercase tracking-[0.18em]" style={{ color: P.gold }}>First-team Manager</div></div>
      </div>
      <GoldRule />
      <DropCap accent={accent} text="Greyfield are a well-organised side who sit deep and counter, so we will need patience and quality in the final third. The group has trained brilliantly this week — Carter is back available after her scan, and that is a big lift for everyone." />
      <PullQuote accent={accent}>“We know what three points would do for us in this run-in.”</PullQuote>
      <p className="prog-sans text-[12px] leading-relaxed" style={{ color: P.ink2 }}>Get behind the players from the first whistle — your support on the overlaps and at set-pieces genuinely makes a difference. Up the Blues.</p>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[['Form', 'W W D W L'], ['League', '3rd · 36 pts'], ['Unbeaten (H)', '6 games']].map(([l, v]) => (
          <div key={l} className="px-2 py-2.5 text-center" style={{ border: `1px solid ${P.line}`, background: '#FBF7EE' }}>
            <div className="text-[8px] uppercase tracking-[0.16em]" style={{ color: P.gold }}>{l}</div>
            <div className="prog-serif text-[14px] font-bold mt-0.5" style={{ color: P.ink }}>{v}</div>
          </div>
        ))}
      </div>
      <SubHead accent={accent}>The match-up</SubHead>
      <div className="px-3 py-2.5 mb-3 text-[11px]" style={{ border: `1px solid ${P.line}`, background: '#FBF7EE', color: P.ink2 }}>
        <b className="prog-serif" style={{ color: P.ink }}>Key battle:</b> Sam Porter vs Lena Marsh — whoever wins the second balls in midfield controls the tempo.
      </div>
      <div className="space-y-2">
        <CompareRow accent={accent} a={58} label="Possession %" b={44} />
        <CompareRow accent={accent} a={15} label="Shots / game" b={9} />
        <CompareRow accent={accent} a={6} label="On target" b={3} />
        <CompareRow accent={accent} a={7} label="Corners" b={4} />
      </div>
      <MiniLegend accent={accent} a="Oakridge" b="Greyfield" />
    </PaperPage>
  )

  // 5 — TEAM NEWS
  if (on('teamnews')) P_(
    <PaperPage key="teamnews" runningHead="Team news" folio={String(pages.length + 1).padStart(2, '0')} accent={accent}>
      <Eyebrow color={accent}>Team news & injury update</Eyebrow>
      <h1 className="prog-serif" style={{ fontSize: 25, fontWeight: 800, color: P.ink }}>The latest from the camp</h1>
      <GoldRule />
      {[
        ['Available', 'Jack Adams returns after a negative scan — straight back into contention.', P.claret],
        ['Doubt', 'Tom Reid (Grade 1 MCL) is 2–3 weeks away; targeting the cup tie.', P.gold],
        ['Out', 'Flynn continues his concussion return-to-play protocol (Day 3).', '#9A2A2A'],
        ['Milestone', 'Sam Porter makes her 100th appearance for the club today.', accent],
      ].map((r, i) => (
        <div key={i} className="flex gap-3 py-3" style={{ borderBottom: `1px solid ${P.line}` }}>
          <span className="prog-sans text-[8.5px] font-bold uppercase tracking-[0.14em] px-2 py-1 h-fit flex-shrink-0" style={{ background: `${r[2]}1a`, color: r[2] as string, border: `1px solid ${r[2]}40` }}>{r[0]}</span>
          <span className="prog-sans text-[12px] leading-snug" style={{ color: P.ink2 }}>{r[1]}</span>
        </div>
      ))}
    </PaperPage>
  )

  // 6 — OPPONENTS
  if (on('opponents')) P_(
    <PaperPage key="opponents" runningHead="Today’s opponents" folio={String(pages.length + 1).padStart(2, '0')} accent={accent}>
      <Eyebrow color={accent}>Today’s opponents</Eyebrow>
      <h1 className="prog-serif" style={{ fontSize: 26, fontWeight: 800, color: P.ink }}>Greyfield Town</h1>
      <GoldRule />
      <div className="my-3"><EditorialPhoto label="Greyfield Town — squad 2025/26" h={120} src="/programme/mens-opponents.jpg" /></div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[['Position', '7th'], ['Form', 'L D W L D'], ['Top scorer', 'J. Holt (14)']].map(([l, v]) => (
          <div key={l} className="px-2 py-2.5 text-center" style={{ border: `1px solid ${P.line}`, background: '#FBF7EE' }}>
            <div className="text-[8px] uppercase tracking-[0.16em]" style={{ color: P.gold }}>{l}</div>
            <div className="prog-serif text-[14px] font-bold mt-0.5" style={{ color: P.ink }}>{v}</div>
          </div>
        ))}
      </div>
      <p className="prog-sans text-[12px] leading-relaxed" style={{ color: P.ink2 }}>Greyfield arrive mid-table and hard to break down, favouring a compact 5-4-1 and quick transitions. Watch for Rachel Boyd in behind and a set-piece threat from the back post. The reverse fixture finished 1-1 in a tight afternoon at Greyfield Park.</p>
      <div className="mt-3 px-3 py-2.5 text-[11px]" style={{ background: `${accent}0e`, borderLeft: `3px solid ${P.goldHi}`, color: P.ink2 }}>
        <b className="prog-serif" style={{ color: P.ink }}>Ones to watch:</b> Jamie Holt (FW), Tom Ellis (CM), keeper Lewis Knox — commanding in the air, shaky on the ground.
      </div>
      <SubHead accent={accent}>Head-to-head record</SubHead>
      <StatStrip accent={accent} items={[['10', 'Played'], ['5', 'Oakridge'], ['3', 'Drawn'], ['2', 'Greyfield']]} />
      <div className="mt-3 space-y-1">
        {([['W', '2-0', 'Mar 25 (H)'], ['D', '1-1', 'Oct 24 (A)'], ['W', '3-1', 'Feb 24 (H)'], ['L', '0-1', 'Sep 23 (A)'], ['W', '2-1', 'Apr 23 (H)']] as [string, string, string][]).map((m, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5 text-[11px]" style={{ borderBottom: `1px solid ${P.line}` }}>
            <span className="w-5 h-5 flex items-center justify-center prog-serif text-[10px] font-bold" style={{ background: m[0] === 'W' ? P.claret : m[0] === 'D' ? P.gold : '#9A2A2A', color: P.cream }}>{m[0]}</span>
            <span className="prog-serif font-bold w-10" style={{ color: P.ink }}>{m[1]}</span>
            <span style={{ color: P.muted }}>{m[2]}</span>
          </div>
        ))}
      </div>
    </PaperPage>
  )

  // 7 — TODAY'S TEAMS (dark centre spread)
  if (on('teams')) {
    const home = ['1 Hayes (GK)', '2 Walsh', '4 Cole', '5 Hart (C)', '3 Reid', '6 Flynn', '8 Rowe', '10 Porter', '7 Barker', '11 Morris', '9 Adams']
    const away = ['1 Knox (GK)', '2 Pratt', '5 Vance', '6 Briggs', '3 Day', '4 Ellis', '8 Webb', '7 Quist', '11 Shaw', '10 Holt (C)', '9 Friel']
    P_(
      <PaperPage key="teams" runningHead="Today’s teams" folio={String(pages.length + 1).padStart(2, '0')} accent={accent} dark>
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: P.goldHi }}>Today’s teams</div>
        <div className="prog-serif" style={{ fontSize: 24, fontWeight: 800, color: P.cream }}>The line-ups</div>
        <div className="my-3" style={{ height: 1, background: 'rgba(203,162,75,0.4)' }} />
        <div className="grid grid-cols-2 gap-5">
          {[['Oakridge', home, P.goldHi], ['Greyfield', away, 'rgba(242,233,216,0.7)']].map(([name, list, col]) => (
            <div key={name as string}>
              <div className="prog-serif text-[14px] font-bold mb-2" style={{ color: col as string }}>{name as string}</div>
              {(list as string[]).map((pl, i) => {
                const [num, ...rest] = pl.split(' ')
                return (
                  <div key={i} className="flex items-baseline gap-2 py-[3px]" style={{ borderBottom: '1px solid rgba(242,233,216,0.12)' }}>
                    <span className="prog-serif w-5 text-[12px] font-bold" style={{ color: P.goldHi }}>{num}</span>
                    <span className="prog-sans text-[11.5px]" style={{ color: P.cream }}>{rest.join(' ')}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-5 mt-3 text-[9.5px]" style={{ color: 'rgba(242,233,216,0.6)' }}>
          <div><b style={{ color: P.cream }}>Subs:</b> McDonnell, Stiles, Owens, Hale, Dodd, Vane, Reece</div>
          <div><b style={{ color: P.cream }}>Subs:</b> Tann, Best, Lowe, Pike, Marsh, Dunne, Page</div>
        </div>
        <div className="mt-3 text-center text-[9.5px] prog-serif italic" style={{ color: 'rgba(242,233,216,0.65)' }}>Referee: M. Oliver · Assistants: S. Bennett, T. Nunn · Fourth official: A. Madley</div>
      </PaperPage>
    )
  }

  // TACTICS / FORMATION
  if (on('tactics')) P_(
    <PaperPage key="tactics" runningHead="How we'll play" folio={String(pages.length + 1).padStart(2, '0')} accent={accent} dark>
      <div className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: P.goldHi }}>Today's shape</div>
      <div className="prog-serif" style={{ fontSize: 24, fontWeight: 800, color: P.cream }}>Formation &middot; 4-3-3</div>
      <div className="my-3" style={{ height: 1, background: 'rgba(203,162,75,0.4)' }} />
      <div className="mx-auto" style={{ maxWidth: 240 }}>
        <svg viewBox="0 0 300 420" style={{ width: '100%' }}>
          <defs><linearGradient id="pitchG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#16351f" /><stop offset="1" stopColor="#0e2417" /></linearGradient></defs>
          <rect x="0" y="0" width="300" height="420" rx="6" fill="url(#pitchG)" />
          {[0, 1, 2, 3, 4, 5].map(i => (<rect key={i} x="0" y={i * 70} width="300" height="35" fill="#ffffff" opacity="0.02" />))}
          <g stroke="rgba(242,233,216,0.32)" strokeWidth="1.5" fill="none">
            <rect x="8" y="8" width="284" height="404" rx="4" />
            <line x1="8" y1="210" x2="292" y2="210" />
            <circle cx="150" cy="210" r="40" /><circle cx="150" cy="210" r="2" fill="rgba(242,233,216,0.5)" />
            <rect x="80" y="8" width="140" height="55" /><rect x="80" y="357" width="140" height="55" />
            <rect x="120" y="8" width="60" height="22" /><rect x="120" y="390" width="60" height="22" />
          </g>
          {([['1', 'Hayes', 150, 392], ['2', 'Walsh', 255, 312], ['4', 'Cole', 197, 330], ['5', 'Hart', 103, 330], ['3', 'Reid', 45, 312], ['6', 'Flynn', 150, 250], ['8', 'Rowe', 213, 205], ['10', 'Porter', 87, 205], ['7', 'Barker', 248, 110], ['9', 'Adams', 150, 78], ['11', 'Morris', 52, 110]] as [string, string, number, number][]).map(([num, nm, x, y]) => (
            <g key={num}>
              <circle cx={x} cy={y} r="13" fill={accent} stroke={P.goldHi} strokeWidth="1.5" />
              <text x={x} y={y + 4} textAnchor="middle" fontFamily="Playfair Display, Georgia, serif" fontSize="12" fontWeight="800" fill="#F2E9D8">{num}</text>
              <text x={x} y={y + 26} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8.5" fill="rgba(242,233,216,0.85)">{nm}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="text-[9.5px] font-bold uppercase tracking-[0.2em] mt-4 mb-2" style={{ color: P.goldHi }}>How we'll play</div>
      <div className="space-y-1.5">
        {['Build patiently from the back and draw Greyfield\'s block forward.', 'Overload the wide areas — full-backs high, wingers inside.', 'Hit the back post from set-pieces — our biggest threat this season.'].map((t, i) => (
          <div key={i} className="flex gap-2 text-[11px]"><span style={{ color: P.goldHi }}>&rsaquo;</span><span style={{ color: 'rgba(242,233,216,0.9)' }}>{t}</span></div>
        ))}
      </div>
    </PaperPage>
  )

  // 8 — SPOTLIGHT (dark feature)
  if (on('spotlight')) P_(
    <PaperPage key="spotlight" runningHead="Player spotlight" folio={String(pages.length + 1).padStart(2, '0')} accent={accent} dark>
      <div className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: P.goldHi }}>Player spotlight</div>
      <div className="prog-serif" style={{ fontSize: 30, fontWeight: 900, color: P.cream, lineHeight: 0.98 }}>100 not out</div>
      <div className="prog-serif italic text-[14px] mb-3" style={{ color: P.goldHi }}>Sam Porter, club centurion</div>
      <div className="my-3"><EditorialPhoto label="Sam Porter — 100 appearances" h={130} src="/programme/mens-spotlight.jpg" /></div>
      <p className="prog-sans text-[12px] leading-relaxed" style={{ color: 'rgba(242,233,216,0.92)' }}>From the academy to 100 first-team games, Emma has been the heartbeat of this side. “Pulling on this shirt never gets old. The growth of the the game here has been unbelievable — I just want to keep winning for these supporters.”</p>
      <div className="grid grid-cols-4 gap-2 mt-4">
        {[['100', 'Apps'], ['24', 'Goals'], ['31', 'Assists'], ['12', 'POTM']].map(([v, l]) => (
          <div key={l} className="text-center py-2" style={{ border: '1px solid rgba(203,162,75,0.3)' }}>
            <div className="prog-serif text-[20px] font-black" style={{ color: P.goldHi }}>{v}</div>
            <div className="text-[8px] uppercase tracking-[0.14em]" style={{ color: 'rgba(242,233,216,0.6)' }}>{l}</div>
          </div>
        ))}
      </div>
      <div className="text-[9.5px] font-bold uppercase tracking-[0.2em] mt-5 mb-2" style={{ color: P.goldHi }}>Appearances by season</div>
      <div className="flex items-end justify-between gap-1.5" style={{ height: 56 }}>
        {([['19/20', 8], ['20/21', 16], ['21/22', 19], ['22/23', 20], ['23/24', 18], ['24/25', 19]] as [string, number][]).map(([yr, v]) => (
          <div key={yr} className="flex-1 flex flex-col items-center justify-end gap-1" style={{ height: '100%' }}>
            <div style={{ width: '56%', height: `${(v / 22) * 100}%`, background: P.goldHi, minHeight: 3 }} />
            <span className="text-[7.5px]" style={{ color: 'rgba(242,233,216,0.6)' }}>{yr}</span>
          </div>
        ))}
      </div>
      <div className="text-[9.5px] font-bold uppercase tracking-[0.2em] mt-5 mb-2" style={{ color: P.goldHi }}>Career milestones</div>
      <div className="space-y-1.5">
        {([['2019', 'Academy debut, aged 16'], ['2021', 'First senior goal vs Castleton'], ['2023', 'Players’ Player of the Season'], ['2026', '100th appearance — today']] as [string, string][]).map(([yr, t]) => (
          <div key={yr} className="flex gap-3 text-[11px]"><span className="prog-serif font-bold w-9 flex-shrink-0" style={{ color: P.goldHi }}>{yr}</span><span style={{ color: 'rgba(242,233,216,0.9)' }}>{t}</span></div>
        ))}
      </div>
    </PaperPage>
  )

  // 9 — TABLE
  if (on('table')) {
    const rows = [
      ['1', 'Cardiff City', '38', '78'], ['2', 'Plymouth Argyle', '38', '74'],
      ['3', 'Lumio Sports', '38', '69'], ['4', 'Castleton Rovers', '38', '64'],
      ['5', 'Northgate City', '38', '60'], ['6', 'Fernbrook Athletic', '38', '57'],
      ['7', 'Greyfield Town', '38', '53'], ['8', 'Redmill United', '38', '49'],
    ]
    P_(
      <PaperPage key="table" runningHead="League table" folio={String(pages.length + 1).padStart(2, '0')} accent={accent}>
        <Eyebrow color={accent}>EFL League One</Eyebrow>
        <h1 className="prog-serif" style={{ fontSize: 25, fontWeight: 800, color: P.ink }}>The table</h1>
        <GoldRule />
        <div className="flex text-[8px] font-bold uppercase tracking-[0.14em] pb-2" style={{ color: P.gold, borderBottom: `2px solid ${P.goldHi}` }}>
          <span className="w-6">#</span><span className="flex-1">Club</span><span className="w-8 text-center">P</span><span className="w-8 text-center">Pts</span>
        </div>
        {rows.map(r => {
          const us = r[1].startsWith('Lumio'), them = r[1].startsWith('Greyfield')
          return (
            <div key={r[0]} className="flex items-center py-2" style={{ borderBottom: `1px solid ${P.line}`, background: us ? `${accent}10` : 'transparent' }}>
              <span className="w-6 prog-serif text-[13px] font-bold" style={{ color: us ? accent : P.muted }}>{r[0]}</span>
              <span className="flex-1 prog-serif text-[13px]" style={{ color: us ? accent : P.ink, fontWeight: us || them ? 700 : 500 }}>{r[1]}</span>
              <span className="w-8 text-center text-[12px]" style={{ color: P.ink2 }}>{r[2]}</span>
              <span className="w-8 text-center prog-serif text-[14px] font-bold" style={{ color: P.ink }}>{r[3]}</span>
            </div>
          )
        })}
        <div className="text-[9px] mt-2 prog-serif italic" style={{ color: P.muted }}>Top two promoted · as of MD-38</div>
        <SubHead accent={accent}>Division top scorers</SubHead>
        <div className="space-y-1">
          {([['R. Pierce', 'Castleton', '14'], ['E. Clarke', 'Oakridge', '11'], ['A. Friel', 'Marsh Rovers', '10'], ['R. Boyd', 'Greyfield', '9']] as [string, string, string][]).map(([nm, cl, g], i) => {
            const us = cl === 'Oakridge'
            return (
              <div key={i} className="flex items-center gap-2 py-1.5 text-[11.5px]" style={{ borderBottom: `1px solid ${P.line}` }}>
                <span className="prog-serif w-4 font-bold" style={{ color: P.muted }}>{i + 1}</span>
                <span className="flex-1 prog-serif" style={{ color: us ? accent : P.ink, fontWeight: us ? 700 : 500 }}>{nm} <span className="text-[9.5px]" style={{ color: P.muted }}>· {cl}</span></span>
                <span className="prog-serif font-bold" style={{ color: P.ink }}>{g}</span>
              </div>
            )
          })}
        </div>
      </PaperPage>
    )
  }

  // BY THE NUMBERS
  if (on('numbers')) P_(
    <PaperPage key="numbers" runningHead="By the numbers" folio={String(pages.length + 1).padStart(2, '0')} accent={accent}>
      <Eyebrow color={accent}>By the numbers</Eyebrow>
      <h1 className="prog-serif" style={{ fontSize: 25, fontWeight: 800, color: P.ink }}>The season in data</h1>
      <GoldRule />
      <div className="flex justify-around my-4">
        <Donut pct={58} label="Avg possession" color={accent} />
        <Donut pct={64} label="Shot accuracy" color={P.gold} />
        <Donut pct={44} label="Conversion" color={P.claret} />
      </div>
      <SubHead accent={accent}>How we score</SubHead>
      <MiniBars accent={accent} data={[{ label: 'Open play', value: 24 }, { label: 'Set-pieces', value: 11 }, { label: 'Penalties', value: 4 }, { label: 'Counters', value: 2 }]} />
      <SubHead accent={accent}>Top performers</SubHead>
      <div className="grid grid-cols-3 gap-2">
        {([['E. Clarke', '11', 'Goals'], ['J. Osei', '9', 'Assists'], ['M. Hughes', '8', 'Clean sheets']] as [string, string, string][]).map(([nm, v, l]) => (
          <div key={nm} className="text-center py-2.5" style={{ border: `1px solid ${P.line}`, background: '#FBF7EE' }}>
            <div className="prog-serif text-[18px] font-black" style={{ color: accent }}>{v}</div>
            <div className="prog-serif text-[11px]" style={{ color: P.ink }}>{nm}</div>
            <div className="text-[7.5px] uppercase tracking-[0.12em]" style={{ color: P.gold }}>{l}</div>
          </div>
        ))}
      </div>
    </PaperPage>
  )

  // 10 — FIXTURES
  if (on('fixtures')) P_(
    <PaperPage key="fixtures" runningHead="Fixtures & results" folio={String(pages.length + 1).padStart(2, '0')} accent={accent}>
      <Eyebrow color={accent}>Recent results</Eyebrow>
      <h1 className="prog-serif" style={{ fontSize: 24, fontWeight: 800, color: P.ink }}>Form guide</h1>
      <GoldRule />
      {[['W', 'Lumio Sports 2–0 Castleton Rovers'], ['L', 'Northgate City 2–1 Lumio Sports'], ['D', 'Lumio Sports 1–1 Fernbrook Athletic'], ['L', 'Plymouth Argyle 2–1 Lumio Sports'], ['D', 'Lumio Sports 2–2 Redmill United']].map((r, i) => (
        <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: `1px solid ${P.line}` }}>
          <span className="w-5 h-5 flex items-center justify-center prog-serif text-[11px] font-bold" style={{ background: r[0] === 'W' ? `${P.claret}` : r[0] === 'D' ? P.gold : '#9A2A2A', color: P.cream }}>{r[0]}</span>
          <span className="prog-sans text-[12px]" style={{ color: P.ink2 }}>{r[1]}</span>
        </div>
      ))}
      <div className="text-[10px] font-bold uppercase tracking-[0.28em] mt-5 mb-2" style={{ color: accent }}>Coming up</div>
      {[['Sat 5 Apr', 'Eastcliff Town (A)'], ['Sat 18 Apr', 'Barford Town (A)'], ['Tue 21 Apr', 'Cardiff City (H)']].map((r, i) => (
        <div key={i} className="flex justify-between py-2 prog-sans text-[12px]" style={{ borderBottom: `1px solid ${P.line}` }}>
          <span style={{ color: P.muted }}>{r[0]}</span><span style={{ color: P.ink }}>{r[1]}</span>
        </div>
      ))}
      <SubHead accent={accent}>Goals by month</SubHead>
      <ColChart accent={accent} data={[{ label: 'Sep', a: 6, b: 2 }, { label: 'Oct', a: 8, b: 4 }, { label: 'Nov', a: 5, b: 3 }, { label: 'Dec', a: 7, b: 2 }, { label: 'Jan', a: 9, b: 5 }, { label: 'Feb', a: 6, b: 3 }]} />
      <MiniLegend accent={accent} a="For" b="Against" />
      <StatStrip accent={accent} items={[['41', 'Scored'], ['23', 'Conceded'], ['+18', 'GD'], ['8', 'Clean sheets']]} />
    </PaperPage>
  )

  // ON THIS DAY
  if (on('history')) P_(
    <PaperPage key="history" runningHead="On this day" folio={String(pages.length + 1).padStart(2, '0')} accent={accent}>
      <Eyebrow color={accent}>On this day · 3 May</Eyebrow>
      <h1 className="prog-serif" style={{ fontSize: 25, fontWeight: 800, color: P.ink }}>From the archive</h1>
      <GoldRule />
      {([['2024', 'Promotion sealed — a 3-0 home win takes Lumio Sports up to League One.'], ['2021', 'Sam Porter nets her first senior goal in a 2-1 win over Castleton.'], ['2019', 'The club launches its first fully professional women’s squad.'], ['2016', 'A then-record women’s crowd of 4,812 packs Lumio Park.']] as [string, string][]).map(([yr, t]) => (
        <div key={yr} className="flex gap-3 py-2.5" style={{ borderBottom: `1px solid ${P.line}` }}>
          <span className="prog-serif font-black text-[15px] w-12 flex-shrink-0" style={{ color: accent }}>{yr}</span>
          <span className="prog-sans text-[12px] leading-snug" style={{ color: P.ink2 }}>{t}</span>
        </div>
      ))}
      <SubHead accent={accent}>Club honours</SubHead>
      <div className="px-3 py-2.5 text-[11px]" style={{ background: `${accent}0e`, borderLeft: `3px solid ${P.goldHi}`, color: P.ink2 }}>
        League One runners-up (2023) · County Cup winners (2022, 2025) · Foundation Community Award (2024) · six academy graduates capped at youth international level.
      </div>
    </PaperPage>
  )

  // 11 — COMMUNITY
  if (on('community')) P_(
    <PaperPage key="community" runningHead="Around the club" folio={String(pages.length + 1).padStart(2, '0')} accent={accent}>
      <Eyebrow color={accent}>Around the club</Eyebrow>
      <h1 className="prog-serif" style={{ fontSize: 24, fontWeight: 800, color: P.ink }}>Growing the game</h1>
      <GoldRule />
      <div className="grid grid-cols-2 gap-2 my-3">
        <EditorialPhoto label="Foundation — youth camp" h={90} src="/programme/mens-community-1.jpg" />
        <EditorialPhoto label="Academy U16s — champions" h={90} src="/programme/mens-community-2.jpg" />
      </div>
      <p className="prog-sans text-[12px] leading-relaxed" style={{ color: P.ink2 }}>Our Foundation reached 1,200 youngsters across local schools this term, and the academy U16s sealed their league title last weekend. The supporters’ club end-of-season awards night is Friday 13 June — tickets on sale now via the club shop.</p>
      <div className="mt-3 px-3 py-2.5 text-[11px]" style={{ background: `${accent}0e`, borderLeft: `3px solid ${P.goldHi}`, color: P.ink2 }}>
        <b className="prog-serif" style={{ color: P.ink }}>Get involved:</b> volunteer matchday roles, junior coaching badges and the “All In” campaign — speak to any staff member.
      </div>
    </PaperPage>
  )

  // ACADEMY FOCUS
  if (on('academy')) P_(
    <PaperPage key="academy" runningHead="Academy focus" folio={String(pages.length + 1).padStart(2, '0')} accent={accent}>
      <Eyebrow color={accent}>Academy focus</Eyebrow>
      <h1 className="prog-serif" style={{ fontSize: 25, fontWeight: 800, color: P.ink }}>The pathway</h1>
      <GoldRule />
      <div className="my-3"><EditorialPhoto label="Academy U16s — league champions" h={100} src="/programme/mens-community-2.jpg" /></div>
      <StatStrip accent={accent} items={[['62', 'Academy'], ['9', 'To first team'], ['4', 'In squad today'], ['1,200', 'Girls reached']]} />
      <p className="prog-sans text-[12px] leading-relaxed mt-3" style={{ color: P.ink2 }}>From grassroots centres to the first team, the Oakridge pathway is the beating heart of the club. The U16s are reigning league champions, and three of that group are already training with Mark Sturridge’s senior squad this season.</p>
      <SubHead accent={accent}>Ones to watch</SubHead>
      <div className="space-y-1.5">
        {([['Maya Bright', '16 · FW', 'Top scorer in the U16 title win — direct and two-footed.'], ['Leah Okonkwo', '17 · CM', 'Composed deep-lying playmaker; first senior bench call last month.'], ['Sienna Park', '15 · GK', 'Already training with the first-team goalkeepers.']] as [string, string, string][]).map(([nm, meta, note]) => (
          <div key={nm} className="px-3 py-2.5" style={{ border: `1px solid ${P.line}`, background: '#FBF7EE' }}>
            <div className="flex items-baseline gap-2"><span className="prog-serif text-[13px] font-bold" style={{ color: P.ink }}>{nm}</span><span className="text-[9px] uppercase tracking-[0.12em]" style={{ color: P.gold }}>{meta}</span></div>
            <div className="prog-sans text-[11px] mt-0.5" style={{ color: P.ink2 }}>{note}</div>
          </div>
        ))}
      </div>
    </PaperPage>
  )

  // FAN ZONE
  if (on('fanzone')) P_(
    <PaperPage key="fanzone" runningHead="Fan zone" folio={String(pages.length + 1).padStart(2, '0')} accent={accent}>
      <Eyebrow color={accent}>Fan zone</Eyebrow>
      <h1 className="prog-serif" style={{ fontSize: 25, fontWeight: 800, color: P.ink }}>Your matchday</h1>
      <GoldRule />
      <div className="my-3"><EditorialPhoto label="The Blues faithful at Lumio Park" h={100} src="/programme/mens-fanzone.jpg" /></div>
      <SubHead accent={accent}>Before kick-off</SubHead>
      <div className="space-y-1">
        {([['11:30', 'Fan Zone opens — food trucks, bar & DJ (West car park)'], ['12:00', 'Junior skills zone & face painting'], ['12:30', 'Club shop — new kit & player signing session'], ['13:30', 'Players\' walk-out — line the tunnel!']] as [string, string][]).map(([t, d]) => (
          <div key={t} className="flex gap-3 py-1.5 text-[11.5px]" style={{ borderBottom: `1px solid ${P.line}` }}>
            <span className="prog-serif font-bold w-12 flex-shrink-0" style={{ color: accent }}>{t}</span>
            <span style={{ color: P.ink2 }}>{d}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="px-3 py-2.5" style={{ border: `1px solid ${P.line}`, background: '#FBF7EE' }}>
          <div className="prog-serif text-[12px] font-bold mb-1" style={{ color: accent }}>Sing your hearts out</div>
          <div className="prog-serif italic text-[11px]" style={{ color: P.ink2 }}>&ldquo;Lumio, Lumio, we'll be with you, in the sun and in the rain…&rdquo;</div>
        </div>
        <div className="px-3 py-2.5" style={{ border: `1px solid ${P.line}`, background: '#FBF7EE' }}>
          <div className="prog-serif text-[12px] font-bold mb-1" style={{ color: accent }}>Fan of the month</div>
          <div className="text-[11px]" style={{ color: P.ink2 }}>Bill Hartley — 50 years a season-ticket holder. A true Blue.</div>
        </div>
      </div>
      <SubHead accent={accent}>Join the family</SubHead>
      <div className="px-3 py-2.5 text-[11px] flex items-center justify-between" style={{ background: `${accent}0e`, borderLeft: `3px solid ${P.goldHi}`, color: P.ink2 }}>
        <span><b className="prog-serif" style={{ color: P.ink }}>2026/27 season tickets</b> on sale now — kids go free.</span>
        <span className="prog-serif font-bold whitespace-nowrap" style={{ color: accent }}>From £90</span>
      </div>
      <div className="flex items-center justify-center gap-5 mt-4 text-[10px] prog-sans" style={{ color: P.muted }}>
        <span>@oakridgewomen</span><span>@OakridgeWFC</span><span>Lumio Sports TV</span>
      </div>
    </PaperPage>
  )

  // 12 — YOUNG SUPPORTERS
  if (on('juniors')) P_(
    <PaperPage key="juniors" runningHead="Young supporters" folio={String(pages.length + 1).padStart(2, '0')} accent={accent}>
      <Eyebrow color={accent}>Young Blues</Eyebrow>
      <h1 className="prog-serif" style={{ fontSize: 24, fontWeight: 800, color: P.ink }}>Junior page</h1>
      <GoldRule />
      {[
        ['Spot the difference', 'Find 5 differences between today’s two team photos — answers on the back page!'],
        ['Mascot of the day', 'Today’s mascot is Charlie (age 8) from the Lumio Juniors U9s. Give her a big cheer as the teams walk out!'],
        ['Quiz', 'How many appearances does Sam Porter reach today? (Clue: turn to the spotlight page!)'],
      ].map(([t, d], i) => (
        <div key={i} className="px-3.5 py-3 mb-2.5" style={{ border: `1px solid ${P.line}`, background: '#FBF7EE' }}>
          <div className="prog-serif text-[13.5px] font-bold mb-1" style={{ color: accent }}>{t}</div>
          <div className="prog-sans text-[11.5px]" style={{ color: P.ink2 }}>{d}</div>
        </div>
      ))}
    </PaperPage>
  )

  // 13 — SPONSORS
  if (on('sponsors')) P_(
    <PaperPage key="sponsors" runningHead="Our partners" folio={String(pages.length + 1).padStart(2, '0')} accent={accent}>
      <Eyebrow color={accent}>Our partners</Eyebrow>
      <h1 className="prog-serif" style={{ fontSize: 24, fontWeight: 800, color: P.ink }}>Thank you</h1>
      <GoldRule />
      <p className="prog-sans text-[11.5px] mb-3" style={{ color: P.ink2 }}>Our partners make football at Oakridge possible. Please support the businesses that support us.</p>
      <div className="grid grid-cols-2 gap-2.5">
        {[
          ['Apex Performance', 'Principal Partner', 'apex'], ['Meridian Group', 'Front of Shirt', 'meridian'],
          ['Crown Broadcasting', 'Official Media', 'crown'], ['Northbridge Sport', 'Sleeve Partner', 'northbridge'],
          ['Oakridge Motors', 'Stand Partner', 'oakridge-motors'], ['Riverside Leisure', 'Community Partner', 'riverside'],
        ].map(([n, t, f]) => <SponsorLogo key={n} name={n} tier={t} file={f} />)}
      </div>
      <div className="text-[9.5px] text-center mt-4 prog-serif italic" style={{ color: P.muted }}>Interested in partnering with us? Speak to our commercial team.</div>
    </PaperPage>
  )

  // 14 — BACK COVER
  if (on('back')) P_(
    <div key="back" className="flex-1 flex flex-col relative overflow-hidden prog-sans" style={{ background: `linear-gradient(200deg, #06122E 0%, ${P.claret} 65%, #1B4FA0 100%)`, color: P.cream }}>
      <div className="absolute inset-3" style={{ border: `1px solid rgba(203,162,75,0.4)` }} />
      <Grain opacity={0.09} />
      <div className="relative flex flex-col h-full px-8 py-9">
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-[9.5px] font-bold tracking-[0.32em]" style={{ color: P.goldHi }}>NEXT AT LUMIO PARK</div>
          <div className="mt-3" style={{ height: 1, width: 60, background: P.goldHi }} />
          <div className="prog-serif mt-4" style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.0 }}>Lumio Sports<br />vs Penmarric</div>
          <div className="text-[12px] mt-3" style={{ color: 'rgba(242,233,216,0.92)' }}>Sat 31 May 2026 · Kick-off 14:00 · League One</div>
          <div className="mt-4 inline-flex w-fit prog-sans text-[11px] font-bold px-3.5 py-2" style={{ background: P.goldHi, color: '#06122E' }}>Tickets on sale now</div>
        </div>
        <div className="text-center">
          <img src={CREST} alt="" style={{ width: 46, height: 46, margin: '0 auto 8px' }} />
          <div className="prog-serif text-[13px] font-bold tracking-[0.1em]" style={{ color: P.cream }}>UP THE BLUES</div>
          <div className="text-[8.5px] mt-2" style={{ color: 'rgba(242,233,216,0.7)' }}>Principal partner: Apex Performance · Designed with Lumio</div>
        </div>
      </div>
    </div>
  )

  return pages
}
