'use client'

import React from 'react'
import { X, MapPin, CalendarDays, Users, Plane, BedDouble, Truck, ShieldCheck, Target, Briefcase, HeartPulse, PoundSterling, Trophy } from 'lucide-react'
import { type Trip, fmtGBP, tripCost } from './WomensTripBuilder'

const C = {
  bg: '#07080F', panel: '#111318', panel2: '#0D0F14',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', accent: '#BE185D',
}
const statusColor = (s: string) => s === 'Active' ? C.good : s === 'Planned' ? C.warn : s === 'Completed' ? C.text3 : C.text4

function Card({ title, icon: Icon, accent, children }: { title: string; icon: React.ElementType; accent: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-2 mb-3"><Icon size={15} style={{ color: accent }} /><span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.text3 }}>{title}</span></div>
      {children}
    </div>
  )
}

export default function WomensTripDetail({ trip, accent = '#BE185D', onClose }: { trip: Trip; accent?: string; onClose: () => void }) {
  const total = tripCost(trip)
  const maxLine = Math.max(1, ...trip.budget.map(b => b.amount))
  return (
    <div className="fixed inset-0 z-[120] flex flex-col" style={{ background: C.bg }}>
      {/* header */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2.5 min-w-0">
          {trip.kind === 'camp' ? <CalendarDays size={17} style={{ color: accent }} /> : <Plane size={17} style={{ color: accent }} />}
          <span className="text-sm font-bold truncate" style={{ color: C.text }}>{trip.name}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${statusColor(trip.status)}26`, color: statusColor(trip.status) }}>{trip.status.toUpperCase()}</span>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ color: C.text3, border: `1px solid ${C.border}` }}><X size={16} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* hero facts */}
          <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${accent}22, ${C.panel} 60%)`, border: `1px solid ${C.border}` }}>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12.5px]">
              <span style={{ color: C.text2 }}><CalendarDays size={12} className="inline mr-1.5" style={{ color: accent }} />{trip.dates || 'Dates TBC'}</span>
              <span style={{ color: C.text2 }}><MapPin size={12} className="inline mr-1.5" style={{ color: accent }} />{trip.location || '—'}</span>
              <span style={{ color: C.text2 }}><Users size={12} className="inline mr-1.5" style={{ color: accent }} />{trip.squad || '—'}</span>
              <span style={{ color: C.text2 }}><PoundSterling size={12} className="inline mr-1.5" style={{ color: accent }} />{fmtGBP(total)}</span>
            </div>
            {trip.focus && <div className="text-[12px] mt-2" style={{ color: C.text3 }}>{trip.focus}</div>}
            {trip.summary && <p className="text-[12.5px] mt-3 leading-relaxed" style={{ color: C.text2 }}>{trip.summary}</p>}
            {trip.outcome && (
              <div className="mt-3 rounded-lg p-3 flex items-start gap-2" style={{ background: `${C.good}12`, border: `1px solid ${C.good}33` }}>
                <Trophy size={14} style={{ color: C.good }} className="mt-0.5 flex-shrink-0" />
                <span className="text-[12px]" style={{ color: C.text2 }}>{trip.outcome}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {trip.objectives.length > 0 && (
              <Card title="Objectives" icon={Target} accent={accent}>
                <ul className="space-y-1.5">
                  {trip.objectives.map((o, i) => <li key={i} className="flex gap-2 text-[12.5px]" style={{ color: C.text2 }}><span style={{ color: accent }}>•</span>{o}</li>)}
                </ul>
              </Card>
            )}
            {(trip.staff.length > 0 || trip.squad) && (
              <Card title="Squad & travelling staff" icon={Users} accent={accent}>
                {trip.squad && <div className="text-[12.5px] mb-2" style={{ color: C.text2 }}>{trip.squad}</div>}
                <div className="flex flex-wrap gap-1.5">
                  {trip.staff.map((s, i) => <span key={i} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: C.panel2, color: C.text3, border: `1px solid ${C.border}` }}>{s}</span>)}
                </div>
              </Card>
            )}
          </div>

          {trip.itinerary.length > 0 && (
            <Card title="Itinerary" icon={CalendarDays} accent={accent}>
              <div className="space-y-2">
                {trip.itinerary.map((d, i) => (
                  <div key={i} className="rounded-lg p-3" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
                    <div className="text-[12px] font-bold mb-1.5" style={{ color: accent }}>{d.day}</div>
                    <div className="grid grid-cols-3 gap-2 text-[11.5px]" style={{ color: C.text2 }}>
                      <div><span className="block text-[9px] uppercase" style={{ color: C.text4 }}>AM</span>{d.am || '—'}</div>
                      <div><span className="block text-[9px] uppercase" style={{ color: C.text4 }}>PM</span>{d.pm || '—'}</div>
                      <div><span className="block text-[9px] uppercase" style={{ color: C.text4 }}>Eve</span>{d.eve || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Travel & accommodation" icon={Plane} accent={accent}>
              <div className="space-y-2 text-[12.5px]">
                <Fact icon={Plane} label="Travel" v={trip.logistics.travel} />
                <Fact icon={BedDouble} label="Accommodation" v={trip.logistics.accommodation} />
                <Fact icon={Truck} label="Transport" v={trip.logistics.transport} />
                <Fact icon={ShieldCheck} label="Insurance" v={trip.logistics.insurance} />
              </div>
            </Card>
            {trip.budget.length > 0 && (
              <Card title="Budget" icon={PoundSterling} accent={accent}>
                <div className="space-y-1.5">
                  {trip.budget.map((b, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex-1 text-[12px]" style={{ color: C.text2 }}>{b.line}</span>
                      <div className="w-20 h-1.5 rounded-full" style={{ background: C.borderHi }}><div className="h-1.5 rounded-full" style={{ width: `${(b.amount / maxLine) * 100}%`, background: accent }} /></div>
                      <span className="w-16 text-right text-[11.5px] font-mono" style={{ color: C.text }}>{fmtGBP(b.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 mt-1 text-[13px] font-bold" style={{ borderTop: `1px solid ${C.border}`, color: C.text }}>
                    <span>Total</span><span className="font-mono" style={{ color: accent }}>{fmtGBP(total)}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {trip.commercial.length > 0 && (
              <Card title="Commercial activation" icon={Briefcase} accent={accent}>
                <ul className="space-y-1.5">{trip.commercial.map((c, i) => <li key={i} className="flex gap-2 text-[12.5px]" style={{ color: C.text2 }}><span style={{ color: accent }}>•</span>{c}</li>)}</ul>
              </Card>
            )}
            {trip.medical.length > 0 && (
              <Card title="Medical & welfare" icon={HeartPulse} accent={accent}>
                <ul className="space-y-1.5">{trip.medical.map((m, i) => <li key={i} className="flex gap-2 text-[12.5px]" style={{ color: C.text2 }}><span style={{ color: accent }}>•</span>{m}</li>)}</ul>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Fact({ icon: Icon, label, v }: { icon: React.ElementType; label: string; v: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={13} style={{ color: C.text4 }} className="mt-0.5 flex-shrink-0" />
      <div><span className="block text-[10px] uppercase" style={{ color: C.text4 }}>{label}</span><span style={{ color: C.text2 }}>{v || '—'}</span></div>
    </div>
  )
}
