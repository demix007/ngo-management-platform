import { useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar as CalendarIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types'

interface CalendarHeatmapProps {
  events: CalendarEvent[]
  title?: string
  description?: string
  delay?: number
}

export function CalendarHeatmap({
  events,
  title = 'Activity Calendar',
  description = 'Events and activities by day',
  delay = 0,
}: CalendarHeatmapProps) {
  const currentDate = useMemo(() => new Date(), [])
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
  }, [currentDate])

  const eventsByDate = useMemo(() => {
    const grouped: Record<string, number> = {}
    events.forEach((event) => {
      const dateKey = format(event.startDate, 'yyyy-MM-dd')
      grouped[dateKey] = (grouped[dateKey] || 0) + 1
    })
    return grouped
  }, [events])

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800'
    if (count <= 2) return 'bg-blue-200 dark:bg-blue-900'
    if (count <= 5) return 'bg-blue-400 dark:bg-blue-700'
    if (count <= 10) return 'bg-blue-600 dark:bg-blue-500'
    return 'bg-blue-800 dark:bg-blue-400'
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="border border-border shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CalendarIcon className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const dateKey = format(day, 'yyyy-MM-dd')
                const count = eventsByDate[dateKey] || 0
                const isCurrentDay = isToday(day)
                const isCurrentMonth = isSameMonth(day, currentDate)

                return (
                  <motion.div
                    key={dateKey}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: delay + index * 0.01 }}
                    className={cn(
                      'aspect-square rounded border-2 border-border flex flex-col items-center justify-center text-xs transition-all hover:scale-110 cursor-pointer',
                      getIntensity(count),
                      !isCurrentMonth && 'opacity-50',
                      isCurrentDay && 'ring-2 ring-primary ring-offset-2',
                      count > 0 && 'text-white dark:text-gray-900 font-semibold'
                    )}
                    title={`${format(day, 'MMM d')}: ${count} events`}
                  >
                    <span>{format(day, 'd')}</span>
                    {count > 0 && (
                      <span className="text-[10px] mt-0.5">{count}</span>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs">
              <span className="text-muted-foreground">Less</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-900" />
                <div className="w-4 h-4 rounded bg-blue-400 dark:bg-blue-700" />
                <div className="w-4 h-4 rounded bg-blue-600 dark:bg-blue-500" />
                <div className="w-4 h-4 rounded bg-blue-800 dark:bg-blue-400" />
              </div>
              <span className="text-muted-foreground">More</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

