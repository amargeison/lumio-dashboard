import { NextResponse } from 'next/server'

export async function GET() {
  const hour = new Date().getHours()

  const meetings = [
    { id: '1', title: 'The Feed Network — Weekly Check-in', time: '09:00', duration: '30 min', attendees: ['Sarah M.'], location: 'Google Meet', type: 'video', status: hour > 9 ? 'done' : hour === 9 ? 'now' : 'upcoming', source: 'google', link: 'https://meet.google.com' },
    { id: '2', title: 'New Customer Demo — Oakridge Schools', time: '11:00', duration: '45 min', attendees: ['Charlotte D.'], location: 'Zoom', type: 'video', status: hour > 11 ? 'done' : hour === 11 ? 'now' : 'upcoming', source: 'google', link: 'https://zoom.us' },
    { id: '3', title: 'Investor Update Call', time: '14:00', duration: '60 min', attendees: ['Arron'], location: 'Google Meet', type: 'call', status: hour > 14 ? 'done' : hour === 14 ? 'now' : 'upcoming', source: 'outlook', link: 'https://meet.google.com' },
    { id: '4', title: 'Team Standup', time: '17:00', duration: '15 min', attendees: ['All team'], location: 'Slack Huddle', type: 'internal', status: hour > 17 ? 'done' : hour === 17 ? 'now' : 'upcoming', source: 'google' },
  ]

  return NextResponse.json({ meetings })
}
