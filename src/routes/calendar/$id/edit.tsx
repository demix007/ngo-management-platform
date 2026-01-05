import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { AppLayout } from '@/components/layout/app-layout'
import { CalendarEventForm } from '@/features/calendar/components/calendar-event-form'
import { useCalendarEvent } from '@/features/calendar/hooks/use-calendar-events'

export const Route = createFileRoute('/calendar/$id/edit')({
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
  component: EditCalendarEventPage,
})

function EditCalendarEventPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { data: event, isLoading } = useCalendarEvent(id)

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
      <div className="container mx-auto p-6 max-w-4xl">
        <CalendarEventForm
          event={event}
          onSuccess={() => navigate({ to: '/calendar/$id', params: { id } })}
        />
      </div>
    </AppLayout>
  )
}
