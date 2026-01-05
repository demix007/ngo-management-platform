import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Calendar as CalendarIcon, FolderKanban } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useCalendarEvents } from '@/features/calendar/hooks/use-calendar-events'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CalendarView } from '@/features/calendar/components/calendar-view'
import type { CalendarEvent } from '@/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/dialog'
import { useDeleteCalendarEvent } from '@/features/calendar/hooks/use-calendar-events'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export const Route = createFileRoute('/calendar/')({
  beforeLoad: async () => {
    const { isLoading } = useAuthStore.getState()
    if (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    const finalState = useAuthStore.getState()
    if (!finalState.isAuthenticated || !finalState.user) {
      throw redirect({ to: '/login' })
    }
  },
  component: CalendarPage,
})

function CalendarPage() {
  const navigate = useNavigate()
  const { data: events = [], isLoading } = useCalendarEvents()
  const deleteMutation = useDeleteCalendarEvent()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events

    const query = searchQuery.toLowerCase()
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query) ||
        e.type.toLowerCase().includes(query)
    )
  }, [events, searchQuery])

  const handleEventClick = (event: CalendarEvent) => {
    navigate({ to: '/calendar/$id', params: { id: event.id } })
  }

  const handleDateClick = (date: Date) => {
    navigate({
      to: '/calendar/create',
      search: { date: date.toISOString() },
    })
  }

  const handleDelete = async () => {
    if (selectedEvent) {
      await deleteMutation.mutateAsync(selectedEvent.id)
      setDeleteDialogOpen(false)
      setSelectedEvent(null)
    }
  }

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Calendar & Workflows
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage events, schedules, and workflows
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex gap-2"
          >
            <Button
              variant="default"
              onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {viewMode === 'calendar' ? 'List View' : 'Calendar View'}
            </Button>
            <Button
              onClick={() => navigate({ to: '/calendar/create' })}
              variant="default"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
            <Button
              onClick={() => navigate({ to: '/workflows' })}
              variant="outline"
            >
              <FolderKanban className="mr-2 h-4 w-4" />
              View Workflows
            </Button>
            <Button
              onClick={() => navigate({ to: '/workflows/create' })}
              variant="default"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Workflow
            </Button>
          </motion.div>
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events by title, description, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Calendar or List View */}
        {viewMode === 'calendar' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <CalendarView
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {isLoading ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Loading events...
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No events found
              </div>
            ) : (
              filteredEvents.map((event) => (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleEventClick(event)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <Badge variant="default" className="capitalize">
                        {event.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{format(event.startDate, 'MMM dd, yyyy')}</span>
                      {event.startTime && !event.allDay && (
                        <span>{event.startTime}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this event ({selectedEvent?.title})? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </AppLayout>
  )
}
