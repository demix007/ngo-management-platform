import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useUIStore } from '@/stores/ui-store'
import type { CalendarEvent } from '@/types'

const CALENDAR_EVENTS_COLLECTION = 'calendarEvents'

// Helper to safely convert Firestore Timestamp to Date
const toDate = (value: any): Date | undefined => {
  if (!value) return undefined
  if (value.toDate && typeof value.toDate === 'function') {
    return value.toDate()
  }
  if (value instanceof Date) {
    return value
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value)
  }
  return undefined
}

// Helper function to remove undefined values from objects
function removeUndefinedValues<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item)) as T
  }
  
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value)
      }
    }
    return cleaned as T
  }
  
  return obj
}

const convertCalendarEventFromFirestore = (data: any, id: string): CalendarEvent => {
  try {
    const event: CalendarEvent = {
      id,
      title: data.title || '',
      description: data.description,
      type: (data.type as CalendarEvent['type']) || 'other',
      scope: (data.scope as CalendarEvent['scope']) || 'national',
      startDate: toDate(data.startDate) || new Date(),
      endDate: toDate(data.endDate),
      allDay: data.allDay ?? true,
      startTime: data.startTime,
      endTime: data.endTime,
      timezone: data.timezone,
      state: data.state,
      lga: data.lga,
      programId: data.programId,
      programName: data.programName,
      location: data.location,
      reminders: (data.reminders || []).map((r: any) => ({
        ...r,
        lastSent: toDate(r.lastSent),
        nextSend: toDate(r.nextSend),
      })),
      isRecurring: data.isRecurring ?? false,
      recurrencePattern: data.recurrencePattern
        ? {
            ...data.recurrencePattern,
            endDate: toDate(data.recurrencePattern.endDate),
          }
        : undefined,
      attendees: data.attendees || [],
      assignedTo: data.assignedTo || [],
      assignedToNames: data.assignedToNames || [],
      relatedBeneficiaryIds: data.relatedBeneficiaryIds || [],
      relatedPartnerIds: data.relatedPartnerIds || [],
      relatedGrantIds: data.relatedGrantIds || [],
      relatedDonationIds: data.relatedDonationIds || [],
      status: (data.status as CalendarEvent['status']) || 'scheduled',
      priority: (data.priority as CalendarEvent['priority']) || 'medium',
      color: data.color,
      tags: data.tags || [],
      attachments: (data.attachments || []).map((a: any) => ({
        ...a,
        uploadedAt: toDate(a.uploadedAt) || new Date(),
      })),
      notes: data.notes,
      followUpRequired: data.followUpRequired ?? false,
      followUpDate: toDate(data.followUpDate),
      followUpNotes: data.followUpNotes,
      createdBy: data.createdBy || '',
      createdAt: toDate(data.createdAt) || new Date(),
      updatedAt: toDate(data.updatedAt) || new Date(),
      lastReminderSent: toDate(data.lastReminderSent),
    }
    return event
  } catch (error) {
    console.error('Error converting calendar event from Firestore:', error)
    throw error
  }
}

export function useCalendarEvents(filters?: {
  state?: string
  programId?: string
  type?: CalendarEvent['type']
  scope?: CalendarEvent['scope']
  startDate?: Date
  endDate?: Date
  status?: CalendarEvent['status']
}) {
  return useQuery({
    queryKey: ['calendarEvents', filters],
    queryFn: async () => {
      let q = query(
        collection(db, CALENDAR_EVENTS_COLLECTION),
        orderBy('startDate', 'asc')
      )

      if (filters?.state) {
        q = query(q, where('state', '==', filters.state))
      }
      if (filters?.programId) {
        q = query(q, where('programId', '==', filters.programId))
      }
      if (filters?.type) {
        q = query(q, where('type', '==', filters.type))
      }
      if (filters?.scope) {
        q = query(q, where('scope', '==', filters.scope))
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status))
      }
      if (filters?.startDate) {
        q = query(q, where('startDate', '>=', Timestamp.fromDate(filters.startDate)))
      }
      if (filters?.endDate) {
        q = query(q, where('startDate', '<=', Timestamp.fromDate(filters.endDate)))
      }

      const snapshot = await getDocs(q)
      const results = snapshot.docs.map((doc) =>
        convertCalendarEventFromFirestore(doc.data(), doc.id)
      )

      return results
    },
  })
}

export function useCalendarEvent(id: string) {
  return useQuery({
    queryKey: ['calendarEvent', id],
    queryFn: async () => {
      const docRef = doc(db, CALENDAR_EVENTS_COLLECTION, id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error('Calendar event not found')
      }

      return convertCalendarEventFromFirestore(docSnap.data(), docSnap.id)
    },
    enabled: !!id,
  })
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
      const cleanedData = removeUndefinedValues({
        ...data,
        startDate: Timestamp.fromDate(data.startDate),
        endDate: data.endDate ? Timestamp.fromDate(data.endDate) : undefined,
        followUpDate: data.followUpDate ? Timestamp.fromDate(data.followUpDate) : undefined,
        lastReminderSent: data.lastReminderSent ? Timestamp.fromDate(data.lastReminderSent) : undefined,
        reminders: data.reminders.map((r) => ({
          ...r,
          lastSent: r.lastSent ? Timestamp.fromDate(r.lastSent) : undefined,
          nextSend: r.nextSend ? Timestamp.fromDate(r.nextSend) : undefined,
        })),
        recurrencePattern: data.recurrencePattern
          ? {
              ...data.recurrencePattern,
              endDate: data.recurrencePattern.endDate
                ? Timestamp.fromDate(data.recurrencePattern.endDate)
                : undefined,
            }
          : undefined,
        attachments: data.attachments?.map((a) => ({
          ...a,
          uploadedAt: Timestamp.fromDate(a.uploadedAt),
        })),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      const docRef = await addDoc(collection(db, CALENDAR_EVENTS_COLLECTION), cleanedData)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
      addNotification({ type: 'success', message: 'Calendar event created successfully' })
    },
    onError: (error) => {
      console.error('Error creating calendar event:', error)
      addNotification({ type: 'error', message: 'Failed to create calendar event' })
    },
  })
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>> & { id: string }) => {
      const cleanedData = removeUndefinedValues({
        ...data,
        startDate: data.startDate ? Timestamp.fromDate(data.startDate) : undefined,
        endDate: data.endDate ? Timestamp.fromDate(data.endDate) : undefined,
        followUpDate: data.followUpDate ? Timestamp.fromDate(data.followUpDate) : undefined,
        lastReminderSent: data.lastReminderSent
          ? Timestamp.fromDate(data.lastReminderSent)
          : undefined,
        reminders: data.reminders?.map((r) => ({
          ...r,
          lastSent: r.lastSent ? Timestamp.fromDate(r.lastSent) : undefined,
          nextSend: r.nextSend ? Timestamp.fromDate(r.nextSend) : undefined,
        })),
        recurrencePattern: data.recurrencePattern
          ? {
              ...data.recurrencePattern,
              endDate: data.recurrencePattern.endDate
                ? Timestamp.fromDate(data.recurrencePattern.endDate)
                : undefined,
            }
          : undefined,
        attachments: data.attachments?.map((a) => ({
          ...a,
          uploadedAt: Timestamp.fromDate(a.uploadedAt),
        })),
        updatedAt: Timestamp.now(),
      })

      const docRef = doc(db, CALENDAR_EVENTS_COLLECTION, id)
      await updateDoc(docRef, cleanedData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
      queryClient.invalidateQueries({ queryKey: ['calendarEvent', variables.id] })
      addNotification({ type: 'success', message: 'Calendar event updated successfully' })
    },
    onError: (error) => {
      console.error('Error updating calendar event:', error)
      addNotification({ type: 'error', message: 'Failed to update calendar event' })
    },
  })
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (id: string) => {
      const docRef = doc(db, CALENDAR_EVENTS_COLLECTION, id)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
      addNotification({ type: 'success', message: 'Calendar event deleted successfully' })
    },
    onError: (error) => {
      console.error('Error deleting calendar event:', error)
      addNotification({ type: 'error', message: 'Failed to delete calendar event' })
    },
  })
}

