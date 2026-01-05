import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Eye, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useBeneficiaries, useDeleteBeneficiary } from '@/features/beneficiaries/hooks/use-beneficiaries'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/shared/table/DataTable'
import { useReactTable, getCoreRowModel, getPaginationRowModel, getFilteredRowModel, getSortedRowModel } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import type { Beneficiary } from '@/types'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
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

export const Route = createFileRoute('/beneficiaries/')({
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
  component: BeneficiariesListPage,
})

function BeneficiariesListPage() {
  const navigate = useNavigate()
  const { data: beneficiaries, isLoading, error } = useBeneficiaries()
  const deleteMutation = useDeleteBeneficiary()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null)

  // Debug logging
  if (error) {
    console.error('Error fetching beneficiaries:', error)
  }
  if (beneficiaries) {
    console.log('Beneficiaries fetched:', beneficiaries.length, beneficiaries)
  }

  const columns = useMemo<ColumnDef<Beneficiary>[]>(
    () => [
      {
        accessorKey: 'firstName',
        header: 'Name',
        cell: ({ row }) => {
          const beneficiary = row.original
          return (
            <div className="flex flex-col">
              <span className="font-medium">
                {beneficiary.firstName} {beneficiary.lastName}
              </span>
              {beneficiary.middleName && (
                <span className="text-sm text-muted-foreground">{beneficiary.middleName}</span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'dateOfBirth',
        header: 'Date of Birth',
        cell: ({ row }) => format(row.original.dateOfBirth, 'MMM dd, yyyy'),
      },
      {
        accessorKey: 'gender',
        header: 'Gender',
        cell: ({ row }) => (
          <span className="capitalize">{row.original.gender}</span>
        ),
      },
      {
        accessorKey: 'address.state',
        header: 'State',
        cell: ({ row }) => row.original.address.state,
      },
      {
        accessorKey: 'address.lga',
        header: 'LGA',
        cell: ({ row }) => row.original.address.lga,
      },
      {
        accessorKey: 'programsReceived',
        header: 'Programs',
        cell: ({ row }) => {
          const programs = row.original.programsReceived || []
          return (
            <Badge variant="secondary">
              {programs.length} {programs.length === 1 ? 'program' : 'programs'}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'amountSpent',
        header: 'Amount Spent',
        cell: ({ row }) => {
          const amount = row.original.amountSpent || 0
          return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
          }).format(amount)
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          const variants: Record<string, string> = {
            active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            inactive: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          }
          return (
            <Badge className={variants[status] || ''}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const beneficiary = row.original
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ 
                  to: '/beneficiaries/$id',
                  params: { id: beneficiary.id }
                })}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ 
                  to: '/beneficiaries/$id/edit',
                  params: { id: beneficiary.id }
                })}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedBeneficiary(beneficiary)
                  setDeleteDialogOpen(true)
                }}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    [navigate]
  )

  const filteredData = useMemo(() => {
    if (!beneficiaries) return []
    if (!searchQuery) return beneficiaries

    const query = searchQuery.toLowerCase()
    return beneficiaries.filter(
      (b) =>
        b.firstName.toLowerCase().includes(query) ||
        b.lastName.toLowerCase().includes(query) ||
        b.address.state.toLowerCase().includes(query) ||
        b.address.lga.toLowerCase().includes(query) ||
        b.phoneNumber?.toLowerCase().includes(query) ||
        b.email?.toLowerCase().includes(query)
    )
  }, [beneficiaries, searchQuery])

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
    if (selectedBeneficiary) {
      await deleteMutation.mutateAsync(selectedBeneficiary.id)
      setDeleteDialogOpen(false)
      setSelectedBeneficiary(null)
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
              Beneficiaries
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and track beneficiary records
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Button
              onClick={() => navigate({ to: '/beneficiaries/create' })}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Beneficiary
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
              placeholder="Search by name, state, LGA, phone, or email..."
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
              <AlertDialogTitle>Delete Beneficiary</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedBeneficiary?.firstName}{' '}
                {selectedBeneficiary?.lastName}? This action cannot be undone.
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
