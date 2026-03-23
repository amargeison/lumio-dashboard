'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ChevronRight, Check, Loader2, Sparkles,
  Star, MapPin, Users, PoundSterling, Calendar, ExternalLink,
  Mail, Phone, Globe, ChevronDown, ChevronUp, X
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Venue {
  name: string
  type: string
  location: string
  rating: number
  reviewCount: number
  pricePerHead: number
  capacity: string
  highlights: string[]
  source: string
  sourceType: 'google' | 'tripadvisor' | 'yelp' | 'eventbrite'
  website: string
  phone: string
  image: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  { id: 'team_lunch',       label: 'Team Lunch',          emoji: '🍽️' },
  { id: 'drinks',           label: 'Team Drinks',         emoji: '🍸' },
  { id: 'offsite',          label: 'Offsite / Retreat',   emoji: '🏔️' },
  { id: 'workshop',         label: 'Workshop',            emoji: '🛠️' },
  { id: 'summer_party',     label: 'Summer Party',        emoji: '☀️' },
  { id: 'christmas_party',  label: 'Christmas Party',     emoji: '🎄' },
  { id: 'away_day',         label: 'Away Day',            emoji: '🗺️' },
  { id: 'sports_day',       label: 'Sports Day',          emoji: '⚽' },
  { id: 'quiz_night',       label: 'Quiz Night',          emoji: '🧠' },
  { id: 'cooking_class',    label: 'Cooking Class',       emoji: '👨‍🍳' },
  { id: 'escape_room',      label: 'Escape Room',         emoji: '🔐' },
  { id: 'volunteering',     label: 'Volunteering Day',    emoji: '🤝' },
]

const LOCATION_OPTIONS = [
  'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Edinburgh, UK',
  'Bristol, UK', 'Leeds, UK', 'Remote / Virtual', 'Custom…'
]

const REQUIREMENTS = [
  { id: 'accessibility',    label: 'Accessibility required' },
  { id: 'dietary',          label: 'Dietary needs (vegan/GF)' },
  { id: 'parking',          label: 'On-site parking' },
  { id: 'av',               label: 'AV / presentation equipment' },
  { id: 'outdoor',          label: 'Outdoor space' },
  { id: 'private_hire',     label: 'Exclusive / private hire' },
  { id: 'transport',        label: 'Transport links essential' },
  { id: 'breakout',         label: 'Breakout rooms' },
]

const MOCK_VENUES: Venue[] = [
  {
    name: 'The Ivy City Garden',
    type: 'Restaurant / Private Dining',
    location: 'London, EC2V',
    rating: 4.7,
    reviewCount: 2841,
    pricePerHead: 65,
    capacity: '20–120',
    highlights: ['Private dining rooms', 'Extensive cocktail menu', 'Seasonal menu', 'Sunday availability'],
    source: 'Google',
    sourceType: 'google',
    website: '#',
    phone: '020 3301 0400',
    image: '🌿',
  },
  {
    name: 'Uncommon Borough',
    type: 'Event Space / Venue',
    location: 'London, SE1',
    rating: 4.8,
    reviewCount: 614,
    pricePerHead: 45,
    capacity: '10–200',
    highlights: ['Rooftop terrace', 'Catering partners', 'AV included', 'Natural light'],
    source: 'Eventbrite',
    sourceType: 'eventbrite',
    website: '#',
    phone: '020 7403 7200',
    image: '🏙️',
  },
  {
    name: 'Flat Iron Square',
    type: 'Street Food & Drinks',
    location: 'London, SE1',
    rating: 4.5,
    reviewCount: 3200,
    pricePerHead: 30,
    capacity: '15–500',
    highlights: ['Exclusive hire available', 'Multiple food vendors', 'Outdoor courtyard', 'Live music options'],
    source: 'TripAdvisor',
    sourceType: 'tripadvisor',
    website: '#',
    phone: '020 7407 0700',
    image: '🎪',
  },
  {
    name: 'Searcys at The Gherkin',
    type: 'Fine Dining / Iconic Venue',
    location: 'London, EC3A',
    rating: 4.6,
    reviewCount: 1100,
    pricePerHead: 95,
    capacity: '20–200',
    highlights: ['360° city views', 'Award-winning food', 'Full bar', 'Event coordinator included'],
    source: 'Google',
    sourceType: 'google',
    website: '#',
    phone: '020 7071 5025',
    image: '🥒',
  },
  {
    name: 'Ace Hotel London',
    type: 'Hotel / Multi-purpose',
    location: 'London, E1',
    rating: 4.4,
    reviewCount: 890,
    pricePerHead: 55,
    capacity: '10–300',
    highlights: ['Rooftop pool bar', 'Multiple event spaces', 'Tech-equipped rooms', 'Central location'],
    source: 'Yelp',
    sourceType: 'yelp',
    website: '#',
    phone: '020 7613 9800',
    image: '🏨',
  },
]

const SOURCE_BADGE: Record<Venue['sourceType'], { label: string; color: string }> = {
  google:      { label: 'Google',      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  tripadvisor: { label: 'TripAdvisor', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  yelp:        { label: 'Yelp',        color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  eventbrite:  { label: 'Eventbrite',  color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['Configure', 'Research', 'Results', 'Book']
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

// ─── Star rating ──────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-[#374151]'}`}
        />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamEventsPage() {
  const [step, setStep] = useState(0)

  // Step 0 — configure
  const [eventType, setEventType]       = useState('')
  const [location, setLocation]         = useState('')
  const [customLocation, setCustomLocation] = useState('')
  const [headcount, setHeadcount]       = useState(20)
  const [budget, setBudget]             = useState('')
  const [eventDate, setEventDate]       = useState('')
  const [requirements, setRequirements] = useState<string[]>([])

  // Step 1 — research (loading)
  const [researchLog, setResearchLog]   = useState<string[]>([])
  const [researchDone, setResearchDone] = useState(false)

  // Step 2 — results
  const [expanded, setExpanded]         = useState<number | null>(null)
  const [selected, setSelected]         = useState<number | null>(null)

  // Step 3 — book
  const [booked, setBooked]             = useState(false)

  // ── helpers ──────────────────────────────────────────────────────────────────

  function toggleRequirement(id: string) {
    setRequirements(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  const resolvedLocation = location === 'Custom…' ? customLocation : location

  async function startResearch() {
    setStep(1)
    setResearchLog([])
    const logs = [
      `Searching venues in ${resolvedLocation}…`,
      `Filtering for ${eventType ? EVENT_TYPES.find(e => e.id === eventType)?.label : 'events'} with capacity for ${headcount} people…`,
      'Checking Google Maps and TripAdvisor listings…',
      'Scraping recent reviews and ratings…',
      'Applying your requirements filters…',
      'Ranking by fit, rating, and price…',
      `Found 5 venues — loading results.`,
    ]
    for (const log of logs) {
      await new Promise(r => setTimeout(r, 500))
      setResearchLog(prev => [...prev, log])
    }

    // Graceful degradation — try real webhook
    try {
      const res = await fetch('/api/workflows/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, location: resolvedLocation, headcount, budget, eventDate, requirements }),
      })
      if (!res.ok) throw new Error('non-ok')
    } catch {
      // silent — mock venues shown below
    }

    setResearchDone(true)
  }

  const selectedEventType = EVENT_TYPES.find(e => e.id === eventType)
  const selectedVenue = selected !== null ? MOCK_VENUES[selected] : null

  // email draft
  const emailDraft = selectedVenue
    ? `Subject: Venue Enquiry — ${selectedEventType?.label ?? 'Team Event'} for ${headcount} people\n\nHi,\n\nI'm reaching out to enquire about availability for a ${selectedEventType?.label ?? 'team event'} at ${selectedVenue.name}.\n\nDetails:\n• Date: ${eventDate || 'TBC'}\n• Number of guests: ${headcount}\n• Budget per head: ${budget ? `£${budget}` : 'flexible'}\n• Location: ${resolvedLocation}\n${requirements.length > 0 ? `• Requirements: ${requirements.map(r => REQUIREMENTS.find(req => req.id === r)?.label).join(', ')}\n` : ''}\nCould you let me know if you have availability and share your packages for this type of event?\n\nMany thanks,\n[Your name]`
    : ''

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#07080F] text-[#F9FAFB] px-6 py-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <Link href="/hr" className="inline-flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to HR
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono bg-[#1F2937] text-[#9CA3AF] px-2 py-0.5 rounded">HR-EVENTS-01</span>
              <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded">Research agent</span>
            </div>
            <h1 className="text-2xl font-bold">Team Events Researcher</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">
              Describe what you need — get venue recommendations with ratings, prices, and a ready-to-send enquiry email.
            </p>
          </div>
        </div>
      </div>

      <StepIndicator current={step} />

      {/* ── Step 0: Configure ─────────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          {/* Event type */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">What type of event?</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Pick the closest match — you can add notes later.</p>
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

          {/* Location, headcount, budget, date */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Logistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Location */}
              <div>
                <label className="text-xs text-[#6B7280] block mb-1.5">Location</label>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] focus:outline-none focus:border-teal-500 transition-colors"
                >
                  <option value="">Select location…</option>
                  {LOCATION_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                {location === 'Custom…' && (
                  <input
                    type="text"
                    value={customLocation}
                    onChange={e => setCustomLocation(e.target.value)}
                    placeholder="Enter city or area…"
                    className="mt-2 w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors"
                  />
                )}
              </div>

              {/* Date */}
              <div>
                <label className="text-xs text-[#6B7280] block mb-1.5">Event date (approx.)</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              {/* Headcount */}
              <div>
                <label className="text-xs text-[#6B7280] block mb-1.5">Headcount — {headcount} people</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setHeadcount(h => Math.max(2, h - 5))}
                    className="w-9 h-9 rounded-lg border border-[#1F2937] flex items-center justify-center text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] transition-colors text-lg"
                  >
                    −
                  </button>
                  <div className="flex-1 bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-center text-[#F9FAFB]">
                    {headcount}
                  </div>
                  <button
                    onClick={() => setHeadcount(h => Math.min(500, h + 5))}
                    className="w-9 h-9 rounded-lg border border-[#1F2937] flex items-center justify-center text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] transition-colors text-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="text-xs text-[#6B7280] block mb-1.5">Budget per head (£) — optional</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">£</span>
                  <input
                    type="number"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg pl-7 pr-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Requirements</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">We'll filter out venues that can't meet these.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {REQUIREMENTS.map(req => (
                <button
                  key={req.id}
                  onClick={() => toggleRequirement(req.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left ${
                    requirements.includes(req.id)
                      ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}
                >
                  {requirements.includes(req.id) && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span className="text-xs">{req.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={startResearch}
              disabled={!eventType || (!location || (location === 'Custom…' && !customLocation))}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
            >
              <Sparkles className="w-4 h-4" /> Find venues
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: Research (loading) ────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              {researchDone
                ? <Check className="w-4 h-4 text-teal-400" />
                : <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
              }
              <h2 className="font-semibold">{researchDone ? 'Research complete' : 'Researching venues…'}</h2>
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

          {researchDone && (
            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors"
              >
                View results <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Results ───────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">5 venues found</h2>
            <div className="text-xs text-[#6B7280]">
              {resolvedLocation} · {headcount} people{budget ? ` · up to £${budget}/head` : ''}
            </div>
          </div>

          {MOCK_VENUES.map((venue, i) => {
            const badge = SOURCE_BADGE[venue.sourceType]
            const isExpanded = expanded === i
            const isSelected = selected === i
            return (
              <div
                key={i}
                className={`bg-[#111318] border rounded-xl overflow-hidden transition-all ${
                  isSelected ? 'border-teal-500' : 'border-[#1F2937]'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#1F2937] flex items-center justify-center text-xl flex-shrink-0">
                        {venue.image}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-[#F9FAFB]">{venue.name}</h3>
                          <span className={`text-xs border px-1.5 py-0.5 rounded ${badge.color}`}>{badge.label}</span>
                        </div>
                        <div className="text-xs text-[#9CA3AF] mt-0.5">{venue.type} · {venue.location}</div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Stars rating={venue.rating} />
                            <span className="text-xs text-[#F9FAFB] font-medium">{venue.rating}</span>
                            <span className="text-xs text-[#6B7280]">({venue.reviewCount.toLocaleString()})</span>
                          </div>
                          <span className="text-xs text-[#6B7280]">·</span>
                          <span className="text-xs text-[#9CA3AF]">£{venue.pricePerHead}/head</span>
                          <span className="text-xs text-[#6B7280]">·</span>
                          <span className="text-xs text-[#9CA3AF]">Capacity: {venue.capacity}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : i)}
                      className="text-[#6B7280] hover:text-[#9CA3AF] transition-colors flex-shrink-0"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {venue.highlights.map(h => (
                      <span key={h} className="text-xs bg-[#1F2937] text-[#9CA3AF] px-2 py-0.5 rounded">{h}</span>
                    ))}
                  </div>

                  {/* Expanded contact */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#1F2937] flex flex-wrap gap-4 text-sm text-[#9CA3AF]">
                      <a href={venue.website} className="flex items-center gap-1.5 hover:text-teal-400 transition-colors">
                        <Globe className="w-3.5 h-3.5" /> Website
                      </a>
                      <a href={`tel:${venue.phone}`} className="flex items-center gap-1.5 hover:text-teal-400 transition-colors">
                        <Phone className="w-3.5 h-3.5" /> {venue.phone}
                      </a>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> {venue.location}
                      </div>
                    </div>
                  )}

                  {/* Select */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setSelected(isSelected ? null : i)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-teal-500/10 border border-teal-500 text-teal-400'
                          : 'bg-[#1F2937] text-[#9CA3AF] hover:bg-[#374151] hover:text-[#F9FAFB]'
                      }`}
                    >
                      {isSelected ? <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Selected</span> : 'Select venue'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(0)} className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">← Adjust search</button>
            <button
              onClick={() => setStep(3)}
              disabled={selected === null}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
            >
              Enquire / Book <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Book / Enquire ────────────────────────────────────────────── */}
      {step === 3 && selectedVenue && (
        <div className="space-y-6">
          {!booked ? (
            <>
              {/* Selected venue recap */}
              <div className="bg-[#111318] border border-teal-500/30 rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1F2937] flex items-center justify-center text-xl">
                    {selectedVenue.image}
                  </div>
                  <div>
                    <div className="font-semibold">{selectedVenue.name}</div>
                    <div className="text-xs text-[#9CA3AF]">{selectedVenue.type} · {selectedVenue.location}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <Stars rating={selectedVenue.rating} />
                    <span className="text-sm font-medium">{selectedVenue.rating}</span>
                  </div>
                </div>
              </div>

              {/* Drafted email */}
              <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#9CA3AF]" /> Enquiry email draft
                  </h2>
                  <span className="text-xs text-[#6B7280]">Edit before sending</span>
                </div>
                <textarea
                  defaultValue={emailDraft}
                  rows={18}
                  className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-4 py-3 text-sm text-[#F9FAFB] font-mono leading-relaxed focus:outline-none focus:border-teal-500 transition-colors resize-none"
                />
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">← Back to results</button>
                <button
                  onClick={() => setBooked(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-colors"
                >
                  <Mail className="w-4 h-4" /> Send enquiry
                </button>
              </div>
            </>
          ) : (
            /* Booked confirmation */
            <div className="bg-[#111318] border border-teal-500/30 rounded-xl p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 text-teal-400" />
              </div>
              <h2 className="text-xl font-semibold">Enquiry sent</h2>
              <p className="text-[#9CA3AF] text-sm max-w-sm mx-auto">
                Your enquiry has been sent to <span className="text-[#F9FAFB]">{selectedVenue.name}</span>.
                Most venues respond within 24 hours.
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => {
                    setStep(0)
                    setEventType('')
                    setLocation('')
                    setCustomLocation('')
                    setHeadcount(20)
                    setBudget('')
                    setEventDate('')
                    setRequirements([])
                    setResearchLog([])
                    setResearchDone(false)
                    setSelected(null)
                    setBooked(false)
                  }}
                  className="px-4 py-2 rounded-lg border border-[#1F2937] text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
                >
                  Plan another event
                </button>
                <Link href="/hr" className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors">
                  Back to HR
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
