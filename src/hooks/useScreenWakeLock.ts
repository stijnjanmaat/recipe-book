import { useEffect, useRef } from 'react'

/**
 * Requests a screen wake lock so the device screen doesn't dim or turn off
 * while the user is viewing this page (e.g. following a recipe).
 * Releases when the component unmounts or the document becomes hidden.
 * Re-requests when the document becomes visible again (e.g. user returns to tab).
 * No-op when the API is not available (e.g. Safari).
 */
export function useScreenWakeLock(enabled = true) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  const requestLock = async () => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.wakeLock) return
    if (document.visibilityState !== 'visible') return
    try {
      sentinelRef.current = await navigator.wakeLock.request('screen')
    } catch {
      // Ignore: not supported, or already active, or permission denied
    }
  }

  const releaseLock = () => {
    try {
      sentinelRef.current?.release?.()
      sentinelRef.current = null
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    if (!enabled) return
    requestLock()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestLock()
      } else {
        releaseLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      releaseLock()
    }
  }, [enabled])
}
