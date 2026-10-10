// The /impact/demo bundle: fictional Northvale / Rally Ten dataset, brand and
// copy, shaped for ImpactDataProvider. The `satisfies` checks keep this set in
// lock-step with the Ten Project shape the shared views are typed against.

import type { ImpactBrand, ImpactCopy, ImpactDataset, ImpactPortalContext } from '@/app/tenproject/[slug]/_components/ImpactDataContext'
import * as DEMO from './demo-data'
import { IMPACT_DEMO_BRAND, IMPACT_DEMO_COPY } from './demo-copy'

export const IMPACT_DEMO_CONTEXT: ImpactPortalContext = {
  mode: 'demo',
  brand: IMPACT_DEMO_BRAND satisfies ImpactBrand,
  copy: IMPACT_DEMO_COPY satisfies ImpactCopy,
  data: { ...DEMO } satisfies ImpactDataset,
  // Demo: every module on, settings shown but not editable (Coach demo idiom).
  org: {
    slug: 'demo',
    settings: { modules: {} },
    canEdit: false,
    readOnlyReason: 'This is the demo — settings are shown but can’t be changed.',
    save: async () => ({ ok: false, error: 'Read-only demo' }),
  },
}
