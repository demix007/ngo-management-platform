import { createFileRoute, useNavigate, redirect, Outlet } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/auth-store'
import { AppLayout } from '@/components/layout/app-layout'
import { useCalendarEvent, useDeleteCalendarEvent } from '@/features/calendar/hooks/use-calendar-events'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Edit, Trash2, ArrowLeft, Calendar as CalendarIcon, MapPin, Bell } from 'lucide-react'
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
import { useState } from 'react'
import { useRouterState } from '@tanstack/react-router'

export const Route = createFileRoute('/calendar/$id')({
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
  component: CalendarEventDetailsLayout,
})

function CalendarEventDetailsLayout() {
  const router = useRouterState()
  const currentPath = router.location.pathname

  if (currentPath.includes('/edit')) {
    return <Outlet />
  }

  return <CalendarEventDetailsPage />
}

function CalendarEventDetailsPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { data: event, isLoading } = useCalendarEvent(id)
  const deleteMutation = useDeleteCalendarEvent()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleDelete = async () => {
    if (event) {
      await deleteMutation.mutateAsync(event.id)
      navigate({ to: '/calendar' })
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-12 text-muted-foreground">Loading event...</div>
        </div>
      </AppLayout>
    )
  }

  if (!event) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-12 text-muted-foreground">Event not found</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/calendar' })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={() => navigate({ to: '/calendar/$id/edit', params: { id } })}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <CardTitle className="text-2xl">{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" className="capitalize">
                  {event.type.replace('_', ' ')}
                </Badge>
                <Badge variant="default" className="capitalize">
                  {event.scope}
                </Badge>
                <Badge
                  variant={
                    event.status === 'completed'
                      ? 'default'
                      : event.status === 'cancelled'
                        ? 'destructive'
                        : 'secondary'
                  }
                  className="capitalize"
                >
                  {event.status}
                </Badge>
                <Badge
                  variant={
                    event.priority === 'urgent'
                      ? 'destructive'
                      : event.priority === 'high'
                        ? 'default'
                        : 'default'
                  }
                  className="capitalize"
                >
                  {event.priority} priority
                </Badge>
              </div>

              {event.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{event.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-semibold">Start Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(event.startDate, 'PPP')}
                      {event.startTime && !event.allDay && ` at ${event.startTime}`}
                    </p>
                  </div>
                </div>

                {event.endDate && (
                  <div className="flex items-start gap-2">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold">End Date</p>
                      <p className="text-sm text-muted-foreground">
                        {format(event.endDate, 'PPP')}
                        {event.endTime && ` at ${event.endTime}`}
                      </p>
                    </div>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {event.location.address || event.location.city || event.location.state || 'Not specified'}
                      </p>
                    </div>
                  </div>
                )}

                {event.reminders.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold">Reminders</p>
                      <p className="text-sm text-muted-foreground">
                        {event.reminders.filter((r) => r.enabled).length} active reminder(s)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {event.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-muted-foreground">{event.notes}</p>
                </div>
              )}

              {event.tags && event.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this event? This action cannot be undone.
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
      </div>
    </AppLayout>
  )
}
