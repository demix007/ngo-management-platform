import type { ColumnDef } from '@tanstack/react-table'
import type { Project } from '@/types'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2 } from 'lucide-react'

const getTypeLabel = (type: Project['type']): string => {
  const labels: Record<Project['type'], string> = {
    construction: 'Construction',
    renovation: 'Renovation',
    hospitals: 'Hospitals',
    water_projects: 'Water Projects',
    skill_empowerment: 'Skill Empowerment',
    community_outreach: 'Community Outreach',
    grants: 'Grants',
    institutional_support: 'Institutional Support',
  }
  return labels[type] || type
}

const getStatusVariant = (status: Project['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const variants: Record<Project['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    planning: 'outline',
    in_progress: 'default',
    on_hold: 'secondary',
    completed: 'default',
    cancelled: 'destructive',
  }
  return variants[status] || 'secondary'
}

const getStatusColor = (status: Project['status']): string => {
  const colors: Record<Project['status'], string> = {
    planning: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    on_hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return colors[status] || ''
}

export const createProjectColumns = (
  onView: (id: string) => void,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void
): ColumnDef<Project>[] => [
  {
    accessorKey: 'name',
    header: 'Project Name',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        <span className="text-sm text-muted-foreground">
          {getTypeLabel(row.original.type)}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => {
      const location = row.original.location
      if (!location) return <span className="text-muted-foreground">-</span>
      return (
        <div className="flex flex-col">
          {location.city && location.state && (
            <span className="text-sm">
              {location.city}, {location.state}
            </span>
          )}
          {location.country && (
            <span className="text-sm text-muted-foreground">
              {location.country}
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'budget',
    header: 'Budget',
    cell: ({ row }) => {
      const budget = row.original.budget
      const spentPercentage = budget.allocated > 0 
        ? ((budget.spent / budget.allocated) * 100).toFixed(1)
        : '0'
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {budget.currency} {budget.allocated.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">
            Spent: {budget.currency} {budget.spent.toLocaleString()} ({spentPercentage}%)
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'timeline',
    header: 'Timeline',
    cell: ({ row }) => {
      const timeline = row.original.timeline
      return (
        <div className="flex flex-col">
          <span className="text-sm">
            Start: {format(timeline.startDate, 'MMM dd, yyyy')}
          </span>
          {timeline.endDate && (
            <span className="text-sm text-muted-foreground">
              End: {format(timeline.endDate, 'MMM dd, yyyy')}
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'progress',
    header: 'Progress',
    cell: ({ row }) => {
      const progress = row.original.progress
      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <span className="text-sm font-medium">{progress.percentage}%</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge 
          variant={getStatusVariant(status)} 
          className={`capitalize ${getStatusColor(status)}`}
        >
          {status.replace('_', ' ')}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'contractors',
    header: 'Contractors',
    cell: ({ row }) => {
      const contractors = row.original.contractors || []
      const partners = row.original.partnerNames || []
      const total = contractors.length + partners.length
      if (total === 0) return <span className="text-muted-foreground">-</span>
      return (
        <Badge variant="secondary">
          {total} {total === 1 ? 'partner' : 'partners'}
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







