// Academic terms, by calendar date. The one definition of "this term".
//
//   Autumn  1 Sept – 31 Dec
//   Spring  1 Jan – 31 Mar
//   Summer  1 Apr – 31 Aug
//
// Easter moves, so the real break can fall either side of 1 April; a fixed date
// keeps the boundary the same for every org. August sits in Summer so that every
// date has a term. Dates are YYYY-MM-DD strings, which compare correctly as text.

export interface Term { name: 'Autumn' | 'Spring' | 'Summer'; start: string; end: string }

export function termOf(date: string): Term {
  const year = date.slice(0, 4), month = Number(date.slice(5, 7))
  if (month >= 9) return { name: 'Autumn', start: `${year}-09-01`, end: `${year}-12-31` }
  if (month <= 3) return { name: 'Spring', start: `${year}-01-01`, end: `${year}-03-31` }
  return { name: 'Summer', start: `${year}-04-01`, end: `${year}-08-31` }
}

export const inTerm = (date: string, term: Term) => date >= term.start && date <= term.end
