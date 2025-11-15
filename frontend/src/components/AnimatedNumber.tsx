import { useCountUp } from '../hooks/useCountUp'

interface AnimatedNumberProps {
  value: number | string
  suffix?: string
  duration?: number
  decimals?: number
  className?: string
}

export function AnimatedNumber({ value, suffix, duration = 1500, decimals = 0, className = '' }: AnimatedNumberProps) {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) || 0 : value
  const animated = useCountUp(numValue, duration, decimals)
  
  const displayValue = decimals > 0 ? animated.toFixed(decimals) : Math.round(animated).toLocaleString()
  const suffixStr = suffix || (typeof value === 'string' && value.includes('%') ? '%' : '')
  
  return (
    <span className={className}>
      {displayValue}{suffixStr && ` ${suffixStr}`}
    </span>
  )
}

