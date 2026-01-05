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
import type { Partner } from '@/types'

const PARTNERS_COLLECTION = 'partners'

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

const convertPartnerFromFirestore = (data: any, id: string): Partner => {
  try {
    const partner: Partner = {
      id,
      name: data.name || '',
      category: (data.category as Partner['category']) || 'private',
      focalPerson: {
        name: data.focalPerson?.name || '',
        title: data.focalPerson?.title,
        email: data.focalPerson?.email || '',
        phoneNumber: data.focalPerson?.phoneNumber,
      },
      contactDetails: {
        email: data.contactDetails?.email || '',
        phoneNumber: data.contactDetails?.phoneNumber,
        alternatePhone: data.contactDetails?.alternatePhone,
        website: data.contactDetails?.website,
      },
      address: {
        street: data.address?.street,
        city: data.address?.city || '',
        state: data.address?.state || '',
        lga: data.address?.lga,
        country: data.address?.country || 'Nigeria',
        postalCode: data.address?.postalCode,
      },
      mouDocuments: data.mouDocuments?.map((doc: any) => ({
        id: doc.id || crypto.randomUUID(),
        title: doc.title || '',
        documentUrl: doc.documentUrl || '',
        signedDate: toDate(doc.signedDate),
        expiryDate: toDate(doc.expiryDate),
        status: (doc.status as 'draft' | 'signed' | 'expired' | 'renewed') || 'draft',
        uploadedAt: toDate(doc.uploadedAt) || new Date(),
      })) || [],
      programsPartneredOn: data.programsPartneredOn || [],
      programNames: data.programNames,
      status: (data.status as Partner['status']) || 'active',
      relationshipRating: data.relationshipRating as Partner['relationshipRating'],
      remarks: data.remarks,
      createdBy: data.createdBy || '',
      createdAt: toDate(data.createdAt) || new Date(),
      updatedAt: toDate(data.updatedAt) || new Date(),
    }
    return partner
  } catch (error) {
    console.error(`Error converting partner ${id}:`, error, data)
    throw error
  }
}

export function usePartners(filters?: { 
  category?: Partner['category']
  status?: Partner['status']
  searchQuery?: string
}) {
  return useQuery({
    queryKey: ['partners', filters],
    queryFn: async () => {
      let q = query(collection(db, PARTNERS_COLLECTION), orderBy('createdAt', 'desc'))

      if (filters?.category) {
        q = query(q, where('category', '==', filters.category))
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status))
      }

      const snapshot = await getDocs(q)
      let results = snapshot.docs.map((doc) => convertPartnerFromFirestore(doc.data(), doc.id))
      
      // Client-side search filtering
      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        results = results.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.focalPerson.name.toLowerCase().includes(query) ||
            p.contactDetails.email.toLowerCase().includes(query) ||
            p.address.city.toLowerCase().includes(query) ||
            p.address.state.toLowerCase().includes(query)
        )
      }
      
      console.log(`Fetched ${results.length} partners from Firestore`)
      return results
    },
  })
}

export function usePartner(id: string) {
  return useQuery({
    queryKey: ['partner', id],
    queryFn: async () => {
      const docRef = doc(db, PARTNERS_COLLECTION, id)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) {
        throw new Error('Partner not found')
      }
      const partner = convertPartnerFromFirestore(docSnap.data(), docSnap.id)
      console.log(`Fetched partner ${docSnap.id}:`, partner)
      return partner
    },
    enabled: !!id,
  })
}

export function useCreatePartner() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (partner: Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docData: Record<string, unknown> = {
        ...partner,
        mouDocuments: partner.mouDocuments?.map(doc => ({
          ...doc,
          signedDate: doc.signedDate ? Timestamp.fromDate(doc.signedDate) : null,
          expiryDate: doc.expiryDate ? Timestamp.fromDate(doc.expiryDate) : null,
          uploadedAt: Timestamp.fromDate(doc.uploadedAt),
        })) || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      const cleanedData = removeUndefinedValues(docData)
      const docRef = await addDoc(collection(db, PARTNERS_COLLECTION), cleanedData)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] })
      addNotification({ type: 'success', message: 'Partner created successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create partner',
      })
    },
  })
}

export function useUpdatePartner() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Partner> & { id: string }) => {
      const docRef = doc(db, PARTNERS_COLLECTION, id)
      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: Timestamp.now(),
      }

      if (updates.mouDocuments) {
        updateData.mouDocuments = updates.mouDocuments.map(doc => ({
          ...doc,
          signedDate: doc.signedDate ? Timestamp.fromDate(doc.signedDate) : null,
          expiryDate: doc.expiryDate ? Timestamp.fromDate(doc.expiryDate) : null,
          uploadedAt: Timestamp.fromDate(doc.uploadedAt),
        }))
      }

      const cleanedData = removeUndefinedValues(updateData)
      await updateDoc(docRef, cleanedData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['partners'] })
      queryClient.invalidateQueries({ queryKey: ['partner', variables.id] })
      addNotification({ type: 'success', message: 'Partner updated successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update partner',
      })
    },
  })
}

export function useDeletePartner() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, PARTNERS_COLLECTION, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] })
      addNotification({ type: 'success', message: 'Partner deleted successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete partner',
      })
    },
  })
}

