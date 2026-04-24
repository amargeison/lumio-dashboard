'use client'

// Stylised US-grid map. Each state is a 56x56 tile, laid out roughly
// geographically. Tile colour = dominant engagement among schools in
// that state. Opacity scales with school count (more schools → more
// saturated). Ported from scripts/rgr/rgr_dashboard.html.

import { T, RAG_COLOR } from './tokens'
import type { School } from './types'

const STATE_PATHS: Record<string, [number, number]> = {
  AK:[20,20],  ME:[620,20],
  VT:[560,80], NH:[620,80],
  WA:[80,140], ID:[140,140], MT:[200,140], ND:[260,140], MN:[320,140], IL:[380,140], WI:[410,140], MI:[470,140], NY:[560,140], MA:[620,140], RI:[650,140],
  OR:[80,200], UT:[140,200], WY:[200,200], SD:[260,200], IA:[320,200], IN:[380,200], OH:[440,200], PA:[500,200], NJ:[560,200], CT:[590,200],
  CA:[80,260], NV:[140,260], CO:[200,260], NE:[260,260], MO:[320,260], KY:[380,260], WV:[440,260], VA:[500,260], MD:[560,260], DE:[590,260], DC:[572,260],
  AZ:[140,320], NM:[200,320], KS:[260,320], AR:[320,320], TN:[380,320], NC:[440,320], SC:[500,320],
  HI:[20,380],  OK:[260,380], LA:[320,380], MS:[380,380], AL:[440,380], GA:[500,380],
  TX:[260,440],                                                        FL:[500,440],
}

const STATE_ABBR: Record<string, string> = {
  Alabama:'AL', Alaska:'AK', Arizona:'AZ', Arkansas:'AR', California:'CA', Colorado:'CO', Connecticut:'CT', Delaware:'DE', 'District of Columbia':'DC',
  Florida:'FL', Georgia:'GA', Hawaii:'HI', Idaho:'ID', Illinois:'IL', Indiana:'IN', Iowa:'IA', Kansas:'KS', Kentucky:'KY', Louisiana:'LA',
  Maine:'ME', Maryland:'MD', Massachusetts:'MA', Michigan:'MI', Minnesota:'MN', Mississippi:'MS', Missouri:'MO', Montana:'MT', Nebraska:'NE',
  Nevada:'NV', 'New Hampshire':'NH', 'New Jersey':'NJ', 'New Mexico':'NM', 'New York':'NY', 'North Carolina':'NC', 'North Dakota':'ND', Ohio:'OH',
  Oklahoma:'OK', Oregon:'OR', Pennsylvania:'PA', 'Rhode Island':'RI', 'South Carolina':'SC', 'South Dakota':'SD', Tennessee:'TN', Texas:'TX',
  Utah:'UT', Vermont:'VT', Virginia:'VA', Washington:'WA', 'West Virginia':'WV', Wisconsin:'WI', Wyoming:'WY',
}

const SIZE = 56

type StateRow = { total: number; red: number; amber: number; green: number }

export function UsStateMap({ schools }: { schools: School[] }) {
  const byState: Record<string, StateRow> = {}
  for (const s of schools) {
    const abbr = STATE_ABBR[s.state]
    if (!abbr) continue
    const row = byState[abbr] ??= { total: 0, red: 0, amber: 0, green: 0 }
    row.total++
    row[s.engagement]++
  }

  return (
    <svg viewBox="0 0 700 520" style={{ width: '100%', height: 'auto', maxHeight: 420 }} xmlns="http://www.w3.org/2000/svg">
      {Object.entries(STATE_PATHS).map(([abbr, [x, y]]) => {
        const row = byState[abbr]
        let fill: string = T.border
        let opacity = 0.22
        let textColor: string = T.inkMute
        if (row) {
          if (row.red >= row.green && row.red >= row.amber) fill = RAG_COLOR.red
          else if (row.amber >= row.green) fill = RAG_COLOR.amber
          else fill = RAG_COLOR.green
          opacity = Math.min(1, 0.45 + row.total * 0.08)
          textColor = '#03191a'
        }
        const cx = x + SIZE / 2
        const cy = y + SIZE / 2
        const title = row
          ? `${abbr}: ${row.total} school${row.total === 1 ? '' : 's'} (R:${row.red} A:${row.amber} G:${row.green})`
          : `${abbr}: no schools`
        return (
          <g key={abbr}>
            <rect x={x} y={y} width={SIZE} height={SIZE} fill={fill} fillOpacity={opacity} rx={3}>
              <title>{title}</title>
            </rect>
            <text x={cx} y={cy - 3} textAnchor="middle" fontSize={12} fontWeight={700} fill={textColor} pointerEvents="none">{abbr}</text>
            {row && (
              <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill={textColor} fillOpacity={0.9} pointerEvents="none">{row.total}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default UsStateMap
