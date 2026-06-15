'use client'

import FinancialPlanningWorkspace, { type FinanceProfile } from '@/components/finance/FinancialPlanningWorkspace'

// Women's — Financial Planning (Oakridge Women FC, WSL 2). All figures £k, illustrative.
const WOMENS_PROFILE: FinanceProfile = {
  unit: 'k',
  revenue: [
    { label: 'Central distribution', amount: 700 },
    { label: 'Matchday', amount: 350 },
    { label: 'Commercial & sponsorship', amount: 650 },
    { label: 'Grants & other', amount: 300 },
  ],
  costs: [
    { label: 'Player & staff wages', amount: 1400 },
    { label: 'Football operations', amount: 250 },
    { label: 'Matchday', amount: 150 },
    { label: 'Administration', amount: 120 },
    { label: 'Academy', amount: 80 },
  ],
  wageBill: 1400,
  cashOnHand: 600,
  monthlyNet: 0,
  regLabel: 'FSR',
  wageCapPct: 80,
  lossAllowance: 1200,
  lossUsed: 400,
  cashFlow: [
    { m: 'Jul', inflow: 150, outflow: 180 }, { m: 'Aug', inflow: 160, outflow: 165 },
    { m: 'Sep', inflow: 180, outflow: 170 }, { m: 'Oct', inflow: 170, outflow: 168 },
    { m: 'Nov', inflow: 175, outflow: 168 }, { m: 'Dec', inflow: 260, outflow: 175 },
    { m: 'Jan', inflow: 165, outflow: 230 }, { m: 'Feb', inflow: 180, outflow: 168 },
    { m: 'Mar', inflow: 175, outflow: 168 }, { m: 'Apr', inflow: 170, outflow: 168 },
    { m: 'May', inflow: 185, outflow: 168 }, { m: 'Jun', inflow: 290, outflow: 175 },
  ],
  budgets: [
    { dept: 'Player wages', budget: 1400, actual: 1420 },
    { dept: 'Recruitment', budget: 200, actual: 180 },
    { dept: 'Academy', budget: 80, actual: 84 },
    { dept: 'Operations & matchday', budget: 150, actual: 145 },
    { dept: 'Commercial & marketing', budget: 120, actual: 110 },
  ],
  promoUplift: 0.5,
  relegationHit: 0.3,
}

export default function WomensFinancialPlanningView() {
  return <FinancialPlanningWorkspace accent="#BE185D" profile={WOMENS_PROFILE} />
}
