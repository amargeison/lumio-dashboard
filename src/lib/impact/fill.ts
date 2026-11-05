import type { ImpactBrand } from '@/app/tenproject/[slug]/_components/ImpactDataContext'

/** Fill `{name}` placeholders in copy from call-site vars, then the brand. */
export function fill(tpl: string, brand: ImpactBrand, vars: Record<string, string | number> = {}): string {
  return tpl.replace(/\{(\w+)\}/g, (m, k: string) => {
    if (k in vars) return String(vars[k])
    if (k in brand) return String(brand[k as keyof ImpactBrand])
    return m
  })
}
