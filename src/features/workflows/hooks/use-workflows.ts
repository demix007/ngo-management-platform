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
import type { Workflow } from '@/types'

const WORKFLOWS_COLLECTION = 'workflows'

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

const convertWorkflowFromFirestore = (data: any, id: string): Workflow => {
  try {
    const workflow: Workflow = {
      id,
      title: data.title || '',
      description: data.description,
      category: (data.category as Workflow['category']) || 'other',
      steps: (data.steps || []).map((s: any) => ({
        ...s,
        dueDate: toDate(s.dueDate),
        completedDate: toDate(s.completedDate),
        attachments: (s.attachments || []).map((a: any) => ({
          ...a,
          uploadedAt: toDate(a.uploadedAt) || new Date(),
        })),
        checklist: (s.checklist || []).map((c: any) => ({
          ...c,
          completedAt: toDate(c.completedAt),
        })),
      })),
      currentStepId: data.currentStepId,
      programId: data.programId,
      programName: data.programName,
      grantId: data.grantId,
      donationId: data.donationId,
      partnerId: data.partnerId,
      beneficiaryId: data.beneficiaryId,
      startDate: toDate(data.startDate) || new Date(),
      targetEndDate: toDate(data.targetEndDate),
      actualEndDate: toDate(data.actualEndDate),
      status: (data.status as Workflow['status']) || 'draft',
      progress: data.progress ?? 0,
      completionPercentage: data.completionPercentage ?? 0,
      assignedTo: data.assignedTo || [],
      assignedToNames: data.assignedToNames || [],
      ownerId: data.ownerId || '',
      ownerName: data.ownerName,
      priority: (data.priority as Workflow['priority']) || 'medium',
      tags: data.tags || [],
      reminders: (data.reminders || []).map((r: any) => ({
        ...r,
        lastSent: toDate(r.lastSent),
      })),
      isTemplate: data.isTemplate ?? false,
      templateId: data.templateId,
      canBeReused: data.canBeReused ?? false,
      attachments: (data.attachments || []).map((a: any) => ({
        ...a,
        uploadedAt: toDate(a.uploadedAt) || new Date(),
      })),
      notes: data.notes,
      history: (data.history || []).map((h: any) => ({
        ...h,
        timestamp: toDate(h.timestamp) || new Date(),
      })),
      createdBy: data.createdBy || '',
      createdAt: toDate(data.createdAt) || new Date(),
      updatedAt: toDate(data.updatedAt) || new Date(),
      completedAt: toDate(data.completedAt),
      cancelledAt: toDate(data.cancelledAt),
      cancelledBy: data.cancelledBy,
      cancelledReason: data.cancelledReason,
    }
    return workflow
  } catch (error) {
    console.error('Error converting workflow from Firestore:', error)
    throw error
  }
}

export function useWorkflows(filters?: {
  category?: Workflow['category']
  status?: Workflow['status']
  programId?: string
  assignedTo?: string
  ownerId?: string
  priority?: Workflow['priority']
}) {
  return useQuery({
    queryKey: ['workflows', filters],
    queryFn: async () => {
      let q = query(
        collection(db, WORKFLOWS_COLLECTION),
        orderBy('createdAt', 'desc')
      )

      if (filters?.category) {
        q = query(q, where('category', '==', filters.category))
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status))
      }
      if (filters?.programId) {
        q = query(q, where('programId', '==', filters.programId))
      }
      if (filters?.assignedTo) {
        q = query(q, where('assignedTo', 'array-contains', filters.assignedTo))
      }
      if (filters?.ownerId) {
        q = query(q, where('ownerId', '==', filters.ownerId))
      }
      if (filters?.priority) {
        q = query(q, where('priority', '==', filters.priority))
      }

      const snapshot = await getDocs(q)
      const results = snapshot.docs.map((doc) =>
        convertWorkflowFromFirestore(doc.data(), doc.id)
      )

      return results
    },
  })
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: ['workflow', id],
    queryFn: async () => {
      const docRef = doc(db, WORKFLOWS_COLLECTION, id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error('Workflow not found')
      }

      return convertWorkflowFromFirestore(docSnap.data(), docSnap.id)
    },
    enabled: !!id,
  })
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (data: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => {
      const cleanedData = removeUndefinedValues({
        ...data,
        steps: data.steps.map((s) => ({
          ...s,
          dueDate: s.dueDate ? Timestamp.fromDate(s.dueDate) : undefined,
          completedDate: s.completedDate ? Timestamp.fromDate(s.completedDate) : undefined,
          attachments: s.attachments?.map((a) => ({
            ...a,
            uploadedAt: Timestamp.fromDate(a.uploadedAt),
          })),
          checklist: s.checklist?.map((c) => ({
            ...c,
            completedAt: c.completedAt ? Timestamp.fromDate(c.completedAt) : undefined,
          })),
        })),
        startDate: Timestamp.fromDate(data.startDate),
        targetEndDate: data.targetEndDate ? Timestamp.fromDate(data.targetEndDate) : undefined,
        actualEndDate: data.actualEndDate ? Timestamp.fromDate(data.actualEndDate) : undefined,
        reminders: data.reminders?.map((r) => ({
          ...r,
          lastSent: r.lastSent ? Timestamp.fromDate(r.lastSent) : undefined,
        })),
        attachments: data.attachments?.map((a) => ({
          ...a,
          uploadedAt: Timestamp.fromDate(a.uploadedAt),
        })),
        history: data.history?.map((h) => ({
          ...h,
          timestamp: Timestamp.fromDate(h.timestamp),
        })),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        completedAt: data.completedAt ? Timestamp.fromDate(data.completedAt) : undefined,
        cancelledAt: data.cancelledAt ? Timestamp.fromDate(data.cancelledAt) : undefined,
      })

      const docRef = await addDoc(collection(db, WORKFLOWS_COLLECTION), cleanedData)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      addNotification({ type: 'success', message: 'Workflow created successfully' })
    },
    onError: (error) => {
      console.error('Error creating workflow:', error)
      addNotification({ type: 'error', message: 'Failed to create workflow' })
    },
  })
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<Omit<Workflow, 'id' | 'createdAt'>> & { id: string }) => {
      const cleanedData = removeUndefinedValues({
        ...data,
        steps: data.steps?.map((s) => ({
          ...s,
          dueDate: s.dueDate ? Timestamp.fromDate(s.dueDate) : undefined,
          completedDate: s.completedDate ? Timestamp.fromDate(s.completedDate) : undefined,
          attachments: s.attachments?.map((a) => ({
            ...a,
            uploadedAt: Timestamp.fromDate(a.uploadedAt),
          })),
          checklist: s.checklist?.map((c) => ({
            ...c,
            completedAt: c.completedAt ? Timestamp.fromDate(c.completedAt) : undefined,
          })),
        })),
        startDate: data.startDate ? Timestamp.fromDate(data.startDate) : undefined,
        targetEndDate: data.targetEndDate ? Timestamp.fromDate(data.targetEndDate) : undefined,
        actualEndDate: data.actualEndDate ? Timestamp.fromDate(data.actualEndDate) : undefined,
        reminders: data.reminders?.map((r) => ({
          ...r,
          lastSent: r.lastSent ? Timestamp.fromDate(r.lastSent) : undefined,
        })),
        attachments: data.attachments?.map((a) => ({
          ...a,
          uploadedAt: Timestamp.fromDate(a.uploadedAt),
        })),
        history: data.history?.map((h) => ({
          ...h,
          timestamp: Timestamp.fromDate(h.timestamp),
        })),
        updatedAt: Timestamp.now(),
        completedAt: data.completedAt ? Timestamp.fromDate(data.completedAt) : undefined,
        cancelledAt: data.cancelledAt ? Timestamp.fromDate(data.cancelledAt) : undefined,
      })

      const docRef = doc(db, WORKFLOWS_COLLECTION, id)
      await updateDoc(docRef, cleanedData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.invalidateQueries({ queryKey: ['workflow', variables.id] })
      addNotification({ type: 'success', message: 'Workflow updated successfully' })
    },
    onError: (error) => {
      console.error('Error updating workflow:', error)
      addNotification({ type: 'error', message: 'Failed to update workflow' })
    },
  })
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (id: string) => {
      const docRef = doc(db, WORKFLOWS_COLLECTION, id)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      addNotification({ type: 'success', message: 'Workflow deleted successfully' })
    },
    onError: (error) => {
      console.error('Error deleting workflow:', error)
      addNotification({ type: 'error', message: 'Failed to delete workflow' })
    },
  })
}

