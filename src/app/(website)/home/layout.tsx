import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lumio — the AI operating system for modern businesses',
  description:
    'Lumio connects every tool your business runs on and automates the work between them. Founding-customer waitlist opens late 2026.',
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
