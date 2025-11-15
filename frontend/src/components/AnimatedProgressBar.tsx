import { useEffect, useState } from 'react'

interface AnimatedProgressBarProps {
  percent: number
  color: string
  label?: string
  duration?: number
}

export function AnimatedProgressBar({ percent, color, label, duration = 1500 }: AnimatedProgressBarProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    const startValue = 0

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (percent - startValue) * easeOut
      
      setAnimatedPercent(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setAnimatedPercent(percent)
      }
    }

    const rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [percent, duration])

  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs text-neutral-400 mb-1">
          <span>{label}</span>
          <span>{animatedPercent.toFixed(1)}%</span>
        </div>
      )}
      <div className="h-2 bg-neutral-800 rounded overflow-hidden">
        <div
          className={`${color} h-2 rounded`}
          style={{
            width: `${animatedPercent}%`,
            transition: 'width 0.1s ease-out',
          }}
        />
      </div>
    </div>
  )
}

