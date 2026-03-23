'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SignInButtonProps {
  variant?: 'primary' | 'ghost'
  className?: string
}

export default function SignInButton({ variant = 'ghost', className = '' }: SignInButtonProps) {
  const pathname = usePathname()
  const redirectTo = encodeURIComponent(pathname || '/overview')

  if (variant === 'primary') {
    return (
      <Link
        href={`/login?redirectTo=${redirectTo}`}
        className={`text-sm bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/15 transition-colors ${className}`}
      >
        Sign in
      </Link>
    )
  }

  return (
    <Link
      href={`/login?redirectTo=${redirectTo}`}
      className={`text-sm text-gray-300 hover:text-white transition-colors font-medium ${className}`}
    >
      Sign in
    </Link>
  )
}
