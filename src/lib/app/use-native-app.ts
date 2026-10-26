'use client'

import { useEffect, useState } from 'react'
import { isNativeApp } from './native'

/**
 * True inside the App Store app. False on the server and on the first render,
 * so the page the server sent and the first paint always match; it flips
 * straight after, before anyone can tap anything.
 */
export function useIsNativeApp(): boolean {
  const [app, setApp] = useState(false)
  useEffect(() => { setApp(isNativeApp()) }, [])
  return app
}
