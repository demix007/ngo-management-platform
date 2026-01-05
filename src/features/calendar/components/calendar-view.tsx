import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, addDays, isToday } from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCalendarEvents } from '../hooks/use-calendar-events'
import type { CalendarEvent, CalendarEventType, CalendarEventScope } from '@/types'
import { cn } from '@/lib/utils'

type CalendarViewType = 'month' | 'week' | 'state' | 'program'

interface CalendarViewProps {
  view?: CalendarViewType
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
}

const eventTypeColors: Record<CalendarEventType, string> = {
  monitoring_visit: 'bg-blue-500',
  grant_reporting_deadline: 'bg-red-500',
  donor_feedback: 'bg-green-500',
  monthly_program: 'bg-purple-500',
  weekly_program: 'bg-pink-500',
  birthday: 'bg-yellow-500',
  anniversary: 'bg-orange-500',
  official_date: 'bg-indigo-500',
  blp_event: 'bg-cyan-500',
  meeting: 'bg-teal-500',
  training: 'bg-amber-500',
  other: 'bg-gray-500',
}

const eventTypeLabels: Record<CalendarEventType, string> = {
  monitoring_visit: 'Monitoring Visit',
  grant_reporting_deadline: 'Grant Deadline',
  donor_feedback: 'Donor Feedback',
  monthly_program: 'Monthly Program',
  weekly_program: 'Weekly Program',
  birthday: 'Birthday',
  anniversary: 'Anniversary',
  official_date: 'Official Date',
  blp_event: 'Event',
  meeting: 'Meeting',
  training: 'Training',
  other: 'Other',
}

export function CalendarView({ view = 'month', onEventClick, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedView, setSelectedView] = useState<CalendarViewType>(view)
  const [selectedType, setSelectedType] = useState<CalendarEventType | 'all'>('all')
  const [selectedScope, setSelectedScope] = useState<CalendarEventScope | 'all'>('all')

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    if (selectedView === 'month') {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      }
    } else if (selectedView === 'week') {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      }
    } else {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      }
    }
  }, [currentDate, selectedView])

  // Fetch events with filters
  const { data: events = [], isLoading } = useCalendarEvents({
    type: selectedType !== 'all' ? selectedType : undefined,
    scope: selectedScope !== 'all' ? selectedScope : undefined,
    startDate: dateRange.start,
    endDate: dateRange.end,
  })

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {}
    events.forEach((event) => {
      const eventDate = format(event.startDate, 'yyyy-MM-dd')
      if (!grouped[eventDate]) {
        grouped[eventDate] = []
      }
      grouped[eventDate].push(event)
    })
    return grouped
  }, [events])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => (direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)))
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => (direction === 'next' ? addDays(prev, 7) : addDays(prev, -7)))
  }

  const navigate = selectedView === 'week' ? navigateWeek : navigateMonth

  // Render month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    return (
      <div className="space-y-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-semibold text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd')
            const dayEvents = eventsByDate[dayKey] || []
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isCurrentDay = isToday(day)

            return (
              <motion.div
                key={dayKey}
                className={cn(
                  'min-h-[100px] border rounded-lg p-2 cursor-pointer transition-colors',
                  !isCurrentMonth && 'opacity-40',
                  isCurrentDay && 'ring-2 ring-primary',
                  'hover:bg-accent'
                )}
                onClick={() => onDateClick?.(day)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isCurrentDay && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {dayEvents.length}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <motion.div
                      key={event.id}
                      className={cn(
                        'text-xs p-1 rounded truncate cursor-pointer',
                        eventTypeColors[event.type] || 'bg-gray-500',
                        'text-white hover:opacity-80'
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick?.(event)
                      }}
                      title={event.title}
                    >
                      {event.startTime && !event.allDay && (
                        <span className="font-semibold">{event.startTime}</span>
                      )}{' '}
                      {event.title}
                    </motion.div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="space-y-4">
        {/* Day headers */}
        <div className="grid grid-cols-8 gap-2 border-b pb-2">
          <div className="text-sm font-semibold text-muted-foreground">Time</div>
          {weekDays.map((day) => (
            <div key={format(day, 'yyyy-MM-dd')} className="text-center">
              <div className="text-sm font-semibold">{format(day, 'EEE')}</div>
              <div
                className={cn(
                  'text-lg font-bold',
                  isToday(day) && 'text-primary'
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="space-y-1">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-2">
              <div className="text-xs text-muted-foreground p-2">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map((day) => {
                const dayKey = format(day, 'yyyy-MM-dd')
                const dayEvents = eventsByDate[dayKey] || []
                const hourEvents = dayEvents.filter((event) => {
                  if (event.allDay) return false
                  const eventHour = event.startTime
                    ? parseInt(event.startTime.split(':')[0])
                    : null
                  return eventHour === hour
                })

                return (
                  <div
                    key={`${dayKey}-${hour}`}
                    className="min-h-[60px] border rounded p-1"
                    onClick={() => onDateClick?.(day)}
                  >
                    {hourEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        className={cn(
                          'text-xs p-1 rounded mb-1 cursor-pointer truncate',
                          eventTypeColors[event.type] || 'bg-gray-500',
                          'text-white'
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick?.(event)
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </motion.div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* All-day events */}
        <div className="grid grid-cols-8 gap-2 border-t pt-2">
          <div className="text-sm font-semibold text-muted-foreground">All Day</div>
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd')
            const dayEvents = eventsByDate[dayKey] || []
            const allDayEvents = dayEvents.filter((event) => event.allDay)

            return (
              <div key={dayKey} className="space-y-1">
                {allDayEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    className={cn(
                      'text-xs p-1 rounded cursor-pointer',
                      eventTypeColors[event.type] || 'bg-gray-500',
                      'text-white'
                    )}
                    onClick={() => onEventClick?.(event)}
                    title={event.title}
                  >
                    {event.title}
                  </motion.div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CalendarIcon className="h-6 w-6" />
              Calendar & Events
            </CardTitle>
            <p className="text-blue-100 mt-1">
              {selectedView === 'month' && format(currentDate, 'MMMM yyyy')}
              {selectedView === 'week' &&
                `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Select
            value={selectedView}
            onValueChange={(value) => setSelectedView(value as CalendarViewType)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="state">State</SelectItem>
              <SelectItem value="program">Program</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as CalendarEventType | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(eventTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedScope}
              onValueChange={(value) => setSelectedScope(value as CalendarEventScope | 'all')}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scopes</SelectItem>
                <SelectItem value="national">National</SelectItem>
                <SelectItem value="state">State</SelectItem>
                <SelectItem value="program">Program</SelectItem>
                <SelectItem value="lga">LGA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Calendar View */}
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-muted-foreground">Loading calendar events...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {selectedView === 'month' && renderMonthView()}
            {selectedView === 'week' && renderWeekView()}
            {selectedView === 'state' && (
              <div className="text-center py-12 text-muted-foreground">
                State-level calendar view - Select a state to filter
              </div>
            )}
            {selectedView === 'program' && (
              <div className="text-center py-12 text-muted-foreground">
                Program-level calendar view - Select a program to filter
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-wrap gap-4">
            <span className="text-sm font-semibold">Legend:</span>
            {Object.entries(eventTypeLabels).slice(0, 6).map(([type, label]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded', eventTypeColors[type as CalendarEventType])} />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

