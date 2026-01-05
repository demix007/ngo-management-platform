import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import {
  useWorkflows,
  useDeleteWorkflow,
} from '@/features/workflows/hooks/use-workflows'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/shared/table/DataTable'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/react-table'
import { createWorkflowColumns } from '@/features/workflows/components/columns'
import type { Workflow } from '@/types'
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
import { useUpdateWorkflow } from '@/features/workflows/hooks/use-workflows'

export const Route = createFileRoute('/workflows/')({
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
  component: WorkflowsListPage,
})

function WorkflowsListPage() {
  const navigate = useNavigate()
  const { data: workflows, isLoading, error } = useWorkflows()
  const deleteMutation = useDeleteWorkflow()
  const updateMutation = useUpdateWorkflow()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)

  if (error) {
    console.error('Error fetching workflows:', error)
  }

  const columns = useMemo(
    () =>
      createWorkflowColumns(
        (id) => navigate({ to: '/workflows/$id', params: { id } }),
        (id) => navigate({ to: '/workflows/$id/edit', params: { id } }),
        (id) => {
          const workflow = workflows?.find((w) => w.id === id)
          if (workflow) {
            setSelectedWorkflow(workflow)
            setDeleteDialogOpen(true)
          }
        },
        async (id, status) => {
          await updateMutation.mutateAsync({ id, status })
        }
      ),
    [navigate, workflows, updateMutation]
  )

  const filteredData = useMemo(() => {
    if (!workflows) return []
    if (!searchQuery) return workflows

    const query = searchQuery.toLowerCase()
    return workflows.filter(
      (w) =>
        w.title.toLowerCase().includes(query) ||
        w.description?.toLowerCase().includes(query) ||
        w.category.toLowerCase().includes(query)
    )
  }, [workflows, searchQuery])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const handleDelete = async () => {
    if (selectedWorkflow) {
      await deleteMutation.mutateAsync(selectedWorkflow.id)
      setDeleteDialogOpen(false)
      setSelectedWorkflow(null)
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
              Workflows
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and track workflow processes
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Button
              onClick={() => navigate({ to: '/workflows/create' })}
              variant="default"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Workflow
            </Button>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <DataTable columns={columns} table={table} loading={isLoading} />
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this workflow ({selectedWorkflow?.title})?
                This action cannot be undone.
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
