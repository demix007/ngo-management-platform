import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { AppLayout } from '@/components/layout/app-layout'
import { CalendarEventForm } from '@/features/calendar/components/calendar-event-form'

export const Route = createFileRoute('/calendar/create')({
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
  component: CreateCalendarEventPage,
})

function CreateCalendarEventPage() {
  const navigate = useNavigate()

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <CalendarEventForm
          onSuccess={() => navigate({ to: '/calendar' })}
        />
      </div>
    </AppLayout>
  )
}
