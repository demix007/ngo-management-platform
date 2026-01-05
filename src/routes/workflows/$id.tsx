import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/auth-store'
import { AppLayout } from '@/components/layout/app-layout'
import { useWorkflow, useDeleteWorkflow } from '@/features/workflows/hooks/use-workflows'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import { Edit, Trash2, ArrowLeft, CheckCircle2, Circle, Clock } from 'lucide-react'
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

export const Route = createFileRoute('/workflows/$id')({
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
  component: WorkflowDetailsPage,
})

function WorkflowDetailsPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { data: workflow, isLoading } = useWorkflow(id)
  const deleteMutation = useDeleteWorkflow()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleDelete = async () => {
    if (workflow) {
      await deleteMutation.mutateAsync(workflow.id)
      navigate({ to: '/workflows' })
    }
  }

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
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/workflows' })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={() => navigate({ to: `/workflows/${id}/edit` })}
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
              <CardTitle className="text-2xl">{workflow.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" className="capitalize">
                  {workflow.category}
                </Badge>
                <Badge
                  variant={
                    workflow.status === 'completed'
                      ? 'default'
                      : workflow.status === 'cancelled'
                        ? 'destructive'
                        : workflow.status === 'active'
                          ? 'default'
                          : 'secondary'
                  }
                  className="capitalize"
                >
                  {workflow.status}
                </Badge>
                <Badge
                  variant={
                    workflow.priority === 'urgent'
                      ? 'destructive'
                      : workflow.priority === 'high'
                        ? 'default'
                        : 'default'
                  }
                  className="capitalize"
                >
                  {workflow.priority} priority
                </Badge>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(workflow.completionPercentage)}%
                  </span>
                </div>
                <Progress value={workflow.completionPercentage} />
              </div>

              {workflow.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{workflow.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold mb-1">Start Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(workflow.startDate, 'PPP')}
                  </p>
                </div>
                {workflow.targetEndDate && (
                  <div>
                    <p className="font-semibold mb-1">Target End Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(workflow.targetEndDate, 'PPP')}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-4">Workflow Steps</h3>
                <div className="space-y-3">
                  {workflow.steps
                    .sort((a, b) => a.order - b.order)
                    .map((step) => (
                      <Card key={step.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {step.status === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : step.status === 'in_progress' ? (
                              <Clock className="h-5 w-5 text-blue-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium">{step.title}</h4>
                              <Badge variant="default" className="capitalize text-xs">
                                {step.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            {step.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {step.description}
                              </p>
                            )}
                            {step.dueDate && (
                              <p className="text-xs text-muted-foreground">
                                Due: {format(step.dueDate, 'MMM dd, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>

              {workflow.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-muted-foreground">{workflow.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this workflow? This action cannot be undone.
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
