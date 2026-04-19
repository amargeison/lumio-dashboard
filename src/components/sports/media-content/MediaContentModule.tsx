'use client';
// ─── MediaContentModule ──────────────────────────────────────────────────────
// Shared Media & Content UI for all sports demo portals.
// Session-only state (useState). No localStorage, no API calls, no <form> tags.
// Tabs: Social | Sponsors | Press | Interviews
//
// Data source: src/lib/demo-content/media-content.ts
//
// Props:
//   sport           — 'golf' | 'tennis' | 'boxing' | etc. (matches MEDIA_CONTENT key)
//   accentColor     — sport accent hex (e.g. '#16a34a' for golf)
//   existingContent — optional JSX to absorb (Tennis Statement Generator, Boxing schedule, etc.)

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  getMediaContent,
  type SocialPost,
  type SocialPostMedia,
  type SocialPlatform,
  type Sponsor,
  type SponsorObligation,
  type PressMention,
  type Interview,
  type InterviewPrepStatus,
} from '@/lib/demo-content/media-content';

const MAX_ATTACHMENTS = 4;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10MB

type TabId = 'social' | 'sponsors' | 'press' | 'interviews';

export interface MediaContentModuleProps {
  sport: string;
  accentColor: string;
  existingContent?: React.ReactNode;
  /** Label rendered above the existingContent block (e.g. "Existing Tennis tools"). */
  existingContentLabel?: string;
  /** If true, render existingContent in the Sponsors tab instead of Press. */
  existingContentIn?: 'press' | 'sponsors';
  /** When true, the compose panel's "Generate with AI" button uses a local
   *  template instead of hitting /api/ai/{sport}. Default true — safe for
   *  demo portals. Pass false only from real founding-member surfaces. */
  isDemoShell?: boolean;
}

// ─── small helpers ────────────────────────────────────────────────────────────
const uid = (() => {
  let i = 0;
  return (p: string) => `${p}-${Date.now()}-${++i}`;
})();

const PLATFORM_META: Record<SocialPlatform, { label: string; glyph: string }> = {
  instagram: { label: 'Instagram', glyph: 'IG' },
  x:         { label: 'X',         glyph: 'X'  },
  tiktok:    { label: 'TikTok',    glyph: 'TT' },
  youtube:   { label: 'YouTube',   glyph: 'YT' },
  facebook:  { label: 'Facebook',  glyph: 'FB' },
};

const BUCKET_LABELS = {
  today:    'Today',
  tomorrow: 'Tomorrow',
  thisWeek: 'This Week',
  nextWeek: 'Next Week',
} as const;

function rgba(hex: string, a: number) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ─── persona + AI helpers ────────────────────────────────────────────────────
type Persona = { name: string; descriptor: string };
const PERSONA_BY_SPORT: Record<string, Persona> = {
  golf:       { name: 'James Halton',              descriptor: 'DP World Tour pro, World #87' },
  tennis:     { name: 'Alex Rivera',               descriptor: 'British ATP tennis player ranked #67' },
  boxing:     { name: 'Marcus Cole',               descriptor: 'pro boxer chasing a world title' },
  darts:      { name: 'Jake "Shooter" Morrison',   descriptor: 'PDC Pro Tour player' },
  cricket:    { name: 'Yorkshire CCC',             descriptor: 'County Championship cricket club based at Headingley — post from the club comms account voice' },
  rugby:      { name: 'Hartfield RFC',             descriptor: 'Championship rugby club at The Grange — post from the club comms account voice, community-rooted and proud' },
  football:   { name: 'Oakridge FC',               descriptor: 'Championship football club — post from the club comms account voice, proud, promotion-chasing, community-rooted, blue & yellow' },
  womens:     { name: 'Oakridge Women FC',         descriptor: 'WSL club — post from the club comms account voice, progressive, inclusive, pathway-first and community-rooted' },
  nonleague:  { name: 'Harfield FC',               descriptor: 'National League club — post from the club comms account voice, non-league grit, volunteer-supported, community-first' },
  grassroots: { name: 'Sunday Rovers FC',          descriptor: 'Sunday League grassroots club — post from the club volunteer comms account voice, volunteer-run, family-club warmth, community-first' },
};

const FALLBACK_PERSONA: Persona = { name: 'The athlete', descriptor: 'professional athlete' };

// Map sport prop → /api/ai/{slug} route. Most map directly; a few special-case.
function aiSportSlug(sport: string): string {
  const map: Record<string, string> = {
    'football-pro': 'football',
    'nonleague': 'football',
    'grassroots': 'football',
  };
  return map[sport] ?? sport;
}

// ─── public component ────────────────────────────────────────────────────────
export default function MediaContentModule({
  sport,
  accentColor,
  existingContent,
  existingContentLabel,
  existingContentIn = 'press',
  isDemoShell = true,
}: MediaContentModuleProps) {
  const seed = useMemo(() => getMediaContent(sport), [sport]);

  const [tab, setTab] = useState<TabId>('social');

  // ── state (session-only, seeded from data file) ─────────────────────────────
  const [posts,      setPosts]      = useState<SocialPost[]>(seed.social);
  const [sponsors,   setSponsors]   = useState<Sponsor[]>(seed.sponsors);
  const [mentions,   setMentions]   = useState<PressMention[]>(seed.press);
  const [interviews, setInterviews] = useState<Interview[]>(seed.interviews);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(
    seed.interviews[0]?.id ?? null,
  );

  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  // ── derived stats ───────────────────────────────────────────────────────────
  const socialStats = useMemo(() => {
    const scheduled = posts.filter(p => p.status === 'scheduled').length;
    const drafts    = posts.filter(p => p.status === 'draft').length;
    const pending   = posts.filter(p => p.status === 'needs-approval').length;
    return {
      scheduled,
      drafts,
      pending,
      reach: seed.stats.social.reach,
      followers: seed.stats.followers,
    };
  }, [posts, seed.stats.social.reach, seed.stats.followers]);

  const sponsorStats = useMemo(() => {
    const active = sponsors.length;
    const obligationsThisMonth = sponsors.reduce((a, s) => a + s.obligations.length, 0);
    const overdue = sponsors.reduce(
      (a, s) => a + s.obligations.filter(o => !o.done && /overdue/i.test(o.dueDate ?? '')).length,
      0,
    );
    return {
      active,
      obligationsThisMonth,
      overdue,
      monthlyValue: seed.stats.sponsors.monthlyValue,
    };
  }, [sponsors, seed.stats.sponsors.monthlyValue]);

  // ── keyboard nav for tabs ───────────────────────────────────────────────────
  const TAB_LIST: { id: TabId; label: string }[] = [
    { id: 'social',     label: 'Social' },
    { id: 'sponsors',   label: 'Sponsors' },
    { id: 'press',      label: 'Press' },
    { id: 'interviews', label: 'Interviews' },
  ];
  const onTabKey = useCallback((e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = (idx + dir + TAB_LIST.length) % TAB_LIST.length;
      setTab(TAB_LIST[next].id);
      const btn = document.querySelectorAll<HTMLButtonElement>('[data-mc-tab]')[next];
      btn?.focus();
    }
  }, []);

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-base font-semibold text-white flex items-center gap-2">
            <span aria-hidden>📱</span> Media &amp; Content
          </div>
          <div className="text-xs text-gray-400">Social, sponsors, press, interviews — in one place.</div>
        </div>
        <div className="text-[10px] text-gray-500">Interactive demo — session state only, resets on reload.</div>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Media & Content tabs" className="flex gap-1 border-b border-gray-800">
        {TAB_LIST.map((t, i) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              aria-controls={`mc-panel-${t.id}`}
              id={`mc-tab-${t.id}`}
              data-mc-tab
              tabIndex={active ? 0 : -1}
              onKeyDown={e => onTabKey(e, i)}
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-xs font-semibold transition-all -mb-px whitespace-nowrap border-b-2 focus:outline-none"
              style={{
                color: active ? accentColor : '#9ca3af',
                borderColor: active ? accentColor : 'transparent',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <div role="tabpanel" id={`mc-panel-${tab}`} aria-labelledby={`mc-tab-${tab}`}>
        {tab === 'social' && (
          <SocialTab
            sport={sport}
            accent={accentColor}
            posts={posts}
            setPosts={setPosts}
            stats={socialStats}
            onToast={setToast}
            isDemoShell={isDemoShell}
          />
        )}
        {tab === 'sponsors' && (
          <SponsorsTab
            accent={accentColor}
            sponsors={sponsors}
            setSponsors={setSponsors}
            stats={sponsorStats}
            onToast={setToast}
            extra={existingContentIn === 'sponsors' ? { label: existingContentLabel, node: existingContent } : undefined}
          />
        )}
        {tab === 'press' && (
          <PressTab
            accent={accentColor}
            mentions={mentions}
            setMentions={setMentions}
            seedStats={seed.stats}
            onToast={setToast}
            extra={existingContentIn === 'press' ? { label: existingContentLabel, node: existingContent } : undefined}
          />
        )}
        {tab === 'interviews' && (
          <InterviewsTab
            accent={accentColor}
            interviews={interviews}
            setInterviews={setInterviews}
            selectedId={selectedInterviewId}
            setSelectedId={setSelectedInterviewId}
            onToast={setToast}
          />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 text-xs font-semibold rounded-lg px-4 py-2 border shadow-lg"
          style={{ color: accentColor, borderColor: rgba(accentColor, 0.4), background: '#0a0c14' }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// ═════ SOCIAL TAB ════════════════════════════════════════════════════════════
function SocialTab({
  sport, accent, posts, setPosts, stats, onToast, isDemoShell,
}: {
  sport: string;
  accent: string;
  posts: SocialPost[];
  setPosts: React.Dispatch<React.SetStateAction<SocialPost[]>>;
  stats: {
    scheduled: number;
    drafts: number;
    pending: number;
    reach: string;
    followers: {
      x:         { current: string; lastMonth: string };
      instagram: { current: string; lastMonth: string };
      tiktok:    { current: string; lastMonth: string };
      youtube:   { current: string; lastMonth: string };
    };
  };
  onToast: (s: string) => void;
  isDemoShell: boolean;
}) {
  // Compose panel state
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(['instagram']);
  const [topic, setTopic] = useState('');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [when, setWhen] = useState('Today 17:00');
  const [attachments, setAttachments] = useState<SocialPostMedia[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const togglePlatform = (p: SocialPlatform) =>
    setPlatforms(cur => (cur.includes(p) ? cur.filter(x => x !== p) : [...cur, p]));

  const removeTag = (t: string) => setTags(tags.filter(x => x !== t));

  const removeAttachment = (idx: number) =>
    setAttachments(cur => cur.filter((_, i) => i !== idx));

  const handleAttachFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const slotsLeft = MAX_ATTACHMENTS - attachments.length;
    if (slotsLeft <= 0) {
      onToast(`Max ${MAX_ATTACHMENTS} attachments per post`);
      return;
    }
    const accepted: File[] = [];
    let rejectedTooBig = 0;
    let rejectedWrongType = 0;
    for (const f of files) {
      if (accepted.length >= slotsLeft) break;
      const isImg = f.type.startsWith('image/');
      const isVid = f.type.startsWith('video/');
      if (!isImg && !isVid) { rejectedWrongType++; continue; }
      if (f.size > MAX_ATTACHMENT_BYTES) { rejectedTooBig++; continue; }
      accepted.push(f);
    }
    if (files.length > slotsLeft) onToast(`Only ${slotsLeft} more attachment${slotsLeft === 1 ? '' : 's'} fit`);
    else if (rejectedTooBig > 0) onToast('Some files exceeded the 10MB limit');
    else if (rejectedWrongType > 0) onToast('Only images and videos are allowed');

    accepted.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        if (!dataUrl) return;
        setAttachments(cur =>
          cur.length >= MAX_ATTACHMENTS
            ? cur
            : [...cur, { type: file.type.startsWith('video/') ? 'video' : 'image', dataUrl, name: file.name }],
        );
      };
      reader.readAsDataURL(file);
    });
  };

  const resetCompose = () => {
    setPlatforms(['instagram']);
    setTopic('');
    setCaption('');
    setTags([]);
    setWhen('Today 17:00');
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const persona = PERSONA_BY_SPORT[sport] ?? FALLBACK_PERSONA;

  const fallbackGenerate = (t: string): { caption: string; hashtags: string[] } => {
    const trimmed = t.trim() || 'today';
    const cap = `${persona.name} here — ${trimmed}. Process over results, every day. More to come.`;
    return {
      caption: cap.slice(0, 280),
      hashtags: [sport, 'training', 'process', 'mindset'].slice(0, 4),
    };
  };

  // Apply the local template to the compose state. Used by:
  //   - the demo-shell short-circuit (avoids a live /api/ai/* hit per click)
  //   - the API-error fallback (existing behaviour)
  const applyLocalTemplate = (toastMessage: string) => {
    const fb = fallbackGenerate(topic);
    setCaption(fb.caption);
    setTags(fb.hashtags);
    onToast(toastMessage);
  };

  const generateWithAI = async () => {
    if (!topic.trim()) { onToast('Describe what the post is about first'); return; }
    if (isDemoShell) {
      // Demo portals: skip the live API entirely.
      applyLocalTemplate('Generated (demo)');
      return;
    }
    setAiLoading(true);
    const prompt = `Write a social post for ${persona.name} (${persona.descriptor}). Post is about: ${topic.trim()}. Return JSON: {"caption": string (under 280 chars), "hashtags": string[] (3-5 items, no # prefix)}. Tone: confident, specific, match the persona voice. Respond ONLY with the JSON object — no preamble, no code fences.`;
    try {
      const res = await fetch(`/api/ai/${aiSportSlug(sport)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      const text: string = data?.content?.[0]?.text ?? '';
      // Strip code fences if the model added any, then parse
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(cleaned) as { caption?: unknown; hashtags?: unknown };
      const cap = typeof parsed.caption === 'string' ? parsed.caption.slice(0, 280) : '';
      const hs = Array.isArray(parsed.hashtags)
        ? parsed.hashtags.filter((h): h is string => typeof h === 'string').map(h => h.replace(/^#/, '').trim()).filter(Boolean).slice(0, 5)
        : [];
      if (!cap) throw new Error('empty caption');
      setCaption(cap);
      setTags(hs);
      onToast('Generated');
    } catch {
      applyLocalTemplate('AI unavailable — used fallback');
    } finally {
      setAiLoading(false);
    }
  };

  const makePost = (status: SocialPost['status']): SocialPost => ({
    id: uid('new'),
    platforms: platforms.length ? platforms : ['instagram'],
    scheduledFor: when || 'Today',
    bucket: 'today',
    caption: caption.trim() || '(empty caption)',
    hashtags: tags,
    status,
    ...(attachments.length > 0 ? { media: attachments } : {}),
  });

  const schedule = () => {
    if (!caption.trim()) { onToast('Caption can’t be empty'); return; }
    setPosts(p => [makePost('scheduled'), ...p]);
    onToast('Post scheduled');
    resetCompose();
  };
  const saveDraft = () => {
    if (!caption.trim() && tags.length === 0) { onToast('Nothing to save'); return; }
    setPosts(p => [makePost('draft'), ...p]);
    onToast('Draft saved');
    resetCompose();
  };

  const remove = (id: string) => setPosts(p => p.filter(x => x.id !== id));
  const markPublished = (id: string) =>
    setPosts(p => p.map(x => (x.id === id ? { ...x, status: 'published' } : x)));
  const duplicate = (id: string) =>
    setPosts(p => {
      const found = p.find(x => x.id === id);
      if (!found) return p;
      return [{ ...found, id: uid('dup'), status: 'draft' }, ...p];
    });

  const grouped = useMemo(() => ({
    today:    posts.filter(p => p.bucket === 'today'),
    tomorrow: posts.filter(p => p.bucket === 'tomorrow'),
    thisWeek: posts.filter(p => p.bucket === 'thisWeek'),
    nextWeek: posts.filter(p => p.bucket === 'nextWeek'),
  }), [posts]);

  return (
    <div className="space-y-5">
      {/* Followers strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FollowerCard platform="Twitter/X"  value={stats.followers.x}         sub="Followers"   tint="#3b82f6" />
        <FollowerCard platform="Instagram"  value={stats.followers.instagram} sub="Followers"   tint="#a855f7" />
        <FollowerCard platform="TikTok"     value={stats.followers.tiktok}    sub="Followers"   tint="#ef4444" />
        <FollowerCard platform="YouTube"    value={stats.followers.youtube}   sub="Subscribers" tint="#f97316" />
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCell accent={accent} label="Scheduled this week" value={String(stats.scheduled)} />
        <StatCell accent={accent} label="Drafts" value={String(stats.drafts)} />
        <StatCell accent={accent} label="Pending approval" value={String(stats.pending)} />
        <StatCell accent={accent} label="Reach (7d)" value={stats.reach} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Feed (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {(['today', 'tomorrow', 'thisWeek', 'nextWeek'] as const).map(bucket => (
            <div key={bucket}>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">{BUCKET_LABELS[bucket]}</div>
              {grouped[bucket].length === 0 ? (
                <div className="text-xs text-gray-600 italic py-2">No posts scheduled.</div>
              ) : (
                <div className="space-y-2">
                  {grouped[bucket].map(p => (
                    <PostCard
                      key={p.id}
                      post={p}
                      accent={accent}
                      onDelete={() => remove(p.id)}
                      onDuplicate={() => duplicate(p.id)}
                      onMarkPublished={() => markPublished(p.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Compose (1/3) */}
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4 space-y-3 h-fit">
          <div className="text-sm font-semibold text-white">Compose</div>

          <div>
            <div className="text-[10px] text-gray-500 mb-1.5">Platforms</div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(PLATFORM_META) as SocialPlatform[]).map(p => {
                const active = platforms.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    aria-pressed={active}
                    className="text-[10px] font-semibold rounded-md px-2 py-1 border transition-colors"
                    style={{
                      color: active ? '#fff' : '#9ca3af',
                      borderColor: active ? accent : '#1f2937',
                      background: active ? rgba(accent, 0.18) : 'transparent',
                    }}
                  >
                    {PLATFORM_META[p].glyph} {PLATFORM_META[p].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-gray-500 mb-1.5">What&rsquo;s this post about?</div>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !aiLoading) { e.preventDefault(); generateWithAI(); } }}
              placeholder="e.g. Pro-am with Halden Motors hosts in Munich tomorrow"
              className="w-full bg-[#0a0c14] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gray-600"
            />
            <button
              onClick={generateWithAI}
              disabled={aiLoading}
              className="w-full mt-2 text-xs font-semibold rounded-lg py-2 text-white disabled:opacity-60"
              style={{ background: accent }}
            >
              {aiLoading ? 'Generating…' : '✨ Generate with AI'}
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-gray-500 mb-1.5">Caption</div>
              <div className="text-[10px] text-gray-500">{caption.length}/280</div>
            </div>
            {aiLoading ? (
              <div className="w-full h-[88px] rounded-lg border border-gray-800 bg-[#0a0c14] overflow-hidden">
                <div className="h-full w-full animate-pulse space-y-2 p-3">
                  <div className="h-2 rounded bg-gray-800/80 w-11/12" />
                  <div className="h-2 rounded bg-gray-800/80 w-10/12" />
                  <div className="h-2 rounded bg-gray-800/80 w-9/12" />
                  <div className="h-2 rounded bg-gray-800/80 w-7/12" />
                </div>
              </div>
            ) : (
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value.slice(0, 280))}
                rows={4}
                placeholder="Generate with AI, or write your own."
                className="w-full bg-[#0a0c14] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gray-600"
              />
            )}
          </div>

          <div>
            <div className="text-[10px] text-gray-500 mb-1.5">Hashtags</div>
            {aiLoading ? (
              <div className="flex gap-1.5">
                {[14, 12, 10, 8].map((w, i) => (
                  <div key={i} className="h-5 rounded-md bg-gray-800/80 animate-pulse" style={{ width: `${w * 6}px` }} />
                ))}
              </div>
            ) : tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <button
                    key={t}
                    onClick={() => removeTag(t)}
                    className="text-[10px] rounded-md px-2 py-0.5 border"
                    style={{ color: accent, borderColor: rgba(accent, 0.4), background: rgba(accent, 0.08) }}
                  >
                    #{t} ×
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-gray-600 italic">Hashtags will appear after generating.</div>
            )}
          </div>

          <div>
            <div className="text-[10px] text-gray-500 mb-1.5">When</div>
            <input
              value={when}
              onChange={e => setWhen(e.target.value)}
              placeholder="Today 17:00"
              className="w-full bg-[#0a0c14] border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gray-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] text-gray-500">Attach media</div>
              <div className="text-[10px] text-gray-600">{attachments.length}/{MAX_ATTACHMENTS}</div>
            </div>
            <div
              onDragOver={e => { e.preventDefault(); }}
              onDrop={e => { e.preventDefault(); handleAttachFiles(e.dataTransfer.files); }}
              className="rounded-lg border border-dashed border-gray-700 bg-[#0a0c14] p-3 text-center"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachments.length >= MAX_ATTACHMENTS}
                aria-label="Attach photo or video"
                className="text-[11px] font-semibold rounded-md px-3 py-1.5 border border-gray-700 text-gray-200 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Choose files
              </button>
              <div className="text-[10px] text-gray-600 mt-1.5">or drop images / videos here · max 10MB each</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={e => { handleAttachFiles(e.target.files); if (e.target) e.target.value = ''; }}
              />
            </div>
            {attachments.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {attachments.map((m, i) => (
                  <div key={i} className="relative group rounded-md overflow-hidden border border-gray-800 aspect-square bg-black">
                    {m.type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.dataUrl} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <video src={m.dataUrl} poster={m.poster} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                        <div className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-black/70 rounded px-1.5 py-0.5">▶ Video</div>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      aria-label={`Remove ${m.name}`}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[11px] leading-none flex items-center justify-center hover:bg-black"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={saveDraft}
              className="flex-1 text-xs font-semibold rounded-lg py-2 border border-gray-700 text-gray-200 hover:bg-gray-800"
            >
              Save draft
            </button>
            <button
              onClick={schedule}
              className="flex-1 text-xs font-semibold rounded-lg py-2 text-white"
              style={{ background: accent }}
            >
              Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostCard({
  post, accent, onDelete, onDuplicate, onMarkPublished,
}: {
  post: SocialPost;
  accent: string;
  onDelete: () => void;
  onDuplicate: () => void;
  onMarkPublished: () => void;
}) {
  const [open, setOpen] = useState(false);
  const statusMeta = {
    'scheduled':       { label: 'Scheduled',       fg: accent,       bg: rgba(accent, 0.15) },
    'draft':           { label: 'Draft',           fg: '#9ca3af',    bg: 'rgba(156,163,175,0.12)' },
    'published':       { label: 'Published',       fg: '#22c55e',    bg: 'rgba(34,197,94,0.12)' },
    'needs-approval':  { label: 'Needs approval',  fg: '#f59e0b',    bg: 'rgba(245,158,11,0.12)' },
  }[post.status];
  return (
    <div className="bg-[#0d0f1a] border border-gray-800 rounded-lg p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex gap-1 flex-shrink-0">
            {post.platforms.map(p => (
              <span
                key={p}
                title={PLATFORM_META[p].label}
                className="inline-flex items-center justify-center text-[9px] font-bold w-6 h-6 rounded border border-gray-700 text-gray-300"
              >
                {PLATFORM_META[p].glyph}
              </span>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-[10px] text-gray-500">{post.scheduledFor}</span>
              <span
                className="text-[9px] font-semibold rounded px-1.5 py-0.5"
                style={{ color: statusMeta.fg, background: statusMeta.bg }}
              >
                {statusMeta.label}
              </span>
            </div>
            <div className="text-xs text-gray-200 leading-snug" style={{
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{post.caption}</div>
            {post.media && post.media.length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {post.media.slice(0, 4).map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { if (typeof window !== 'undefined') window.open(m.dataUrl, '_blank', 'noopener'); }}
                    aria-label={`Open ${m.name} in a new tab`}
                    className="relative rounded-md overflow-hidden border border-gray-700 bg-black flex-shrink-0"
                    style={{ width: 64, height: 64 }}
                  >
                    {m.type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.dataUrl} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <video src={m.dataUrl} poster={m.poster} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0.5 left-0.5 text-[8px] font-bold text-white bg-black/70 rounded px-1 leading-tight">▶</div>
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}
            {post.hashtags.length > 0 && (
              <div className="text-[10px] mt-1" style={{ color: accent }}>
                {post.hashtags.map(h => `#${h}`).join(' ')}
              </div>
            )}
          </div>
        </div>
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
            className="text-gray-500 hover:text-gray-200 text-lg leading-none px-1"
          >…</button>
          {open && (
            <div
              role="menu"
              className="absolute right-0 top-6 bg-[#0a0c14] border border-gray-700 rounded-lg shadow-xl py-1 z-20 min-w-[140px]"
            >
              <MenuItem onClick={() => { onDuplicate(); setOpen(false); }}>Duplicate</MenuItem>
              <MenuItem onClick={() => { onMarkPublished(); setOpen(false); }}>Mark published</MenuItem>
              <MenuItem danger onClick={() => { onDelete(); setOpen(false); }}>Delete</MenuItem>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`w-full text-left text-xs px-3 py-1.5 ${danger ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-200 hover:bg-gray-800'}`}
    >{children}</button>
  );
}

// ═════ SPONSORS TAB ═══════════════════════════════════════════════════════════
function SponsorsTab({
  accent, sponsors, setSponsors, stats, onToast, extra,
}: {
  accent: string;
  sponsors: Sponsor[];
  setSponsors: React.Dispatch<React.SetStateAction<Sponsor[]>>;
  stats: { active: number; obligationsThisMonth: number; overdue: number; monthlyValue: string };
  onToast: (s: string) => void;
  extra?: { label?: string; node?: React.ReactNode };
}) {
  const [expanded, setExpanded] = useState(false);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newText, setNewText] = useState('');
  const [newDue, setNewDue] = useState('');

  const toggleObligation = (sponsorId: string, obligationId: string) => {
    let completedSponsorName: string | null = null;
    setSponsors(list => list.map(s => {
      if (s.id !== sponsorId) return s;
      const next: Sponsor = {
        ...s,
        obligations: s.obligations.map(o =>
          o.id === obligationId ? { ...o, done: !o.done } : o,
        ),
      };
      const total = next.obligations.length;
      const done = next.obligations.filter(o => o.done).length;
      if (total > 0 && done === total) completedSponsorName = next.name;
      return next;
    }));
    if (completedSponsorName) {
      onToast(`${completedSponsorName}: all obligations complete ✓`);
    }
  };

  const addObligation = (sponsorId: string) => {
    if (!newText.trim()) { setAddingFor(null); return; }
    const ob: SponsorObligation = {
      id: uid('o'),
      text: newText.trim(),
      done: false,
      dueDate: newDue.trim() || undefined,
    };
    setSponsors(list => list.map(s => s.id === sponsorId ? { ...s, obligations: [...s.obligations, ob] } : s));
    setNewText(''); setNewDue(''); setAddingFor(null);
    onToast('Obligation added');
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCell accent={accent} label="Active sponsors" value={String(stats.active)} />
        <StatCell accent={accent} label="Obligations this month" value={String(stats.obligationsThisMonth)} />
        <StatCell accent={accent} label="Overdue" value={String(stats.overdue)} tone={stats.overdue > 0 ? 'warn' : undefined} />
        <StatCell accent={accent} label="Monthly value" value={stats.monthlyValue} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sponsors.map(s => {
          const total = s.obligations.length;
          const done = s.obligations.filter(o => o.done).length;
          const pct = total === 0 ? 0 : Math.round((done / total) * 100);
          return (
            <div key={s.id} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div
                  aria-hidden
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: s.colour }}
                >{s.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{s.name}</div>
                  <div className="text-[11px] text-gray-400">{s.contractValue}</div>
                  <div className="text-[10px] text-gray-500">{s.contractDuration} · {s.monthlyValue}</div>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                  <span>Obligations {done}/{total}</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 rounded bg-gray-800 overflow-hidden">
                  <div className="h-full rounded transition-all" style={{ width: `${pct}%`, background: accent }} />
                </div>
              </div>

              {/* Checklist */}
              <ul className="space-y-1.5 mb-3">
                {s.obligations.map(o => (
                  <li key={o.id} className="flex items-start gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={o.done}
                      onChange={() => toggleObligation(s.id, o.id)}
                      className="mt-0.5 w-3.5 h-3.5 accent-current flex-shrink-0"
                      style={{ accentColor: accent }}
                      aria-label={o.text}
                    />
                    <div className="flex-1">
                      <div className={o.done ? 'line-through text-gray-500' : 'text-gray-200'}>{o.text}</div>
                      {o.dueDate && (
                        <div className={`text-[10px] ${/overdue/i.test(o.dueDate) ? 'text-red-400' : 'text-gray-500'}`}>
                          Due: {o.dueDate}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <div className="text-[10px] text-gray-500">Next: {s.nextDeadline}</div>
                {addingFor === s.id ? (
                  <div className="flex gap-1.5 w-full pl-3">
                    <input
                      autoFocus
                      value={newText}
                      onChange={e => setNewText(e.target.value)}
                      placeholder="New obligation"
                      className="flex-1 bg-[#0a0c14] border border-gray-800 rounded px-2 py-1 text-[11px] text-white"
                      onKeyDown={e => { if (e.key === 'Enter') addObligation(s.id); if (e.key === 'Escape') setAddingFor(null); }}
                    />
                    <input
                      value={newDue}
                      onChange={e => setNewDue(e.target.value)}
                      placeholder="Due"
                      className="w-20 bg-[#0a0c14] border border-gray-800 rounded px-2 py-1 text-[11px] text-white"
                    />
                    <button onClick={() => addObligation(s.id)} className="text-[10px] font-semibold px-2 rounded text-white" style={{ background: accent }}>OK</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingFor(s.id)}
                    className="text-[10px] font-semibold text-gray-400 hover:text-white"
                  >+ Add obligation</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Brand Usage Guidelines (expandable) or absorbed existing content */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl">
        <button
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
          className="w-full flex items-center justify-between p-4 text-sm font-semibold text-white"
        >
          <span>{extra?.node ? (extra.label || 'Brand Usage Guidelines') : 'Brand Usage Guidelines'}</span>
          <span className="text-gray-400">{expanded ? '−' : '+'}</span>
        </button>
        {expanded && (
          <div className="px-4 pb-4 border-t border-gray-800">
            {extra?.node ? (
              <div className="pt-3">{extra.node}</div>
            ) : (
              <ul className="space-y-2 pt-3 text-xs text-gray-400">
                <li>• Sponsor logos must appear in agreed placements — see individual contracts above.</li>
                <li>• Social captions mentioning a partner require approval from the player&rsquo;s agent and the sponsor marketing lead.</li>
                <li>• No competitor brand visibility in official content. Cropping is fine; blurring is not.</li>
                <li>• Campaign shoots: 48-hour review before publication.</li>
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═════ PRESS TAB ═════════════════════════════════════════════════════════════
function PressTab({
  accent, mentions, setMentions, seedStats, onToast, extra,
}: {
  accent: string;
  mentions: PressMention[];
  setMentions: React.Dispatch<React.SetStateAction<PressMention[]>>;
  seedStats: ReturnType<typeof getMediaContent>['stats'];
  onToast: (s: string) => void;
  extra?: { label?: string; node?: React.ReactNode };
}) {
  const [logFor, setLogFor] = useState<string | null>(null);
  const [logText, setLogText] = useState('');
  const [extraOpen, setExtraOpen] = useState(true);

  const submitLog = () => {
    if (!logText.trim()) { setLogFor(null); return; }
    onToast('Response logged');
    setLogText(''); setLogFor(null);
  };

  const remove = (id: string) => setMentions(m => m.filter(x => x.id !== id));

  const sentimentTotal =
    seedStats.sentimentSplit.positive +
    seedStats.sentimentSplit.neutral +
    seedStats.sentimentSplit.negative || 1;
  const posPct = Math.round((seedStats.sentimentSplit.positive / sentimentTotal) * 100);
  const neuPct = Math.round((seedStats.sentimentSplit.neutral / sentimentTotal) * 100);
  const negPct = 100 - posPct - neuPct;

  return (
    <div className="space-y-5">
      {extra?.node && (
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl">
          <button
            onClick={() => setExtraOpen(o => !o)}
            aria-expanded={extraOpen}
            className="w-full flex items-center justify-between p-4 text-sm font-semibold text-white"
          >
            <span>{extra.label || 'Existing tools'}</span>
            <span className="text-gray-400">{extraOpen ? '−' : '+'}</span>
          </button>
          {extraOpen && <div className="px-4 pb-4 border-t border-gray-800 pt-3">{extra.node}</div>}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCell accent={accent} label="Mentions this week" value={String(seedStats.press.mentionsThisWeek)} />
        <StatCell accent={accent} label="Sentiment" value={seedStats.press.sentiment} />
        <StatCell accent={accent} label="Top outlet" value={seedStats.press.topOutlet} />
        <StatCell accent={accent} label="Interview requests" value={String(seedStats.press.pendingRequests)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Feed */}
        <div className="lg:col-span-2 space-y-3">
          {mentions.map(m => {
            const sentimentMeta = m.sentiment === 'positive'
              ? { label: 'Positive', fg: '#22c55e' }
              : m.sentiment === 'negative'
                ? { label: 'Negative', fg: '#ef4444' }
                : { label: 'Neutral',  fg: '#9ca3af' };
            return (
              <div key={m.id} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">{m.outlet} · {m.date}</div>
                    <div className="text-sm font-semibold text-white leading-snug">{m.headline}</div>
                  </div>
                  <span className="text-[10px] font-semibold rounded px-1.5 py-0.5 flex-shrink-0"
                    style={{ color: sentimentMeta.fg, background: rgba(sentimentMeta.fg, 0.12) }}
                  >{sentimentMeta.label}</span>
                </div>
                <div className="text-xs text-gray-400 mb-3 leading-relaxed">{m.excerpt}</div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">By {m.author}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLogFor(m.id)}
                      className="font-semibold rounded-md px-2 py-1 border hover:bg-gray-900"
                      style={{ color: accent, borderColor: rgba(accent, 0.4) }}
                    >Log response</button>
                    <span className="text-gray-600 cursor-default select-none" title="Demo only">Read</span>
                    <button onClick={() => remove(m.id)} className="text-gray-600 hover:text-red-400">Remove</button>
                  </div>
                </div>
                {logFor === m.id && (
                  <div className="mt-3 pt-3 border-t border-gray-800 flex gap-2">
                    <input
                      autoFocus
                      value={logText}
                      onChange={e => setLogText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') submitLog(); if (e.key === 'Escape') { setLogFor(null); setLogText(''); } }}
                      placeholder="What was the response? (stored in session)"
                      className="flex-1 bg-[#0a0c14] border border-gray-800 rounded-md px-2 py-1 text-xs text-white"
                    />
                    <button onClick={submitLog} className="text-xs font-semibold px-3 rounded-md text-white" style={{ background: accent }}>Log</button>
                  </div>
                )}
              </div>
            );
          })}
          {mentions.length === 0 && (
            <div className="text-xs text-gray-500 italic">No press mentions.</div>
          )}
        </div>

        {/* Sidebar charts */}
        <div className="space-y-4">
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-white mb-3">Mention velocity — 7d</div>
            <MentionBars values={seedStats.mentionVelocity} accent={accent} />
          </div>
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-white mb-3">Sentiment</div>
            <SentimentDonut positive={posPct} neutral={neuPct} negative={negPct} accent={accent} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MentionBars({ values, accent }: { values: number[]; accent: string }) {
  const max = Math.max(1, ...values);
  const labels = ['−6d', '−5d', '−4d', '−3d', '−2d', 'Yday', 'Today'];
  return (
    <svg viewBox="0 0 140 80" className="w-full h-24" role="img" aria-label="7-day mention velocity">
      {values.map((v, i) => {
        const w = 14;
        const x = 6 + i * 20;
        const h = (v / max) * 60;
        const y = 70 - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx={2} fill={accent} opacity={0.8} />
            <text x={x + w / 2} y={78} fontSize="7" textAnchor="middle" fill="#6b7280">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function SentimentDonut({ positive, neutral, negative, accent }: { positive: number; neutral: number; negative: number; accent: string }) {
  const r = 30, cx = 60, cy = 40, C = 2 * Math.PI * r;
  const pPos = Math.max(0, Math.min(100, positive));
  const pNeu = Math.max(0, Math.min(100, neutral));
  const pNeg = Math.max(0, Math.min(100, negative));
  const seg = (pct: number) => (pct / 100) * C;
  const posLen = seg(pPos), neuLen = seg(pNeu), negLen = seg(pNeg);
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 80" className="w-28 h-20" role="img" aria-label="Sentiment breakdown">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1f2937" strokeWidth="10" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={accent} strokeWidth="10"
          strokeDasharray={`${posLen} ${C - posLen}`} strokeDashoffset="0" transform={`rotate(-90 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#9ca3af" strokeWidth="10"
          strokeDasharray={`${neuLen} ${C - neuLen}`} strokeDashoffset={`-${posLen}`} transform={`rotate(-90 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ef4444" strokeWidth="10"
          strokeDasharray={`${negLen} ${C - negLen}`} strokeDashoffset={`-${posLen + neuLen}`} transform={`rotate(-90 ${cx} ${cy})`} />
      </svg>
      <div className="text-[10px] space-y-0.5">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: accent }} /> <span className="text-gray-300">Pos {pPos}%</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" /> <span className="text-gray-300">Neu {pNeu}%</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> <span className="text-gray-300">Neg {pNeg}%</span></div>
      </div>
    </div>
  );
}

// ═════ INTERVIEWS TAB ════════════════════════════════════════════════════════
function InterviewsTab({
  accent, interviews, setInterviews, selectedId, setSelectedId, onToast,
}: {
  accent: string;
  interviews: Interview[];
  setInterviews: React.Dispatch<React.SetStateAction<Interview[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onToast: (s: string) => void;
}) {
  const selected = interviews.find(i => i.id === selectedId) ?? null;

  const addInterview = () => {
    const id = uid('int');
    const blank: Interview = {
      id,
      outlet: 'New outlet',
      journalist: 'TBC',
      datetime: 'TBC',
      format: 'video',
      prepStatus: 'not-started',
      topics: [],
      talkingPoints: [],
      topicsToAvoid: [],
      keyStats: [],
    };
    setInterviews(list => [blank, ...list]);
    setSelectedId(id);
    onToast('Interview added');
  };

  const updateSelected = (patch: Partial<Interview>) => {
    if (!selected) return;
    setInterviews(list => list.map(i => i.id === selected.id ? { ...i, ...patch } : i));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* List */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-white">Upcoming</div>
          <button
            onClick={addInterview}
            className="text-[10px] font-semibold rounded-md px-2 py-1 text-white"
            style={{ background: accent }}
          >+ New interview</button>
        </div>
        <div className="space-y-2">
          {interviews.map(i => {
            const active = i.id === selectedId;
            return (
              <button
                key={i.id}
                onClick={() => setSelectedId(i.id)}
                aria-pressed={active}
                className="w-full text-left bg-[#0d0f1a] border rounded-lg p-3 transition-all"
                style={{ borderColor: active ? accent : '#1f2937' }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-sm font-semibold text-white truncate">{i.outlet}</div>
                  <span className="text-[10px] font-semibold rounded px-1.5 py-0.5"
                    style={{ color: prepStatusColor(i.prepStatus, accent), background: rgba(prepStatusColor(i.prepStatus, accent), 0.12) }}
                  >{prepStatusLabel(i.prepStatus)}</span>
                </div>
                <div className="text-[11px] text-gray-400">{i.journalist} · {i.datetime}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] uppercase tracking-wider rounded px-1.5 py-0.5 border border-gray-700 text-gray-400">{formatLabel(i.format)}</span>
                  {i.topics.slice(0, 2).map(t => (
                    <span key={t} className="text-[10px] rounded px-1.5 py-0.5 bg-gray-800 text-gray-300">{t}</span>
                  ))}
                  {i.topics.length > 2 && <span className="text-[10px] text-gray-500">+{i.topics.length - 2}</span>}
                </div>
              </button>
            );
          })}
          {interviews.length === 0 && (
            <div className="text-xs text-gray-500 italic">No interviews yet.</div>
          )}
        </div>
      </div>

      {/* Prep panel */}
      <div className="lg:col-span-3">
        {selected ? (
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <input
                  value={selected.outlet}
                  onChange={e => updateSelected({ outlet: e.target.value })}
                  className="bg-transparent text-sm font-semibold text-white border-b border-transparent focus:border-gray-700 outline-none"
                  aria-label="Outlet"
                />
                <div className="flex items-center gap-2 mt-1">
                  <input
                    value={selected.journalist}
                    onChange={e => updateSelected({ journalist: e.target.value })}
                    className="bg-transparent text-[11px] text-gray-400 border-b border-transparent focus:border-gray-700 outline-none"
                    aria-label="Journalist"
                  />
                  <span className="text-gray-600 text-[11px]">·</span>
                  <input
                    value={selected.datetime}
                    onChange={e => updateSelected({ datetime: e.target.value })}
                    className="bg-transparent text-[11px] text-gray-400 border-b border-transparent focus:border-gray-700 outline-none"
                    aria-label="Date and time"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selected.format}
                  onChange={e => updateSelected({ format: e.target.value as Interview['format'] })}
                  className="bg-[#0a0c14] border border-gray-800 rounded-md text-[11px] text-gray-300 px-2 py-1"
                >
                  <option value="in-person">In-person</option>
                  <option value="phone">Phone</option>
                  <option value="video">Video</option>
                  <option value="written">Written</option>
                </select>
                <button
                  onClick={() => { updateSelected({ prepStatus: 'ready' }); onToast('Prep marked ready ✓'); }}
                  disabled={selected.prepStatus === 'ready'}
                  className="text-[11px] font-semibold rounded-md px-3 py-1 text-white disabled:opacity-50"
                  style={{ background: accent }}
                >Mark prep ready</button>
              </div>
            </div>

            <EditableList
              title="Talking points"
              items={selected.talkingPoints}
              onChange={(items) => updateSelected({ talkingPoints: items })}
              accent={accent}
              placeholder="Add a talking point…"
            />
            <EditableList
              title="Topics to avoid"
              items={selected.topicsToAvoid}
              onChange={(items) => updateSelected({ topicsToAvoid: items })}
              accent={accent}
              placeholder="Add a topic to avoid…"
            />
            <EditableList
              title="Key stats to mention"
              items={selected.keyStats}
              onChange={(items) => updateSelected({ keyStats: items })}
              accent={accent}
              placeholder="Add a key stat…"
            />
          </div>
        ) : (
          <div className="text-xs text-gray-500 italic">Select an interview to view prep.</div>
        )}
      </div>
    </div>
  );
}

function EditableList({
  title, items, onChange, accent, placeholder,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  accent: string;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft('');
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div>
      <div className="text-xs font-semibold text-white mb-1.5">{title}</div>
      {items.length === 0 ? (
        <div className="text-[11px] text-gray-600 italic mb-2">None yet.</div>
      ) : (
        <ul className="space-y-1 mb-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
              <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accent }} />
              <span className="flex-1">{it}</span>
              <button
                onClick={() => remove(i)}
                className="text-gray-600 hover:text-red-400 text-[10px]"
                aria-label={`Remove ${it}`}
              >×</button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 bg-[#0a0c14] border border-gray-800 rounded-md text-xs text-white px-2 py-1 focus:outline-none focus:border-gray-600"
        />
        <button
          onClick={add}
          className="text-[11px] font-semibold rounded-md px-3 text-white"
          style={{ background: accent }}
        >Add</button>
      </div>
    </div>
  );
}

// ─── shared bits ──────────────────────────────────────────────────────────────
function StatCell({ accent, label, value, tone }: { accent: string; label: string; value: string; tone?: 'warn' }) {
  return (
    <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
      <div className="text-lg font-bold" style={{ color: tone === 'warn' ? '#f59e0b' : accent }}>{value}</div>
    </div>
  );
}

// Parse display strings like "247K", "30.2K", "1.5M" → raw numbers.
// Returns NaN for placeholders ("TODO") or anything unparseable — callers
// must treat NaN as "no delta to show".
function parseFollowerCount(s: string): number {
  const m = /^([\d.]+)\s*([KMB]?)\s*$/i.exec(s.trim());
  if (!m) return NaN;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return NaN;
  const mult = m[2]?.toUpperCase();
  if (mult === 'K') return n * 1_000;
  if (mult === 'M') return n * 1_000_000;
  if (mult === 'B') return n * 1_000_000_000;
  return n;
}

function FollowerCard({ platform, value, sub, tint }: {
  platform: string;
  value: { current: string; lastMonth: string };
  sub: string;
  tint: string;
}) {
  const cur = parseFollowerCount(value.current);
  const prev = parseFollowerCount(value.lastMonth);
  const deltaPct = Number.isFinite(cur) && Number.isFinite(prev) && prev > 0
    ? ((cur - prev) / prev) * 100
    : null;

  let deltaNode: React.ReactNode = null;
  if (deltaPct !== null) {
    const rounded = Math.round(deltaPct * 10) / 10;
    const absRounded = Math.abs(rounded);
    const isFlat = absRounded < 0.05;
    const color = isFlat ? '#9ca3af' : rounded > 0 ? '#22c55e' : '#ef4444';
    const arrow = isFlat ? '—' : rounded > 0 ? '↑' : '↓';
    const label = isFlat
      ? 'flat vs last month'
      : `${absRounded.toFixed(1)}% vs last month`;
    deltaNode = (
      <div className="text-[10px] mt-1 flex items-center gap-1" style={{ color }}>
        <span>{arrow}</span>
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        background: `linear-gradient(135deg, ${rgba(tint, 0.18)}, ${rgba(tint, 0.04)})`,
        borderColor: rgba(tint, 0.3),
      }}
    >
      <div className="text-2xl font-bold text-white leading-none mb-1">{value.current}</div>
      <div className="text-sm" style={{ color: tint }}>{platform}</div>
      <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{sub}</div>
      {deltaNode}
    </div>
  );
}

function prepStatusLabel(s: InterviewPrepStatus): string {
  if (s === 'ready') return 'Ready';
  if (s === 'in-progress') return 'In progress';
  return 'Not started';
}
function prepStatusColor(s: InterviewPrepStatus, accent: string): string {
  if (s === 'ready') return accent;
  if (s === 'in-progress') return '#f59e0b';
  return '#9ca3af';
}
function formatLabel(f: Interview['format']): string {
  if (f === 'in-person') return 'In-person';
  if (f === 'phone')     return 'Phone';
  if (f === 'video')     return 'Video';
  return 'Written';
}
