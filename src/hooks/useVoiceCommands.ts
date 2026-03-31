'use client'
import { useRef, useState, useCallback } from 'react'

export type VoiceCommandResult = {
  command: string
  action: string
  response: string
  payload?: Record<string, any>
  data?: Record<string, any>
}

const TEAM_MEMBERS = [
  { name: 'Sarah', fullName: 'Sarah Chen', phone: '+447700900001', email: 'sarah@company.com' },
  { name: 'Marcus', fullName: 'Marcus Webb', phone: '+447700900002', email: 'marcus@company.com' },
  { name: 'Dan', fullName: 'Dan Marsh', phone: '+447700900003', email: 'dan@company.com' },
  { name: 'Sophie', fullName: 'Sophie Bell', phone: '+447700900004', email: 'sophie@company.com' },
  { name: 'James', fullName: 'James Harlow', phone: '+447700900005', email: 'james@company.com' },
  { name: 'Tom', fullName: 'Tom Rashid', phone: '+447700900007', email: 'tom@company.com' },
]

function findMember(text: string) {
  return TEAM_MEMBERS.find(m => text.toLowerCase().includes(m.name.toLowerCase()))
}

function extractName(text: string, prefixes: string[]): string | null {
  const lower = text.toLowerCase()
  for (const p of prefixes) {
    const idx = lower.indexOf(p)
    if (idx >= 0) { const w = text.slice(idx + p.length).trim().split(/[\s,.!?]/)[0]; if (w.length > 1) return w.charAt(0).toUpperCase() + w.slice(1) }
  }
  return findMember(text)?.name || null
}

const COMMANDS: { patterns: RegExp[]; action: string; response: (m: RegExpMatchArray, t: string) => string; data?: (m: RegExpMatchArray, t: string) => Record<string, any> }[] = [
  { patterns: [/play.*brief/i, /morning brief/i, /start brief/i], action: 'PLAY_BRIEFING', response: () => 'Starting your briefing now.' },
  { patterns: [/^stop$/i, /^pause$/i, /^quiet$/i], action: 'STOP_AUDIO', response: () => 'Stopping.' },
  { patterns: [/go to (\w+)/i, /open (\w+)/i], action: 'NAVIGATE', response: (m) => `Navigating to ${m[1]}.`, data: (m) => ({ dept: m[1].toLowerCase() }) },
  { patterns: [/send slack/i, /slack message/i, /message.*slack/i, /slack to (\w+)/i], action: 'SEND_SLACK', response: (_m, t) => { const n = extractName(t, ['to ']); return n ? `Opening Slack message to ${n}.` : 'Who would you like to Slack?' }, data: (_m, t) => ({ recipient: extractName(t, ['to ']) }) },
  { patterns: [/phone call/i, /call (\w+)/i, /ring (\w+)/i, /dial/i], action: 'PHONE_CALL', response: (_m, t) => { const m = findMember(t); return m ? `Calling ${m.fullName} now.` : 'What number would you like to call?' }, data: (_m, t) => { const m = findMember(t); return m ? { name: m.fullName, phone: m.phone } : {} } },
  { patterns: [/i'?m ill/i, /i'?m sick/i, /i feel sick/i, /i'?m not well/i, /report sick/i, /i can'?t come in/i, /i won'?t be in/i], action: 'REPORT_SICK', response: () => "Sorry to hear that. I'll log your absence and let your manager know. Should I also notify the team on Slack?" },
  { patterns: [/book holiday/i, /request leave/i, /book time off/i, /annual leave/i], action: 'BOOK_HOLIDAY', response: () => "Opening the leave request form for you now." },
  { patterns: [/claim expense/i, /log expense/i, /submit expense/i, /expense report/i], action: 'CLAIM_EXPENSE', response: () => "Opening the expense form now." },
  { patterns: [/new joiner/i, /new starter/i, /onboard someone/i, /new team member/i, /new hire/i], action: 'NEW_JOINER', response: (_m, t) => { const n = extractName(t, ['for ', 'named ']); return n ? `Adding ${n} to onboarding.` : 'Opening the new joiner form.' }, data: (_m, t) => ({ name: extractName(t, ['for ', 'named ']) }) },
  { patterns: [/book.*meeting/i, /schedule.*meeting/i, /arrange.*meeting/i], action: 'BOOK_MEETING', response: (_m, t) => { const n = extractName(t, ['with ']); return n ? `Booking a meeting with ${n}.` : 'Opening the meeting scheduler.' }, data: (_m, t) => ({ attendee: extractName(t, ['with ']) }) },
  { patterns: [/send.*email/i, /email (\w+)/i, /email my team/i], action: 'SEND_EMAIL', response: (_m, t) => { const n = extractName(t, ['email ']); return n ? `Opening email to ${n}.` : t.match(/my team/i) ? 'Opening email to your team.' : 'Who would you like to email?' }, data: (_m, t) => ({ recipient: t.match(/my team/i) ? 'team' : extractName(t, ['email ']) }) },
  { patterns: [/new (invoice|lead|deal|ticket|client|campaign|project)/i, /create (invoice|lead|deal|ticket|client|campaign|project)/i], action: 'OPEN_MODAL', response: (m) => `Opening new ${m[1]} form.`, data: (m) => ({ modal: m[1].toLowerCase() }) },
  { patterns: [/chase invoice/i, /chase payment/i, /payment reminder/i], action: 'CHASE_INVOICE', response: () => 'Opening the chase payment form.' },
  { patterns: [/competitor/i], action: 'COMPETITOR_WATCH', response: () => 'Opening competitor intelligence.' },
  { patterns: [/team event/i, /team outing/i, /team lunch/i, /team drinks/i], action: 'TEAM_EVENT', response: () => 'Opening the team events researcher.' },
  { patterns: [/what.*time/i], action: 'TELL_TIME', response: () => `It's ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.` },
  { patterns: [/how many email/i, /check.*email/i], action: 'EMAIL_COUNT', response: () => 'You have 12 emails, 3 marked urgent.' },
  { patterns: [/add task (.+)/i, /add (.+) to (?:my )?tasks/i], action: 'ADD_TASK', response: (m) => `Got it — I've added "${m[1]}" to your daily tasks.`, data: (m) => ({ taskName: m[1] }) },
  { patterns: [/read (?:my )?tasks/i, /what.*(?:my )?tasks/i, /list (?:my )?tasks/i], action: 'READ_TASKS', response: () => 'Reading your tasks now.' },
  { patterns: [/read (?:my )?quick wins/i, /what.*quick wins/i, /list (?:my )?quick wins/i], action: 'READ_QUICK_WINS', response: () => 'Reading your quick wins now.' },
  { patterns: [/what (?:do i|have i) (?:got )?on today/i, /what.*on today/i, /today'?s schedule/i, /what'?s on/i], action: 'READ_TODAY', response: () => 'Here\'s your day at a glance.' },
  { patterns: [/help/i, /what can you do/i, /commands/i], action: 'HELP', response: () => "You can say: play my briefing, add task, read my tasks, read my quick wins, what's on today, I'm ill, send Slack, call Sarah, book a meeting, new invoice, claim expenses, or book holiday." },
]

export function useVoiceCommands() {
  const recognitionRef = useRef<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lastCommand, setLastCommand] = useState<VoiceCommandResult | null>(null)
  const [pendingAction, setPendingAction] = useState<{ type: string; data?: any } | null>(null)

  const processCommand = useCallback((text: string): VoiceCommandResult => {
    for (const cmd of COMMANDS) {
      for (const pattern of cmd.patterns) {
        const match = text.match(pattern)
        if (match) return { command: text, action: cmd.action, response: cmd.response(match, text), data: cmd.data?.(match, text) }
      }
    }
    return { command: text, action: 'UNKNOWN', response: `I heard "${text}" but I'm not sure what to do. Say "help" for a list of commands.` }
  }, [])

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.lang = 'en-GB'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false
    recognition.onresult = (e: any) => { const text = e.results[0][0].transcript; setTranscript(text); setLastCommand(processCommand(text)) }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [processCommand])

  const stopListening = useCallback(() => { recognitionRef.current?.stop(); setIsListening(false) }, [])

  return { isListening, transcript, lastCommand, startListening, stopListening, pendingAction, setPendingAction }
}
