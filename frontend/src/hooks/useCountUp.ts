import { useEffect, useState } from 'react'

/**
 * Animate a number from 0 to target value
 */
export function useCountUp(target: number, duration = 2000, decimals = 0) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target === 0) {
      setCount(0)
      return
    }

    let startTime: number | null = null
    const startValue = 0

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (target - startValue) * easeOut
      
      setCount(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(target)
      }
    }

    const rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration])

  return decimals > 0 ? Number(count.toFixed(decimals)) : Math.round(count)
}

