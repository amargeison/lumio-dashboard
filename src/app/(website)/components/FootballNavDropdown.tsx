'use client'
import { NavDropdown } from './NavDropdown'

const FOOTBALL_TIERS = [
  { href: '/football/pro',         label: 'Pro & Academy', subtitle: 'EFL · Premier League · Academies' },
  { href: '/football/non-league',  label: 'Non-League',    subtitle: 'National League · Steps 1–6' },
  { href: '/football/grassroots',  label: 'Grassroots',    subtitle: 'Amateur · Youth · Sunday League' },
  { href: '/football/junior',      label: 'Junior',        subtitle: 'U7–U16 · FA Charter Standard · Volunteer-led' },
]

type Props = {
  /** Text size / weight classes to match the surrounding nav. */
  className?: string
  /** Whether the parent header is scrolled (affects panel bg). */
  scrolled?: boolean
}

// Thin wrapper over the generic NavDropdown — keeps the existing call sites and
// FOOTBALL_TIERS export unchanged. Football's appearance/behaviour is identical.
export function FootballNavDropdown({ className, scrolled }: Props) {
  return (
    <NavDropdown
      label="Football"
      tiers={FOOTBALL_TIERS}
      accentHover="rgba(239, 68, 68, 0.08)"
      className={className}
      scrolled={scrolled}
    />
  )
}

export { FOOTBALL_TIERS }
