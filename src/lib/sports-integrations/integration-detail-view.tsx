'use client'
import React, { useState } from 'react'

export type IntegrationStatus = 'Live' | 'Beta' | 'Planned'

export type IntegrationEndpoint = {
  endpoint: string
  desc: string
  status: IntegrationStatus
}

export type IntegrationCoverage = {
  title: string
  columns: string[]
  rows: string[][]
}

export type IntegrationConfig = {
  icon: string
  title: string
  subtitle: string
  partnerBadge: string
  connectLabel: string
  summaryText: string
  connectedStats?: { label: string; value: string }[]
  whyHeading: string
  whyBody: string
  endpointsTitle: string
  endpoints: IntegrationEndpoint[]
  coverage?: IntegrationCoverage
  pricing: string
}

export function IntegrationDetailCard({ config }: { config: IntegrationConfig }) {
  const [connected, setConnected] = useState(false)
  return (
    <div className="space-y-6">
      <div className="mb-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <h2 className="text-xl font-bold text-white">{config.title}</h2>
        </div>
        <p className="text-sm text-gray-400 mt-1 ml-7">{config.subtitle}</p>
      </div>

      <div className={`rounded-xl p-5 border ${connected ? 'bg-teal-900/20 border-teal-600/40' : 'bg-gray-900/30 border-gray-700'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 ${connected ? 'border-teal-500 bg-teal-500/20' : 'border-gray-600 bg-gray-800'}`}>
              {config.icon}
            </div>
            <div>
              <div className="text-white font-semibold">{config.title}</div>
              <div className="text-xs text-gray-400">{config.partnerBadge}</div>
            </div>
          </div>
          <button
            onClick={() => setConnected(!connected)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${connected ? 'bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30' : 'bg-green-600 text-white hover:bg-green-700'}`}
          >
            {connected ? 'Disconnect' : config.connectLabel}
          </button>
        </div>
        {connected && config.connectedStats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {config.connectedStats.map((s, i) => (
              <div key={i} className="bg-black/20 rounded-lg p-3 text-center">
                <div className="text-white font-bold text-sm">{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400">{config.summaryText}</div>
        )}
      </div>

      <div className="bg-[#0d0f1a] border border-green-600/30 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">{config.whyHeading}</div>
        <div className="text-sm text-gray-300 leading-relaxed">{config.whyBody}</div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <div className="text-sm font-semibold text-white">{config.endpointsTitle}</div>
        </div>
        <div className="divide-y divide-gray-800/50">
          {config.endpoints.map((e, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.status === 'Live' ? 'bg-teal-500' : e.status === 'Beta' ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{e.endpoint}</div>
                <div className="text-xs text-gray-500">{e.desc}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${e.status === 'Live' ? 'bg-teal-600/20 text-teal-400' : e.status === 'Beta' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-gray-600/20 text-gray-400'}`}>
                {e.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {config.coverage && (
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <div className="text-sm font-semibold text-white">{config.coverage.title}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800 bg-gray-900/30">
                  {config.coverage.columns.map((c, i) => (
                    <th key={i} className="text-left p-3">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {config.coverage.rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    {row.map((v, j) => {
                      const color = j === 0 ? 'text-white font-medium'
                        : v.startsWith('✓') ? 'text-teal-400'
                        : (v === 'N/A' || v === '—') ? 'text-gray-600'
                        : 'text-yellow-400'
                      return <td key={j} className={`p-3 ${color}`}>{v}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
        <div className="text-xs font-semibold text-blue-400 mb-1">ℹ️ Pricing &amp; Access</div>
        <div className="text-xs text-gray-400">{config.pricing}</div>
      </div>
    </div>
  )
}
