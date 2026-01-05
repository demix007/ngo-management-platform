import type { ColumnDef } from '@tanstack/react-table'
import type { Donation, Grant } from '@/types'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2 } from 'lucide-react'

export const createDonationColumns = (
  onView: (id: string) => void,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void
): ColumnDef<Donation>[] => [
  {
    accessorKey: 'donorName',
    header: 'Donor',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.donorName || 'Unknown Donor'}</span>
        {row.original.receiptNumber && (
          <span className="text-sm text-muted-foreground">Receipt: {row.original.receiptNumber}</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <span className="font-semibold">
        {new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: row.original.currency || 'NGN',
        }).format(row.original.amount)}
      </span>
    ),
  },
  {
    accessorKey: 'donationDate',
    header: 'Date',
    cell: ({ row }) => format(row.original.donationDate, 'MMM dd, yyyy'),
  },
  {
    accessorKey: 'programName',
    header: 'Program',
    cell: ({ row }) => row.original.programName || '-',
  },
  {
    accessorKey: 'balanceRemaining',
    header: 'Balance',
    cell: ({ row }) => (
      <span className={row.original.balanceRemaining < 0 ? 'text-destructive' : ''}>
        {new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: row.original.currency || 'NGN',
        }).format(row.original.balanceRemaining)}
      </span>
    ),
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Payment Method',
    cell: ({ row }) => (
      <span className="capitalize">{row.original.paymentMethod.replace('_', ' ')}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const variant = {
        pending: 'secondary',
        confirmed: 'default',
        cancelled: 'destructive',
      }[status] as 'default' | 'secondary' | 'destructive'
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

export const createGrantColumns = (
  onView: (id: string) => void,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void
): ColumnDef<Grant>[] => [
  {
    accessorKey: 'grantName',
    header: 'Grant Name',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.grantName}</span>
        <span className="text-sm text-muted-foreground">{row.original.grantor}</span>
      </div>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <span className="font-semibold">
        {new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: row.original.currency || 'NGN',
        }).format(row.original.amount)}
      </span>
    ),
  },
  {
    accessorKey: 'startDate',
    header: 'Period',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{format(row.original.startDate, 'MMM dd, yyyy')}</span>
        <span className="text-sm text-muted-foreground">
          to {format(row.original.endDate, 'MMM dd, yyyy')}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'programIds',
    header: 'Programs',
    cell: ({ row }) => (
      <Badge variant="secondary">
        {row.original.programIds.length} {row.original.programIds.length === 1 ? 'program' : 'programs'}
      </Badge>
    ),
  },
  {
    accessorKey: 'reportingRequirements.nextReportDue',
    header: 'Next Report Due',
    cell: ({ row }) => format(row.original.reportingRequirements.nextReportDue, 'MMM dd, yyyy'),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const variant = {
        active: 'default',
        completed: 'outline',
        suspended: 'destructive',
      }[status] as 'default' | 'outline' | 'destructive'
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

