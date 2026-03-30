'use client'
import { useRef, useState, useCallback } from 'react'

export type SchoolVoiceCommandResult = {
  command: string
  action: string
  response: string
  payload?: Record<string, any>
  data?: Record<string, any>
}

function extractName(text: string, prefixes: string[]): string | null {
  const lower = text.toLowerCase()
  for (const p of prefixes) {
    const idx = lower.indexOf(p)
    if (idx >= 0) { const w = text.slice(idx + p.length).trim().split(/[\s,.!?]/)[0]; if (w.length > 1) return w.charAt(0).toUpperCase() + w.slice(1) }
  }
  return null
}

const COMMANDS: { patterns: RegExp[]; action: string; response: (m: RegExpMatchArray, t: string) => string; data?: (m: RegExpMatchArray, t: string) => Record<string, any> }[] = [
  { patterns: [/play.*brief/i, /morning brief/i, /start brief/i], action: 'PLAY_BRIEFING', response: () => 'Starting your morning briefing now.' },
  { patterns: [/^stop$/i, /^pause$/i], action: 'STOP_AUDIO', response: () => 'Stopping.' },
  { patterns: [/i'?m ill/i, /i'?m sick/i, /i'?m not well/i, /report sick/i, /i can'?t come in/i], action: 'REPORT_SICK', response: () => "I'll log your absence and notify the cover coordinator." },
  { patterns: [/log.*concern/i, /safeguarding concern/i, /raise.*concern/i], action: 'LOG_CONCERN', response: () => 'Opening the safeguarding concern form.' },
  { patterns: [/take.*register/i, /register for (\w+)/i, /class register/i], action: 'TAKE_REGISTER', response: (_m, t) => { const c = extractName(t, ['for ', 'register ']); return c ? `Opening register for ${c}.` : 'Opening the class register.' }, data: (_m, t) => ({ className: extractName(t, ['for ', 'register ']) }) },
  { patterns: [/book cover/i, /cover for (\w+)/i, /need cover/i, /arrange cover/i], action: 'BOOK_COVER', response: (_m, t) => { const c = extractName(t, ['for ']); return c ? `Opening cover booking for ${c}.` : 'Opening the cover booking form.' }, data: (_m, t) => ({ className: extractName(t, ['for ']) }) },
  { patterns: [/parent contact/i, /contact parent/i, /message parent/i], action: 'PARENT_CONTACT', response: (_m, t) => { const n = extractName(t, ['for ', 'about ']); return n ? `Opening parent contact for ${n}.` : 'Opening parent contact form.' }, data: (_m, t) => ({ pupilName: extractName(t, ['for ', 'about ']) }) },
  { patterns: [/staff alert/i, /send.*staff/i, /alert staff/i], action: 'STAFF_ALERT', response: () => 'Opening staff alert form.' },
  { patterns: [/check attendance/i, /attendance today/i, /what.*attendance/i], action: 'CHECK_ATTENDANCE', response: () => 'Today\'s attendance is 96.2% across all year groups. Year 6 is lowest at 91.8%.' },
  { patterns: [/ehcp review/i, /ehcp for (\w+)/i], action: 'EHCP_REVIEW', response: (_m, t) => { const n = extractName(t, ['for ']); return n ? `Opening EHCP review for ${n}.` : 'Opening EHCP review form.' }, data: (_m, t) => ({ pupilName: extractName(t, ['for ']) }) },
  { patterns: [/log absence/i, /pupil absent/i, /report absence/i], action: 'LOG_ABSENCE', response: () => 'Opening the absence logging form.' },
  { patterns: [/book holiday/i, /request leave/i, /time off/i], action: 'BOOK_HOLIDAY', response: () => 'Opening the leave request form.' },
  { patterns: [/what.*time/i], action: 'TELL_TIME', response: () => `It's ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.` },
  { patterns: [/help/i, /what can you do/i, /commands/i], action: 'HELP', response: () => "You can say: play my briefing, I'm ill today, log a concern, take register, book cover, check attendance, parent contact, or EHCP review." },
]

export function useSchoolVoiceCommands() {
  const recognitionRef = useRef<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lastCommand, setLastCommand] = useState<SchoolVoiceCommandResult | null>(null)

  const processCommand = useCallback((text: string): SchoolVoiceCommandResult => {
    for (const cmd of COMMANDS) {
      for (const pattern of cmd.patterns) {
        const match = text.match(pattern)
        if (match) return { command: text, action: cmd.action, response: cmd.response(match, text), data: cmd.data?.(match, text) }
      }
    }
    return { command: text, action: 'UNKNOWN', response: `I heard "${text}" but I'm not sure what to do. Say "help" for available commands.` }
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

  return { isListening, transcript, lastCommand, startListening, stopListening }
}
