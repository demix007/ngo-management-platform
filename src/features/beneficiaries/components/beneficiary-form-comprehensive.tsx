import { useForm, useFieldArray, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CustomDatePicker } from '@/components/ui/date-picker'
import { useCreateBeneficiary, useUpdateBeneficiary } from '../hooks/use-beneficiaries'
import type { Beneficiary } from '@/types'
import { Plus, X, Upload, MapPin } from 'lucide-react'
import { useState } from 'react'

const beneficiarySchema = z.object({
  // Bio data
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  
  // ID Document
  idDocument: z.object({
    type: z.enum(['national_id', 'voters_card', 'drivers_license', 'passport', 'other']).optional(),
    number: z.string().optional(),
    documentUrl: z.string().optional(),
  }).optional(),
  
  // Address
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    lga: z.string().min(1, 'LGA is required'),
    country: z.string().min(1, 'Country is required'),
    postalCode: z.string().optional(),
  }),
  
  // GPS Location (optional)
  gpsLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  
  // Programs
  programsReceived: z.array(z.object({
    programId: z.string(),
    programName: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    amountSpent: z.number().min(0),
    status: z.enum(['completed', 'ongoing', 'cancelled']),
  })).optional(),
  amountSpent: z.coerce.number().min(0).default(0),
  
  // Medical Bills
  medicalBills: z.array(z.object({
    id: z.string().optional(),
    description: z.string().min(1, 'Description is required'),
    amount: z.number().min(0, 'Amount must be positive'),
    date: z.string().min(1, 'Date is required'),
    cleared: z.boolean().default(false),
    clearedDate: z.string().optional(),
    documentUrl: z.string().optional(),
  })).optional(),
  
  // Bail Bills
  bailBills: z.array(z.object({
    id: z.string().optional(),
    description: z.string().min(1, 'Description is required'),
    amount: z.number().min(0, 'Amount must be positive'),
    date: z.string().min(1, 'Date is required'),
    cleared: z.boolean().default(false),
    clearedDate: z.string().optional(),
    documentUrl: z.string().optional(),
  })).optional(),
  
  // Follow-up Reports
  followUpReports: z.array(z.object({
    id: z.string().optional(),
    date: z.string().min(1, 'Date is required'),
    reporter: z.string().min(1, 'Reporter name is required'),
    report: z.string().min(1, 'Report is required'),
    status: z.enum(['positive', 'needs_attention', 'critical']),
    nextFollowUpDate: z.string().optional(),
  })).optional(),
  
  // Impact & Reintegration
  impactNotes: z.string().optional(),
  reintegrationSuccessScore: z.number().min(0).max(100).optional(),
  reintegrationDetails: z.object({
    dateCompleted: z.string().optional(),
    employmentStatus: z.enum(['employed', 'self_employed', 'unemployed', 'student']).optional(),
    housingStatus: z.enum(['stable', 'temporary', 'homeless']).optional(),
    familyReunited: z.boolean().optional(),
    communitySupport: z.boolean().optional(),
  }).optional(),
  
  // Legacy
  notes: z.string().optional(),
})

type BeneficiaryFormData = z.infer<typeof beneficiarySchema>

interface BeneficiaryFormComprehensiveProps {
  beneficiary?: Beneficiary
  onSuccess?: () => void
}

export function BeneficiaryFormComprehensive({ beneficiary, onSuccess }: BeneficiaryFormComprehensiveProps) {
  const createMutation = useCreateBeneficiary()
  const updateMutation = useUpdateBeneficiary()
  const [activeTab, setActiveTab] = useState('bio')
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<BeneficiaryFormData>({
    mode: 'onChange',
    // @ts-expect-error - zodResolver type mismatch with react-hook-form versions
    resolver: zodResolver(beneficiarySchema),
    defaultValues: beneficiary
      ? {
          ...beneficiary,
          dateOfBirth: beneficiary.dateOfBirth.toISOString().split('T')[0],
          programsReceived: beneficiary.programsReceived?.map(p => ({
            ...p,
            startDate: p.startDate.toISOString().split('T')[0],
            endDate: p.endDate?.toISOString().split('T')[0],
          })),
          medicalBills: beneficiary.medicalBills?.map(b => ({
            ...b,
            date: b.date.toISOString().split('T')[0],
            clearedDate: b.clearedDate?.toISOString().split('T')[0],
          })),
          bailBills: beneficiary.bailBills?.map(b => ({
            ...b,
            date: b.date.toISOString().split('T')[0],
            clearedDate: b.clearedDate?.toISOString().split('T')[0],
          })),
          followUpReports: beneficiary.followUpReports?.map(r => ({
            ...r,
            date: r.date.toISOString().split('T')[0],
            nextFollowUpDate: r.nextFollowUpDate?.toISOString().split('T')[0],
          })),
          reintegrationDetails: beneficiary.reintegrationDetails ? {
            ...beneficiary.reintegrationDetails,
            dateCompleted: beneficiary.reintegrationDetails.dateCompleted?.toISOString().split('T')[0],
          } : undefined,
        }
      : {
          address: { country: 'Nigeria' },
          amountSpent: 0,
        },
  })

  const { fields: programFields, append: appendProgram, remove: removeProgram } = useFieldArray({
    control,
    name: 'programsReceived',
  })

  const { fields: medicalFields, append: appendMedical, remove: removeMedical } = useFieldArray({
    control,
    name: 'medicalBills',
  })

  const { fields: bailFields, append: appendBail, remove: removeBail } = useFieldArray({
    control,
    name: 'bailBills',
  })

  const { fields: followUpFields, append: appendFollowUp, remove: removeFollowUp } = useFieldArray({
    control,
    name: 'followUpReports',
  })

  const onSubmit = async (data: BeneficiaryFormData) => {
    try {
      console.log('Form submitted with data:', data)
      
      const beneficiaryData: Partial<Beneficiary> = {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth),
        idDocument: data.idDocument?.type ? {
          type: data.idDocument.type,
          number: data.idDocument.number,
          documentUrl: data.idDocument.documentUrl,
        } : undefined,
        programsReceived: data.programsReceived?.map(p => ({
          ...p,
          startDate: new Date(p.startDate),
          endDate: p.endDate ? new Date(p.endDate) : undefined,
        })),
        medicalBills: data.medicalBills?.map(b => ({
          id: b.id || crypto.randomUUID(),
          description: b.description,
          amount: b.amount,
          date: new Date(b.date),
          cleared: b.cleared,
          clearedDate: b.clearedDate ? new Date(b.clearedDate) : undefined,
          documentUrl: b.documentUrl,
        })),
        bailBills: data.bailBills?.map(b => ({
          id: b.id || crypto.randomUUID(),
          description: b.description,
          amount: b.amount,
          date: new Date(b.date),
          cleared: b.cleared,
          clearedDate: b.clearedDate ? new Date(b.clearedDate) : undefined,
          documentUrl: b.documentUrl,
        })),
        followUpReports: data.followUpReports?.map(r => ({
          id: r.id || crypto.randomUUID(),
          date: new Date(r.date),
          reporter: r.reporter,
          report: r.report,
          status: r.status,
          nextFollowUpDate: r.nextFollowUpDate ? new Date(r.nextFollowUpDate) : undefined,
        })),
        reintegrationDetails: data.reintegrationDetails ? {
          ...data.reintegrationDetails,
          dateCompleted: data.reintegrationDetails.dateCompleted 
            ? new Date(data.reintegrationDetails.dateCompleted) 
            : undefined,
        } : undefined,
        programParticipations: beneficiary?.programParticipations || [],
        impactMetrics: beneficiary?.impactMetrics || {
          programsCompleted: data.programsReceived?.length || 0,
          totalBenefitAmount: data.amountSpent || 0,
        },
        status: beneficiary?.status || 'active',
        createdBy: beneficiary?.createdBy || '',
      }

      if (beneficiary) {
        await updateMutation.mutateAsync({ id: beneficiary.id, ...beneficiaryData })
      } else {
        console.log('Creating beneficiary with data:', beneficiaryData)
        await createMutation.mutateAsync(beneficiaryData as Omit<Beneficiary, 'id' | 'createdAt' | 'updatedAt'>)
      }
      onSuccess?.()
    } catch (error) {
      console.error('Form submission error:', error)
      // Error notification is handled by the mutation hooks
    }
  }

  const handleFormError = (validationErrors: FieldErrors<BeneficiaryFormData>) => {
    console.error('Form validation errors:', validationErrors)
    // Show validation errors to user
    const errorMessages = Object.entries(validationErrors).map(([key, value]) => {
      const error = value as { message?: string } | undefined
      return `${key}: ${error?.message || 'Invalid value'}`
    })
    console.error('Validation errors:', errorMessages)
  }

  const tabs = [
    { id: 'bio', label: 'Bio Data' },
    { id: 'id', label: 'ID & Photos' },
    { id: 'location', label: 'Location' },
    { id: 'programs', label: 'Programs' },
    { id: 'bills', label: 'Medical/Bail Bills' },
    { id: 'followup', label: 'Follow-up' },
    { id: 'impact', label: 'Impact & Reintegration' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <CardTitle className="text-2xl">
            {beneficiary ? 'Edit Beneficiary' : 'Add New Beneficiary'}
          </CardTitle>
          <CardDescription className="text-blue-100">
            {beneficiary ? 'Update beneficiary information' : 'Enter comprehensive beneficiary details'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* @ts-expect-error - handleSubmit type inference issue with complex schema */}
          <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-6">
            {/* Bio Data Tab */}
            {activeTab === 'bio' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Select
                      value={watch('gender') || ''}
                      onValueChange={(value) => {
                        setValue('gender', value as 'male' | 'female' | 'other', { shouldValidate: true })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input id="phoneNumber" {...register('phoneNumber')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register('email')} />
                  </div>
                </div>
                {errors.gender && (
                  <p className="text-sm text-destructive">{errors.gender.message}</p>
                )}
                {errors.dateOfBirth && (
                  <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="notes">General Notes</Label>
                  <Textarea id="notes" {...register('notes')} rows={3} />
                </div>
              </motion.div>
            )}

            {/* ID & Photos Tab */}
            {activeTab === 'id' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="idType">ID Document Type</Label>
                    <Select
                      value={watch('idDocument.type')}
                      onValueChange={(value) => setValue('idDocument.type', value as 'national_id' | 'voters_card' | 'drivers_license' | 'passport' | 'other')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="national_id">National ID</SelectItem>
                        <SelectItem value="voters_card">Voter's Card</SelectItem>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idNumber">ID Number</Label>
                    <Input id="idNumber" {...register('idDocument.number')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload ID Document</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload Photos</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to upload beneficiary photos</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB each</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input id="street" {...register('address.street')} />
                  {errors.address?.street && (
                    <p className="text-sm text-destructive">{errors.address.street.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lga">LGA *</Label>
                    <Input id="lga" {...register('address.lga')} />
                    {errors.address?.lga && (
                      <p className="text-sm text-destructive">{errors.address.lga.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input id="country" {...register('address.country')} />
                    {errors.address?.country && (
                      <p className="text-sm text-destructive">{errors.address.country.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input id="postalCode" {...register('address.postalCode')} />
                </div>

                <div className="border rounded-lg p-4 ">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <Label>GPS Location (Optional)</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        {...register('gpsLocation.latitude', { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        {...register('gpsLocation.longitude', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                  <Button type="button" variant="default" className="mt-2" size="sm">
                    Get Current Location
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Programs Tab */}
            {activeTab === 'programs' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <Label>Programs Received</Label>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => appendProgram({
                      programId: '',
                      programName: '',
                      startDate: '',
                      amountSpent: 0,
                      status: 'ongoing',
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Program
                  </Button>
                </div>

                {programFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Program {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProgram(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Program Name *</Label>
                        <Input {...register(`programsReceived.${index}.programName`)} />
                      </div>
                      <div className="space-y-2">
                        <CustomDatePicker
                          control={control}
                          name={`programsReceived.${index}.startDate`}
                          label="Start Date *"
                          placeholder="Select start date"
                        />
                      </div>
                      <div className="space-y-2">
                        <CustomDatePicker
                          control={control}
                          name={`programsReceived.${index}.endDate`}
                          label="End Date"
                          placeholder="Select end date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount Spent *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`programsReceived.${index}.amountSpent`, { valueAsNumber: true })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={watch(`programsReceived.${index}.status`)}
                          onValueChange={(value) => setValue(`programsReceived.${index}.status`, value as 'completed' | 'ongoing' | 'cancelled')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="ongoing">Ongoing</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                ))}

                <div className="space-y-2">
                  <Label htmlFor="amountSpent">Total Amount Spent</Label>
                  <Input
                    id="amountSpent"
                    type="number"
                    step="0.01"
                    {...register('amountSpent', { valueAsNumber: true })}
                  />
                </div>
              </motion.div>
            )}

            {/* Medical/Bail Bills Tab */}
            {activeTab === 'bills' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Medical Bills */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-semibold">Medical Bills</Label>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => appendMedical({
                        description: '',
                        amount: 0,
                        date: '',
                        cleared: false,
                      })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Medical Bill
                    </Button>
                  </div>

                  {medicalFields.map((field, index) => (
                    <Card key={field.id} className="p-4 mb-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Medical Bill {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMedical(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Input {...register(`medicalBills.${index}.description`)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Amount *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`medicalBills.${index}.amount`, { valueAsNumber: true })}
                          />
                        </div>
                        <div className="space-y-2">
                          <CustomDatePicker
                            control={control}
                            name={`medicalBills.${index}.date`}
                            label="Date *"
                            placeholder="Select date"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cleared</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              {...register(`medicalBills.${index}.cleared`)}
                              className="h-4 w-4"
                            />
                            {watch(`medicalBills.${index}.cleared`) && (
                              <div className="space-y-2 flex-1">
                                <CustomDatePicker
                                  control={control}
                                  name={`medicalBills.${index}.clearedDate`}
                                  label="Cleared Date"
                                  placeholder="Select cleared date"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Bail Bills */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-semibold">Bail Bills</Label>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => appendBail({
                        description: '',
                        amount: 0,
                        date: '',
                        cleared: false,
                      })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Bail Bill
                    </Button>
                  </div>

                  {bailFields.map((field, index) => (
                    <Card key={field.id} className="p-4 mb-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Bail Bill {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBail(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Input {...register(`bailBills.${index}.description`)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Amount *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`bailBills.${index}.amount`, { valueAsNumber: true })}
                          />
                        </div>
                        <div className="space-y-2">
                          <CustomDatePicker
                            control={control}
                            name={`bailBills.${index}.date`}
                            label="Date *"
                            placeholder="Select date"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cleared</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              {...register(`bailBills.${index}.cleared`)}
                              className="h-4 w-4"
                            />
                            {watch(`bailBills.${index}.cleared`) && (
                              <div className="space-y-2 flex-1">
                                <CustomDatePicker
                                  control={control}
                                  name={`bailBills.${index}.clearedDate`}
                                  label="Cleared Date"
                                  placeholder="Select cleared date"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Follow-up Tab */}
            {activeTab === 'followup' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <Label>Follow-up Reports</Label>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => appendFollowUp({
                      date: '',
                      reporter: '',
                      report: '',
                      status: 'positive',
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Follow-up
                  </Button>
                </div>

                {followUpFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Follow-up Report {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFollowUp(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <CustomDatePicker
                          control={control}
                          name={`followUpReports.${index}.date`}
                          label="Date *"
                          placeholder="Select date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reporter *</Label>
                        <Input {...register(`followUpReports.${index}.reporter`)} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Report *</Label>
                        <Textarea {...register(`followUpReports.${index}.report`)} rows={3} />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={watch(`followUpReports.${index}.status`)}
                          onValueChange={(value) => setValue(`followUpReports.${index}.status`, value as 'positive' | 'needs_attention' | 'critical')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="positive">Positive</SelectItem>
                            <SelectItem value="needs_attention">Needs Attention</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <CustomDatePicker
                          control={control}
                          name={`followUpReports.${index}.nextFollowUpDate`}
                          label="Next Follow-up Date"
                          placeholder="Select next follow-up date"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}

            {/* Impact & Reintegration Tab */}
            {activeTab === 'impact' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="impactNotes">Impact Notes</Label>
                  <Textarea id="impactNotes" {...register('impactNotes')} rows={4} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reintegrationScore">Reintegration Success Score (0-100)</Label>
                  <Input
                    id="reintegrationScore"
                    type="number"
                    min="0"
                    max="100"
                    {...register('reintegrationSuccessScore', { valueAsNumber: true })}
                  />
                  {watch('reintegrationSuccessScore') && (
                    <div className="mt-2">
                      <div className="w-full rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${watch('reintegrationSuccessScore')}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Card className="p-4 ">
                  <h4 className="font-semibold mb-4">Reintegration Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <CustomDatePicker
                        control={control}
                        name="reintegrationDetails.dateCompleted"
                        label="Date Completed"
                        placeholder="Select completion date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Employment Status</Label>
                      <Select
                        value={watch('reintegrationDetails.employmentStatus')}
                        onValueChange={(value) => setValue('reintegrationDetails.employmentStatus', value as 'employed' | 'self_employed' | 'unemployed' | 'student')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employed">Employed</SelectItem>
                          <SelectItem value="self_employed">Self Employed</SelectItem>
                          <SelectItem value="unemployed">Unemployed</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Housing Status</Label>
                      <Select
                        value={watch('reintegrationDetails.housingStatus')}
                        onValueChange={(value) => setValue('reintegrationDetails.housingStatus', value as 'stable' | 'temporary' | 'homeless')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stable">Stable</SelectItem>
                          <SelectItem value="temporary">Temporary</SelectItem>
                          <SelectItem value="homeless">Homeless</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          {...register('reintegrationDetails.familyReunited')}
                          className="h-4 w-4"
                        />
                        <Label>Family Reunited</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          {...register('reintegrationDetails.communitySupport')}
                          className="h-4 w-4"
                        />
                        <Label>Community Support</Label>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Form Validation Errors Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium text-destructive mb-2">
                  Please fix the following errors:
                </p>
                <ul className="text-sm text-destructive space-y-1 list-disc list-inside">
                  {errors.firstName && <li>{errors.firstName.message}</li>}
                  {errors.lastName && <li>{errors.lastName.message}</li>}
                  {errors.dateOfBirth && <li>{errors.dateOfBirth.message}</li>}
                  {errors.gender && <li>{errors.gender.message}</li>}
                  {errors.address?.street && <li>Street address: {errors.address.street.message}</li>}
                  {errors.address?.city && <li>City: {errors.address.city.message}</li>}
                  {errors.address?.state && <li>State: {errors.address.state.message}</li>}
                  {errors.address?.lga && <li>LGA: {errors.address.lga.message}</li>}
                  {errors.address?.country && <li>Country: {errors.address.country.message}</li>}
                </ul>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="destructive" onClick={onSuccess}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || createMutation.isPending || updateMutation.isPending} 
                className="min-w-[120px]"
              >
                {isSubmitting || createMutation.isPending || updateMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Saving...
                  </span>
                ) : beneficiary ? (
                  'Update Beneficiary'
                ) : (
                  'Create Beneficiary'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

