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

function extractMessage(text: string, keyword: string): string {
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase())
  if (idx === -1) return ''
  return text.slice(idx + keyword.length).trim()
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
    patterns: [/go to (hr|accounts|sales|crm|marketing|operations|support|insights|workflows|strategy|trials|partners|settings|overview)/i, /open (hr|accounts|sales|crm|marketing|operations|support|insights|workflows|strategy|trials|partners|settings|overview)/i, /take me to (hr|accounts|sales|crm|marketing|operations|support|insights|workflows|strategy|trials|partners)/i],
    action: 'NAVIGATE',
    response: (m) => `Navigating to ${m[1]}.`,
    payload: (m) => ({ dept: m[1].toLowerCase() })
  },

  // ── TABS ────────────────────────────────────────────────────────────────────
  {
    patterns: [/(?:show|go to|open) quick wins/i, /what are my quick wins/i],
    action: 'SWITCH_TAB',
    response: () => 'Showing your quick wins.',
    payload: () => ({ tab: 'quick-wins' })
  },
  {
    patterns: [/(?:show|go to|open) (?:daily )?tasks/i, /what are my tasks/i],
    action: 'SWITCH_TAB',
    response: () => 'Opening your daily tasks.',
    payload: () => ({ tab: 'tasks' })
  },
  {
    patterns: [/(?:show|go to|open) insights/i],
    action: 'SWITCH_TAB',
    response: () => "Here are your insights.",
    payload: () => ({ tab: 'insights' })
  },
  {
    patterns: [/(?:show|go to|open) don'?t miss/i, /what shouldn'?t I miss/i],
    action: 'SWITCH_TAB',
    response: () => "Here's what you shouldn't miss today.",
    payload: () => ({ tab: 'not-to-miss' })
  },
  {
    patterns: [/(?:show|go to|open) team/i, /show my team/i],
    action: 'SWITCH_TAB',
    response: () => 'Opening your team panel.',
    payload: () => ({ tab: 'team' })
  },

  // ── MORNING ROUNDUP ─────────────────────────────────────────────────────────
  {
    patterns: [/show (?:my )?emails?/i, /check (?:my )?emails?/i, /any emails?/i],
    action: 'EXPAND_ROUNDUP',
    response: () => 'Opening your emails.',
    payload: () => ({ section: 'email' })
  },
  {
    patterns: [/show (?:my )?slack/i, /check slack/i, /any slack messages?/i],
    action: 'EXPAND_ROUNDUP',
    response: () => 'Opening Slack.',
    payload: () => ({ section: 'slack' })
  },
  {
    patterns: [/show (?:my )?hubspot/i, /check hubspot/i],
    action: 'EXPAND_ROUNDUP',
    response: () => 'Opening HubSpot.',
    payload: () => ({ section: 'hubspot' })
  },
  {
    patterns: [/show (?:my )?linkedin/i, /check linkedin/i],
    action: 'EXPAND_ROUNDUP',
    response: () => 'Opening LinkedIn.',
    payload: () => ({ section: 'linkedin' })
  },

  // ── MODALS — SALES ──────────────────────────────────────────────────────────
  {
    patterns: [/new (?:sales )?lead/i, /add (?:a )?lead/i, /create (?:a )?lead/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening a new lead form.',
    payload: () => ({ modal: 'NewLead' })
  },
  {
    patterns: [/new deal/i, /add (?:a )?deal/i, /create (?:a )?deal/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening a new deal.',
    payload: () => ({ modal: 'NewDeal' })
  },
  {
    patterns: [/log (?:a )?call/i, /record (?:a )?call/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening the call log.',
    payload: () => ({ modal: 'LogCall' })
  },
  {
    patterns: [/send (?:a )?proposal/i, /new proposal/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening the proposal form.',
    payload: () => ({ modal: 'SendProposal' })
  },
  {
    patterns: [/schedule (?:a )?demo/i, /book (?:a )?demo/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening the demo scheduler.',
    payload: () => ({ modal: 'ScheduleDemo' })
  },
  {
    patterns: [/new client/i, /add (?:a )?client/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening a new client form.',
    payload: () => ({ modal: 'NewClient' })
  },

  // ── MODALS — ACCOUNTS ───────────────────────────────────────────────────────
  {
    patterns: [/new invoice/i, /create (?:an )?invoice/i, /raise (?:an )?invoice/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening a new invoice.',
    payload: () => ({ modal: 'NewInvoice' })
  },
  {
    patterns: [/chase (?:a )?payment/i, /chase (?:an )?invoice/i, /follow up (?:on )?(?:a )?payment/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening the payment chase form.',
    payload: () => ({ modal: 'ChasePayment' })
  },
  {
    patterns: [/new expense/i, /log (?:an )?expense/i, /add (?:an )?expense/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening a new expense.',
    payload: () => ({ modal: 'NewExpense' })
  },

  // ── MODALS — HR ─────────────────────────────────────────────────────────────
  {
    patterns: [/new joiner/i, /add (?:a )?new (?:staff member|employee|joiner)/i, /onboard someone/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening the new joiner form.',
    payload: () => ({ modal: 'NewJoiner' })
  },
  {
    patterns: [/(?:request|book|log) (?:some )?leave/i, /time off request/i, /holiday request/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening a leave request.',
    payload: () => ({ modal: 'LeaveRequest' })
  },
  {
    patterns: [/new (?:support )?ticket/i, /raise (?:a )?ticket/i, /log (?:an? )?issue/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening a new support ticket.',
    payload: () => ({ modal: 'NewSupportTicket' })
  },
  {
    patterns: [/new project/i, /create (?:a )?project/i, /start (?:a )?project/i],
    action: 'OPEN_MODAL',
    response: () => 'Opening a new project.',
    payload: () => ({ modal: 'NewProject' })
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

  // ── TIME / INFO ──────────────────────────────────────────────────────────────
  {
    patterns: [/what(?:'s| is) (?:the )?(?:current )?time/i, /what time is it/i],
    action: 'TELL_TIME',
    response: () => `It's ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`,
  },
  {
    patterns: [/how many emails?/i, /check (?:my )?email count/i],
    action: 'EMAIL_COUNT',
    response: () => 'You have 12 emails, with some marked urgent.',
  },

  // ── MEETING ──────────────────────────────────────────────────────────────────
  {
    patterns: [/cancel my (\w+(?:\s+\w+)?) meeting/i, /cancel the (\w+(?:\s+\w+)?) meeting/i],
    action: 'CANCEL_NAMED_MEETING',
    response: (m) => `I'll look for your ${m[1]} meeting. One moment.`,
    payload: (m) => ({ meetingName: m[1] })
  },
  {
    patterns: [/cancel my (?:next )?meeting/i, /cancel (?:my )?upcoming meeting/i],
    action: 'CANCEL_NEXT_MEETING',
    response: () => 'Let me find your next meeting.',
  },
  {
    patterns: [/book (?:a )?(zoom|teams|google meet|microsoft teams) (?:meeting |call )?(?:for (?:my )?team )?at (.+)/i, /schedule (?:a )?(zoom|teams|google meet) (?:for (?:my )?team )?at (.+)/i],
    action: 'BOOK_MEETING',
    response: (m, full) => `Opening a ${extractPlatform(full)} booking for ${extractTime(full) || 'the time you mentioned'}.`,
    payload: (_m, full) => ({ platform: extractPlatform(full), time: extractTime(full) })
  },

  // ── SLACK / EMAIL TEAM ───────────────────────────────────────────────────────
  {
    patterns: [/send (?:my )?team (?:this message |a message )?on slack[: ]+(.+)/i, /slack (?:my )?team[: ]+(.+)/i, /message (?:my )?team on slack[: ]+(.+)/i],
    action: 'SLACK_TEAM_MESSAGE',
    response: (m) => `I have your message. Which Slack channel should I send to?`,
    payload: (m) => ({ message: m[1] })
  },
  {
    patterns: [/email (?:my )?team (?:the following|this)[: ]+(.+)/i, /send (?:my )?team an email[: ]+(.+)/i, /send an email to (?:my )?team[: ]+(.+)/i],
    action: 'EMAIL_TEAM',
    response: () => `Opening a team email with your message. Please review before sending.`,
    payload: (m) => ({ message: m[1] })
  },

  // ── HELP ─────────────────────────────────────────────────────────────────────
  {
    patterns: [/help/i, /what can you do/i, /(?:list )?commands/i, /what do you know/i],
    action: 'HELP',
    response: () => `You can say: play my briefing, new invoice, new lead, go to CRM, show my emails, cancel my meeting, book a Teams call at 3pm, send my team on Slack, email my team, or stop. There are 30 commands in total.`,
  },
]

export function useVoiceCommands() {
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
