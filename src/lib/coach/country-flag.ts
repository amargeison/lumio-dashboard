// ─────────────────────────────────────────────────────────────────────────────
// The flag for a camp's location.
//
// `region` is free text a coach typed — "Algarve, Portugal", "Surrey", "Spain",
// "Vale do Lobo, Portugal". So this reads the last comma-separated part and
// matches it against a list of countries, plus the aliases people actually type
// (UK, England, USA, Holland). No match means no flag, which is the right
// outcome: a wrong flag on someone's £1,500 trip is worse than none.
//
// Flags are built from the ISO code rather than pasted, because regional
// indicator pairs are what render consistently across mail clients and phones.
// ─────────────────────────────────────────────────────────────────────────────

const CODES: Record<string, string> = {
  // British Isles, spelled every way a coach types it
  'uk': 'GB', 'u.k.': 'GB', 'united kingdom': 'GB', 'great britain': 'GB', 'britain': 'GB',
  'england': 'GB', 'scotland': 'GB', 'wales': 'GB', 'northern ireland': 'GB',
  'ireland': 'IE', 'republic of ireland': 'IE', 'eire': 'IE',

  // Where British coaches actually run camps
  'spain': 'ES', 'espana': 'ES', 'españa': 'ES', 'mallorca': 'ES', 'majorca': 'ES',
  'portugal': 'PT', 'france': 'FR', 'italy': 'IT', 'greece': 'GR', 'cyprus': 'CY',
  'malta': 'MT', 'turkey': 'TR', 'türkiye': 'TR', 'croatia': 'HR', 'morocco': 'MA',
  'tunisia': 'TN', 'egypt': 'EG', 'dubai': 'AE', 'uae': 'AE',
  'united arab emirates': 'AE', 'abu dhabi': 'AE', 'qatar': 'QA',

  // Europe, the rest
  'germany': 'DE', 'austria': 'AT', 'switzerland': 'CH', 'belgium': 'BE',
  'netherlands': 'NL', 'holland': 'NL', 'denmark': 'DK', 'sweden': 'SE',
  'norway': 'NO', 'finland': 'FI', 'poland': 'PL', 'czechia': 'CZ',
  'czech republic': 'CZ', 'slovakia': 'SK', 'slovenia': 'SI', 'hungary': 'HU',
  'romania': 'RO', 'bulgaria': 'BG', 'serbia': 'RS', 'luxembourg': 'LU',
  'iceland': 'IS', 'estonia': 'EE', 'latvia': 'LV', 'lithuania': 'LT',

  // Further afield
  'usa': 'US', 'u.s.a.': 'US', 'united states': 'US', 'america': 'US',
  'florida': 'US', 'california': 'US',
  'canada': 'CA', 'mexico': 'MX', 'brazil': 'BR', 'argentina': 'AR', 'chile': 'CL',
  'australia': 'AU', 'new zealand': 'NZ', 'south africa': 'ZA', 'india': 'IN',
  'china': 'CN', 'japan': 'JP', 'thailand': 'TH', 'singapore': 'SG',
  'vietnam': 'VN', 'indonesia': 'ID', 'bali': 'ID', 'malaysia': 'MY',
  'kenya': 'KE', 'mauritius': 'MU', 'barbados': 'BB', 'jamaica': 'JM',
  'antigua': 'AG', 'bahamas': 'BS',
}

const clean = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\s.]/gu, '').replace(/\s+/g, ' ').trim()

/** Regional indicator pair for an ISO-3166 alpha-2 code. */
function toFlag(code: string): string {
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)))
}

/**
 * The flag emoji for a free-text location, or '' when we cannot be sure.
 *
 * Tries the last comma-separated part first, because "Algarve, Portugal" puts
 * the country there, then falls back to trying every part — so "Portugal,
 * Algarve" works too, and a bare "Spain" works on its own.
 */
export function flagFor(...parts: (string | null | undefined)[]): string {
  const text = parts.filter(Boolean).join(', ')
  if (!text.trim()) return ''
  const bits = text.split(',').map(clean).filter(Boolean)
  for (const b of [...bits].reverse()) {
    const code = CODES[b]
    if (code) return toFlag(code)
  }
  // Last resort: a country name sitting inside a longer phrase, matched on whole
  // words only so "Indiana" cannot become India.
  const whole = clean(text)
  for (const [name, code] of Object.entries(CODES)) {
    if (name.length < 5) continue
    if (new RegExp(`(^|\\s)${name}($|\\s)`).test(whole)) return toFlag(code)
  }
  return ''
}
