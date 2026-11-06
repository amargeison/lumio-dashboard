'use client'

// What feeds the shared Impact / Ten Project views. Every view reads its
// dataset, brand identity and demo copy from here instead of importing
// src/data/tenproject/demo-data.ts directly, so one set of views serves:
//   /tenproject/*        — no provider → the Ten Project defaults below
//   /impact/demo         — fictional Northvale / Rally Ten set (src/data/impact)
//   /impact/<live slug>  — Ten Project brand + Supabase data / empty states
// The palette (TP_RED etc.) stays a direct import — it's chrome, not content.

import React, { createContext, useContext } from 'react'
import * as TP from '@/data/tenproject/demo-data'
import { TEN_PROJECT_BRAND, TEN_PROJECT_COPY } from '@/data/tenproject/portal-copy'
import type { ImpactOrgSettings } from '@/lib/impact/org'
import type { LiveInsights } from '@/lib/impact/insights'
import type { PackData } from '@/lib/impact/packs'

export { fill } from '@/lib/impact/fill'

type Palette = 'TP_RED' | 'TP_BLACK' | 'TP_DARK' | 'TP_PAPER'
type TpModule = Omit<typeof TP, Palette>

// Top-level string consts (and the `as const` STICKER_AREAS) are literal-typed
// in the Ten Project file; widen them so other datasets carry their own values.
export type ImpactDataset = {
  [K in keyof TpModule]: K extends 'STICKER_AREAS'
    ? readonly { id: string; label: string; desc: string }[]
    : TpModule[K] extends string ? string : TpModule[K]
}

export type ImpactBrand = typeof TEN_PROJECT_BRAND
export type ImpactCopy = typeof TEN_PROJECT_COPY

/** Saved per-org settings (impact_orgs) — present on /impact portals only. */
export interface ImpactOrgHandle {
  slug: string
  settings: ImpactOrgSettings
  /** Signed-in HQ of this org, and the settings row exists. */
  canEdit: boolean
  /** Why settings are read-only, when they are. */
  readOnlyReason?: string
  save: (next: ImpactOrgSettings) => Promise<{ ok: boolean; error?: string }>
}

export interface ImpactPortalContext {
  /** 'demo' renders curated content; 'live' renders data-driven/empty states. */
  mode: 'demo' | 'live'
  brand: ImpactBrand
  copy: ImpactCopy
  data: ImpactDataset
  /** Absent on the legacy /tenproject route (no org settings there). */
  org?: ImpactOrgHandle
  /** Live portals: households and their children (Families module, parent preview). */
  people?: ImpactPeople
  /** Live portals: staff CPD records, by school. */
  cpd?: ImpactCpd[]
  /** Live portals: the Insights page and funder documents, computed from the rows. */
  insights?: LiveInsights
  /** Live portals: the welcome pack, its stock, issues and payments. */
  packs?: PackData
  /** Live portals: every cohort with its children, for the Coach view. */
  cohorts?: LiveCohort[]
  /** Live portals: load the org's data again after a change. */
  reload?: () => void
}

export interface LiveCohort { id: string; label: string; sessionId: string | null; leadStaffId: string | null; children: TP.DemoChild[] }

export interface ImpactChild {
  id: string; name: string; age: number | null; yearGroup: string | null; school: string | null; schoolId?: string | null
  medical: string | null; photoConsent: boolean | null; feeStatus: string; stickers: number
}
export interface ImpactFamily {
  id: string; guardian: string; email: string | null; phone: string | null
  consentData: boolean | null; consentPhoto: boolean | null; unsubscribed: boolean; children: ImpactChild[]
}
export interface ImpactCpd { id: string; school_id: string; staff_name: string; course: string; cpd_date: string | null; provider: string | null; notes: string | null }
export interface ImpactPeople { families: ImpactFamily[]; unlinkedChildren: ImpactChild[] }

const { TP_RED: _r, TP_BLACK: _b, TP_DARK: _d, TP_PAPER: _p, ...TP_DATA } = TP

export const TEN_PROJECT_CONTEXT: ImpactPortalContext = {
  mode: 'demo',
  brand: TEN_PROJECT_BRAND,
  copy: TEN_PROJECT_COPY,
  data: TP_DATA,
}

const Ctx = createContext<ImpactPortalContext>(TEN_PROJECT_CONTEXT)

export function ImpactDataProvider({ value, children }: { value: ImpactPortalContext; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useImpact(): ImpactPortalContext {
  return useContext(Ctx)
}
