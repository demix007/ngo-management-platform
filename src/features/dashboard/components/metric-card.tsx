import { useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  note?: string
  icon: LucideIcon
  iconBgColor?: string
  delay?: number
  animated?: boolean
}

export function MetricCard({
  title,
  value,
  change,
  note,
  icon: Icon,
  iconBgColor = 'bg-blue-500',
  delay = 0,
  animated = true,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value)
  const [isHovered, setIsHovered] = useState(false)
  const iconControls = useAnimation()

  useEffect(() => {
    if (!animated || typeof value !== 'number') {
      setDisplayValue(value)
      return
    }

    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current = Math.min(increment * step, value)
      setDisplayValue(Math.floor(current))

      if (step >= steps) {
        setDisplayValue(value)
        clearInterval(timer)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value, animated])

  useEffect(() => {
    if (isHovered) {
      iconControls.start({
        scale: [1, 1.15, 1],
        rotate: [0, 5, -5, 0],
        transition: { duration: 0.5, repeat: Infinity, repeatDelay: 1 }
      })
    } else {
      iconControls.start({ scale: 1, rotate: 0 })
    }
  }, [isHovered, iconControls])

  const formattedValue =
    typeof displayValue === 'number' && typeof value === 'number'
      ? displayValue.toLocaleString()
      : String(displayValue)

  const isPositive = change?.startsWith('+')
  // Extract the numeric value, handling NaN cases
  const changeValue = change?.replace(/[+-]/g, '').replace(/%/g, '').trim() || '0'
  
  // Validate that changeValue is a valid number, if not show '0'
  const isValidChange = changeValue && !isNaN(parseFloat(changeValue)) && isFinite(parseFloat(changeValue))
  const displayChange = isValidChange ? `${changeValue}%` : '0%'

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ 
        scale: 1.03,
        y: -4,
        transition: { duration: 0.2 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-full"
    >
      <Card className="relative overflow-hidden border-2 border-border rounded-xl shadow-lg bg-card hover:shadow-xl transition-all duration-300 h-full group">
        {/* Animated gradient background on hover */}
        <motion.div
          className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500",
            iconBgColor
          )}
        />
        
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
          }}
        />

        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <motion.p 
                className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.1, duration: 0.4 }}
              >
                {title}
              </motion.p>
              <motion.div
                key={value}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  duration: 0.5,
                  delay: delay + 0.2,
                  type: "spring",
                  stiffness: 200
                }}
                className="text-2xl font-extrabold text-foreground mb-3"
              >
                <motion.span
                  animate={isHovered ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {formattedValue}
                </motion.span>
              </motion.div>
              {change && (
                <motion.div 
                  className="flex items-center gap-1.5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.3, duration: 0.4 }}
                >
                  <motion.div
                    animate={isPositive ? {
                      y: [0, -2, 0],
                    } : {
                      y: [0, 2, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {isPositive ? (
                      <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                  </motion.div>
                  <span className={cn(
                    'text-sm font-semibold px-2 py-0.5 rounded-md',
                    isPositive 
                      ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30' 
                      : 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30'
                  )}>
                    {displayChange}
                  </span>
                </motion.div>
              )}
            </div>
            <motion.div 
              className={cn(
                'p-4 rounded-xl shadow-lg relative overflow-hidden',
                iconBgColor
              )}
              animate={iconControls}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Icon glow effect */}
              <motion.div
                className="absolute inset-0 rounded-xl"
                animate={{
                  boxShadow: isHovered 
                    ? ['0 0 0px rgba(255,255,255,0)', '0 0 20px rgba(255,255,255,0.3)', '0 0 0px rgba(255,255,255,0)']
                    : '0 0 0px rgba(255,255,255,0)'
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <Icon className="h-4 w-4 text-white relative z-10" />
            </motion.div>
          </div>
          {note && (
            <motion.p 
              className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/50 leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.4, duration: 0.4 }}
            >
              {note}
            </motion.p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

