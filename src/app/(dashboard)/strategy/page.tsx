'use client'

import Link from 'next/link'
import { Eye, Sparkles } from 'lucide-react'

export default function StrategyPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>Strategy</h1>
        <p className="mt-1 text-sm" style={{ color: '#9CA3AF' }}>
          Competitive intelligence and strategic planning tools
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/strategy/competitor-watch"
          className="group flex flex-col gap-3 rounded-xl border border-[#1F2937] bg-[#111318] p-5 hover:border-[#374151] transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
              <Eye className="w-4 h-4" style={{ color: '#EF4444' }} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
                LIVE
              </span>
            </div>
          </div>
          <div>
            <div className="font-semibold group-hover:text-white transition-colors" style={{ color: '#F9FAFB' }}>
              Competitor Watch
            </div>
            <div className="text-xs mt-1 leading-relaxed" style={{ color: '#6B7280' }}>
              Live intelligence on competitors — signals, roadmaps, pricing changes, job postings and what&apos;s coming next
            </div>
          </div>
          <div className="text-xs font-medium mt-auto" style={{ color: '#EF4444' }}>
            Open dashboard →
          </div>
        </Link>
      </div>
    </div>
  )
}
