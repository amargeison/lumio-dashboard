// ─── Static AI Summaries for Demo Shells — Today Tab Only ────────────────────
// Single source of truth. One entry per sport for the dashboard/landing page.
//
// Voice rule: second-person ("you") — the demo visitor types their own name in
// the greeting bar, but steps into an established persona's world. "You had a
// great week, coming off three top-20s at World #87..." reads cleanly for any
// visitor and any persona. Never reference the persona's name here; reference
// their stats inline (ranking, average, record).

export type DemoAISummary = {
  summary: string
  highlights: string[]
}

export const DEMO_AI_SUMMARIES: Record<string, Record<string, DemoAISummary>> = {
  golf: {
    dashboard: {
      summary: "You're heading into the Halden Motors International Open in Munich on genuine momentum — three consecutive top-20 finishes on the DP World Tour and a 4.82 strokes-gained average that has you sitting World #87 and 43rd in the Race to Dubai. The new Vanta Sports iron setup is adding roughly half a club of stopping power into firm greens, and Munich has historically rewarded your ball flight. The question this week is tee-to-green on tight par-4s — your driving is the relative weakness, and if it shows up early on Thursday, the putter will have to bail you out. Stay process-heavy. The numbers are moving.",
      highlights: [
        "You've made 11 of your last 12 DP World Tour cuts — career-best cut-making at this point of the season.",
        "Strokes-gained approach: +0.82 over the last 10 events (top-15 on tour).",
        "312 Race to Dubai points drop off this week; a T5 or better protects your top-50 trajectory.",
        "Caddie Gareth flagged the greens running a full roll faster than Tuesday's practice round — firm and fast.",
        "Meridian Watches content drop queued for Friday — GMT piece on the wrist for the weekly vlog.",
      ],
    },
  },

  tennis: {
    insights: {
      summary: "You've come out of Monte-Carlo R3 with the biggest clay win of your career — a three-set bruiser over Caballero, three service breaks in the decider, four break points saved in set two. Madrid is next: the Caja Mágica's altitude suits your flatter ball, Marco has shortened the swing path on your second serve, and the Vanta Luxe Pro tensions are dropped slightly for the conditions. Internal goal is top-50 by Wimbledon. The external one is to not talk about it. Today is tonight's QF and a Northbridge Sport interview recording; next week is a full reset into the Madrid draw. Process over outcome, same as every match.",
      highlights: [
        "ATP ranking: #67, up 4 places this clay swing (1,847 pts, career high #44 in reach).",
        "Rally balls 7+ shots won: 58% last week in Monte-Carlo, up from 44% in Marrakech.",
        "Second-serve points won: 46% — still the metric the columnists are picking on; Marco has a tweak ready for Madrid.",
        "Madrid Open wildcard confirmed; flights Sun 20 Apr, NH Eurobuilding locked in for the week.",
        "Crown Wagers ambassador inquiry (£85k/yr offer) pending — agent has the brief.",
      ],
    },
  },

  boxing: {
    dashboard: {
      summary: "Three weeks into camp for Viktor Petrov on 22 May — the fight that opens up the world title conversation. Jim has the pad rounds running at championship pace and the body-work drills locked in for exactly what Petrov's pressure game gives up. Record is 22-1, 18 KOs, 78% stoppage rate; Petrov is 28-2 with 24 knockouts and a right hand that has hurt every fighter he's put on the floor. Sheffield camp is disciplined, hotel on airplane mode, film study built around closing the two-step jab gap. Matchroom has the three-fight pipeline post-22 May in place — none of which exists if Petrov isn't dealt with. Five weeks. One opponent. One job.",
      highlights: [
        "WBC ranking: #6 heavyweight, up one this month — win on 22 May opens the mandatory eliminator.",
        "Five years under Jim Bevan: from prospect to top-10 WBC, no wasted rounds.",
        "Sparring power output: +8% on the five-session rolling average; right-hand velocity trending up.",
        "Fight-week Apex Performance billboard shoot at the London HQ — Wed 6 May.",
        "DAZN pre-fight documentary crew on site from Monday — 3 days filming access cleared.",
      ],
    },
  },

  darts: {
    dashboard: {
      summary: "Tonight is Board 4 at 20:00, Westfalenhallen Dortmund — European Championship R1 vs D. Merrick. Your 97.8 tour average is above his TV number by a point, your 42.3% checkout above his 39.8%, and the H2H sits 3-4 Merrick but you've taken the last two. Lead early — his first-3 drops six points when he loses leg one. Vanta 24g barrels unchanged, Tom has two frames strung, flights tweaked slightly for the stage lights. Dave Harris is in the building; Crown Wagers have you at 12/1 outright for the whole event. Sharp on the doubles in warm-up. Board 4, 20:00. Doors open.",
      highlights: [
        "PDC ranking: #19, 1,847 points — career high #12 within reach with a deep run tonight.",
        "Averages: 97.8 three-dart, 42.3% checkout, 4.2 180s per match.",
        "£12,400 drops off after Players Ch. 8 this week — win tonight holds #19, loss risks #22.",
        "H2H vs Merrick: 3-4 overall, the last two going your way.",
        "Vanta Sports barrel review shoot with Sarah Mills — today 14:00 at Westfalenhallen.",
      ],
    },
  },

  cricket: {
    dashboard: {
      summary: "You've got Lancashire at Headingley this week — the Roses opener at 94% capacity, with the Western Terrace gone from Monday's members sale. Brook came through Wednesday's fitness check, Coad bowled twelve overs unbroken in the nets the same evening, and the strip reads exactly seam-friendly. Jennings returns to the Lancashire top order against a nip-backing new-ball plan he's historically struggled with; your plans, one suspects, have that number circled. Media training with Northbridge Sport runs this afternoon ahead of Ottis Gibson's pre-match press conference. Northbridge Financial client-day hospitality is filling for Friday; the Apex spring kit drop is locked in for next Wednesday.",
      highlights: [
        "Friday attendance: 17,200 of 18,350 — 94% sold, Western Terrace full.",
        "Brook's career average vs seam: 54.6 — he's in the top three.",
        "Coad's 12-over unbroken net session Wednesday — no workload concerns from the physio.",
        "Lancashire's Jennings vs the nip-backer: career average 17. The plan is live.",
        "Ottis Gibson pre-match press conference with The Covers — Today 15:30 at Headingley.",
      ],
    },
  },

  rugby: {
    dashboard: {
      summary: "Tomorrow is Jersey Reds at The Grange, 3pm kick-off. You sit seventh in the Championship, 71% of the way to the franchise criteria, and a win over the Jersey front row will be a real marker on the franchise-readiness case. Steve Whitfield's press conference with The Breakdown runs at 3 today; the Crown Broadcasting pre-match TV package records at 2. Welfare-first on any availability questions — refer to the club medical statement template. The scrum is the thing to fix — Bath exposed it two rounds ago, and Jersey's front row has won penalties in every game this season. Open-play shape is in good order.",
      highlights: [
        "Championship position: 7th. Home record at The Grange: 6 wins from 9.",
        "Franchise readiness: 71% (target 85%) — Jersey Reds is another brick.",
        "Scrum penalties conceded in defensive positions: one every 5.3 attempts, division's second-worst.",
        "Regional Law Stand + Everline Stand hospitality both sold out for Saturday.",
        "Sat 25 Apr — Hartfield Motors spring content shoot (captain + 2 players) locked in.",
      ],
    },
  },

  'football-pro': {
    dashboard: {
      summary: "Eighth in the Championship, three points off sixth, with Northern Town at Oakridge Park tomorrow and James Walker stepping into the armband while Thompson serves his suspension. Home form is W4-D1-L0 across the last five; the playoff math is genuinely alive and the run-in is four home, two away. Marcus Reid is preparing for Northern Town's deeper January-window shape. Santos's knee cartilage injury has him on track for a ~25 Apr return, Thompson back next week. Northbridge Financial renewal conversations open in May. The Apex Performance third-kit reveal is scheduled for Wed 29 Apr. One fixture, one weekend — Bristol won't drop from ninth without you moving first.",
      highlights: [
        "Championship position: 8th, 3 pts off 6th — run-in 4 home, 2 away.",
        "Home record: W4 D1 L0 at Oakridge Park (last five fixtures).",
        "Walker on the armband tomorrow (Thompson suspended), Santos ~25 Apr return confirmed.",
        "Marcus Reid pre-match press conference with The Footballer's Post — Today 13:00 at the training ground.",
        "Apex Performance third-kit reveal content drop — Wed 29 Apr.",
      ],
    },
  },

  womens: {
    dashboard: {
      summary: "Tomorrow is Bristol City at Oakridge Stadium, 12:30 kick-off, Everline Family Stand filling. You're mid-table and climbing — attendance doubled since 2024, three academy graduates into the first team this season, a welfare programme the rest of the WSL is still catching up to. Sarah Frost's pre-match briefing with The Matchday Pass is 14:00 at the training ground. The Chronicle's long-form Sarah Frost feature is recorded and awaiting your comms sign-off before publication. Set-piece defence is the tactical question Bristol will ask in the first twenty minutes — open-play shape is in good order. Northbridge Financial's matchday client hospitality sold out on Tuesday.",
      highlights: [
        "WSL attendance trajectory: doubled since 2024; accreditation pending with Northbridge Sport for tomorrow.",
        "Lumio Cycle integration: 64% squad opt-in, +6% squad availability across the season.",
        "Pathway: three academy graduates into the first team this season (Niamh O'Brien dual reg from May).",
        "Sarah Frost head-coach briefing with The Matchday Pass — Today 14:00 at the training ground.",
        "Apex Performance pre-match squad photoshoot — Sun 19 Apr (content team booked).",
      ],
    },
  },

  nonleague: {
    dashboard: {
      summary: "Bootle tomorrow, 3pm at the Harfield Community Stadium — home fixture in a playoff push that sits fourth on 47 points with a +13 GD and the best home form in the division. Dougie Platt has the set-piece work and shooting drills done on Thursday. Grady is on 15 league goals plus 4 in the FA Vase — his quietest best-of-career season. Ground-grading inspection is 14 days out; the disabled-access ramp widening quote is in from J.D. Construction and the floodlight fund stands at £2,400 raised. Harfield Brewery renewal decision is overdue with chairman Brian Crossley; Miners Arms renewal paperwork needs the committee's sign-off this week.",
      highlights: [
        "Northern Premier League position: 4th (W14 D5 L9, +13 GD, 47 pts).",
        "Home record: W9 D1 L1 at Harfield Community Stadium this season.",
        "Grady: 15 league goals + 4 in the FA Vase — quiet best-of-career season.",
        "Ground-grading inspection: 14 days out — ramp widening quoted, floodlight bulbs scheduled.",
        "Harfield Brewery sponsorship renewal decision overdue with the brewery owner.",
      ],
    },
  },

  grassroots: {
    dashboard: {
      summary: "Red Lion United at Millfield Rec on Sunday, 10:30 — they beat you 3-1 in October, so there's a return-fixture feel to this one. Whitfield is on five goals in three matches, his best form since the 2019/20 promotion season. Dave Nolan has training Saturday morning, full squad wanted. Terry, Tommo and Phil picked up their County FA volunteer award last week — the club's owed them that for years. Fundraiser at The Green Man on Fri 24 Apr for the U12s kit fund; Northgate Taxis have the away-day lift scheme sorted for Fox & Goose next week. Club running on volunteer goodwill, and the volunteer goodwill is strong.",
      highlights: [
        "Westshire Sunday League Div 2 position: 8th, 14 pts — a win Sunday lifts you to seventh.",
        "Whitfield: 5 goals in the last 3 games, best form since the 2019/20 promotion season.",
        "Dave Nolan's manager chat with the Harfield Gazette — Today 18:30 at The Green Man.",
        "Ground crew — Terry, Tommo, Phil — County FA volunteer award last week.",
        "Fundraiser at The Green Man for the U12s kit fund: Fri 24 Apr, 7:30pm, £12 a ticket.",
      ],
    },
  },
}

export function getDemoAISummary(
  sport: string,
  departmentKey: string
): DemoAISummary | null {
  return DEMO_AI_SUMMARIES[sport]?.[departmentKey] ?? null
}
