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
import type { Project } from '@/types'

const PROJECTS_COLLECTION = 'projects'

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

const convertProjectFromFirestore = (data: any, id: string): Project => {
  try {
    const project: Project = {
      id,
      name: data.name || '',
      type: (data.type as Project['type']) || 'construction',
      description: data.description,
      objectives: data.objectives || [],
      location: data.location ? {
        address: data.location.address,
        city: data.location.city,
        state: data.location.state,
        lga: data.location.lga,
        country: data.location.country,
        gpsLocation: data.location.gpsLocation,
      } : undefined,
      budget: {
        allocated: data.budget?.allocated || 0,
        spent: data.budget?.spent || 0,
        currency: data.budget?.currency || 'NGN',
        breakdown: data.budget?.breakdown?.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          category: item.category || '',
          amount: item.amount || 0,
          description: item.description,
        })) || [],
      },
      timeline: {
        startDate: toDate(data.timeline?.startDate) || new Date(),
        endDate: toDate(data.timeline?.endDate),
        milestones: data.timeline?.milestones?.map((milestone: any) => ({
          id: milestone.id || crypto.randomUUID(),
          title: milestone.title || '',
          description: milestone.description,
          targetDate: toDate(milestone.targetDate) || new Date(),
          status: (milestone.status as 'pending' | 'in_progress' | 'completed' | 'overdue') || 'pending',
          completionDate: toDate(milestone.completionDate),
        })) || [],
      },
      contractors: data.contractors?.map((contractor: any) => ({
        id: contractor.id || crypto.randomUUID(),
        name: contractor.name || '',
        type: (contractor.type as 'contractor' | 'partner' | 'supplier') || 'contractor',
        contactPerson: contractor.contactPerson,
        email: contractor.email,
        phoneNumber: contractor.phoneNumber,
        contractAmount: contractor.contractAmount,
        contractStartDate: toDate(contractor.contractStartDate),
        contractEndDate: toDate(contractor.contractEndDate),
        status: (contractor.status as 'active' | 'completed' | 'terminated') || 'active',
      })) || [],
      partnerIds: data.partnerIds || [],
      partnerNames: data.partnerNames,
      documents: data.documents?.map((doc: any) => ({
        id: doc.id || crypto.randomUUID(),
        title: doc.title || '',
        type: (doc.type as 'contract' | 'proposal' | 'report' | 'permit' | 'certificate' | 'other') || 'other',
        documentUrl: doc.documentUrl || '',
        uploadedAt: toDate(doc.uploadedAt) || new Date(),
        uploadedBy: doc.uploadedBy,
        description: doc.description,
      })) || [],
      activityLog: data.activityLog?.map((activity: any) => ({
        id: activity.id || crypto.randomUUID(),
        date: toDate(activity.date) || new Date(),
        user: activity.user || '',
        userName: activity.userName,
        action: activity.action || '',
        description: activity.description || '',
        attachments: activity.attachments || [],
      })) || [],
      progress: {
        percentage: data.progress?.percentage || 0,
        lastUpdated: toDate(data.progress?.lastUpdated) || new Date(),
        notes: data.progress?.notes,
      },
      media: data.media?.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        type: (item.type as 'photo' | 'video') || 'photo',
        url: item.url || '',
        caption: item.caption,
        uploadedAt: toDate(item.uploadedAt) || new Date(),
        uploadedBy: item.uploadedBy,
      })) || [],
      completionCertificate: data.completionCertificate ? {
        certificateUrl: data.completionCertificate.certificateUrl || '',
        issuedDate: toDate(data.completionCertificate.issuedDate),
        issuedBy: data.completionCertificate.issuedBy,
        certificateNumber: data.completionCertificate.certificateNumber,
      } : undefined,
      impactSummary: data.impactSummary ? {
        beneficiariesReached: data.impactSummary.beneficiariesReached,
        communitiesImpacted: data.impactSummary.communitiesImpacted,
        outcomes: data.impactSummary.outcomes || [],
        metrics: data.impactSummary.metrics,
        notes: data.impactSummary.notes,
      } : undefined,
      status: (data.status as Project['status']) || 'planning',
      createdBy: data.createdBy || '',
      createdAt: toDate(data.createdAt) || new Date(),
      updatedAt: toDate(data.updatedAt) || new Date(),
      notes: data.notes,
    }
    return project
  } catch (error) {
    console.error(`Error converting project ${id}:`, error, data)
    throw error
  }
}

export function useProjects(filters?: {
  type?: Project['type']
  status?: Project['status']
  searchQuery?: string
}) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      let q = query(collection(db, PROJECTS_COLLECTION), orderBy('createdAt', 'desc'))

      if (filters?.type) {
        q = query(q, where('type', '==', filters.type))
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status))
      }

      const snapshot = await getDocs(q)
      let results = snapshot.docs.map((doc) => convertProjectFromFirestore(doc.data(), doc.id))
      
      // Client-side search filtering
      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        results = results.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query) ||
            p.location?.city?.toLowerCase().includes(query) ||
            p.location?.state?.toLowerCase().includes(query)
        )
      }
      
      console.log(`Fetched ${results.length} projects from Firestore`)
      return results
    },
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const docRef = doc(db, PROJECTS_COLLECTION, id)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) {
        throw new Error('Project not found')
      }
      const project = convertProjectFromFirestore(docSnap.data(), docSnap.id)
      console.log(`Fetched project ${docSnap.id}:`, project)
      return project
    },
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docData: Record<string, unknown> = {
        ...project,
        budget: {
          ...project.budget,
          breakdown: project.budget.breakdown?.map(item => ({
            ...item,
          })) || [],
        },
        timeline: {
          startDate: Timestamp.fromDate(project.timeline.startDate),
          endDate: project.timeline.endDate ? Timestamp.fromDate(project.timeline.endDate) : null,
          milestones: project.timeline.milestones?.map(milestone => ({
            ...milestone,
            targetDate: Timestamp.fromDate(milestone.targetDate),
            completionDate: milestone.completionDate ? Timestamp.fromDate(milestone.completionDate) : null,
          })) || [],
        },
        contractors: project.contractors?.map(contractor => ({
          ...contractor,
          contractStartDate: contractor.contractStartDate ? Timestamp.fromDate(contractor.contractStartDate) : null,
          contractEndDate: contractor.contractEndDate ? Timestamp.fromDate(contractor.contractEndDate) : null,
        })) || [],
        documents: project.documents?.map(doc => ({
          ...doc,
          uploadedAt: Timestamp.fromDate(doc.uploadedAt),
        })) || [],
        activityLog: project.activityLog?.map(activity => ({
          ...activity,
          date: Timestamp.fromDate(activity.date),
        })) || [],
        progress: {
          ...project.progress,
          lastUpdated: Timestamp.fromDate(project.progress.lastUpdated),
        },
        media: project.media?.map(item => ({
          ...item,
          uploadedAt: Timestamp.fromDate(item.uploadedAt),
        })) || [],
        completionCertificate: project.completionCertificate ? {
          ...project.completionCertificate,
          issuedDate: project.completionCertificate.issuedDate ? Timestamp.fromDate(project.completionCertificate.issuedDate) : null,
        } : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      const cleanedData = removeUndefinedValues(docData)
      const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), cleanedData)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      addNotification({ type: 'success', message: 'Project created successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create project',
      })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const docRef = doc(db, PROJECTS_COLLECTION, id)
      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: Timestamp.now(),
      }

      // Convert Date fields to Timestamps
      if (updates.timeline) {
        updateData.timeline = {
          ...updates.timeline,
          startDate: Timestamp.fromDate(updates.timeline.startDate),
          endDate: updates.timeline.endDate ? Timestamp.fromDate(updates.timeline.endDate) : null,
          milestones: updates.timeline.milestones?.map(milestone => ({
            ...milestone,
            targetDate: Timestamp.fromDate(milestone.targetDate),
            completionDate: milestone.completionDate ? Timestamp.fromDate(milestone.completionDate) : null,
          })) || [],
        }
      }

      if (updates.contractors) {
        updateData.contractors = updates.contractors.map(contractor => ({
          ...contractor,
          contractStartDate: contractor.contractStartDate ? Timestamp.fromDate(contractor.contractStartDate) : null,
          contractEndDate: contractor.contractEndDate ? Timestamp.fromDate(contractor.contractEndDate) : null,
        }))
      }

      if (updates.documents) {
        updateData.documents = updates.documents.map(doc => ({
          ...doc,
          uploadedAt: Timestamp.fromDate(doc.uploadedAt),
        }))
      }

      if (updates.activityLog) {
        updateData.activityLog = updates.activityLog.map(activity => ({
          ...activity,
          date: Timestamp.fromDate(activity.date),
        }))
      }

      if (updates.progress) {
        updateData.progress = {
          ...updates.progress,
          lastUpdated: Timestamp.fromDate(updates.progress.lastUpdated),
        }
      }

      if (updates.media) {
        updateData.media = updates.media.map(item => ({
          ...item,
          uploadedAt: Timestamp.fromDate(item.uploadedAt),
        }))
      }

      if (updates.completionCertificate) {
        updateData.completionCertificate = {
          ...updates.completionCertificate,
          issuedDate: updates.completionCertificate.issuedDate ? Timestamp.fromDate(updates.completionCertificate.issuedDate) : null,
        }
      }

      const cleanedData = removeUndefinedValues(updateData)
      await updateDoc(docRef, cleanedData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] })
      addNotification({ type: 'success', message: 'Project updated successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update project',
      })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, PROJECTS_COLLECTION, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      addNotification({ type: 'success', message: 'Project deleted successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete project',
      })
    },
  })
}







