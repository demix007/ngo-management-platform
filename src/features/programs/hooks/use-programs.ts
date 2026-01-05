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
import type { Program } from '@/types'

const PROGRAMS_COLLECTION = 'programs'

// Helper to safely convert Firestore Timestamp to Date
const toDate = (value: any): Date | undefined => {
  if (!value) return undefined
  
  // Check if it's a Firestore Timestamp instance
  if (value instanceof Timestamp) {
    return value.toDate()
  }
  
  // Check if it has the toDate method (for Timestamp objects)
  if (value.toDate && typeof value.toDate === 'function') {
    return value.toDate()
  }
  
  // Check if it's a plain object with seconds and nanoseconds (Firestore Timestamp structure)
  if (typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
    // Convert seconds and nanoseconds to milliseconds
    const milliseconds = value.seconds * 1000 + (value.nanoseconds || 0) / 1000000
    return new Date(milliseconds)
  }
  
  // Check if it's already a Date
  if (value instanceof Date) {
    return value
  }
  
  // Check if it's a string or number that can be converted
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value)
  }
  
  return undefined
}

const convertProgramFromFirestore = (data: any, id: string): Program => {
  try {
    const program: Program = {
      id,
      title: data.title || '',
      objectives: data.objectives || [],
      description: data.description,
      type: (data.type as Program['type']) || 'other',
      // startDate is required, so if conversion fails, log error but use fallback
      startDate: (() => {
        const converted = toDate(data.startDate)
        if (!converted && data.startDate) {
          console.error('Failed to convert startDate for program', id, data.startDate)
        }
        return converted || new Date() // Fallback to today only if conversion fails
      })(),
      endDate: toDate(data.endDate), // endDate can be undefined, which is fine
      states: data.states || [],
      lgas: data.lgas || [],
      location: data.location,
      partners: data.partners || [],
      partnerNames: data.partnerNames,
      targetBeneficiaries: data.targetBeneficiaries || 0,
      actualBeneficiaries: data.actualBeneficiaries || 0,
      beneficiaryIds: data.beneficiaryIds || [],
      budget: data.budget || {
        allocated: 0,
        spent: 0,
        currency: 'NGN',
      },
      expenditures: data.expenditures?.map((e: any) => ({
        id: e.id || crypto.randomUUID(),
        description: e.description || '',
        amount: e.amount || 0,
        date: toDate(e.date) || new Date(),
        category: (e.category as 'personnel' | 'equipment' | 'transport' | 'venue' | 'materials' | 'other') || 'other',
        receiptUrl: e.receiptUrl,
      })) || [],
      media: data.media?.map((m: any) => ({
        id: m.id || crypto.randomUUID(),
        type: (m.type as 'photo' | 'video' | 'document') || 'photo',
        url: m.url || '',
        caption: m.caption,
        uploadedAt: toDate(m.uploadedAt) || new Date(),
      })) || [],
      documentation: data.documentation?.map((d: any) => ({
        id: d.id || crypto.randomUUID(),
        title: d.title || '',
        type: (d.type as 'report' | 'proposal' | 'agreement' | 'other') || 'other',
        url: d.url || '',
        uploadedAt: toDate(d.uploadedAt) || new Date(),
      })) || [],
      monitoringReports: data.monitoringReports?.map((r: any) => ({
        id: r.id || crypto.randomUUID(),
        title: r.title || '',
        reportDate: toDate(r.reportDate) || new Date(),
        reporter: r.reporter || '',
        content: r.content || '',
        metrics: r.metrics || {},
        attachments: r.attachments || [],
      })) || [],
      evaluationReports: data.evaluationReports?.map((r: any) => ({
        id: r.id || crypto.randomUUID(),
        title: r.title || '',
        reportDate: toDate(r.reportDate) || new Date(),
        evaluator: r.evaluator || '',
        content: r.content || '',
        findings: r.findings || [],
        recommendations: r.recommendations || [],
        attachments: r.attachments || [],
      })) || [],
      impactScore: data.impactScore,
      impactMetrics: data.impactMetrics ? {
        beneficiariesReached: data.impactMetrics.beneficiariesReached || 0,
        objectivesAchieved: data.impactMetrics.objectivesAchieved || 0,
        totalObjectives: data.impactMetrics.totalObjectives || 0,
        satisfactionScore: data.impactMetrics.satisfactionScore,
        outcomes: data.impactMetrics.outcomes || [],
      } : undefined,
      status: (data.status as Program['status']) || 'planning',
      createdBy: data.createdBy || '',
      createdAt: toDate(data.createdAt) || new Date(),
      updatedAt: toDate(data.updatedAt) || new Date(),
      metadata: data.metadata,
    }
    return program
  } catch (error) {
    console.error(`Error converting program ${id}:`, error, data)
    throw error
  }
}

export function usePrograms(filters?: { state?: string; type?: string; status?: string }) {
  return useQuery({
    queryKey: ['programs', filters],
    queryFn: async () => {
      let q = query(collection(db, PROGRAMS_COLLECTION), orderBy('createdAt', 'desc'))

      if (filters?.state) {
        q = query(q, where('states', 'array-contains', filters.state))
      }
      if (filters?.type) {
        q = query(q, where('type', '==', filters.type))
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status))
      }

      const snapshot = await getDocs(q)
      const results = snapshot.docs.map((doc) => convertProgramFromFirestore(doc.data(), doc.id))
      console.log(`Fetched ${results.length} programs from Firestore`)
      return results
    },
  })
}

export function useProgram(id: string) {
  return useQuery({
    queryKey: ['program', id],
    queryFn: async () => {
      const docRef = doc(db, PROGRAMS_COLLECTION, id)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) {
        throw new Error('Program not found')
      }
      const program = convertProgramFromFirestore(docSnap.data(), docSnap.id)
      console.log(`Fetched program ${docSnap.id}:`, program)
      return program
    },
    enabled: !!id,
  })
}

// Helper function to remove undefined values from objects (Firestore doesn't accept undefined)
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

export function useCreateProgram() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docData: Record<string, unknown> = {
        ...program,
        startDate: Timestamp.fromDate(program.startDate),
        endDate: program.endDate ? Timestamp.fromDate(program.endDate) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      // Convert date fields to timestamps
      if (program.expenditures) {
        docData.expenditures = program.expenditures.map(e => ({
          ...e,
          date: Timestamp.fromDate(e.date),
          receiptUrl: e.receiptUrl || null,
        }))
      }
      if (program.media) {
        docData.media = program.media.map(m => ({
          ...m,
          uploadedAt: Timestamp.fromDate(m.uploadedAt),
          caption: m.caption || null,
        }))
      }
      if (program.documentation) {
        docData.documentation = program.documentation.map(d => ({
          ...d,
          uploadedAt: Timestamp.fromDate(d.uploadedAt),
        }))
      }
      if (program.monitoringReports) {
        docData.monitoringReports = program.monitoringReports.map(r => ({
          ...r,
          reportDate: Timestamp.fromDate(r.reportDate),
          metrics: r.metrics || null,
          attachments: r.attachments || null,
        }))
      }
      if (program.evaluationReports) {
        docData.evaluationReports = program.evaluationReports.map(r => ({
          ...r,
          reportDate: Timestamp.fromDate(r.reportDate),
          findings: r.findings || [],
          recommendations: r.recommendations || [],
          attachments: r.attachments || null,
        }))
      }

      // Remove all undefined values before sending to Firestore
      const cleanedData = removeUndefinedValues(docData)

      const docRef = await addDoc(collection(db, PROGRAMS_COLLECTION), cleanedData)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      addNotification({ type: 'success', message: 'Program created successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create program',
      })
    },
  })
}

export function useUpdateProgram() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Program> & { id: string }) => {
      const docRef = doc(db, PROGRAMS_COLLECTION, id)
      const updateData: Record<string, unknown> = {
        updatedAt: Timestamp.now(),
      }

      // Only include fields that are actually being updated (not undefined)
      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.objectives !== undefined) updateData.objectives = updates.objectives
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.type !== undefined) updateData.type = updates.type
      if (updates.status !== undefined) updateData.status = updates.status
      
      // Handle startDate - always include it if it's in the updates (startDate is required)
      if ('startDate' in updates && updates.startDate) {
        updateData.startDate = Timestamp.fromDate(updates.startDate)
      } else if (updates.startDate) {
        // Also check direct property access in case 'in' operator doesn't work
        updateData.startDate = Timestamp.fromDate(updates.startDate)
      }
      // Handle endDate - explicitly check if it's being updated (including clearing it)
      // Use 'endDate' in updates to detect if the field is being updated
      if ('endDate' in updates) {
        if (updates.endDate === null || updates.endDate === undefined) {
          updateData.endDate = null // Explicitly set to null to clear the field in Firestore
        } else {
          updateData.endDate = Timestamp.fromDate(updates.endDate)
        }
      }
      
      if (updates.states !== undefined) updateData.states = updates.states
      if (updates.lgas !== undefined) updateData.lgas = updates.lgas || []
      if (updates.location !== undefined) updateData.location = updates.location
      if (updates.partners !== undefined) updateData.partners = updates.partners || []
      if (updates.partnerNames !== undefined) updateData.partnerNames = updates.partnerNames
      
      if (updates.targetBeneficiaries !== undefined) updateData.targetBeneficiaries = updates.targetBeneficiaries
      if (updates.actualBeneficiaries !== undefined) updateData.actualBeneficiaries = updates.actualBeneficiaries
      if (updates.beneficiaryIds !== undefined) updateData.beneficiaryIds = updates.beneficiaryIds || []
      
      if (updates.budget !== undefined) updateData.budget = updates.budget
      
      if (updates.expenditures !== undefined) {
        updateData.expenditures = updates.expenditures.map(e => ({
          id: e.id || crypto.randomUUID(),
          description: e.description,
          amount: e.amount,
          date: Timestamp.fromDate(e.date),
          category: e.category,
          receiptUrl: e.receiptUrl || null,
        }))
      }
      
      if (updates.media !== undefined) {
        updateData.media = updates.media.map(m => ({
          id: m.id || crypto.randomUUID(),
          type: m.type,
          url: m.url,
          caption: m.caption || null,
          uploadedAt: Timestamp.fromDate(m.uploadedAt),
        }))
      }
      
      if (updates.documentation !== undefined) {
        updateData.documentation = updates.documentation.map(d => ({
          id: d.id || crypto.randomUUID(),
          title: d.title,
          type: d.type,
          url: d.url,
          uploadedAt: Timestamp.fromDate(d.uploadedAt),
        }))
      }
      
      if (updates.monitoringReports !== undefined) {
        updateData.monitoringReports = updates.monitoringReports.map(r => ({
          id: r.id || crypto.randomUUID(),
          title: r.title,
          reportDate: Timestamp.fromDate(r.reportDate),
          reporter: r.reporter,
          content: r.content,
          metrics: r.metrics || null,
          attachments: r.attachments || null,
        }))
      }
      
      if (updates.evaluationReports !== undefined) {
        updateData.evaluationReports = updates.evaluationReports.map(r => ({
          id: r.id || crypto.randomUUID(),
          title: r.title,
          reportDate: Timestamp.fromDate(r.reportDate),
          evaluator: r.evaluator,
          content: r.content,
          findings: r.findings || [],
          recommendations: r.recommendations || [],
          attachments: r.attachments || null,
        }))
      }
      
      if (updates.impactScore !== undefined) updateData.impactScore = updates.impactScore
      if (updates.impactMetrics !== undefined) updateData.impactMetrics = updates.impactMetrics
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata
      if (updates.createdBy !== undefined) updateData.createdBy = updates.createdBy

      // Remove all undefined values before sending to Firestore
      const cleanedData = removeUndefinedValues(updateData)

      await updateDoc(docRef, cleanedData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      queryClient.invalidateQueries({ queryKey: ['program', variables.id] })
      addNotification({ type: 'success', message: 'Program updated successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update program',
      })
    },
  })
}

export function useDeleteProgram() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, PROGRAMS_COLLECTION, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      addNotification({ type: 'success', message: 'Program deleted successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete program',
      })
    },
  })
}

