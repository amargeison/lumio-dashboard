'use client'

import React from 'react'
import Link from 'next/link'
import { Database, Users, Link2, Inbox } from 'lucide-react'

// ─── Standard empty state presets ────────────────────────────────────────────

export const EMPTY_STATES = {
  sso: {
    title: "Connect your directory",
    message: "Link Google Workspace or Microsoft 365 to sync your team automatically.",
    ctaLabel: "Set up SSO",
    ctaHref: "/settings/integrations",
    icon: "integration" as const,
  },
  staff: {
    title: "No staff added yet",
    message: "Import your team via CSV or connect your HR system to see staff here.",
    ctaLabel: "Import staff",
    ctaHref: "/settings/data",
    icon: "data" as const,
  },
  contacts: {
    title: "No contacts yet",
    message: "Upload your contacts via CSV or connect HubSpot to populate your CRM.",
    ctaLabel: "Import contacts",
    ctaHref: "/settings/data",
    icon: "data" as const,
  },
  accounts: {
    title: "No accounts yet",
    message: "Add your clients and accounts manually or import via CSV.",
    ctaLabel: "Import accounts",
    ctaHref: "/settings/data",
    icon: "data" as const,
  },
  insights: {
    title: "No data to display",
    message: "Connect your integrations or import data to see live insights here.",
    ctaLabel: "Connect integrations",
    ctaHref: "/settings/integrations",
    icon: "integration" as const,
  },
  generic: {
    title: "Nothing here yet",
    message: "This section will populate once your data is connected.",
    ctaLabel: "Get started",
    ctaHref: "/settings",
    icon: "generic" as const,
  },
} as const

// ─── Icon map ────────────────────────────────────────────────────────────────

const ICONS = {
  integration: Link2,
  data: Database,
  team: Users,
  generic: Inbox,
} as const

// ─── Component ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  title: string
  message: string
  ctaLabel?: string
  ctaHref?: string
  icon?: 'integration' | 'data' | 'team' | 'generic'
}

export default function EmptyState({ title, message, ctaLabel, ctaHref, icon = 'generic' }: EmptyStateProps) {
  const Icon = ICONS[icon]

  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl px-6 py-12 text-center"
      style={{
        backgroundColor: 'rgba(17,19,24,0.5)',
        border: '2px dashed #1F2937',
      }}
    >
      <div
        className="flex items-center justify-center rounded-xl mb-4"
        style={{
          width: 48,
          height: 48,
          backgroundColor: 'rgba(108,63,197,0.12)',
        }}
      >
        <Icon size={22} style={{ color: '#A78BFA' }} />
      </div>

      <h3
        className="text-sm font-semibold mb-1"
        style={{ color: '#F9FAFB' }}
      >
        {title}
      </h3>

      <p
        className="text-xs max-w-xs mb-4"
        style={{ color: '#6B7280', lineHeight: 1.6 }}
      >
        {message}
      </p>

      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-90"
          style={{
            backgroundColor: 'rgba(108,63,197,0.15)',
            color: '#A78BFA',
            border: '1px solid rgba(108,63,197,0.3)',
          }}
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}
