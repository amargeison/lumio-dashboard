/**
 * Marketing-site sport availability config.
 *
 * Single source of truth for "which sport demos are live vs coming soon"
 * across lumiosports.com marketing surfaces:
 *   - /sports/try-demo grid (per-sport card)
 *   - per-sport landing pages (Try the demo / View demo / See it in the
 *     portal CTAs)
 *   - /sports-product tabbed product page (per-portal demo CTA)
 *
 * Lifted from the inline definition that previously sat in
 * src/app/(website)/sports/try-demo/page.tsx. The shape and order are
 * preserved so the existing SportCard render path is unchanged.
 *
 * Flip `available` to `true` once a sport's demo is signed off. The
 * href stays intact regardless so ungating is a one-line change.
 *
 * Scope notes:
 *  - This module is for the public marketing site. Live-portal demo
 *    routes (e.g. /tennis/demo) still exist on disk — they're just no
 *    longer linked from marketing while gated.
 *  - sports-product/page.tsx has its own PORTALS array with overlapping
 *    but not identical IDs; it maps `womensfootball` -> `womens` and
 *    derives gated state from this array's `available` flag.
 */

export type Sport = {
  id: string
  label: string
  logo: string
  href: string
  accent: string
  desc: string
  available: boolean
}

export const SPORTS: Sport[] = [
  { id: 'football',   label: 'Football Pro',    logo: '/football_logo.png',  href: '/football/oakridge-fc',                accent: '#3b82f6', desc: 'PSR compliance, FIFA pitch view, set pieces, board suite',                       available: true  },
  { id: 'womens',     label: "Women's FC",      logo: '/womens_fc_logo.png', href: '/womens/oakridge-women',               accent: '#be185d', desc: 'FSR compliance, player welfare, dual registration, demerger tracker',           available: true  },
  { id: 'junior',     label: 'Junior Football', logo: '/football_logo.png',  href: '/junior/oakridge-juniors',             accent: '#16A34A', desc: 'Parent app, FA Charter Standard, junior development tracking, referee module',  available: true  },
  { id: 'nonleague',  label: 'Non-League',      logo: '/football_logo.png',  href: '/nonleague/harfield-fc',               accent: '#f59e0b', desc: 'FA Ground Grading, wage bill, sponsorship, match day revenue',                  available: false },
  { id: 'grassroots', label: 'Grassroots',      logo: '/football_logo.png',  href: '/grassroots/sunday-rovers-fc',         accent: '#84cc16', desc: 'AI team selection, subs collection, safeguarding, parent portal',               available: true  },
  { id: 'cricket',    label: 'Cricket',         logo: '/cricket_logo.png',   href: '/cricket/cricket-demo',                accent: '#10b981', desc: 'GPS bowling load, batting analytics, D/L calculator, camp mode',                available: true  },
  { id: 'rugby',      label: 'Rugby',           logo: '/rugby_logo.png',     href: '/rugby/hartfield',                     accent: '#f97316', desc: 'Salary cap, GPS, pre-season camp, set pieces, board suite',                     available: true  },
  { id: 'tennis',     label: 'Tennis',          logo: '/tennis_logo.png',    href: '/tennis/demo',                         accent: '#a855f7', desc: 'ATP/WTA rankings, match prep, AI briefing, GPS heatmaps',                        available: true  },
  { id: 'tenniscoach', label: 'Tennis Coach',   logo: '/tennis_coach_logo.png', href: '/tennis/coach/demo',                accent: '#3A8EE0', desc: 'Session planner, AI reviews, Racket Progression, GPS heatmaps',                  available: true  },
  { id: 'boxing',     label: 'Boxing',          logo: '/boxing_logo.png',    href: '/boxing/demo',                         accent: '#ef4444', desc: 'Fight camp, weight tracker, opponent scout, purse simulator',                   available: true  },
  { id: 'golf',       label: 'Golf',            logo: '/golf_logo.png',      href: '/golf/demo',                           accent: '#EAB308', desc: 'OWGR ranking, strokes gained, course fit, caddie hub',                          available: true  },
  { id: 'darts',      label: 'Darts',           logo: '/darts_logo.png',     href: '/darts/demo',                          accent: '#22c55e', desc: 'PDC rankings, practice tracker, match prep, opponent intel',                    available: true  },
]
