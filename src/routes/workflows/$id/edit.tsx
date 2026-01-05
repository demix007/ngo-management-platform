import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { AppLayout } from '@/components/layout/app-layout'
import { WorkflowForm } from '@/features/workflows/components/workflow-form'
import { useWorkflow } from '@/features/workflows/hooks/use-workflows'

export const Route = createFileRoute('/workflows/$id/edit')({
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
  component: EditWorkflowPage,
})

function EditWorkflowPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { data: workflow, isLoading } = useWorkflow(id)

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-12 text-muted-foreground">Loading workflow...</div>
        </div>
      </AppLayout>
    )
  }

  if (!workflow) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-12 text-muted-foreground">Workflow not found</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <WorkflowForm
          workflow={workflow}
          onSuccess={() => navigate({ to: `/workflows/${id}` })}
        />
      </div>
    </AppLayout>
  )
}
