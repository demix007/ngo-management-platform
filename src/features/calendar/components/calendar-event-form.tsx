import { useForm, useFieldArray, type FieldErrors } from 'react-hook-form'
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
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
} from '../hooks/use-calendar-events'
import { usePrograms } from '@/features/programs/hooks/use-programs'
import type { CalendarEvent } from '@/types'
import { Plus, X, Calendar as CalendarIcon, Clock, MapPin, Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

const calendarEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum([
    'monitoring_visit',
    'grant_reporting_deadline',
    'donor_feedback',
    'monthly_program',
    'weekly_program',
    'birthday',
    'anniversary',
    'official_date',
    'blp_event',
    'meeting',
    'training',
    'other',
  ]),
  scope: z.enum(['national', 'state', 'program', 'lga']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  allDay: z.boolean(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  timezone: z.string().optional(),
  state: z.string().optional(),
  lga: z.string().optional(),
  programId: z.string().optional(),
  location: z
    .object({
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
    })
    .optional(),
  reminders: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.enum(['email', 'sms', 'push', 'in_app']),
        frequency: z.enum(['none', 'daily', 'weekly', 'monthly']),
        daysBefore: z.number().min(0),
        enabled: z.boolean(),
      })
    )
    .optional(),
  isRecurring: z.boolean(),
  recurrencePattern: z
    .object({
      frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
      interval: z.number().min(1),
      endDate: z.string().optional(),
      occurrences: z.number().optional(),
    })
    .optional(),
  status: z.enum(['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  followUpRequired: z.boolean(),
  followUpDate: z.string().optional(),
})

type CalendarEventFormData = z.infer<typeof calendarEventSchema>

interface CalendarEventFormProps {
  event?: CalendarEvent
  onSuccess?: () => void
}

export function CalendarEventForm({ event, onSuccess }: CalendarEventFormProps) {
  const createMutation = useCreateCalendarEvent()
  const updateMutation = useUpdateCalendarEvent()
  const { user } = useAuthStore()
  const { data: programs } = usePrograms()
  const [activeTab, setActiveTab] = useState('basic')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<CalendarEventFormData>({
    mode: 'onChange',
    resolver: zodResolver(calendarEventSchema),
    defaultValues: event
      ? {
          ...event,
          startDate: event.startDate.toISOString().split('T')[0],
          endDate: event.endDate?.toISOString().split('T')[0],
          followUpDate: event.followUpDate?.toISOString().split('T')[0],
          allDay: event.allDay ?? true,
          isRecurring: event.isRecurring ?? false,
          followUpRequired: event.followUpRequired ?? false,
          reminders: event.reminders?.map((r) => ({
            id: r.id,
            type: r.type,
            frequency: r.frequency,
            daysBefore: r.daysBefore,
            enabled: r.enabled ?? true,
          })) ?? [],
          recurrencePattern: event.recurrencePattern
            ? {
                ...event.recurrencePattern,
                endDate: event.recurrencePattern.endDate?.toISOString().split('T')[0],
              }
            : undefined,
        }
      : {
          scope: 'national',
          type: 'other',
          status: 'scheduled',
          priority: 'medium',
          allDay: true,
          isRecurring: false,
          followUpRequired: false,
        },
  })

  const {
    fields: reminderFields,
    append: appendReminder,
    remove: removeReminder,
  } = useFieldArray({
    control,
    name: 'reminders',
  })

  const selectedScope = watch('scope')
  const isRecurring = watch('isRecurring')
  const allDay = watch('allDay')

  const onSubmit = async (data: CalendarEventFormData) => {
    try {
      const eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        reminders: data.reminders?.map((r) => ({
          id: r.id || crypto.randomUUID(),
          type: r.type,
          frequency: r.frequency,
          daysBefore: r.daysBefore,
          enabled: r.enabled,
        })) || [],
        recurrencePattern: data.isRecurring && data.recurrencePattern
          ? {
              ...data.recurrencePattern,
              endDate: data.recurrencePattern.endDate
                ? new Date(data.recurrencePattern.endDate)
                : undefined,
            }
          : undefined,
        isRecurring: data.isRecurring,
        createdBy: event?.createdBy || user?.id || '',
        programName: programs?.find((p) => p.id === data.programId)?.title,
      }

      if (event) {
        await updateMutation.mutateAsync({ id: event.id, ...eventData })
      } else {
        await createMutation.mutateAsync(eventData)
      }
      onSuccess?.()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleFormError = (validationErrors: FieldErrors<CalendarEventFormData>) => {
    console.error('Form validation errors:', validationErrors)
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: CalendarIcon },
    { id: 'schedule', label: 'Schedule', icon: Clock },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'reminders', label: 'Reminders', icon: Bell },
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
            {event ? 'Edit Calendar Event' : 'Create New Calendar Event'}
          </CardTitle>
          <CardDescription className="text-blue-100">
            {event ? 'Update event information' : 'Enter comprehensive event details'}
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
                    <Label htmlFor="title">Event Title *</Label>
                    <Input id="title" {...register('title')} />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Event Type *</Label>
                    <Select
                      value={watch('type') || ''}
                      onValueChange={(value) => {
                        setValue('type', value as CalendarEventFormData['type'], {
                          shouldValidate: true,
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monitoring_visit">Monitoring Visit</SelectItem>
                        <SelectItem value="grant_reporting_deadline">
                          Grant Reporting Deadline
                        </SelectItem>
                        <SelectItem value="donor_feedback">Donor Feedback</SelectItem>
                        <SelectItem value="monthly_program">Monthly Program</SelectItem>
                        <SelectItem value="weekly_program">Weekly Program</SelectItem>
                        <SelectItem value="birthday">Birthday</SelectItem>
                        <SelectItem value="anniversary">Anniversary</SelectItem>
                        <SelectItem value="official_date">Official Date</SelectItem>
                        <SelectItem value="blp_event"> Event</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-sm text-destructive">{errors.type.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scope">Scope *</Label>
                    <Select
                      value={watch('scope') || ''}
                      onValueChange={(value) => {
                        setValue('scope', value as CalendarEventFormData['scope'], {
                          shouldValidate: true,
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select scope" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="national">National</SelectItem>
                        <SelectItem value="state">State</SelectItem>
                        <SelectItem value="program">Program</SelectItem>
                        <SelectItem value="lga">LGA</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.scope && (
                      <p className="text-sm text-destructive">{errors.scope.message}</p>
                    )}
                  </div>

                  {selectedScope === 'state' && (
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" {...register('state')} />
                    </div>
                  )}

                  {selectedScope === 'program' && (
                    <div className="space-y-2">
                      <Label htmlFor="programId">Program</Label>
                      <Select
                        value={watch('programId') || ''}
                        onValueChange={(value) => setValue('programId', value)}
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
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={watch('status') || ''}
                      onValueChange={(value) => {
                        setValue('status', value as CalendarEventFormData['status'], {
                          shouldValidate: true,
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="postponed">Postponed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Select
                      value={watch('priority') || ''}
                      onValueChange={(value) => {
                        setValue('priority', value as CalendarEventFormData['priority'], {
                          shouldValidate: true,
                        })
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
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    rows={4}
                    placeholder="Enter event description..."
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
                      name="endDate"
                      label="End Date"
                      placeholder="Select end date"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allDay"
                        checked={allDay}
                        onChange={(e) => setValue('allDay', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="allDay">All Day Event</Label>
                    </div>
                  </div>

                  {!allDay && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          {...register('startTime')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input id="endTime" type="time" {...register('endTime')} />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isRecurring"
                        checked={isRecurring}
                        onChange={(e) => setValue('isRecurring', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="isRecurring">Recurring Event</Label>
                    </div>
                  </div>

                  {isRecurring && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="recurrencePattern.frequency">Frequency</Label>
                        <Select
                          value={watch('recurrencePattern.frequency') || ''}
                          onValueChange={(value) =>
                            setValue('recurrencePattern.frequency', value as NonNullable<CalendarEventFormData['recurrencePattern']>['frequency'])
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="recurrencePattern.interval">Interval</Label>
                        <Input
                          id="recurrencePattern.interval"
                          type="number"
                          min="1"
                          {...register('recurrencePattern.interval', {
                            valueAsNumber: true,
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <CustomDatePicker
                          control={control}
                          name="recurrencePattern.endDate"
                          label="Recurrence End Date"
                          placeholder="Select end date"
                        />
                      </div>
                    </>
                  )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="location.address">Address</Label>
                    <Input id="location.address" {...register('location.address')} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location.city">City</Label>
                    <Input id="location.city" {...register('location.city')} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location.state">State</Label>
                    <Input id="location.state" {...register('location.state')} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Reminders Tab */}
            {activeTab === 'reminders' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">Reminders</Label>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() =>
                      appendReminder({
                        type: 'email',
                        frequency: 'none',
                        daysBefore: 1,
                        enabled: true,
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reminder
                  </Button>
                </div>

                {reminderFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Reminder {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeReminder(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={watch(`reminders.${index}.type`)}
                          onValueChange={(value) =>
                            setValue(`reminders.${index}.type`, value as NonNullable<CalendarEventFormData['reminders']>[number]['type'])
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="push">Push Notification</SelectItem>
                            <SelectItem value="in_app">In-App</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Days Before</Label>
                        <Input
                          type="number"
                          min="0"
                          {...register(`reminders.${index}.daysBefore`, {
                            valueAsNumber: true,
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select
                          value={watch(`reminders.${index}.frequency`)}
                          onValueChange={(value) =>
                            setValue(`reminders.${index}.frequency`, value as NonNullable<CalendarEventFormData['reminders']>[number]['frequency'])
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={watch(`reminders.${index}.enabled`)}
                            onChange={(e) =>
                              setValue(`reminders.${index}.enabled`, e.target.checked)
                            }
                            className="rounded"
                          />
                          <Label>Enabled</Label>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {reminderFields.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No reminders configured. Click "Add Reminder" to create one.
                  </div>
                )}
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
                  : event
                    ? 'Update Event'
                    : 'Create Event'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

