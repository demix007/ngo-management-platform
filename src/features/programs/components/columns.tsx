import type { ColumnDef } from '@tanstack/react-table'
import type { Program } from '@/types'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2 } from 'lucide-react'

export const createProgramColumns = (
  onView: (id: string) => void,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void
): ColumnDef<Program>[] => [
  {
    accessorKey: 'title',
    header: 'Program Title',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.title}</span>
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <span className="capitalize">{row.original.type.replace('_', ' ')}</span>
    ),
  },
  {
    accessorKey: 'startDate',
    header: 'Start Date',
    cell: ({ row }) => format(row.original.startDate, 'MMM dd, yyyy'),
  },
  {
    accessorKey: 'endDate',
    header: 'End Date',
    cell: ({ row }) => row.original.endDate ? format(row.original.endDate, 'MMM dd, yyyy') : '-',
  },
  {
    accessorKey: 'states',
    header: 'States',
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.states.slice(0, 2).map((state, idx) => (
          <Badge key={idx} variant="secondary" className="text-xs">
            {state}
          </Badge>
        ))}
        {row.original.states.length > 2 && (
          <Badge variant="secondary" className="text-xs">
            +{row.original.states.length - 2}
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'actualBeneficiaries',
    header: 'Beneficiaries',
    cell: ({ row }) => (
      <span>
        {row.original.actualBeneficiaries} / {row.original.targetBeneficiaries}
      </span>
    ),
  },
  {
    accessorKey: 'budget.allocated',
    header: 'Budget',
    cell: ({ row }) => (
      <span>
        {new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: row.original.budget.currency || 'NGN',
        }).format(row.original.budget.allocated)}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const variant = {
        planning: 'secondary',
        active: 'default',
        completed: 'outline',
        cancelled: 'destructive',
      }[status] as 'default' | 'secondary' | 'outline' | 'destructive'
      return (
        <Badge variant={variant} className="capitalize">
          {status}
        </Badge>
      )
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(row.original.id)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(row.original.id)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(row.original.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    ),
  },
]

