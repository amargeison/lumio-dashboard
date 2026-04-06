'use client'

import { useState } from 'react'
import { ROLE_LABELS } from '@/lib/permissions'

interface AccessRequestProps {
  dept: string
  deptLabel: string
  deptDescription: string
  userRole: string
  roleLevel: number
  requiredLevel?: number
  onRequest?: () => void
}

export default function AccessRequest({ deptLabel, deptDescription, userRole, roleLevel, requiredLevel = 1, onRequest }: AccessRequestProps) {
  const [requested, setRequested] = useState(false)
  const [reason, setReason] = useState('')

  const roleLabel = ROLE_LABELS[userRole] || userRole
  const requiredLabel = requiredLevel <= 1 ? 'Director' : requiredLevel <= 2 ? 'Admin' : 'Manager'

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-2">{deptLabel}</h2>
        <p className="text-gray-400 mb-2">{deptDescription}</p>
        <div className="bg-gray-900 rounded-xl p-3 mb-6 inline-block">
          <span className="text-xs text-gray-500">Your role: </span>
          <span className="text-xs font-medium text-amber-400">{roleLabel}</span>
          <span className="text-xs text-gray-500 ml-2">· Access requires {requiredLabel} level or above</span>
        </div>

        {!requested ? (
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-6 text-left">
            <h3 className="text-white font-semibold mb-1">Request Access</h3>
            <p className="text-xs text-gray-500 mb-4">Your request will be sent to your workspace admin for approval.</p>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1.5 block">Reason for access</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="Why do you need access to this department?"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"
              />
            </div>
            <button
              onClick={() => { setRequested(true); onRequest?.() }}
              disabled={!reason.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white py-2.5 rounded-xl font-semibold text-sm"
            >
              Request Access
            </button>
          </div>
        ) : (
          <div className="bg-teal-900/20 border border-teal-700/30 rounded-2xl p-6">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-white font-semibold mb-1">Request sent</div>
            <div className="text-sm text-gray-400">Your workspace admin has been notified. You&apos;ll receive an email when access is granted.</div>
          </div>
        )}
      </div>
    </div>
  )
}
