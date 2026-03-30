'use client'
import { useRef, useState, useCallback } from 'react'

export type FootballCommandResult = { command: string; action: string; response: string; data?: Record<string, any> }

const PLAYERS = [
  { name: 'Walker', fullName: 'James Walker', pos: 'GK' },
  { name: 'Henderson', fullName: 'Callum Henderson', pos: 'RB' },
  { name: 'Martinez', fullName: 'Diego Martinez', pos: 'CB' },
  { name: 'O\'Brien', fullName: 'Sean O\'Brien', pos: 'LW' },
  { name: 'Santos', fullName: 'Lucas Santos', pos: 'ST' },
  { name: 'Thompson', fullName: 'Ryan Thompson', pos: 'CM' },
]

function findPlayer(text: string) { return PLAYERS.find(p => text.toLowerCase().includes(p.name.toLowerCase())) }

const CMDS: { patterns: RegExp[]; action: string; response: (m: RegExpMatchArray, t: string) => string }[] = [
  { patterns: [/play.*brief/i, /morning brief/i], action: 'PLAY_BRIEFING', response: () => 'Starting your morning briefing now.' },
  { patterns: [/^stop$/i, /^pause$/i], action: 'STOP_AUDIO', response: () => 'Stopping.' },
  { patterns: [/who.*fit/i, /squad availability/i, /who.*available/i], action: 'SQUAD_FIT', response: () => '21 players are fit for selection. 3 injured: Martinez, O\'Brien, Santos. Thompson is suspended.' },
  { patterns: [/log injury/i, /injury for (\w+)/i, /(\w+).*injured/i], action: 'LOG_INJURY', response: (_m, t) => { const p = findPlayer(t); return p ? `Opening injury log for ${p.fullName}.` : 'Opening the injury log.' } },
  { patterns: [/transfer budget/i, /budget remaining/i, /how much.*spend/i], action: 'TRANSFER_BUDGET', response: () => 'Transfer budget: £4.2 million remaining of £8 million. Two active targets totalling £3.1 million.' },
  { patterns: [/agent message/i, /any.*agent/i], action: 'AGENT_MESSAGES', response: () => 'You have 3 agent messages today. 1 urgent from Stellar Group regarding Martinez contract.' },
  { patterns: [/target list/i, /show.*targets/i, /transfer targets/i], action: 'TARGET_LIST', response: () => 'Opening the transfer target list. 2 active targets: a left-back from Genk and a midfielder from Braga.' },
  { patterns: [/book.*video/i, /analysis room/i], action: 'BOOK_VIDEO', response: () => 'Video analysis room booked for 10am tomorrow.' },
  { patterns: [/call (\w+)/i, /phone (\w+)/i, /ring (\w+)/i], action: 'PHONE_CALL', response: (_m, t) => `Calling ${t.match(/(?:call|phone|ring)\s+(\w+)/i)?.[1] || 'contact'} now.` },
  { patterns: [/press conference/i, /presser/i], action: 'PRESS_CONF', response: () => 'Press conference is at 2pm today in the media suite. AI briefing notes are ready.' },
  { patterns: [/window clos/i, /days.*window/i, /transfer window/i], action: 'WINDOW_CLOSES', response: () => 'The transfer window closes in 11 days. Two targets are in active negotiation.' },
  { patterns: [/match.*doubt/i, /flag.*doubt/i, /doubt for/i], action: 'MATCH_DOUBT', response: (_m, t) => { const p = findPlayer(t); return p ? `${p.fullName} flagged as match-day doubt.` : 'Who would you like to flag?' } },
  { patterns: [/academy highlight/i, /academy/i], action: 'ACADEMY', response: () => 'Academy highlights: U21s won 3-0 yesterday. J. Collins scored a hat-trick and is recommended for first-team training.' },
  { patterns: [/board report/i, /generate.*report/i], action: 'BOARD_REPORT', response: () => 'Generating board report now. Includes squad status, transfer activity, and financial summary.' },
  { patterns: [/team sheet/i, /starting.*eleven/i, /lineup/i], action: 'TEAM_SHEET', response: () => 'Opening team sheet builder for Saturday\'s match.' },
  { patterns: [/training plan/i, /today.*training/i], action: 'TRAINING', response: () => 'Today\'s training: tactical session at 10am, set pieces at 11:30. Recovery group in the gym.' },
  { patterns: [/match report/i, /last.*result/i], action: 'MATCH_REPORT', response: () => 'Last match: Oakridge FC 2-1 Riverside United. Goals from Santos and Thompson. xG 1.8 vs 0.9.' },
  { patterns: [/scout report/i, /scouting/i], action: 'SCOUT_REPORT', response: () => 'Opening scout report form. 3 reports submitted this week.' },
  { patterns: [/contract.*expir/i, /renewal/i], action: 'CONTRACTS', response: () => '4 contracts expiring in June. Martinez renewal is flagged urgent — board approval needed.' },
  { patterns: [/what.*time/i], action: 'TELL_TIME', response: () => `It's ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.` },
  { patterns: [/help/i, /what can you do/i, /commands/i], action: 'HELP', response: () => 'You can say: who\'s fit for Saturday, log injury, transfer budget, agent messages, team sheet, press conference, academy highlights, or board report.' },
]

export function useFootballVoiceCommands() {
  const recRef = useRef<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lastCommand, setLastCommand] = useState<FootballCommandResult | null>(null)

  const process = useCallback((text: string): FootballCommandResult => {
    for (const cmd of CMDS) for (const p of cmd.patterns) { const m = text.match(p); if (m) return { command: text, action: cmd.action, response: cmd.response(m, text) } }
    return { command: text, action: 'UNKNOWN', response: `I heard "${text}" but I'm not sure what to do. Say "help" for commands.` }
  }, [])

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const r = new SR(); r.lang = 'en-GB'; r.interimResults = false; r.maxAlternatives = 1; r.continuous = false
    r.onresult = (e: any) => { const t = e.results[0][0].transcript; setTranscript(t); setLastCommand(process(t)) }
    r.onend = () => setIsListening(false); r.onerror = () => setIsListening(false)
    recRef.current = r; r.start(); setIsListening(true)
  }, [process])

  const stopListening = useCallback(() => { recRef.current?.stop(); setIsListening(false) }, [])
  return { isListening, transcript, lastCommand, startListening, stopListening }
}
