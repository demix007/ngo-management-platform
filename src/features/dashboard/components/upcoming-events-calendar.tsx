import { useMemo, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfDay, differenceInDays } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types'
import { ChartCard } from './chart-card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface UpcomingEventsCalendarProps {
  events: CalendarEvent[]
  title?: string
  description?: string
  delay?: number
}

export function UpcomingEventsCalendar({
  events,
  title = 'Upcoming Events',
  description = 'Events calendar with status indicators',
  delay = 0,
}: UpcomingEventsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([])
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const now = useMemo(() => startOfDay(new Date()), [])

  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate])
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate])
  
  const days = useMemo(() => {
    // Get first day of week for the month start
    const firstDayOfWeek = monthStart.getDay()
    const daysBeforeMonth = Array.from({ length: firstDayOfWeek }, (_, i) => {
      const date = new Date(monthStart)
      date.setDate(date.getDate() - (firstDayOfWeek - i))
      return date
    })
    
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    // Get days after month to fill the last week
    const lastDayOfWeek = monthEnd.getDay()
    const daysAfterMonth = Array.from({ length: 6 - lastDayOfWeek }, (_, i) => {
      const date = new Date(monthEnd)
      date.setDate(date.getDate() + i + 1)
      return date
    })
    
    return [...daysBeforeMonth, ...monthDays, ...daysAfterMonth]
  }, [monthStart, monthEnd])

  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {}
    events.forEach((event) => {
      const dateKey = format(startOfDay(event.startDate), 'yyyy-MM-dd')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    })
    return grouped
  }, [events])

  const getEventStatusColor = (event: CalendarEvent) => {
    const eventDate = startOfDay(event.startDate)
    
    if (event.status === 'cancelled') {
      return 'bg-red-500 dark:bg-red-600'
    }
    if (event.status === 'completed') {
      return 'bg-gray-400 dark:bg-gray-600'
    }
    if (event.status === 'ongoing') {
      return 'bg-blue-500 dark:bg-blue-600'
    }
    if (event.status === 'postponed') {
      return 'bg-yellow-500 dark:bg-yellow-600'
    }
    // Scheduled/upcoming
    const daysUntil = differenceInDays(eventDate, now)
    if (daysUntil <= 3) {
      return 'bg-orange-500 dark:bg-orange-600'
    }
    return 'bg-green-500 dark:bg-green-600'
  }

  const handleDateClick = (date: Date) => {
    const dateKey = format(startOfDay(date), 'yyyy-MM-dd')
    const dayEvents = eventsByDate[dateKey] || []
    if (dayEvents.length > 0) {
      setSelectedDate(date)
      setSelectedEvents(dayEvents)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <>
      <ChartCard
        title={title}
        description={description}
        delay={delay}
      >
        <div className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <motion.button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg hover:bg-accent transition-colors group"
              aria-label="Previous month"
              whileHover={{ scale: 1.1, x: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ x: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronLeft className="h-5 w-5 group-hover:text-primary transition-colors" />
              </motion.div>
            </motion.button>
            <motion.h3 
              className="text-lg font-semibold text-foreground"
              key={format(currentDate, 'MMMM yyyy')}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              {format(currentDate, 'MMMM yyyy')}
            </motion.h3>
            <motion.button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg hover:bg-accent transition-colors group"
              aria-label="Next month"
              whileHover={{ scale: 1.1, x: 2 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ x: [0, 2, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronRight className="h-5 w-5 group-hover:text-primary transition-colors" />
              </motion.div>
            </motion.button>
          </div>

          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, index) => (
              <motion.div 
                key={day} 
                className="text-center text-xs font-semibold text-muted-foreground py-1"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay + index * 0.02, duration: 0.3 }}
              >
                {day}
              </motion.div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const dateKey = format(startOfDay(day), 'yyyy-MM-dd')
              const dayEvents = eventsByDate[dateKey] || []
              const isCurrentDay = isToday(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const hasEvents = dayEvents.length > 0
              const isHovered = hoveredDate === dateKey

              return (
                <div
                  key={dateKey}
                  className="relative"
                  onMouseEnter={() => hasEvents && setHoveredDate(dateKey)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  <Popover
                    open={isHovered && hasEvents}
                    onOpenChange={() => {}}
                  >
                    <PopoverTrigger asChild>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ 
                          delay: delay + index * 0.01,
                          type: "spring",
                          stiffness: 200,
                          damping: 15
                        }}
                        onClick={() => handleDateClick(day)}
                        disabled={!hasEvents}
                        whileHover={hasEvents ? { 
                          scale: 1.05, 
                          y: -2,
                          transition: { duration: 0.2 }
                        } : {}}
                        whileTap={hasEvents ? { scale: 0.95 } : {}}
                        className={cn(
                          'aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-xs transition-all w-full relative overflow-hidden group',
                          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                          !isCurrentMonth && 'opacity-40',
                          isCurrentDay && 'ring-2 ring-primary ring-offset-1 shadow-md',
                          hasEvents 
                            ? 'cursor-pointer border-primary/50 bg-gradient-to-br from-accent/50 to-accent/30 hover:from-accent/70 hover:to-accent/50' 
                            : 'cursor-default border-border hover:bg-accent/20'
                        )}
                      >
                        {/* Shimmer effect on hover */}
                        {hasEvents && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6 }}
                          />
                        )}
                        <motion.span 
                          className={cn(
                            'text-xs font-medium relative z-10',
                            isCurrentDay ? 'text-primary font-bold' : 'text-foreground',
                            !isCurrentMonth && 'text-muted-foreground'
                          )}
                          animate={isCurrentDay ? {
                            scale: [1, 1.1, 1],
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          {format(day, 'd')}
                        </motion.span>
                        {hasEvents && (
                          <motion.div 
                            className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-full relative z-10"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: delay + index * 0.01 + 0.2 }}
                          >
                            {dayEvents.slice(0, 3).map((event, eventIndex) => (
                              <motion.div
                                key={event.id}
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full',
                                  getEventStatusColor(event)
                                )}
                                title={event.title}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ 
                                  delay: delay + index * 0.01 + 0.3 + eventIndex * 0.05,
                                  type: "spring",
                                  stiffness: 300
                                }}
                                whileHover={{ scale: 1.5 }}
                              />
                            ))}
                            {dayEvents.length > 3 && (
                              <motion.span 
                                className="text-[8px] text-muted-foreground font-semibold"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: delay + index * 0.01 + 0.4 }}
                              >
                                +{dayEvents.length - 3}
                              </motion.span>
                            )}
                          </motion.div>
                        )}
                      </motion.button>
                    </PopoverTrigger>
                    {hasEvents && (
                      <PopoverContent
                        className="w-80 p-0 z-50"
                        side="top"
                        align="center"
                        sideOffset={8}
                        onMouseEnter={() => setHoveredDate(dateKey)}
                        onMouseLeave={() => setHoveredDate(null)}
                      >
                      <motion.div 
                        className="p-3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <motion.div 
                          className="mb-2"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <h4 className="text-sm font-semibold text-foreground">
                            {format(day, 'EEEE, MMMM d')}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                          </p>
                        </motion.div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {dayEvents.map((event, eventIndex) => {
                            const eventDate = startOfDay(event.startDate)
                            const daysUntil = differenceInDays(eventDate, now)
                            
                            return (
                              <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: eventIndex * 0.05 }}
                                whileHover={{ x: 4, transition: { duration: 0.2 } }}
                                className={cn(
                                  'p-2.5 rounded-md border transition-all cursor-pointer',
                                  event.status === 'cancelled' && 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20',
                                  event.status === 'completed' && 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/10 hover:bg-gray-50 dark:hover:bg-gray-900/20',
                                  event.status === 'ongoing' && 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/10 hover:bg-blue-50 dark:hover:bg-blue-950/20',
                                  event.status === 'postponed' && 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/10 hover:bg-yellow-50 dark:hover:bg-yellow-950/20',
                                  event.status === 'scheduled' && daysUntil <= 3 && 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/10 hover:bg-orange-50 dark:hover:bg-orange-950/20',
                                  event.status === 'scheduled' && daysUntil > 3 && 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10 hover:bg-green-50 dark:hover:bg-green-950/20'
                                )}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <h5 className="text-xs font-semibold text-foreground leading-tight flex-1">
                                    {event.title}
                                  </h5>
                                  <Badge
                                    variant={
                                      event.status === 'cancelled' ? 'destructive' :
                                      event.status === 'completed' ? 'secondary' :
                                      event.status === 'ongoing' ? 'default' :
                                      'outline'
                                    }
                                    className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                                  >
                                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-1 text-[11px] text-muted-foreground">
                                  {event.startTime && (
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-3 w-3 shrink-0" />
                                      <span>
                                        {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
                                        {event.allDay && ' (All Day)'}
                                      </span>
                                    </div>
                                  )}
                                  {!event.startTime && event.allDay && (
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-3 w-3 shrink-0" />
                                      <span>All Day</span>
                                    </div>
                                  )}
                                  {event.location?.address && (
                                    <div className="flex items-start gap-1.5">
                                      <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                                      <span className="line-clamp-2">{event.location.address}</span>
                                    </div>
                                  )}
                                  {event.description && (
                                    <p className="line-clamp-2 mt-1">{event.description}</p>
                                  )}
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                        <motion.div 
                          className="mt-3 pt-2 border-t border-border"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <p className="text-[10px] text-muted-foreground text-center">
                            Click to view full details
                          </p>
                        </motion.div>
                      </motion.div>
                    </PopoverContent>
                  )}
                </Popover>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-3 text-xs pt-2 border-t border-border"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.5, duration: 0.4 }}
          >
            {[
              { color: 'bg-green-500 dark:bg-green-600', label: 'Upcoming' },
              { color: 'bg-orange-500 dark:bg-orange-600', label: 'Urgent (≤3 days)' },
              { color: 'bg-blue-500 dark:bg-blue-600', label: 'Ongoing' },
              { color: 'bg-gray-400 dark:bg-gray-600', label: 'Completed' },
              { color: 'bg-red-500 dark:bg-red-600', label: 'Cancelled' },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                className="flex items-center gap-1.5 cursor-default group"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: delay + 0.5 + index * 0.05, duration: 0.3 }}
                whileHover={{ scale: 1.1 }}
              >
                <motion.div 
                  className={cn('w-3 h-3 rounded-full', item.color)}
                  whileHover={{ scale: 1.3, rotate: 180 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </ChartCard>

      {/* Event Details Modal */}
      <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DialogHeader>
              <DialogTitle>
                Events on {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
              </DialogTitle>
              <DialogDescription>
                {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''} scheduled
              </DialogDescription>
            </DialogHeader>
          </motion.div>
          <div className="space-y-3 mt-4">
            <AnimatePresence mode="popLayout">
              {selectedEvents.map((event, index) => {
              const eventDate = startOfDay(event.startDate)
              const daysUntil = differenceInDays(eventDate, now)
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    y: -2,
                    transition: { duration: 0.2 }
                  }}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all cursor-default',
                    event.status === 'cancelled' && 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 hover:shadow-lg hover:shadow-red-200/50',
                    event.status === 'completed' && 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 hover:shadow-lg hover:shadow-gray-200/50',
                    event.status === 'ongoing' && 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 hover:shadow-lg hover:shadow-blue-200/50',
                    event.status === 'postponed' && 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20 hover:shadow-lg hover:shadow-yellow-200/50',
                    event.status === 'scheduled' && daysUntil <= 3 && 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 hover:shadow-lg hover:shadow-orange-200/50',
                    event.status === 'scheduled' && daysUntil > 3 && 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 hover:shadow-lg hover:shadow-green-200/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground">{event.title}</h4>
                        <Badge
                          variant={
                            event.status === 'cancelled' ? 'destructive' :
                            event.status === 'completed' ? 'secondary' :
                            event.status === 'ongoing' ? 'default' :
                            'outline'
                          }
                        >
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Badge>
                        {event.priority === 'urgent' && (
                          <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                      )}
                      
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{format(event.startDate, 'EEEE, MMMM d, yyyy')}</span>
                        </div>
                        {event.startTime && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</span>
                          </div>
                        )}
                        {event.location?.address && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location.address}</span>
                          </div>
                        )}
                        {event.scope && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-xs font-medium">Scope:</span>
                            <Badge variant="outline" className="text-xs">
                              {event.scope.charAt(0).toUpperCase() + event.scope.slice(1)}
                            </Badge>
                          </div>
                        )}
                        {event.type && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-xs font-medium">Type:</span>
                            <Badge variant="outline" className="text-xs">
                              {event.type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
