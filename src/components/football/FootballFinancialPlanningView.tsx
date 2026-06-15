'use client'

import FinancialPlanningWorkspace, { type FinanceProfile } from '@/components/finance/FinancialPlanningWorkspace'

// Men's Pro — Financial Planning (Oakridge FC, EFL Championship). All figures £m, illustrative.
const MENS_PROFILE: FinanceProfile = {
  unit: 'M',
  revenue: [
    { label: 'Broadcast & central', amount: 14 },
    { label: 'Matchday', amount: 9 },
    { label: 'Commercial & sponsorship', amount: 11 },
    { label: 'Player trading & other', amount: 4 },
  ],
  costs: [
    { label: 'Player & staff wages', amount: 24 },
    { label: 'Football operations', amount: 5 },
    { label: 'Stadium & matchday', amount: 3 },
    { label: 'Administration', amount: 2 },
    { label: 'Academy', amount: 2 },
  ],
  wageBill: 24,
  cashOnHand: 8,
  monthlyNet: 0.2,
  regLabel: 'PSR',
  wageCapPct: 70,
  lossAllowance: 39,
  lossUsed: 22,
  cashFlow: [
    { m: 'Jul', inflow: 2.6, outflow: 3.4 }, { m: 'Aug', inflow: 3.0, outflow: 3.0 },
    { m: 'Sep', inflow: 3.4, outflow: 3.0 }, { m: 'Oct', inflow: 3.0, outflow: 3.0 },
    { m: 'Nov', inflow: 3.2, outflow: 3.0 }, { m: 'Dec', inflow: 4.8, outflow: 3.2 },
    { m: 'Jan', inflow: 3.0, outflow: 4.4 }, { m: 'Feb', inflow: 3.6, outflow: 3.0 },
    { m: 'Mar', inflow: 3.2, outflow: 3.0 }, { m: 'Apr', inflow: 3.0, outflow: 3.0 },
    { m: 'May', inflow: 3.4, outflow: 3.0 }, { m: 'Jun', inflow: 5.0, outflow: 3.2 },
  ],
  budgets: [
    { dept: 'First-team wages', budget: 24, actual: 24.3 },
    { dept: 'Recruitment / transfers', budget: 6, actual: 5.4 },
    { dept: 'Academy', budget: 2, actual: 2.1 },
    { dept: 'Operations & stadium', budget: 3, actual: 2.9 },
    { dept: 'Commercial & marketing', budget: 2, actual: 1.8 },
  ],
  promoUplift: 0.6,
  relegationHit: 0.4,
}

export default function FootballFinancialPlanningView() {
  return <FinancialPlanningWorkspace accent="#003DA5" profile={MENS_PROFILE} />
}
