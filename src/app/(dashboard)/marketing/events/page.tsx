'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ChevronRight, Check, Loader2, Sparkles,
  Calendar, Mail, Users, PoundSterling, MapPin,
  Linkedin, Twitter, Instagram, Plus, X, Eye, EyeOff,
  Clock, Send, ChevronDown, ChevronUp
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  { id: 'conference',        label: 'Conference',        emoji: '🎤' },
  { id: 'webinar',           label: 'Webinar',           emoji: '💻' },
  { id: 'product_launch',    label: 'Product Launch',    emoji: '🚀' },
  { id: 'networking',        label: 'Networking',        emoji: '🤝' },
  { id: 'workshop',          label: 'Workshop',          emoji: '🛠️' },
  { id: 'trade_show',        label: 'Trade Show',        emoji: '🏪' },
  { id: 'award_ceremony',    label: 'Award Ceremony',    emoji: '🏆' },
  { id: 'team_away_day',     label: 'Team Away Day',     emoji: '🗺️' },
  { id: 'client_dinner',     label: 'Client Dinner',     emoji: '🍽️' },
  { id: 'press_briefing',    label: 'Press Briefing',    emoji: '📰' },
  { id: 'podcast_live',      label: 'Podcast Live',      emoji: '🎙️' },
  { id: 'roadshow',          label: 'Roadshow',          emoji: '🚌' },
  { id: 'hackathon',         label: 'Hackathon',         emoji: '⌨️' },
  { id: 'panel_discussion',  label: 'Panel Discussion',  emoji: '🗣️' },
  { id: 'charity_event',     label: 'Charity Event',     emoji: '💝' },
  { id: 'brand_activation',  label: 'Brand Activation',  emoji: '✨' },
]

const FORMAT_OPTIONS = [
  { id: 'in-person', label: 'In-person' },
  { id: 'virtual',   label: 'Virtual' },
  { id: 'hybrid',    label: 'Hybrid' },
]

const AUDIENCE_OPTIONS = [
  { id: 'customers', label: 'Customers' },
  { id: 'prospects', label: 'Prospects' },
  { id: 'partners',  label: 'Partners' },
  { id: 'press',     label: 'Press' },
  { id: 'internal',  label: 'Internal' },
  { id: 'public',    label: 'Public' },
]

const RESEARCH_TABS = [
  { id: 'venues',    label: 'Venues' },
  { id: 'timeline',  label: 'Timeline' },
  { id: 'budget',    label: 'Budget' },
  { id: 'promotion', label: 'Promotion' },
  { id: 'runofshow', label: 'Run of Show' },
  { id: 'themes',    label: 'Themes' },
]

const PROMO_CHANNELS = [
  { id: 'linkedin',  label: 'LinkedIn',  icon: Linkedin,  timing: '4 weeks before' },
  { id: 'email',     label: 'Email',     icon: Mail,      timing: '3 weeks before' },
  { id: 'twitter',   label: 'Twitter',   icon: Twitter,   timing: '2 weeks before' },
  { id: 'instagram', label: 'Instagram', icon: Instagram,  timing: '1 week before' },
]

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['Event Details', 'AI Research', 'Calendar & Logistics', 'Promotion']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                done   ? 'bg-teal-500 text-white' :
                active ? 'bg-purple-600 text-white' :
                         'bg-[#1F2937] text-[#6B7280]'
              }`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs whitespace-nowrap ${active ? 'text-[#F9FAFB]' : 'text-[#6B7280]'}`}>
                {label}
              </span>
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

// ─── Toast component ──────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-teal-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-4">
      <Check className="w-4 h-4" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketingEventsPage() {
  const [step, setStep] = useState(0)

  // Step 0 — Event Details
  const [eventName, setEventName]         = useState('')
  const [eventType, setEventType]         = useState('')
  const [format, setFormat]               = useState('')
  const [attendees, setAttendees]         = useState(50)
  const [audiences, setAudiences]         = useState<string[]>([])
  const [budget, setBudget]               = useState('')
  const [eventDate, setEventDate]         = useState('')
  const [location, setLocation]           = useState('')

  // Step 1 — AI Research
  const [researchLog, setResearchLog]     = useState<string[]>([])
  const [researchDone, setResearchDone]   = useState(false)
  const [researchResult, setResearchResult] = useState('')
  const [activeTab, setActiveTab]         = useState('venues')
  const [showFullReport, setShowFullReport] = useState(false)

  // Step 2 — Calendar & Logistics
  const [chosenVenue, setChosenVenue]       = useState('')
  const [confirmDate, setConfirmDate]       = useState('')
  const [contactInput, setContactInput]     = useState('')
  const [contacts, setContacts]             = useState<string[]>([])
  const [internalOwner, setInternalOwner]   = useState('')

  // Step 3 — Promotion
  const [promoDrafts, setPromoDrafts] = useState<Record<string, string>>({
    linkedin:  '',
    email:     '',
    twitter:   '',
    instagram: '',
  })

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  // ── helpers ──────────────────────────────────────────────────────────────────

  function toggleAudience(id: string) {
    setAudiences(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  function addContact() {
    const trimmed = contactInput.trim()
    if (trimmed && !contacts.includes(trimmed)) {
      setContacts(prev => [...prev, trimmed])
      setContactInput('')
    }
  }

  function removeContact(c: string) {
    setContacts(prev => prev.filter(x => x !== c))
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const selectedEventType = EVENT_TYPES.find(e => e.id === eventType)
  const resolvedLocation = location || 'TBC'
  const showLocation = format === 'in-person' || format === 'hybrid'

  const canProceedStep0 = eventName && eventType && format && audiences.length > 0 && eventDate

  // ── research ────────────────────────────────────────────────────────────────

  async function startResearch() {
    setStep(1)
    setResearchLog([])
    setResearchDone(false)
    setResearchResult('')

    const logs = [
      `Researching ${format} ${selectedEventType?.label ?? 'event'} venues for ${attendees} attendees…`,
      `Checking availability in ${resolvedLocation}…`,
      'Analysing venue ratings and reviews…',
      'Building event timeline and budget breakdown…',
      'Generating promotional plan…',
      'Research complete — preparing results.',
    ]

    for (const log of logs) {
      await new Promise(r => setTimeout(r, 600))
      setResearchLog(prev => [...prev, log])
    }

    // Call Anthropic API
    try {
      const audienceList = audiences.map(a => AUDIENCE_OPTIONS.find(o => o.id === a)?.label ?? a).join(', ')
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{ role: 'user', content: `Plan a ${selectedEventType?.label ?? eventType} event (${format}) for ${attendees} attendees in ${resolvedLocation} with budget of £${budget || 'flexible'} per head on ${eventDate}. Target audience: ${audienceList}. Provide:
1. Top 3 venue recommendations with: name, capacity, estimated cost, pros/cons, contact approach
2. Event timeline (8-week planning schedule)
3. Budget breakdown (venue, catering, AV, marketing, contingency)
4. Promotional plan: what to post when, on which channels
5. Run of show for the event day itself
6. 3 creative event theme ideas that match the brand
Format with clear headers and sections.` }]
        })
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.content?.[0]?.text ?? data.content ?? ''
        setResearchResult(typeof text === 'string' ? text : JSON.stringify(text))
      } else {
        // Fallback mock result
        setResearchResult(generateMockResult())
      }
    } catch {
      // Fallback mock result
      setResearchResult(generateMockResult())
    }

    // Pre-fill step 2 fields
    setConfirmDate(eventDate)

    // Generate default promo drafts
    const evtLabel = selectedEventType?.label ?? 'event'
    setPromoDrafts({
      linkedin: `We're thrilled to announce ${eventName}! 🎉\n\nJoin us for an incredible ${evtLabel} on ${eventDate}${showLocation ? ` in ${resolvedLocation}` : ''}.\n\nWhether you're a ${audiences.map(a => AUDIENCE_OPTIONS.find(o => o.id === a)?.label?.toLowerCase()).filter(Boolean).join(', ')}, this is an event you won't want to miss.\n\nSpaces are limited to ${attendees} attendees — secure your spot today.\n\n#${eventName.replace(/\s+/g, '')} #Events #Marketing`,
      email: `Subject: You're Invited — ${eventName}\n\nHi [First Name],\n\nWe'd love for you to join us at ${eventName}, a ${format} ${evtLabel} taking place on ${eventDate}${showLocation ? ` in ${resolvedLocation}` : ''}.\n\nWhat to expect:\n• Networking with industry leaders\n• Keynote presentations and panel discussions\n• Exclusive insights and takeaways\n\nSpaces are limited to ${attendees} attendees, so register early to avoid disappointment.\n\n[Register Now]\n\nBest regards,\nThe Marketing Team`,
      twitter: `📢 Save the date! ${eventName} is happening on ${eventDate}.\n\n${attendees} spots available for this must-attend ${evtLabel}.\n\nMore details coming soon 👇\n\n#${eventName.replace(/\s+/g, '')}`,
      instagram: `✨ ${eventName} ✨\n\n📅 ${eventDate}\n📍 ${showLocation ? resolvedLocation : 'Virtual'}\n👥 ${attendees} attendees\n\nWe're hosting a ${evtLabel} you won't want to miss. Tag someone who needs to be there! 👇\n\n#${eventName.replace(/\s+/g, '')} #EventMarketing #ComingSoon`,
    })

    setResearchDone(true)
  }

  function generateMockResult(): string {
    const evtLabel = selectedEventType?.label ?? 'Event'
    return `## 1. Top 3 Venue Recommendations

### Venue 1: The Grand Hall
- **Capacity:** Up to ${attendees + 50} guests
- **Estimated Cost:** £${Number(budget || 75) * attendees} total (£${budget || 75}/head)
- **Pros:** Central location, state-of-the-art AV, dedicated event coordinator
- **Cons:** Limited parking, books up quickly
- **Contact Approach:** Email events@grandhall.com or call 020 7946 0958

### Venue 2: Innovation Centre
- **Capacity:** Up to ${attendees + 100} guests
- **Estimated Cost:** £${Math.round(Number(budget || 75) * 0.8 * attendees)} total (£${Math.round(Number(budget || 75) * 0.8)}/head)
- **Pros:** Modern facilities, breakout rooms, on-site catering
- **Cons:** Slightly outside city centre, minimum spend required
- **Contact Approach:** Online booking portal or direct line 020 7946 0123

### Venue 3: Riverside Studios
- **Capacity:** Up to ${attendees + 30} guests
- **Estimated Cost:** £${Math.round(Number(budget || 75) * 1.1 * attendees)} total (£${Math.round(Number(budget || 75) * 1.1)}/head)
- **Pros:** Stunning river views, flexible layout, outdoor terrace
- **Cons:** Premium pricing, noise from nearby construction
- **Contact Approach:** Venue manager Sarah Chen — sarah@riverside.com

---

## 2. Event Timeline (8-Week Planning Schedule)

| Week | Tasks |
|------|-------|
| Week 1 | Finalise venue and sign contract. Brief design team on branding. |
| Week 2 | Confirm speakers/panellists. Draft promotional copy. |
| Week 3 | Launch registration page. Begin social media teaser campaign. |
| Week 4 | Send email invitations to primary audience. Confirm catering menu. |
| Week 5 | Reminder emails. Finalise AV requirements and run of show. |
| Week 6 | Print materials. Confirm all vendor deliveries. |
| Week 7 | Final attendee communications. Internal briefing and rehearsal. |
| Week 8 | Event week — final checks, setup day, event day, debrief. |

---

## 3. Budget Breakdown

| Category | Estimated Cost | % of Total |
|----------|---------------|------------|
| Venue hire | £${Math.round(Number(budget || 75) * attendees * 0.35)} | 35% |
| Catering & drinks | £${Math.round(Number(budget || 75) * attendees * 0.25)} | 25% |
| AV & production | £${Math.round(Number(budget || 75) * attendees * 0.15)} | 15% |
| Marketing & print | £${Math.round(Number(budget || 75) * attendees * 0.10)} | 10% |
| Staffing | £${Math.round(Number(budget || 75) * attendees * 0.05)} | 5% |
| Contingency (10%) | £${Math.round(Number(budget || 75) * attendees * 0.10)} | 10% |
| **Total** | **£${Number(budget || 75) * attendees}** | **100%** |

---

## 4. Promotional Plan

### 4 Weeks Before
- **LinkedIn:** Announcement post with event details and registration link
- **Email:** Save-the-date to VIP list and key contacts

### 3 Weeks Before
- **LinkedIn:** Speaker/agenda reveal post
- **Email:** Full invitation with agenda to broader list
- **Twitter:** Teaser thread with key highlights

### 2 Weeks Before
- **All channels:** Early-bird reminder / limited spots messaging
- **Instagram:** Behind-the-scenes preparation content

### 1 Week Before
- **Email:** Final reminder with logistics details
- **Social:** Countdown posts, speaker quotes, attendee testimonials

### Day of Event
- **Social:** Live posting, stories, real-time updates
- **Email:** Last-minute virtual join link (if hybrid)

---

## 5. Run of Show — Event Day

| Time | Activity |
|------|----------|
| 08:00 | Venue access — setup begins |
| 08:30 | AV check and rehearsal |
| 09:00 | Registration and welcome drinks |
| 09:30 | Opening remarks and welcome |
| 10:00 | Keynote session |
| 10:45 | Coffee break and networking |
| 11:15 | Panel discussion / workshop |
| 12:30 | Lunch and networking |
| 13:30 | Afternoon sessions |
| 15:00 | Afternoon break |
| 15:30 | Closing keynote / awards |
| 16:30 | Drinks reception and networking |
| 18:00 | Event close |
| 18:30 | Debrief with internal team |

---

## 6. Creative Event Theme Ideas

### Theme 1: "Horizon ${new Date().getFullYear()}"
A forward-looking theme focused on innovation and what's next. Clean, futuristic branding with gradient blues and whites. Perfect for a ${evtLabel} targeting industry leaders.

### Theme 2: "Connected"
A warm, community-driven theme emphasising relationships and collaboration. Earth tones with vibrant accent colours. Ideal for networking-heavy formats.

### Theme 3: "Spark"
An energetic, bold theme built around igniting ideas and inspiration. Electric colours, dynamic stage design, and interactive installations. Great for product launches and brand activations.`
  }

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#07080F] text-[#F9FAFB] px-6 py-8 max-w-4xl mx-auto">

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="mb-6">
        <Link href="/marketing" className="inline-flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Marketing
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono bg-[#1F2937] text-[#9CA3AF] px-2 py-0.5 rounded">MKT-EVENTS-02</span>
              <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded">AI Research agent</span>
            </div>
            <h1 className="text-2xl font-bold">Marketing Events — Event Planner</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">
              Plan your marketing event end-to-end — venue research, timeline, budget, and promotional content powered by AI.
            </p>
          </div>
        </div>
      </div>

      <StepIndicator current={step} />

      {/* ── Step 0: Event Details ─────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          {/* Event name */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Event name</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Give your event a working title.</p>
            <input
              type="text"
              value={eventName}
              onChange={e => setEventName(e.target.value)}
              placeholder="e.g. Lumio Product Summit 2026"
              className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          {/* Event type */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Event type</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Select the format that best describes your event.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {EVENT_TYPES.map(et => (
                <button
                  key={et.id}
                  onClick={() => setEventType(et.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    eventType === et.id
                      ? 'border-purple-500 bg-purple-600/10 text-purple-300'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}
                >
                  <span>{et.emoji}</span> {et.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Format</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">How will attendees participate?</p>
            <div className="flex gap-2">
              {FORMAT_OPTIONS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    format === f.id
                      ? 'border-purple-500 bg-purple-600/10 text-purple-300'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Attendees, audience, budget, date, location */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Expected attendees */}
              <div>
                <label className="text-xs text-[#6B7280] block mb-1.5">Expected attendees — {attendees}</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAttendees(a => Math.max(5, a - 10))}
                    className="w-9 h-9 rounded-lg border border-[#1F2937] flex items-center justify-center text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] transition-colors text-lg"
                  >
                    −
                  </button>
                  <div className="flex-1 bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-center text-[#F9FAFB]">
                    {attendees}
                  </div>
                  <button
                    onClick={() => setAttendees(a => Math.min(5000, a + 10))}
                    className="w-9 h-9 rounded-lg border border-[#1F2937] flex items-center justify-center text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] transition-colors text-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Budget per head */}
              <div>
                <label className="text-xs text-[#6B7280] block mb-1.5">Budget per head (£)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">£</span>
                  <input
                    type="number"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    placeholder="e.g. 75"
                    className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg pl-7 pr-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              {/* Target date */}
              <div>
                <label className="text-xs text-[#6B7280] block mb-1.5">Target date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              {/* Location (conditional) */}
              {showLocation && (
                <div>
                  <label className="text-xs text-[#6B7280] block mb-1.5">Location preference</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. London, Manchester, Edinburgh"
                    className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Target audience */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Target audience</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Select all that apply.</p>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_OPTIONS.map(a => (
                <button
                  key={a.id}
                  onClick={() => toggleAudience(a.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${
                    audiences.includes(a.id)
                      ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}
                >
                  {audiences.includes(a.id) && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={startResearch}
              disabled={!canProceedStep0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
            >
              <Sparkles className="w-4 h-4" /> Run AI Research
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: AI Research ──────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Loading log */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              {researchDone
                ? <Check className="w-4 h-4 text-teal-400" />
                : <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
              }
              <h2 className="font-semibold">{researchDone ? 'Research complete' : 'Researching your event…'}</h2>
            </div>
            <div className="space-y-2 font-mono text-sm">
              {researchLog.map((log, i) => (
                <div key={i} className={`flex items-start gap-2 ${i === researchLog.length - 1 && !researchDone ? 'text-teal-400' : 'text-[#6B7280]'}`}>
                  <span className="text-[#374151] select-none">{String(i + 1).padStart(2, '0')}</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Results — tabbed view */}
          {researchDone && researchResult && (
            <>
              <div className="bg-[#111318] border border-[#1F2937] rounded-xl overflow-hidden">
                {/* Tab bar */}
                <div className="flex gap-1 p-2 border-b border-[#1F2937] overflow-x-auto">
                  {RESEARCH_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setShowFullReport(false) }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        activeTab === tab.id && !showFullReport
                          ? 'bg-teal-600 text-white'
                          : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F2937]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowFullReport(!showFullReport)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ml-auto ${
                      showFullReport
                        ? 'bg-purple-600 text-white'
                        : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F2937]'
                    }`}
                  >
                    {showFullReport ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showFullReport ? 'Hide Full Report' : 'View Full Report'}
                  </button>
                </div>

                {/* Content area */}
                <div className="p-6">
                  {showFullReport ? (
                    <div className="text-sm text-[#D1D5DB] whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
                      {researchResult}
                    </div>
                  ) : (
                    <div className="text-sm text-[#D1D5DB] whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
                      {(() => {
                        // Try to extract relevant section
                        const sectionMap: Record<string, string[]> = {
                          venues:    ['venue', 'recommendation'],
                          timeline:  ['timeline', 'planning schedule', 'week'],
                          budget:    ['budget', 'breakdown', 'cost'],
                          promotion: ['promotional', 'promotion', 'channel', 'post'],
                          runofshow: ['run of show', 'event day', 'schedule'],
                          themes:    ['theme', 'creative'],
                        }
                        const keywords = sectionMap[activeTab] ?? []
                        const sections = researchResult.split(/(?=## \d)/g)
                        const matched = sections.find(s =>
                          keywords.some(kw => s.toLowerCase().includes(kw))
                        )
                        return matched ?? researchResult
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors"
                >
                  Continue to logistics <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Step 2: Calendar & Logistics ─────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Venue */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Confirm venue</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Type or paste your chosen venue from the research results.</p>
            <input
              type="text"
              value={chosenVenue}
              onChange={e => setChosenVenue(e.target.value)}
              placeholder="e.g. The Grand Hall, London"
              className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          {/* Date */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Confirm date</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Pre-filled from Step 1 — adjust if needed.</p>
            <input
              type="date"
              value={confirmDate}
              onChange={e => setConfirmDate(e.target.value)}
              className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] focus:outline-none focus:border-teal-500 transition-colors sm:w-64"
            />
          </div>

          {/* Key contacts */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Key contacts to invite</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Add names or email addresses of key attendees.</p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={contactInput}
                onChange={e => setContactInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addContact()}
                placeholder="Name or email"
                className="flex-1 bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors"
              />
              <button
                onClick={addContact}
                className="px-3 py-2 rounded-lg border border-[#1F2937] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {contacts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {contacts.map(c => (
                  <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1F2937] text-sm text-[#D1D5DB]">
                    {c}
                    <button onClick={() => removeContact(c)} className="text-[#6B7280] hover:text-[#F9FAFB] transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Internal owner */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Internal owner</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Who is responsible for this event?</p>
            <input
              type="text"
              value={internalOwner}
              onChange={e => setInternalOwner(e.target.value)}
              placeholder="e.g. Sarah Johnson"
              className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors sm:w-64"
            />
          </div>

          {/* Action buttons */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => showToast('Calendar events created')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-colors"
              >
                <Calendar className="w-4 h-4" /> {'\uD83D\uDCC5'} Create planning timeline in calendar
              </button>
              <button
                onClick={() => showToast('Save-the-date draft created in Gmail')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors"
              >
                <Mail className="w-4 h-4" /> {'\uD83D\uDCE7'} Send save the date
              </button>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">
              ← Back to research
            </button>
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors"
            >
              Continue to promotion <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Promotion Plan ───────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6 mb-2">
            <h2 className="font-semibold mb-1">Promotional content</h2>
            <p className="text-sm text-[#9CA3AF]">AI-generated drafts for each channel. Edit as needed before publishing.</p>
          </div>

          {/* Channel cards */}
          {PROMO_CHANNELS.map(channel => {
            const Icon = channel.icon
            return (
              <div key={channel.id} className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#9CA3AF]" />
                    <h3 className="font-semibold text-sm">{channel.label}</h3>
                  </div>
                  <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {channel.timing}
                  </span>
                </div>
                <textarea
                  value={promoDrafts[channel.id] ?? ''}
                  onChange={e => setPromoDrafts(prev => ({ ...prev, [channel.id]: e.target.value }))}
                  rows={6}
                  className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-4 py-3 text-sm text-[#F9FAFB] font-mono leading-relaxed focus:outline-none focus:border-teal-500 transition-colors resize-none"
                />
              </div>
            )
          })}

          {/* Create all drafts button */}
          <div className="flex justify-center">
            <button
              onClick={() => showToast('All promotional drafts created')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-colors"
            >
              <Send className="w-4 h-4" /> {'\uD83D\uDCE7'} Create all promotional drafts
            </button>
          </div>

          {/* Summary card */}
          <div className="bg-[#111318] border border-teal-500/30 rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-400" /> Event Summary
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#6B7280] block text-xs mb-0.5">Event name</span>
                <span className="text-[#F9FAFB]">{eventName || '—'}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-xs mb-0.5">Date</span>
                <span className="text-[#F9FAFB]">{confirmDate || eventDate || '—'}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-xs mb-0.5">Venue</span>
                <span className="text-[#F9FAFB]">{chosenVenue || '—'}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-xs mb-0.5">Attendees</span>
                <span className="text-[#F9FAFB]">{attendees}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-xs mb-0.5">Budget per head</span>
                <span className="text-[#F9FAFB]">{budget ? `£${budget}` : 'Flexible'}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-xs mb-0.5">Owner</span>
                <span className="text-[#F9FAFB]">{internalOwner || '—'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(2)} className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">
              ← Back to logistics
            </button>
            <Link
              href="/marketing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors"
            >
              Done — back to Marketing
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
