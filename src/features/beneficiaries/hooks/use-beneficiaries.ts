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
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useUIStore } from '@/stores/ui-store'
import type { Beneficiary } from '@/types'

const BENEFICIARIES_COLLECTION = 'beneficiaries'

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

export function useBeneficiaries(filters?: { state?: string; lga?: string; programId?: string }) {
  return useQuery({
    queryKey: ['beneficiaries', filters],
    queryFn: async () => {
      let q = query(collection(db, BENEFICIARIES_COLLECTION), orderBy('createdAt', 'desc'))
      
      if (filters?.state) {
        q = query(q, where('address.state', '==', filters.state))
      }
      if (filters?.lga) {
        q = query(q, where('address.lga', '==', filters.lga))
      }
      if (filters?.programId) {
        q = query(q, where('programParticipations', 'array-contains', filters.programId))
      }

      const snapshot = await getDocs(q)
      const results = snapshot.docs.map((doc) => {
        const data = doc.data()
        try {
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

          const beneficiary: Beneficiary = {
            id: doc.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            middleName: data.middleName,
            dateOfBirth: toDate(data.dateOfBirth) || new Date(),
            gender: (data.gender as 'male' | 'female' | 'other') || 'other',
            phoneNumber: data.phoneNumber,
            email: data.email,
            photos: data.photos || [],
            idDocument: data.idDocument,
            address: data.address || {
              street: '',
              city: '',
              state: '',
              lga: '',
              country: 'Nigeria',
            },
            gpsLocation: data.gpsLocation,
            programParticipations: data.programParticipations || [],
            programsReceived: data.programsReceived?.map((p: any) => ({
              programId: p.programId || '',
              programName: p.programName || '',
              startDate: toDate(p.startDate) || new Date(),
              endDate: toDate(p.endDate),
              amountSpent: p.amountSpent || 0,
              status: p.status || 'ongoing',
            })) || [],
            amountSpent: data.amountSpent || 0,
            medicalBills: data.medicalBills?.map((b: any) => ({
              id: b.id || crypto.randomUUID(),
              description: b.description || '',
              amount: b.amount || 0,
              date: toDate(b.date) || new Date(),
              cleared: b.cleared || false,
              clearedDate: toDate(b.clearedDate),
              documentUrl: b.documentUrl,
            })) || [],
            bailBills: data.bailBills?.map((b: any) => ({
              id: b.id || crypto.randomUUID(),
              description: b.description || '',
              amount: b.amount || 0,
              date: toDate(b.date) || new Date(),
              cleared: b.cleared || false,
              clearedDate: toDate(b.clearedDate),
              documentUrl: b.documentUrl,
            })) || [],
            followUpReports: data.followUpReports?.map((r: any) => ({
              id: r.id || crypto.randomUUID(),
              date: toDate(r.date) || new Date(),
              reporter: r.reporter || '',
              report: r.report || '',
              status: r.status || 'positive',
              nextFollowUpDate: toDate(r.nextFollowUpDate),
            })) || [],
            impactNotes: data.impactNotes,
            reintegrationSuccessScore: data.reintegrationSuccessScore,
            reintegrationDetails: data.reintegrationDetails ? {
              dateCompleted: toDate(data.reintegrationDetails.dateCompleted),
              employmentStatus: data.reintegrationDetails.employmentStatus,
              housingStatus: data.reintegrationDetails.housingStatus,
              familyReunited: data.reintegrationDetails.familyReunited,
              communitySupport: data.reintegrationDetails.communitySupport,
            } : undefined,
            impactMetrics: {
              programsCompleted: data.impactMetrics?.programsCompleted || 0,
              totalBenefitAmount: data.impactMetrics?.totalBenefitAmount || 0,
              lastProgramDate: toDate(data.impactMetrics?.lastProgramDate),
            },
            status: (data.status as 'active' | 'inactive' | 'archived') || 'active',
            createdBy: data.createdBy || '',
            createdAt: toDate(data.createdAt) || new Date(),
            updatedAt: toDate(data.updatedAt) || new Date(),
            notes: data.notes,
          }
          return beneficiary
        } catch (error) {
          console.error(`Error converting beneficiary ${doc.id}:`, error, data)
          throw error
        }
      })
      console.log(`Fetched ${results.length} beneficiaries from Firestore`)
      return results
    },
  })
}

export function useBeneficiary(id: string) {
  return useQuery({
    queryKey: ['beneficiary', id],
    queryFn: async () => {
      const docRef = doc(db, BENEFICIARIES_COLLECTION, id)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) {
        throw new Error('Beneficiary not found')
      }
      const data = docSnap.data()
      try {
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

        const beneficiary: Beneficiary = {
          id: docSnap.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          middleName: data.middleName,
          dateOfBirth: toDate(data.dateOfBirth) || new Date(),
          gender: (data.gender as 'male' | 'female' | 'other') || 'other',
          phoneNumber: data.phoneNumber,
          email: data.email,
          photos: data.photos || [],
          idDocument: data.idDocument,
          address: data.address || {
            street: '',
            city: '',
            state: '',
            lga: '',
            country: 'Nigeria',
          },
          gpsLocation: data.gpsLocation,
          programParticipations: data.programParticipations || [],
          programsReceived: data.programsReceived?.map((p: any) => ({
            programId: p.programId || '',
            programName: p.programName || '',
            startDate: toDate(p.startDate) || new Date(),
            endDate: toDate(p.endDate),
            amountSpent: p.amountSpent || 0,
            status: p.status || 'ongoing',
          })) || [],
          amountSpent: data.amountSpent || 0,
          medicalBills: data.medicalBills?.map((b: any) => ({
            id: b.id || crypto.randomUUID(),
            description: b.description || '',
            amount: b.amount || 0,
            date: toDate(b.date) || new Date(),
            cleared: b.cleared || false,
            clearedDate: toDate(b.clearedDate),
            documentUrl: b.documentUrl,
          })) || [],
          bailBills: data.bailBills?.map((b: any) => ({
            id: b.id || crypto.randomUUID(),
            description: b.description || '',
            amount: b.amount || 0,
            date: toDate(b.date) || new Date(),
            cleared: b.cleared || false,
            clearedDate: toDate(b.clearedDate),
            documentUrl: b.documentUrl,
          })) || [],
          followUpReports: data.followUpReports?.map((r: any) => ({
            id: r.id || crypto.randomUUID(),
            date: toDate(r.date) || new Date(),
            reporter: r.reporter || '',
            report: r.report || '',
            status: r.status || 'positive',
            nextFollowUpDate: toDate(r.nextFollowUpDate),
          })) || [],
          impactNotes: data.impactNotes,
          reintegrationSuccessScore: data.reintegrationSuccessScore,
          reintegrationDetails: data.reintegrationDetails ? {
            dateCompleted: toDate(data.reintegrationDetails.dateCompleted),
            employmentStatus: data.reintegrationDetails.employmentStatus,
            housingStatus: data.reintegrationDetails.housingStatus,
            familyReunited: data.reintegrationDetails.familyReunited,
            communitySupport: data.reintegrationDetails.communitySupport,
          } : undefined,
          impactMetrics: {
            programsCompleted: data.impactMetrics?.programsCompleted || 0,
            totalBenefitAmount: data.impactMetrics?.totalBenefitAmount || 0,
            lastProgramDate: toDate(data.impactMetrics?.lastProgramDate),
          },
          status: (data.status as 'active' | 'inactive' | 'archived') || 'active',
          createdBy: data.createdBy || '',
          createdAt: toDate(data.createdAt) || new Date(),
          updatedAt: toDate(data.updatedAt) || new Date(),
          notes: data.notes,
        }
        console.log(`Fetched beneficiary ${docSnap.id}:`, beneficiary)
        return beneficiary
      } catch (error) {
        console.error(`Error converting beneficiary ${docSnap.id}:`, error, data)
        throw error
      }
    },
    enabled: !!id,
  })
}

export function useCreateBeneficiary() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (beneficiary: Omit<Beneficiary, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docData: Record<string, unknown> = {
        ...beneficiary,
        dateOfBirth: Timestamp.fromDate(beneficiary.dateOfBirth),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      // Convert date fields to timestamps
      if (beneficiary.programsReceived) {
        docData.programsReceived = beneficiary.programsReceived.map(p => ({
          ...p,
          startDate: Timestamp.fromDate(p.startDate),
          endDate: p.endDate ? Timestamp.fromDate(p.endDate) : null,
        }))
      }
      if (beneficiary.medicalBills) {
        docData.medicalBills = beneficiary.medicalBills.map(b => ({
          ...b,
          date: Timestamp.fromDate(b.date),
          clearedDate: b.clearedDate ? Timestamp.fromDate(b.clearedDate) : null,
        }))
      }
      if (beneficiary.bailBills) {
        docData.bailBills = beneficiary.bailBills.map(b => ({
          ...b,
          date: Timestamp.fromDate(b.date),
          clearedDate: b.clearedDate ? Timestamp.fromDate(b.clearedDate) : null,
        }))
      }
      if (beneficiary.followUpReports) {
        docData.followUpReports = beneficiary.followUpReports.map(r => ({
          ...r,
          date: Timestamp.fromDate(r.date),
          nextFollowUpDate: r.nextFollowUpDate ? Timestamp.fromDate(r.nextFollowUpDate) : null,
        }))
      }
      if (beneficiary.reintegrationDetails) {
        docData.reintegrationDetails = {
          ...beneficiary.reintegrationDetails,
          dateCompleted: beneficiary.reintegrationDetails.dateCompleted
            ? Timestamp.fromDate(beneficiary.reintegrationDetails.dateCompleted)
            : null,
        }
      }
      if (beneficiary.impactMetrics) {
        docData.impactMetrics = {
          ...beneficiary.impactMetrics,
          lastProgramDate: beneficiary.impactMetrics.lastProgramDate
            ? Timestamp.fromDate(beneficiary.impactMetrics.lastProgramDate)
            : null,
        }
      }

      // Remove all undefined values before sending to Firestore
      const cleanedData = removeUndefinedValues(docData)

      const docRef = await addDoc(collection(db, BENEFICIARIES_COLLECTION), cleanedData)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] })
      addNotification({ type: 'success', message: 'Beneficiary created successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create beneficiary',
      })
    },
  })
}

export function useUpdateBeneficiary() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Beneficiary> & { id: string }) => {
      const docRef = doc(db, BENEFICIARIES_COLLECTION, id)
      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: Timestamp.now(),
      }
      
      if (updates.dateOfBirth) {
        updateData.dateOfBirth = Timestamp.fromDate(updates.dateOfBirth)
      }
      if (updates.programsReceived) {
        updateData.programsReceived = updates.programsReceived.map(p => ({
          ...p,
          startDate: Timestamp.fromDate(p.startDate),
          endDate: p.endDate ? Timestamp.fromDate(p.endDate) : null,
        }))
      }
      if (updates.medicalBills) {
        updateData.medicalBills = updates.medicalBills.map(b => ({
          ...b,
          date: Timestamp.fromDate(b.date),
          clearedDate: b.clearedDate ? Timestamp.fromDate(b.clearedDate) : null,
        }))
      }
      if (updates.bailBills) {
        updateData.bailBills = updates.bailBills.map(b => ({
          ...b,
          date: Timestamp.fromDate(b.date),
          clearedDate: b.clearedDate ? Timestamp.fromDate(b.clearedDate) : null,
        }))
      }
      if (updates.followUpReports) {
        updateData.followUpReports = updates.followUpReports.map(r => ({
          ...r,
          date: Timestamp.fromDate(r.date),
          nextFollowUpDate: r.nextFollowUpDate ? Timestamp.fromDate(r.nextFollowUpDate) : null,
        }))
      }
      if (updates.reintegrationDetails) {
        updateData.reintegrationDetails = {
          ...updates.reintegrationDetails,
          dateCompleted: updates.reintegrationDetails.dateCompleted
            ? Timestamp.fromDate(updates.reintegrationDetails.dateCompleted)
            : null,
        }
      }
      if (updates.impactMetrics) {
        if (updates.impactMetrics.lastProgramDate) {
          updateData.impactMetrics = {
            ...updates.impactMetrics,
            lastProgramDate: Timestamp.fromDate(updates.impactMetrics.lastProgramDate),
          }
        } else {
          updateData.impactMetrics = {
            ...updates.impactMetrics,
            lastProgramDate: null,
          }
        }
      }

      // Remove all undefined values before sending to Firestore
      const cleanedData = removeUndefinedValues(updateData)

      await updateDoc(docRef, cleanedData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] })
      queryClient.invalidateQueries({ queryKey: ['beneficiary', variables.id] })
      addNotification({ type: 'success', message: 'Beneficiary updated successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update beneficiary',
      })
    },
  })
}

export function useDeleteBeneficiary() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, BENEFICIARIES_COLLECTION, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] })
      addNotification({ type: 'success', message: 'Beneficiary deleted successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete beneficiary',
      })
    },
  })
}

