'use client'
import { useRef, useState, useCallback } from 'react'

export type VoiceCommandResult = {
  command: string
  action: string
  response: string
}

const COMMANDS: { patterns: RegExp[], action: string, response: (m: RegExpMatchArray) => string }[] = [
  {
    patterns: [/play.*brief/i, /morning brief/i, /afternoon brief/i, /start brief/i],
    action: 'PLAY_BRIEFING',
    response: () => 'Starting your briefing now.',
  },
  {
    patterns: [/stop/i, /pause/i, /quiet/i, /shut up/i],
    action: 'STOP_AUDIO',
    response: () => 'Stopping.',
  },
  {
    patterns: [/go to (hr|accounts|sales|crm|marketing|operations|support|insights|workflows|strategy|trials|partners)/i, /open (hr|accounts|sales|crm|marketing|operations|support|insights|workflows|strategy|trials|partners)/i],
    action: 'NAVIGATE',
    response: (m) => `Navigating to ${m[1]}.`,
  },
  {
    patterns: [/new (invoice|lead|deal|ticket|expense|joiner|client|campaign)/i, /create (invoice|lead|deal|ticket|expense|joiner|client|campaign)/i],
    action: 'OPEN_MODAL',
    response: (m) => `Opening new ${m[1]} form.`,
  },
  {
    patterns: [/what.*time/i, /current time/i],
    action: 'TELL_TIME',
    response: () => `It's ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`,
  },
  {
    patterns: [/how many email/i, /check.*email/i],
    action: 'EMAIL_COUNT',
    response: () => 'You have 12 emails, with some marked urgent.',
  },
  {
    patterns: [/help/i, /what can you do/i, /commands/i],
    action: 'HELP',
    response: () => 'You can say: play my briefing, go to HR, new invoice, stop, what time is it, or check emails.',
  },
]

export function useVoiceCommands() {
  const recognitionRef = useRef<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lastCommand, setLastCommand] = useState<VoiceCommandResult | null>(null)

  const processCommand = useCallback((text: string): VoiceCommandResult | null => {
    for (const cmd of COMMANDS) {
      for (const pattern of cmd.patterns) {
        const match = text.match(pattern)
        if (match) {
          return { command: text, action: cmd.action, response: cmd.response(match) }
        }
      }
    }
    return { command: text, action: 'UNKNOWN', response: `I heard "${text}" but I'm not sure what to do. Try saying "help" for a list of commands.` }
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

  return { isListening, transcript, lastCommand, startListening, stopListening }
}
// Sat Mar 28 16:29:30 GMTST 2026
