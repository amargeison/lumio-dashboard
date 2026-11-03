'use client'

// An adult's level and checklist progress, wherever a player is shown, so
// adults are not drawn on the junior colour ladder. See adultStanding in
// lib/coach/adult-levels.ts.
//
//   const { standingOf } = useAdultStanding()
//   const a = standingOf(player)   // null for a junior
//   a ? a.label : <RacketChip … />

import { useCallback, useMemo } from 'react'
import { useCoachTable } from './coach-db'
import { adultStanding, ordered, tidyChecklist, type AdultLevel, type AdultPass, type AdultStanding } from '@/lib/coach/adult-levels'

type Who = { id: string; category?: string | null; age?: number | null; adult_level_id?: string | null }

export function useAdultStanding(): { standingOf: (p: Who | null | undefined) => AdultStanding | null; levels: AdultLevel[]; passes: (AdultPass & { id: string })[] } {
  const levelsT = useCoachTable<AdultLevel>('coach_adult_levels')
  const passesT = useCoachTable<AdultPass & { id: string }>('coach_adult_passes')
  const levels = useMemo(() => ordered(levelsT.rows.map(l => ({ ...l, checklist: tidyChecklist(l.checklist) }))), [levelsT.rows])
  const passes = passesT.rows
  const standingOf = useCallback((p: Who | null | undefined) => (p ? adultStanding(p, levels, passes) : null), [levels, passes])
  return { standingOf, levels, passes }
}
