// Tenant → partner mapping.
// v1: hardcoded from the demo slug. Move to Supabase (tenants.partner column)
// when a second partner lands.

export type PartnerKey = 'RGR' | null

const MAP: Record<string, PartnerKey> = {
  'horizon-education-us-demo': 'RGR',
}

export function partnerForSlug(slug: string | null | undefined): PartnerKey {
  if (!slug) return null
  return MAP[slug] ?? null
}
