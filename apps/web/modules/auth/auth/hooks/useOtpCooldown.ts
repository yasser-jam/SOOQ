"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export const useOtpCooldown = (initialSeconds: number = 60) => {
  const [remaining, setRemaining] = useState(0)
  const intervalRef = useRef<number | null>(null)

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(
    (seconds: number = initialSeconds) => {
      clear()
      const safe = Math.max(0, Math.floor(seconds))
      setRemaining(safe)
      if (safe === 0) return

      intervalRef.current = window.setInterval(() => {
        setRemaining((current) => {
          if (current <= 1) {
            clear()
            return 0
          }
          return current - 1
        })
      }, 1000)
    },
    [clear, initialSeconds]
  )

  useEffect(() => () => clear(), [clear])

  return {
    remaining,
    isCooling: remaining > 0,
    start,
    reset: () => {
      clear()
      setRemaining(0)
    },
  }
}
