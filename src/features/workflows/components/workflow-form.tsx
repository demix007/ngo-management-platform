import { useForm, useFieldArray, Controller, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CustomDatePicker } from '@/components/ui/date-picker'
import {
  useCreateWorkflow,
  useUpdateWorkflow,
} from '../hooks/use-workflows'
import { usePrograms } from '@/features/programs/hooks/use-programs'
import type { Workflow } from '@/types'
import { Plus, X, ListChecks, Calendar } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

const workflowSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum([
    'program',
    'grant',
    'donation',
    'monitoring',
    'reporting',
    'compliance',
    'other',
  ]),
  steps: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().min(1, 'Step title is required'),
        description: z.string().optional(),
        order: z.number(),
        status: z.enum(['pending', 'in_progress', 'completed', 'skipped', 'blocked']),
        dueDate: z.string().optional(),
        estimatedDuration: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .min(1, 'At least one step is required'),
  programId: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  targetEndDate: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

type WorkflowFormData = z.infer<typeof workflowSchema>

interface WorkflowFormProps {
  workflow?: Workflow
  onSuccess?: () => void
}

export function WorkflowForm({ workflow, onSuccess }: WorkflowFormProps) {
  const createMutation = useCreateWorkflow()
  const updateMutation = useUpdateWorkflow()
  const { user } = useAuthStore()
  const { data: programs } = usePrograms()
  const [activeTab, setActiveTab] = useState('basic')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<WorkflowFormData>({
    mode: 'onChange',
    resolver: zodResolver(workflowSchema),
    defaultValues: workflow
      ? {
          ...workflow,
          startDate: workflow.startDate.toISOString().split('T')[0],
          targetEndDate: workflow.targetEndDate?.toISOString().split('T')[0],
          steps: workflow.steps.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            order: s.order,
            status: s.status,
            dueDate: s.dueDate?.toISOString().split('T')[0],
            estimatedDuration: s.estimatedDuration,
            notes: s.notes,
          })),
        }
      : {
          category: 'other',
          status: 'draft',
          priority: 'medium',
          steps: [
            {
              title: '',
              order: 1,
              status: 'pending',
            },
          ],
        },
  })

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({
    control,
    name: 'steps',
  })

  const onSubmit = async (data: WorkflowFormData) => {
    try {
      // Calculate completion percentage
      const completedSteps = data.steps.filter((s) => s.status === 'completed').length
      const completionPercentage = (completedSteps / data.steps.length) * 100

      const workflowData: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'> = {
        ...data,
        steps: data.steps.map((s, index) => ({
          id: s.id || crypto.randomUUID(),
          title: s.title,
          description: s.description,
          order: s.order || index + 1,
          status: s.status,
          dueDate: s.dueDate ? new Date(s.dueDate) : undefined,
          estimatedDuration: s.estimatedDuration,
          notes: s.notes,
        })),
        startDate: new Date(data.startDate),
        targetEndDate: data.targetEndDate ? new Date(data.targetEndDate) : undefined,
        progress: 0,
        completionPercentage,
        ownerId: workflow?.ownerId || user?.id || '',
        ownerName: user?.displayName,
        programName: programs?.find((p) => p.id === data.programId)?.title,
        createdBy: workflow?.createdBy || user?.id || '',
        isTemplate: false,
        canBeReused: false,
      }

      if (workflow) {
        await updateMutation.mutateAsync({ id: workflow.id, ...workflowData })
      } else {
        await createMutation.mutateAsync(workflowData)
      }
      onSuccess?.()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleFormError = (validationErrors: FieldErrors<WorkflowFormData>) => {
    console.error('Form validation errors:', validationErrors)
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: ListChecks },
    { id: 'steps', label: 'Steps', icon: ListChecks },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
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
            {workflow ? 'Edit Workflow' : 'Create New Workflow'}
          </CardTitle>
          <CardDescription className="text-blue-100">
            {workflow ? 'Update workflow information' : 'Enter comprehensive workflow details'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form
            onSubmit={handleSubmit(onSubmit, handleFormError)}
            className="space-y-6"
          >
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">Workflow Title *</Label>
                    <Input id="title" {...register('title')} />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Controller
                      control={control}
                      name="category"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value as WorkflowFormData['category'])
                          }}
                        >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="program">Program</SelectItem>
                        <SelectItem value="grant">Grant</SelectItem>
                        <SelectItem value="donation">Donation</SelectItem>
                        <SelectItem value="monitoring">Monitoring</SelectItem>
                        <SelectItem value="reporting">Reporting</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="programId">Related Program</Label>
                    <Controller
                      control={control}
                      name="programId"
                      render={({ field }) => (
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>
                          <SelectContent>
                            {programs?.map((program) => (
                              <SelectItem key={program.id} value={program.id}>
                                {program.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value as WorkflowFormData['status'])
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Controller
                      control={control}
                      name="priority"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value as WorkflowFormData['priority'])
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    rows={4}
                    placeholder="Enter workflow description..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </motion.div>
            )}

            {/* Steps Tab */}
            {activeTab === 'steps' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">Workflow Steps</Label>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() =>
                      appendStep({
                        title: '',
                        order: stepFields.length + 1,
                        status: 'pending',
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>

                {stepFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Step {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Step Title *</Label>
                        <Input {...register(`steps.${index}.title`)} />
                        {errors.steps?.[index]?.title && (
                          <p className="text-sm text-destructive">
                            {errors.steps[index]?.title?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Controller
                          control={control}
                          name={`steps.${index}.status`}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="skipped">Skipped</SelectItem>
                                <SelectItem value="blocked">Blocked</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Estimated Duration (hours)</Label>
                        <Input
                          type="number"
                          min="0"
                          {...register(`steps.${index}.estimatedDuration`, {
                            valueAsNumber: true,
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <CustomDatePicker
                          control={control}
                          name={`steps.${index}.dueDate`}
                          label="Due Date"
                          placeholder="Select due date"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          {...register(`steps.${index}.description`)}
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Notes</Label>
                        <Textarea {...register(`steps.${index}.notes`)} rows={2} />
                      </div>
                    </div>
                  </Card>
                ))}

                {errors.steps && (
                  <p className="text-sm text-destructive">{errors.steps.message}</p>
                )}
              </motion.div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <CustomDatePicker
                      control={control}
                      name="startDate"
                      label="Start Date *"
                      placeholder="Select start date"
                    />
                    {errors.startDate && (
                      <p className="text-sm text-destructive">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <CustomDatePicker
                      control={control}
                      name="targetEndDate"
                      label="Target End Date"
                      placeholder="Select target end date"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="default" onClick={onSuccess}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                {isSubmitting ||
                createMutation.isPending ||
                updateMutation.isPending
                  ? 'Saving...'
                  : workflow
                    ? 'Update Workflow'
                    : 'Create Workflow'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

