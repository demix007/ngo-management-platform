import type { ColumnDef } from '@tanstack/react-table'
import type { Partner } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2 } from 'lucide-react'

const getCategoryLabel = (category: Partner['category']): string => {
  const labels: Record<Partner['category'], string> = {
    government_ministry: 'Government Ministry',
    hospital: 'Hospital',
    correctional_center: 'Correctional Center',
    ngo: 'NGO',
    cso: 'CSO',
    international_agency: 'International Agency',
    foundation: 'Foundation',
    media_partner: 'Media Partner',
    donor_sponsor: 'Donor/Sponsor',
    private: 'Private',
  }
  return labels[category] || category
}

const getStatusVariant = (status: Partner['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const variants: Record<Partner['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    dormant: 'secondary',
    past: 'outline',
  }
  return variants[status] || 'secondary'
}

const getRatingColor = (rating?: Partner['relationshipRating']): string => {
  if (!rating) return 'text-muted-foreground'
  const colors: Record<NonNullable<Partner['relationshipRating']>, string> = {
    excellent: 'text-green-600 dark:text-green-400',
    very_good: 'text-green-500 dark:text-green-500',
    good: 'text-blue-600 dark:text-blue-400',
    fair: 'text-yellow-600 dark:text-yellow-400',
    poor: 'text-red-600 dark:text-red-400',
  }
  return colors[rating] || 'text-muted-foreground'
}

export const createPartnerColumns = (
  onView: (id: string) => void,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void
): ColumnDef<Partner>[] => [
  {
    accessorKey: 'name',
    header: 'Institution Name',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        <span className="text-sm text-muted-foreground">
          {getCategoryLabel(row.original.category)}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'focalPerson.name',
    header: 'Focal Person',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.focalPerson.name}</span>
        {row.original.focalPerson.title && (
          <span className="text-sm text-muted-foreground">
            {row.original.focalPerson.title}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'contactDetails.email',
    header: 'Contact',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm">{row.original.contactDetails.email}</span>
        {row.original.contactDetails.phoneNumber && (
          <span className="text-sm text-muted-foreground">
            {row.original.contactDetails.phoneNumber}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'address',
    header: 'Location',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm">
          {row.original.address.city}, {row.original.address.state}
        </span>
        {row.original.address.country && (
          <span className="text-sm text-muted-foreground">
            {row.original.address.country}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'programsPartneredOn',
    header: 'Programs',
    cell: ({ row }) => (
      <Badge variant="secondary">
        {row.original.programsPartneredOn.length}{' '}
        {row.original.programsPartneredOn.length === 1 ? 'program' : 'programs'}
      </Badge>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant={getStatusVariant(status)} className="capitalize">
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'relationshipRating',
    header: 'Rating',
    cell: ({ row }) => {
      const rating = row.original.relationshipRating
      if (!rating) return <span className="text-muted-foreground">-</span>
      return (
        <span className={`font-medium capitalize ${getRatingColor(rating)}`}>
          {rating.replace('_', ' ')}
        </span>
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

