import { useEffect, useRef } from 'react'

export const useWakeLock = () => {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const requestWakeLock = async () => {
    try {
      // Check if wake lock is supported
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')

        // Handle wake lock release (e.g., when tab becomes inactive)
        wakeLockRef.current.addEventListener('release', () => {
          console.log('Wake lock was released')
        })

        console.log('Wake lock activated')
      } else {
        console.warn('Wake lock is not supported in this browser')
      }
    } catch (err) {
      console.error('Failed to request wake lock:', err)
    }
  }

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
        console.log('Wake lock released')
      } catch (err) {
        console.error('Failed to release wake lock:', err)
      }
    }
  }

  useEffect(() => {
    // Request wake lock when component mounts
    requestWakeLock()

    // Cleanup: release wake lock when component unmounts
    return () => {
      releaseWakeLock()
    }
  }, [])

  return {
    requestWakeLock,
    releaseWakeLock,
    isWakeLockActive: wakeLockRef.current !== null,
  }
}
