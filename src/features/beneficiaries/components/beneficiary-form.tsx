import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomDatePicker } from '@/components/ui/date-picker'
import { useCreateBeneficiary, useUpdateBeneficiary } from '../hooks/use-beneficiaries'
import type { Beneficiary } from '@/types'

const beneficiarySchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    lga: z.string().min(1, 'LGA is required'),
    country: z.string().min(1, 'Country is required'),
    postalCode: z.string().optional(),
  }),
  gpsLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  notes: z.string().optional(),
})

type BeneficiaryFormData = z.infer<typeof beneficiarySchema>

interface BeneficiaryFormProps {
  beneficiary?: Beneficiary
  onSuccess?: () => void
}

export function BeneficiaryForm({ beneficiary, onSuccess }: BeneficiaryFormProps) {
  const createMutation = useCreateBeneficiary()
  const updateMutation = useUpdateBeneficiary()
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BeneficiaryFormData>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: beneficiary
      ? {
          ...beneficiary,
          dateOfBirth: beneficiary.dateOfBirth.toISOString().split('T')[0],
        }
      : undefined,
  })

  const onSubmit = async (data: BeneficiaryFormData) => {
    try {
      const beneficiaryData = {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth),
        programParticipations: beneficiary?.programParticipations || [],
        amountSpent: beneficiary?.amountSpent || 0,
        impactMetrics: beneficiary?.impactMetrics || {
          programsCompleted: 0,
          totalBenefitAmount: 0,
        },
        status: beneficiary?.status || 'active',
        createdBy: beneficiary?.createdBy || '',
      }

      if (beneficiary) {
        await updateMutation.mutateAsync({ id: beneficiary.id, ...beneficiaryData })
      } else {
        await createMutation.mutateAsync(beneficiaryData)
      }
      onSuccess?.()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{beneficiary ? 'Edit Beneficiary' : 'Add New Beneficiary'}</CardTitle>
        <CardDescription>
          {beneficiary ? 'Update beneficiary information' : 'Enter beneficiary details'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input id="middleName" {...register('middleName')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <CustomDatePicker
                control={control}
                name="dateOfBirth"
                label="Date of Birth *"
                placeholder="Select date of birth"
                disableAfter={new Date()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <select
                id="gender"
                {...register('gender')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input id="phoneNumber" {...register('phoneNumber')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Street Address *</Label>
            <Input id="street" {...register('address.street')} />
            {errors.address?.street && (
              <p className="text-sm text-destructive">{errors.address.street.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" {...register('address.city')} />
              {errors.address?.city && (
                <p className="text-sm text-destructive">{errors.address.city.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input id="state" {...register('address.state')} />
              {errors.address?.state && (
                <p className="text-sm text-destructive">{errors.address.state.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lga">LGA *</Label>
              <Input id="lga" {...register('address.lga')} />
              {errors.address?.lga && (
                <p className="text-sm text-destructive">{errors.address.lga.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input id="country" {...register('address.country')} defaultValue="Nigeria" />
              {errors.address?.country && (
                <p className="text-sm text-destructive">{errors.address.country.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              {...register('notes')}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Saving...' : beneficiary ? 'Update Beneficiary' : 'Create Beneficiary'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

