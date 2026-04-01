'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'

/**
 * Legacy football-amateur route — redirects to the new grassroots portal.
 * The three-tier switcher has been replaced with separate portal routes:
 *   /football/pro/[slug]        — Pro Club (Oakridge FC)
 *   /football/nonleague/[slug]  — Non-League (Harfield FC)
 *   /football/grassroots/[slug] — Grassroots (Sunday Rovers FC)
 */
export default function FootballAmateurRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()

  useEffect(() => {
    router.replace(`/football/grassroots/${slug}`)
  }, [slug, router])

  return (
    <div style={{ backgroundColor: '#07080F', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#9CA3AF', fontSize: 14 }}>Redirecting to Grassroots Portal...</div>
    </div>
  )
}
