'use client'
import { useRef, useState, useCallback } from 'react'

export type VoiceCommandResult = {
  command: string
  action: string
  response: string
  payload?: Record<string, any>
}

function extractTime(text: string): string | null {
  const match = text.match(/at (\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i)
  return match ? match[1] : null
}

function extractChannel(text: string): string {
  const match = text.match(/(?:to |in |channel )?#?([a-z0-9-_]+)(?:\s|$)/i)
  return match ? match[1].toLowerCase() : 'general'
}

function extractPlatform(text: string): string {
  if (/zoom/i.test(text)) return 'Zoom'
  if (/teams/i.test(text)) return 'Microsoft Teams'
  if (/google meet|google/i.test(text)) return 'Google Meet'
  return 'Teams'
}

const COMMANDS: { patterns: RegExp[], action: string, response: (m: RegExpMatchArray, full: string) => string, payload?: (m: RegExpMatchArray, full: string) => Record<string, any> }[] = [

  // ── NAVIGATION ──────────────────────────────────────────────────────────────
  {
    patterns: [/go to (school.office|hr|hr.staff|staff|finance|reports|safeguarding|students|send|curriculum|facilities|admissions|workflows|settings|trust|wraparound|insights)/i, /open (school.office|hr|hr.staff|staff|finance|reports|safeguarding|students|send|curriculum|facilities|admissions|workflows|settings|trust|wraparound|insights)/i],
    action: 'NAVIGATE',
    response: (m) => `Navigating to ${m[1]}.`,
    payload: (m) => {
      let dept = m[1].toLowerCase().replace(/\s+/g, '-')
      if (dept === 'staff' || dept === 'hr') dept = 'hr-staff'
      if (dept === 'school-office' || dept === 'school.office') dept = 'school-office'
      if (dept === 'send') dept = 'send-dsl'
      return { dept }
    }
  },
  {
    patterns: [/check attendance/i, /show attendance/i],
    action: 'NAVIGATE',
    response: () => 'Opening attendance.',
    payload: () => ({ dept: 'students' })
  },
  {
    patterns: [/show send pupils/i, /show send/i, /show ehcp/i],
    action: 'NAVIGATE',
    response: () => 'Opening SEND & DSL.',
    payload: () => ({ dept: 'send-dsl' })
  },

  // ── ROUNDUP ─────────────────────────────────────────────────────────────────
  {
    patterns: [/show (?:my )?alerts?/i, /any alerts?/i, /urgent alerts?/i],
    action: 'EXPAND_ROUNDUP',
    response: () => 'Opening alerts.',
    payload: () => ({ section: 'alerts' })
  },
  {
    patterns: [/show (?:my )?emails?/i, /check (?:my )?emails?/i],
    action: 'EXPAND_ROUNDUP',
    response: () => 'Opening your emails.',
    payload: () => ({ section: 'email' })
  },
  {
    patterns: [/show (?:my )?mis/i, /check mis/i, /mis updates?/i],
    action: 'EXPAND_ROUNDUP',
    response: () => 'Opening MIS updates.',
    payload: () => ({ section: 'mis' })
  },
  {
    patterns: [/show polic(?:y|ies)/i, /policy updates?/i],
    action: 'EXPAND_ROUNDUP',
    response: () => 'Opening policy updates.',
    payload: () => ({ section: 'policy' })
  },

  // ── MODALS — SCHOOL ─────────────────────────────────────────────────────────
  {
    patterns: [/new safeguarding/i, /safeguarding alert/i, /log (?:a )?concern/i, /raise (?:a )?concern/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening a new safeguarding concern.',
    payload: () => ({ modal: 'SafeguardingAlert' })
  },
  {
    patterns: [/new pupil/i, /add (?:a )?pupil/i, /add (?:a )?student/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening the new pupil form.',
    payload: () => ({ modal: 'NewPupil' })
  },
  {
    patterns: [/new exclusion/i, /log (?:an )?exclusion/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening a new exclusion form.',
    payload: () => ({ modal: 'NewExclusion' })
  },
  {
    patterns: [/new incident/i, /log (?:an )?incident/i, /report (?:an )?incident/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening a new incident form.',
    payload: () => ({ modal: 'NewIncident' })
  },
  {
    patterns: [/staff leave/i, /(?:request|book) staff leave/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening a staff leave request.',
    payload: () => ({ modal: 'StaffLeave' })
  },
  {
    patterns: [/ofsted check/i, /ofsted readiness/i, /check ofsted/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening the Ofsted readiness check.',
    payload: () => ({ modal: 'OfstedCheck' })
  },
  {
    patterns: [/send (?:a )?report/i, /new report/i, /generate (?:a )?report/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening the report builder.',
    payload: () => ({ modal: 'SendReport' })
  },

  // ── BRIEFING ────────────────────────────────────────────────────────────────
  {
    patterns: [/play.*brief/i, /morning brief/i, /afternoon brief/i, /start brief/i, /give me (?:my )?briefing/i],
    action: 'PLAY_BRIEFING',
    response: () => 'Starting your briefing now.',
  },
  {
    patterns: [/stop/i, /pause/i, /quiet/i, /shut up/i, /silence/i],
    action: 'STOP_AUDIO',
    response: () => 'Stopping.',
  },

  // ── INFO ─────────────────────────────────────────────────────────────────────
  {
    patterns: [/what(?:'s| is) (?:the )?(?:current )?time/i, /what time is it/i],
    action: 'TELL_TIME',
    response: () => `It's ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`,
  },
  {
    patterns: [/how many pupils?(?:\s+today)?/i, /pupil count/i, /how many students?/i],
    action: 'PUPIL_COUNT',
    response: () => "You have 847 pupils on roll. Today's attendance is 96.2%.",
  },
  {
    patterns: [/any urgent alerts?/i, /urgent safeguarding/i, /safeguarding alerts?/i],
    action: 'ALERT_COUNT',
    response: () => 'You have 3 urgent safeguarding alerts that need attention.',
  },
  {
    patterns: [/today'?s? schedule/i, /what'?s? on today/i, /my schedule/i],
    action: 'SCHEDULE',
    response: () => 'You have 4 lessons, 2 meetings, and a governors briefing at 4pm today.',
  },

  // ── MEETING ──────────────────────────────────────────────────────────────────
  {
    patterns: [/cancel my (\w+(?:\s+\w+)?) meeting/i, /cancel the (\w+(?:\s+\w+)?) meeting/i],
    action: 'CANCEL_NAMED_MEETING',
    response: (m) => `I'll look for your ${m[1]} meeting.`,
    payload: (m) => ({ meetingName: m[1] })
  },
  {
    patterns: [/cancel my (?:next )?meeting/i, /cancel (?:my )?upcoming meeting/i],
    action: 'CANCEL_NEXT_MEETING',
    response: () => 'Let me find your next meeting.',
  },
  {
    patterns: [/book (?:a )?(zoom|teams|google meet|microsoft teams) (?:meeting |call )?at (.+)/i, /schedule (?:a )?(zoom|teams|google meet) at (.+)/i],
    action: 'BOOK_MEETING',
    response: (_m, full) => `Opening a ${extractPlatform(full)} booking for ${extractTime(full) || 'the time you mentioned'}.`,
    payload: (_m, full) => ({ platform: extractPlatform(full), time: extractTime(full) })
  },

  // ── SLACK / EMAIL ────────────────────────────────────────────────────────────
  {
    patterns: [/send (?:my )?team (?:this message |a message )?on slack[: ]+(.+)/i, /slack (?:my )?team[: ]+(.+)/i],
    action: 'SLACK_TEAM_MESSAGE',
    response: () => `I have your message. Which Slack channel should I send to?`,
    payload: (m) => ({ message: m[1] })
  },
  {
    patterns: [/email (?:my )?team[: ]+(.+)/i, /send (?:my )?team an email[: ]+(.+)/i],
    action: 'EMAIL_TEAM',
    response: () => `Opening a team email with your message.`,
    payload: (m) => ({ message: m[1] })
  },

  // ── HELP ─────────────────────────────────────────────────────────────────────
  {
    patterns: [/help/i, /what can you do/i, /(?:list )?commands/i],
    action: 'HELP',
    response: () => `You can say: play my briefing, new safeguarding alert, log a concern, add a pupil, go to students, check attendance, show alerts, how many pupils today, today's schedule, cancel my meeting, book a Teams call, or stop.`,
  },
]

export function useSchoolVoiceCommands() {
  const recognitionRef = useRef<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lastCommand, setLastCommand] = useState<VoiceCommandResult | null>(null)
  const [pendingAction, setPendingAction] = useState<{ type: string, data: Record<string, any> } | null>(null)

  const processCommand = useCallback((text: string): VoiceCommandResult | null => {
    if (pendingAction) {
      if (pendingAction.type === 'AWAITING_SLACK_CHANNEL') {
        const channel = extractChannel(text)
        setPendingAction(null)
        return { command: text, action: 'EXECUTE_SLACK_SEND', response: `Sending to #${channel}.`, payload: { ...pendingAction.data, channel } }
      }
      if (pendingAction.type === 'AWAITING_CANCEL_CONFIRMATION') {
        if (/yes|confirm|do it|go ahead/i.test(text)) {
          setPendingAction(null)
          return { command: text, action: 'CANCEL_MEETING_WITH_EMAIL', response: 'Meeting cancelled and email sent.', payload: pendingAction.data }
        }
        setPendingAction(null)
        return { command: text, action: 'CANCEL_MEETING_NO_EMAIL', response: 'Meeting cancelled. No email sent.', payload: pendingAction.data }
      }
    }

    for (const cmd of COMMANDS) {
      for (const pattern of cmd.patterns) {
        const match = text.match(pattern)
        if (match) {
          const payload = cmd.payload ? cmd.payload(match, text) : {}
          return { command: text, action: cmd.action, response: cmd.response(match, text), payload }
        }
      }
    }
    return { command: text, action: 'UNKNOWN', response: `I heard "${text.slice(0, 40)}" but I'm not sure what to do. Try saying "help" for a list of commands.` }
  }, [pendingAction])

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.lang = 'en-GB'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      setTranscript(text)
      const result = processCommand(text)
      if (result) setLastCommand(result)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [processCommand])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return { isListening, transcript, lastCommand, startListening, stopListening, pendingAction, setPendingAction }
}
