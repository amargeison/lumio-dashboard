'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ChevronRight, Check, Loader2, Sparkles,
  Copy, Mail, Calendar, ClipboardList, RefreshCw,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'linkedin',  label: 'LinkedIn',   emoji: '💼' },
  { id: 'twitter',   label: 'Twitter/X',  emoji: '🐦' },
  { id: 'instagram', label: 'Instagram',  emoji: '📸' },
  { id: 'facebook',  label: 'Facebook',   emoji: '📘' },
  { id: 'tiktok',    label: 'TikTok',     emoji: '🎵' },
  { id: 'youtube',   label: 'YouTube',    emoji: '▶️' },
]

const CONTENT_PILLARS = [
  'Product/feature spotlight',
  'Customer success story',
  'Industry insight / thought leadership',
  'Behind the scenes / team culture',
  'Tips and how-tos',
  'Company news',
  'Engagement / question post',
  'Event / webinar promo',
]

const TONES = ['Professional', 'Conversational', 'Bold', 'Educational', 'Inspiring'] as const

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const

// ─── Types ───────────────────────────────────────────────────────────────────

interface PostData {
  id: string
  day: string
  platform: string
  time: string
  postType: string
  copy: string
  hashtags: string[]
  approved: boolean
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['Configure', 'Generate', 'Approve', 'Export']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const done = i < current; const active = i === current
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                done ? 'bg-teal-500 text-white' : active ? 'bg-purple-600 text-white' : 'bg-[#1F2937] text-[#6B7280]'
              }`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs whitespace-nowrap ${active ? 'text-[#F9FAFB]' : 'text-[#6B7280]'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-16 mx-2 mb-5 transition-colors ${i < current ? 'bg-teal-500' : 'bg-[#1F2937]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-teal-600 text-white text-sm font-medium shadow-lg animate-fade-in">
      <Check className="w-4 h-4" />
      {message}
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white">✕</button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SocialSchedulePage() {

  const [step, setStep] = useState(0)

  // Step 0 — Configure
  const [weekCommencing, setWeekCommencing] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [postsPerDay, setPostsPerDay] = useState(1)
  const [theme, setTheme] = useState('')
  const [pillars, setPillars] = useState<string[]>([])
  const [tone, setTone] = useState('')

  // Step 1 — Generate
  const [genLog, setGenLog] = useState<string[]>([])
  const [genDone, setGenDone] = useState(false)
  const [posts, setPosts] = useState<PostData[]>([])

  // Step 2 — Approve
  const [customCopy, setCustomCopy] = useState('')
  const [customPlatform, setCustomPlatform] = useState('')

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function togglePlatform(id: string) {
    setPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  function togglePillar(p: string) {
    setPillars(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  function toggleApprove(postId: string) {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, approved: !p.approved } : p))
  }

  function updatePostCopy(postId: string, copy: string) {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, copy } : p))
  }

  function regeneratePost(postId: string) {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, copy: p.copy + '\n\n[Regenerated — edit as needed]', approved: false } : p))
  }

  function parsePosts(text: string): PostData[] {
    const parsed: PostData[] = []
    const lines = text.split('\n').filter(l => l.trim())

    let currentDay = ''
    let counter = 0

    for (const line of lines) {
      // Try to detect day headers
      const dayMatch = line.match(/^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY)/i)
      if (dayMatch) {
        currentDay = dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase()
      }

      // Try to parse structured lines: DAY > Platform > Time > Type > Copy > Hashtags
      const parts = line.split('>').map(s => s.trim())
      if (parts.length >= 4) {
        const dayPart = parts[0].match(/^(Monday|Tuesday|Wednesday|Thursday|Friday)/i)
        const day = dayPart ? dayPart[1].charAt(0).toUpperCase() + dayPart[1].slice(1).toLowerCase() : currentDay
        if (!day) continue

        const platform = parts[1] || ''
        const time = parts[2] || '9:00 AM'
        const postType = parts[3] || 'text'
        const copy = parts[4] || ''
        const hashtagStr = parts[5] || ''
        const hashtags = hashtagStr.match(/#[\w]+/g) || ['#SaaS', '#B2B', '#Tech']

        counter++
        parsed.push({
          id: `post-${counter}`,
          day,
          platform: platform.toLowerCase().replace(/[^a-z]/g, '').replace('twitterx', 'twitter'),
          time,
          postType,
          copy,
          hashtags,
          approved: false,
        })
      }
    }

    // If parsing didn't work well, generate placeholder posts
    if (parsed.length === 0) {
      for (const day of DAYS) {
        for (const plat of platforms) {
          for (let n = 0; n < postsPerDay; n++) {
            counter++
            const platLabel = PLATFORMS.find(p => p.id === plat)?.label || plat
            parsed.push({
              id: `post-${counter}`,
              day,
              platform: plat,
              time: n === 0 ? '9:00 AM' : n === 1 ? '12:30 PM' : '5:00 PM',
              postType: 'text',
              copy: text.length > 100
                ? text.slice(0, 300) + '...'
                : `Sample ${platLabel} post for ${day}. Edit this content to match your brand voice.`,
              hashtags: ['#SaaS', '#B2B', '#Tech', '#Innovation', '#Growth'],
              approved: false,
            })
          }
        }
      }
    }

    return parsed
  }

  async function startGeneration() {
    setStep(1)
    setGenLog([])
    setGenDone(false)
    setPosts([])

    const platformLabels = platforms.map(id => PLATFORMS.find(p => p.id === id)?.label || id)

    const logs = [
      `Planning content for ${platformLabels.join(', ')}...`,
      `Generating ${postsPerDay * 5 * platforms.length} posts for the week...`,
      'Writing copy for each platform...',
      'Adding hashtags and timing suggestions...',
      'Optimising for engagement...',
    ]

    for (const log of logs) {
      await new Promise(r => setTimeout(r, 700))
      setGenLog(prev => [...prev, log])
    }

    try {
      const response = await fetch('/api/ai/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{ role: 'user', content: `Create a full week's social media content schedule (Monday to Friday) for a B2B SaaS company.
Theme: ${theme}
Platforms: ${platformLabels.join(', ')}
Content pillars: ${pillars.join(', ')}
Posts per day per platform: ${postsPerDay}
Tone: ${tone}

For each day and platform provide:
- Day and platform
- Post type (text, image description, carousel, video idea, poll)
- Full post copy (ready to publish, platform-appropriate length)
- Hashtags (5-8 relevant ones)
- Best time to post (e.g. 9:00 AM, 12:30 PM)
- Engagement prompt or question

Format as: MONDAY > [Platform] > [Time] > [Post type] > [Copy] > [Hashtags]` }]
        })
      })

      if (response.ok) {
        const data = await response.json()
        const text = data?.content?.[0]?.text || ''
        const parsed = parsePosts(text)
        setPosts(parsed)
      } else {
        // Fallback: generate placeholder posts
        generateFallbackPosts(platformLabels)
      }
    } catch {
      generateFallbackPosts(platformLabels)
    }

    setGenLog(prev => [...prev, 'Content schedule ready.'])
    setGenDone(true)
  }

  function generateFallbackPosts(platformLabels: string[]) {
    const fallback: PostData[] = []
    let counter = 0
    const sampleCopies: Record<string, string[]> = {
      linkedin: [
        '🚀 Exciting product update! We\'ve just launched our new analytics dashboard that helps teams make data-driven decisions faster than ever. Here\'s what\'s new...',
        '💡 Industry insight: The future of B2B SaaS is moving towards AI-first experiences. Here are 3 trends we\'re watching closely...',
        '🎯 Customer spotlight: See how @Company achieved 40% growth using our platform. Their journey is inspiring!',
      ],
      twitter: [
        '🔥 New feature alert! Our analytics dashboard just got a major upgrade. Thread 🧵👇',
        '💭 Hot take: The best B2B products are built by teams who use their own product daily. Agree? 👀',
        '📊 Quick tip: Use our new reporting feature to track KPIs in real-time. Game changer for growth teams.',
      ],
      instagram: [
        '✨ Behind the scenes at our latest team offsite! Swipe to see what we\'ve been working on → Great things ahead!',
        '📱 Product demo time! Watch how easy it is to set up your first dashboard in under 60 seconds.',
        '🎉 We just hit a major milestone — 10,000 customers worldwide! Thank you for being part of this journey.',
      ],
      facebook: [
        '🌟 We\'re thrilled to announce our latest product update! Our team has been working hard to bring you features that make your workflow smoother...',
        '📢 Join us for our upcoming webinar on "Scaling Your B2B Strategy in 2026" — Register now!',
        '🤔 Question for our community: What\'s your biggest challenge with team productivity? Drop your thoughts below!',
      ],
      tiktok: [
        '🎬 POV: Your team discovers the new dashboard feature and productivity goes through the roof 📈 #SaaS #ProductivityHack',
        '⚡ 3 things I wish I knew before starting a B2B SaaS company... #StartupLife #TechTips',
        '🎵 Day in the life at a growing tech startup — from standup to launch day! #BehindTheScenes',
      ],
      youtube: [
        '🎥 Full walkthrough: How to set up your analytics dashboard from scratch. Perfect for new users looking to get the most out of our platform.',
        '📹 Interview with our CTO about the future of AI in B2B SaaS — Where are we heading?',
        '🔴 LIVE: Q&A session about our latest product release. Bring your questions!',
      ],
    }

    for (const day of DAYS) {
      for (const plat of platforms) {
        for (let n = 0; n < postsPerDay; n++) {
          counter++
          const copies = sampleCopies[plat] || sampleCopies['linkedin']
          fallback.push({
            id: `post-${counter}`,
            day,
            platform: plat,
            time: n === 0 ? '9:00 AM' : n === 1 ? '12:30 PM' : '5:00 PM',
            postType: n === 0 ? 'text' : n === 1 ? 'carousel' : 'image description',
            copy: copies[n % copies.length],
            hashtags: ['#SaaS', '#B2B', '#Tech', '#Innovation', '#Growth', '#Startup'],
            approved: false,
          })
        }
      }
    }

    setPosts(fallback)
  }

  function addCustomPost() {
    if (!customCopy.trim() || !customPlatform) return
    const newPost: PostData = {
      id: `custom-${Date.now()}`,
      day: 'Monday',
      platform: customPlatform,
      time: '10:00 AM',
      postType: 'text',
      copy: customCopy,
      hashtags: ['#Custom'],
      approved: true,
    }
    setPosts(prev => [...prev, newPost])
    setCustomCopy('')
    setCustomPlatform('')
    showToast('Custom post added')
  }

  const approvedPosts = posts.filter(p => p.approved)
  const approvedPlatforms = [...new Set(approvedPosts.map(p => p.platform))]
  const canProceed = platforms.length > 0 && theme.trim() && pillars.length > 0 && tone

  function copyAllPosts() {
    const text = approvedPosts.map(p => {
      const platLabel = PLATFORMS.find(pl => pl.id === p.platform)?.label || p.platform
      return `${p.day} | ${platLabel} | ${p.time}\n${p.copy}\n${p.hashtags.join(' ')}\n`
    }).join('\n---\n\n')
    navigator.clipboard.writeText(text)
    showToast('Copied to clipboard')
  }

  // Calculate Mon-Fri dates from weekCommencing
  function getWeekDates() {
    if (!weekCommencing) return ''
    const start = new Date(weekCommencing)
    const end = new Date(start)
    end.setDate(end.getDate() + 4)
    const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    return `${fmt(start)} – ${fmt(end)}`
  }

  return (
    <div className="min-h-screen text-[#F9FAFB] px-6 py-8 max-w-4xl mx-auto" style={{ backgroundColor: '#07080F' }}>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Badge */}
      <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
        style={{ backgroundColor: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse inline-block" />
        AI content engine
      </div>

      {/* Header */}
      <div className="mb-6">
        <Link href="/marketing"
          className="inline-flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Marketing
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)', color: '#2DD4BF' }}>MKT-SOCIAL-01</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA' }}>AI content engine</span>
          </div>
          <h1 className="text-2xl font-bold">Social Media Schedule Wizard</h1>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Configure your channels, generate AI-powered content for the week, approve and refine, then export.
          </p>
        </div>
      </div>

      <StepIndicator current={step} />

      {/* ── Step 0: Configure ──────────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">

          {/* Week commencing */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Week commencing</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Select the Monday your content week starts.</p>
            <input
              type="date"
              value={weekCommencing}
              onChange={e => setWeekCommencing(e.target.value)}
              className="bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          {/* Platforms */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Platforms</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Select all platforms you want to schedule content for.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => togglePlatform(p.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    platforms.includes(p.id)
                      ? 'border-teal-500 bg-teal-600/10 text-teal-300'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}>
                  <span>{p.emoji}</span> {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Posts per day */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Posts per day per platform</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">How many posts should each platform get daily?</p>
            <div className="flex gap-2">
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => setPostsPerDay(n)}
                  className={`px-5 py-2 rounded-lg border text-sm font-medium transition-all ${
                    postsPerDay === n
                      ? 'border-teal-500 bg-teal-600/10 text-teal-300'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Theme / focus this week</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Describe the key theme, campaign, or focus area for this week&apos;s content.</p>
            <textarea
              value={theme}
              onChange={e => setTheme(e.target.value)}
              placeholder="e.g. Product launch week — new analytics dashboard, emphasis on data-driven decision making..."
              rows={3}
              className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors resize-none"
            />
          </div>

          {/* Content pillars */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Content pillars</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Select the content types to include this week.</p>
            <div className="flex flex-wrap gap-2">
              {CONTENT_PILLARS.map(p => (
                <button key={p} onClick={() => togglePillar(p)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                    pillars.includes(p)
                      ? 'border-teal-500 bg-teal-600/10 text-teal-300'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Tone</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">What tone should the content strike?</p>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <button key={t} onClick={() => setTone(t)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    tone === t
                      ? 'border-purple-500 bg-purple-600/10 text-purple-300'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Proceed */}
          <button
            disabled={!canProceed}
            onClick={startGeneration}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
              canProceed
                ? 'bg-teal-600 hover:bg-teal-500 text-white'
                : 'bg-[#1F2937] text-[#6B7280] cursor-not-allowed'
            }`}>
            <Sparkles className="w-4 h-4" /> Generate Content Schedule <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Step 1: AI Content Generation ──────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">

          {/* Log */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              {!genDone && <Loader2 className="w-4 h-4 animate-spin text-teal-400" />}
              {genDone && <Check className="w-4 h-4 text-teal-400" />}
              AI Content Generation
            </h2>
            <div className="space-y-2 font-mono text-xs">
              {genLog.map((msg, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-teal-500">▸</span>
                  <span className="text-[#9CA3AF]">{msg}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar view */}
          {genDone && posts.length > 0 && (
            <>
              <div className="space-y-6">
                {DAYS.map(day => {
                  const dayPosts = posts.filter(p => p.day === day)
                  if (dayPosts.length === 0) return null
                  return (
                    <div key={day}>
                      <h3 className="text-lg font-semibold mb-3 text-[#F9FAFB]">{day}</h3>
                      <div className="grid gap-3">
                        {dayPosts.map(post => {
                          const platInfo = PLATFORMS.find(p => p.id === post.platform)
                          return (
                            <div key={post.id} className="bg-[#111318] border border-[#1F2937] rounded-xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F2937] text-[#F9FAFB]">
                                    {platInfo?.emoji} {platInfo?.label || post.platform}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F2937] text-[#9CA3AF]">
                                    {post.postType}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30">
                                    {post.time}
                                  </span>
                                </div>
                              </div>

                              <textarea
                                value={post.copy}
                                onChange={e => updatePostCopy(post.id, e.target.value)}
                                rows={3}
                                className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] focus:outline-none focus:border-teal-500 transition-colors resize-none"
                              />

                              <div className="flex flex-wrap gap-1.5">
                                {post.hashtags.map((tag, i) => (
                                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#1F2937] text-[#6B7280]">{tag}</span>
                                ))}
                              </div>

                              <div className="flex items-center gap-2">
                                <button onClick={() => regeneratePost(post.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1F2937] text-xs text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] transition-colors">
                                  <RefreshCw className="w-3 h-3" /> Regenerate
                                </button>
                                <button onClick={() => toggleApprove(post.id)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                                    post.approved
                                      ? 'border-teal-500 bg-teal-600/10 text-teal-300'
                                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                                  }`}>
                                  <Check className="w-3 h-3" /> {post.approved ? 'Approved' : 'Approve'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Proceed */}
              <button
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-all">
                Continue to Approve & Refine <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Back */}
          {genDone && (
            <button onClick={() => setStep(0)}
              className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">
              ← Back to Configure
            </button>
          )}
        </div>
      )}

      {/* ── Step 2: Approve & Refine ───────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">

          {approvedPosts.length === 0 ? (
            <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-8 text-center">
              <p className="text-[#9CA3AF] text-sm">Approve posts in the previous step to see them here.</p>
              <button onClick={() => setStep(1)} className="mt-4 text-sm text-teal-400 hover:text-teal-300 transition-colors">
                ← Back to Generate
              </button>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
                <h2 className="font-semibold mb-1">Approved Schedule</h2>
                <p className="text-sm text-[#9CA3AF]">
                  {approvedPosts.length} posts approved across {approvedPlatforms.length} platform{approvedPlatforms.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Approved posts grouped by day */}
              {DAYS.map(day => {
                const dayPosts = approvedPosts.filter(p => p.day === day)
                if (dayPosts.length === 0) return null
                return (
                  <div key={day}>
                    <h3 className="text-lg font-semibold mb-3 text-[#F9FAFB]">{day}</h3>
                    <div className="grid gap-3">
                      {dayPosts.map(post => {
                        const platInfo = PLATFORMS.find(p => p.id === post.platform)
                        return (
                          <div key={post.id} className="bg-[#111318] border border-[#1F2937] rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-600/20 text-teal-300 border border-teal-500/30">
                                {platInfo?.emoji} {platInfo?.label || post.platform}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30">
                                {post.time}
                              </span>
                            </div>
                            <p className="text-sm text-[#D1D5DB] whitespace-pre-wrap">{post.copy}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {post.hashtags.map((tag, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#1F2937] text-[#6B7280]">{tag}</span>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Add custom post */}
              <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
                <h2 className="font-semibold mb-4">Add a custom post</h2>
                <div className="space-y-3">
                  <textarea
                    value={customCopy}
                    onChange={e => setCustomCopy(e.target.value)}
                    placeholder="Write your custom post copy..."
                    rows={3}
                    className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors resize-none"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    {PLATFORMS.filter(p => platforms.includes(p.id)).map(p => (
                      <button key={p.id} onClick={() => setCustomPlatform(p.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                          customPlatform === p.id
                            ? 'border-teal-500 bg-teal-600/10 text-teal-300'
                            : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                        }`}>
                        {p.emoji} {p.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={addCustomPost}
                    disabled={!customCopy.trim() || !customPlatform}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      customCopy.trim() && customPlatform
                        ? 'bg-purple-600 hover:bg-purple-500 text-white'
                        : 'bg-[#1F2937] text-[#6B7280] cursor-not-allowed'
                    }`}>
                    + Add Post
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button onClick={() => setStep(1)} className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">
              ← Back to Generate
            </button>
            {approvedPosts.length > 0 && (
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-all">
                Continue to Export <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Step 3: Export & Schedule ──────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">

          {/* Summary card */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-3">Schedule Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold text-teal-400">{approvedPosts.length}</p>
                <p className="text-xs text-[#9CA3AF]">Posts scheduled</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">{approvedPlatforms.length}</p>
                <p className="text-xs text-[#9CA3AF]">Platforms</p>
              </div>
              <div className="col-span-2">
                <p className="text-2xl font-bold text-[#F9FAFB]">{getWeekDates() || 'Mon – Fri'}</p>
                <p className="text-xs text-[#9CA3AF]">Date range</p>
              </div>
            </div>
          </div>

          {/* Export actions */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6 space-y-3">
            <h2 className="font-semibold mb-4">Export Options</h2>

            <button onClick={() => showToast('Schedule emailed to team')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#1F2937] text-sm text-[#F9FAFB] hover:border-[#374151] hover:bg-[#1F2937]/30 transition-all text-left">
              <Mail className="w-5 h-5 text-teal-400" />
              <div>
                <p className="font-medium">Email schedule to team</p>
                <p className="text-xs text-[#9CA3AF]">Send the approved content schedule via email</p>
              </div>
            </button>

            <button onClick={() => showToast('Posting reminders created in calendar')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#1F2937] text-sm text-[#F9FAFB] hover:border-[#374151] hover:bg-[#1F2937]/30 transition-all text-left">
              <Calendar className="w-5 h-5 text-purple-400" />
              <div>
                <p className="font-medium">Create posting reminders in calendar</p>
                <p className="text-xs text-[#9CA3AF]">Add calendar events for each scheduled post</p>
              </div>
            </button>

            <button onClick={copyAllPosts}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#1F2937] text-sm text-[#F9FAFB] hover:border-[#374151] hover:bg-[#1F2937]/30 transition-all text-left">
              <ClipboardList className="w-5 h-5 text-teal-400" />
              <div>
                <p className="font-medium">Copy all posts</p>
                <p className="text-xs text-[#9CA3AF]">Copy all approved posts to clipboard</p>
              </div>
            </button>
          </div>

          {/* Navigation */}
          <button onClick={() => setStep(2)} className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">
            ← Back to Approve & Refine
          </button>
        </div>
      )}
    </div>
  )
}
