import type { ColumnDef } from '@tanstack/react-table'
import type { Workflow } from '@/types'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2, Play, Pause } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

export const createWorkflowColumns = (
  onView: (id: string) => void,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
  onToggleStatus?: (id: string, status: Workflow['status']) => void
): ColumnDef<Workflow>[] => [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.title}</span>
        {row.original.description && (
          <span className="text-sm text-muted-foreground line-clamp-1">
            {row.original.description}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.category}
      </Badge>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const variant = {
        draft: 'secondary',
        active: 'default',
        paused: 'outline',
        completed: 'default',
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
    accessorKey: 'progress',
    header: 'Progress',
    cell: ({ row }) => (
      <div className="flex items-center gap-2 w-32">
        <Progress value={row.original.completionPercentage} className="flex-1" />
        <span className="text-sm text-muted-foreground min-w-[3rem]">
          {Math.round(row.original.completionPercentage)}%
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => {
      const priority = row.original.priority
      const variant = {
        low: 'outline',
        medium: 'secondary',
        high: 'default',
        urgent: 'destructive',
      }[priority] as 'default' | 'secondary' | 'outline' | 'destructive'
      return (
        <Badge variant={variant} className="capitalize">
          {priority}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'startDate',
    header: 'Start Date',
    cell: ({ row }) => format(row.original.startDate, 'MMM dd, yyyy'),
  },
  {
    accessorKey: 'targetEndDate',
    header: 'Target End',
    cell: ({ row }) =>
      row.original.targetEndDate
        ? format(row.original.targetEndDate, 'MMM dd, yyyy')
        : '-',
  },
  {
    accessorKey: 'assignedToNames',
    header: 'Assigned To',
    cell: ({ row }) => (
      <div className="flex flex-col">
        {row.original.assignedToNames && row.original.assignedToNames.length > 0 ? (
          <span className="text-sm">
            {row.original.assignedToNames.slice(0, 2).join(', ')}
            {row.original.assignedToNames.length > 2 &&
              ` +${row.original.assignedToNames.length - 2}`}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        )}
      </div>
    ),
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
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(row.original.id)}
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4" />
        </Button>
        {onToggleStatus && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newStatus =
                row.original.status === 'active' ? 'paused' : 'active'
              onToggleStatus(row.original.id, newStatus)
            }}
            className="h-8 w-8 p-0"
          >
            {row.original.status === 'active' ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(row.original.id)}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
]

