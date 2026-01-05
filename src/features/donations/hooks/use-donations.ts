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
import type { Donation, Donor, Grant } from '@/types'

const DONATIONS_COLLECTION = 'donations'
const DONORS_COLLECTION = 'donors'
const GRANTS_COLLECTION = 'grants'

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

// ==================== DONATIONS ====================

const convertDonationFromFirestore = (data: any, id: string): Donation => {
  try {
    // Calculate balance remaining
    const totalExpenditures = data.expenditures?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0
    const balanceRemaining = (data.amount || 0) - totalExpenditures

    const donation: Donation = {
      id,
      donorId: data.donorId || '',
      donorName: data.donorName,
      amount: data.amount || 0,
      currency: data.currency || 'NGN',
      donationDate: toDate(data.donationDate) || new Date(),
      paymentMethod: (data.paymentMethod as Donation['paymentMethod']) || 'bank_transfer',
      receiptNumber: data.receiptNumber || '',
      programId: data.programId,
      programName: data.programName,
      expenditures: data.expenditures?.map((e: any) => ({
        id: e.id || crypto.randomUUID(),
        description: e.description || '',
        amount: e.amount || 0,
        date: toDate(e.date) || new Date(),
        programId: e.programId,
        category: (e.category as Donation['expenditures'] extends Array<infer U> ? U : never extends { category: infer C } ? C : never) || 'other',
        receiptUrl: e.receiptUrl,
      })) || [],
      balanceRemaining,
      donorRestrictions: data.donorRestrictions || [],
      donorReporting: data.donorReporting ? {
        lastReportDate: toDate(data.donorReporting.lastReportDate),
        nextReportDue: toDate(data.donorReporting.nextReportDue),
        reportFrequency: data.donorReporting.reportFrequency,
        reports: data.donorReporting.reports?.map((r: any) => ({
          id: r.id || crypto.randomUUID(),
          reportDate: toDate(r.reportDate) || new Date(),
          content: r.content || '',
          attachments: r.attachments || [],
        })) || [],
      } : undefined,
      relatedDonationIds: data.relatedDonationIds || [],
      purpose: data.purpose,
      status: (data.status as Donation['status']) || 'pending',
      notes: data.notes,
      createdBy: data.createdBy || '',
      createdAt: toDate(data.createdAt) || new Date(),
      updatedAt: toDate(data.updatedAt) || new Date(),
    }
    return donation
  } catch (error) {
    console.error(`Error converting donation ${id}:`, error, data)
    throw error
  }
}

export function useDonations(filters?: { donorId?: string; programId?: string; status?: string }) {
  return useQuery({
    queryKey: ['donations', filters],
    queryFn: async () => {
      let q = query(collection(db, DONATIONS_COLLECTION), orderBy('donationDate', 'desc'))

      if (filters?.donorId) {
        q = query(q, where('donorId', '==', filters.donorId))
      }
      if (filters?.programId) {
        q = query(q, where('programId', '==', filters.programId))
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status))
      }

      const snapshot = await getDocs(q)
      const results = snapshot.docs.map((doc) => convertDonationFromFirestore(doc.data(), doc.id))
      console.log(`Fetched ${results.length} donations from Firestore`)
      return results
    },
  })
}

export function useDonation(id: string) {
  return useQuery({
    queryKey: ['donation', id],
    queryFn: async () => {
      const docRef = doc(db, DONATIONS_COLLECTION, id)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) {
        throw new Error('Donation not found')
      }
      const donation = convertDonationFromFirestore(docSnap.data(), docSnap.id)
      console.log(`Fetched donation ${docSnap.id}:`, donation)
      return donation
    },
    enabled: !!id,
  })
}

export function useCreateDonation() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (donation: Omit<Donation, 'id' | 'createdAt' | 'updatedAt' | 'balanceRemaining'>) => {
      // Calculate balance remaining
      const totalExpenditures = donation.expenditures?.reduce((sum, exp) => sum + exp.amount, 0) || 0
      const balanceRemaining = donation.amount - totalExpenditures

      const docData: Record<string, unknown> = {
        ...donation,
        donationDate: Timestamp.fromDate(donation.donationDate),
        balanceRemaining,
        expenditures: donation.expenditures?.map(e => ({
          ...e,
          date: Timestamp.fromDate(e.date),
          receiptUrl: e.receiptUrl || null,
        })) || [],
        donorReporting: donation.donorReporting ? {
          ...donation.donorReporting,
          lastReportDate: donation.donorReporting.lastReportDate ? Timestamp.fromDate(donation.donorReporting.lastReportDate) : null,
          nextReportDue: donation.donorReporting.nextReportDue ? Timestamp.fromDate(donation.donorReporting.nextReportDue) : null,
          reports: donation.donorReporting.reports?.map(r => ({
            ...r,
            reportDate: Timestamp.fromDate(r.reportDate),
            attachments: r.attachments || [],
          })) || [],
        } : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      const cleanedData = removeUndefinedValues(docData)
      const docRef = await addDoc(collection(db, DONATIONS_COLLECTION), cleanedData)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] })
      addNotification({ type: 'success', message: 'Donation recorded successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to record donation',
      })
    },
  })
}

export function useUpdateDonation() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Donation> & { id: string }) => {
      const docRef = doc(db, DONATIONS_COLLECTION, id)
      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: Timestamp.now(),
      }

      if (updates.donationDate) {
        updateData.donationDate = Timestamp.fromDate(updates.donationDate)
      }
      if (updates.expenditures) {
        updateData.expenditures = updates.expenditures.map(e => ({
          ...e,
          date: Timestamp.fromDate(e.date),
          receiptUrl: e.receiptUrl || null,
        }))
        // Recalculate balance
        const totalExpenditures = updates.expenditures.reduce((sum, exp) => sum + exp.amount, 0)
        const currentAmount = updates.amount || 0
        updateData.balanceRemaining = currentAmount - totalExpenditures
      }
      if (updates.amount) {
        // Recalculate balance if amount changed
        const currentExpenditures = updates.expenditures || []
        const totalExpenditures = currentExpenditures.reduce((sum, exp) => sum + exp.amount, 0)
        updateData.balanceRemaining = updates.amount - totalExpenditures
      }
      if (updates.donorReporting) {
        updateData.donorReporting = {
          ...updates.donorReporting,
          lastReportDate: updates.donorReporting.lastReportDate ? Timestamp.fromDate(updates.donorReporting.lastReportDate) : null,
          nextReportDue: updates.donorReporting.nextReportDue ? Timestamp.fromDate(updates.donorReporting.nextReportDue) : null,
          reports: updates.donorReporting.reports?.map(r => ({
            ...r,
            reportDate: Timestamp.fromDate(r.reportDate),
            attachments: r.attachments || [],
          })) || [],
        }
      }

      const cleanedData = removeUndefinedValues(updateData)
      await updateDoc(docRef, cleanedData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['donations'] })
      queryClient.invalidateQueries({ queryKey: ['donation', variables.id] })
      addNotification({ type: 'success', message: 'Donation updated successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update donation',
      })
    },
  })
}

export function useDeleteDonation() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, DONATIONS_COLLECTION, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] })
      addNotification({ type: 'success', message: 'Donation deleted successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete donation',
      })
    },
  })
}

// ==================== DONORS ====================

const convertDonorFromFirestore = (data: any, id: string): Donor => {
  try {
    return {
      id,
      name: data.name || '',
      type: (data.type as Donor['type']) || 'individual',
      email: data.email || '',
      phoneNumber: data.phoneNumber,
      address: data.address,
      contactPerson: data.contactPerson,
      taxId: data.taxId,
      status: (data.status as Donor['status']) || 'active',
      createdAt: toDate(data.createdAt) || new Date(),
      updatedAt: toDate(data.updatedAt) || new Date(),
    }
  } catch (error) {
    console.error(`Error converting donor ${id}:`, error, data)
    throw error
  }
}

export function useDonors() {
  return useQuery({
    queryKey: ['donors'],
    queryFn: async () => {
      const snapshot = await getDocs(query(collection(db, DONORS_COLLECTION), orderBy('createdAt', 'desc')))
      const results = snapshot.docs.map((doc) => convertDonorFromFirestore(doc.data(), doc.id))
      console.log(`Fetched ${results.length} donors from Firestore`)
      return results
    },
  })
}

export function useDonor(id: string) {
  return useQuery({
    queryKey: ['donor', id],
    queryFn: async () => {
      const docRef = doc(db, DONORS_COLLECTION, id)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) {
        throw new Error('Donor not found')
      }
      return convertDonorFromFirestore(docSnap.data(), docSnap.id)
    },
    enabled: !!id,
  })
}

export function useCreateDonor() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (donor: Omit<Donor, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docData = {
        ...donor,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
      const cleanedData = removeUndefinedValues(docData)
      const docRef = await addDoc(collection(db, DONORS_COLLECTION), cleanedData)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] })
      addNotification({ type: 'success', message: 'Donor added successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to add donor',
      })
    },
  })
}

export function useUpdateDonor() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Donor> & { id: string }) => {
      const docRef = doc(db, DONORS_COLLECTION, id)
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      }
      const cleanedData = removeUndefinedValues(updateData)
      await updateDoc(docRef, cleanedData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['donors'] })
      queryClient.invalidateQueries({ queryKey: ['donor', variables.id] })
      addNotification({ type: 'success', message: 'Donor updated successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update donor',
      })
    },
  })
}

export function useDeleteDonor() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, DONORS_COLLECTION, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] })
      addNotification({ type: 'success', message: 'Donor deleted successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete donor',
      })
    },
  })
}

// ==================== GRANTS ====================

const convertGrantFromFirestore = (data: any, id: string): Grant => {
  try {
    const grant: Grant = {
      id,
      grantor: data.grantor || '',
      grantName: data.grantName || '',
      grantorContact: data.grantorContact,
      amount: data.amount || 0,
      currency: data.currency || 'NGN',
      startDate: toDate(data.startDate) || new Date(),
      endDate: toDate(data.endDate) || new Date(),
      purpose: data.purpose || '',
      programIds: data.programIds || [],
      programNames: data.programNames,
      termsAndConditions: data.termsAndConditions,
      conditions: data.conditions || [],
      disbursementSchedule: data.disbursementSchedule?.map((d: any) => ({
        id: d.id || crypto.randomUUID(),
        scheduledDate: toDate(d.scheduledDate) || new Date(),
        amount: d.amount || 0,
        status: (d.status as 'pending' | 'disbursed' | 'overdue') || 'pending',
        actualDisbursementDate: toDate(d.actualDisbursementDate),
        notes: d.notes,
      })) || [],
      milestones: data.milestones?.map((m: any) => ({
        id: m.id || crypto.randomUUID(),
        title: m.title || '',
        description: m.description || '',
        targetDate: toDate(m.targetDate) || new Date(),
        status: (m.status as 'pending' | 'in_progress' | 'completed' | 'overdue') || 'pending',
        completionDate: toDate(m.completionDate),
        deliverables: m.deliverables || [],
      })) || [],
      deliverables: data.deliverables?.map((d: any) => ({
        id: d.id || crypto.randomUUID(),
        title: d.title || '',
        description: d.description || '',
        dueDate: toDate(d.dueDate) || new Date(),
        status: (d.status as 'pending' | 'submitted' | 'approved' | 'rejected') || 'pending',
        submissionDate: toDate(d.submissionDate),
        documentUrl: d.documentUrl,
        notes: d.notes,
      })) || [],
      reportingRequirements: {
        frequency: (data.reportingRequirements?.frequency as Grant['reportingRequirements']['frequency']) || 'quarterly',
        nextReportDue: toDate(data.reportingRequirements?.nextReportDue) || new Date(),
        lastReportDate: toDate(data.reportingRequirements?.lastReportDate),
        reports: data.reportingRequirements?.reports?.map((r: any) => ({
          id: r.id || crypto.randomUUID(),
          reportDate: toDate(r.reportDate) || new Date(),
          reportType: (r.reportType as 'usage' | 'financial' | 'compliance' | 'milestone') || 'usage',
          content: r.content || '',
          attachments: r.attachments || [],
          status: (r.status as 'draft' | 'submitted' | 'approved' | 'rejected') || 'draft',
        })) || [],
      },
      usageReport: data.usageReport ? {
        totalDisbursed: data.usageReport.totalDisbursed || 0,
        totalSpent: data.usageReport.totalSpent || 0,
        balanceRemaining: data.usageReport.balanceRemaining || 0,
        spendingByProgram: data.usageReport.spendingByProgram || {},
        spendingByCategory: data.usageReport.spendingByCategory || {},
        lastUpdated: toDate(data.usageReport.lastUpdated) || new Date(),
      } : undefined,
      complianceTracking: data.complianceTracking ? {
        isCompliant: data.complianceTracking.isCompliant || false,
        complianceIssues: data.complianceTracking.complianceIssues?.map((i: any) => ({
          id: i.id || crypto.randomUUID(),
          issue: i.issue || '',
          severity: (i.severity as 'low' | 'medium' | 'high' | 'critical') || 'low',
          status: (i.status as 'open' | 'resolved') || 'open',
          resolvedDate: toDate(i.resolvedDate),
          notes: i.notes,
        })) || [],
        lastComplianceCheck: toDate(data.complianceTracking.lastComplianceCheck),
      } : undefined,
      status: (data.status as Grant['status']) || 'active',
      createdBy: data.createdBy || '',
      createdAt: toDate(data.createdAt) || new Date(),
      updatedAt: toDate(data.updatedAt) || new Date(),
    }
    return grant
  } catch (error) {
    console.error(`Error converting grant ${id}:`, error, data)
    throw error
  }
}

export function useGrants(filters?: { status?: string; grantor?: string }) {
  return useQuery({
    queryKey: ['grants', filters],
    queryFn: async () => {
      let q = query(collection(db, GRANTS_COLLECTION), orderBy('createdAt', 'desc'))

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status))
      }
      if (filters?.grantor) {
        q = query(q, where('grantor', '==', filters.grantor))
      }

      const snapshot = await getDocs(q)
      const results = snapshot.docs.map((doc) => convertGrantFromFirestore(doc.data(), doc.id))
      console.log(`Fetched ${results.length} grants from Firestore`)
      return results
    },
  })
}

export function useGrant(id: string) {
  return useQuery({
    queryKey: ['grant', id],
    queryFn: async () => {
      const docRef = doc(db, GRANTS_COLLECTION, id)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) {
        throw new Error('Grant not found')
      }
      const grant = convertGrantFromFirestore(docSnap.data(), docSnap.id)
      console.log(`Fetched grant ${docSnap.id}:`, grant)
      return grant
    },
    enabled: !!id,
  })
}

export function useCreateGrant() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (grant: Omit<Grant, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docData: Record<string, unknown> = {
        ...grant,
        startDate: Timestamp.fromDate(grant.startDate),
        endDate: Timestamp.fromDate(grant.endDate),
        disbursementSchedule: grant.disbursementSchedule?.map(d => ({
          ...d,
          scheduledDate: Timestamp.fromDate(d.scheduledDate),
          actualDisbursementDate: d.actualDisbursementDate ? Timestamp.fromDate(d.actualDisbursementDate) : null,
        })) || [],
        milestones: grant.milestones?.map(m => ({
          ...m,
          targetDate: Timestamp.fromDate(m.targetDate),
          completionDate: m.completionDate ? Timestamp.fromDate(m.completionDate) : null,
        })) || [],
        deliverables: grant.deliverables?.map(d => ({
          ...d,
          dueDate: Timestamp.fromDate(d.dueDate),
          submissionDate: d.submissionDate ? Timestamp.fromDate(d.submissionDate) : null,
        })) || [],
        reportingRequirements: {
          ...grant.reportingRequirements,
          nextReportDue: Timestamp.fromDate(grant.reportingRequirements.nextReportDue),
          lastReportDate: grant.reportingRequirements.lastReportDate ? Timestamp.fromDate(grant.reportingRequirements.lastReportDate) : null,
          reports: grant.reportingRequirements.reports?.map(r => ({
            ...r,
            reportDate: Timestamp.fromDate(r.reportDate),
            attachments: r.attachments || [],
          })) || [],
        },
        usageReport: grant.usageReport ? {
          ...grant.usageReport,
          lastUpdated: Timestamp.fromDate(grant.usageReport.lastUpdated),
        } : null,
        complianceTracking: grant.complianceTracking ? {
          ...grant.complianceTracking,
          complianceIssues: grant.complianceTracking.complianceIssues?.map(i => ({
            ...i,
            resolvedDate: i.resolvedDate ? Timestamp.fromDate(i.resolvedDate) : null,
          })) || [],
          lastComplianceCheck: grant.complianceTracking.lastComplianceCheck ? Timestamp.fromDate(grant.complianceTracking.lastComplianceCheck) : null,
        } : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      const cleanedData = removeUndefinedValues(docData)
      const docRef = await addDoc(collection(db, GRANTS_COLLECTION), cleanedData)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grants'] })
      addNotification({ type: 'success', message: 'Grant created successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create grant',
      })
    },
  })
}

export function useUpdateGrant() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Grant> & { id: string }) => {
      const docRef = doc(db, GRANTS_COLLECTION, id)
      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: Timestamp.now(),
      }

      if (updates.startDate) {
        updateData.startDate = Timestamp.fromDate(updates.startDate)
      }
      if (updates.endDate) {
        updateData.endDate = Timestamp.fromDate(updates.endDate)
      }
      if (updates.disbursementSchedule) {
        updateData.disbursementSchedule = updates.disbursementSchedule.map(d => ({
          ...d,
          scheduledDate: Timestamp.fromDate(d.scheduledDate),
          actualDisbursementDate: d.actualDisbursementDate ? Timestamp.fromDate(d.actualDisbursementDate) : null,
        }))
      }
      if (updates.milestones) {
        updateData.milestones = updates.milestones.map(m => ({
          ...m,
          targetDate: Timestamp.fromDate(m.targetDate),
          completionDate: m.completionDate ? Timestamp.fromDate(m.completionDate) : null,
        }))
      }
      if (updates.deliverables) {
        updateData.deliverables = updates.deliverables.map(d => ({
          ...d,
          dueDate: Timestamp.fromDate(d.dueDate),
          submissionDate: d.submissionDate ? Timestamp.fromDate(d.submissionDate) : null,
        }))
      }
      if (updates.reportingRequirements) {
        updateData.reportingRequirements = {
          ...updates.reportingRequirements,
          nextReportDue: Timestamp.fromDate(updates.reportingRequirements.nextReportDue),
          lastReportDate: updates.reportingRequirements.lastReportDate ? Timestamp.fromDate(updates.reportingRequirements.lastReportDate) : null,
          reports: updates.reportingRequirements.reports?.map(r => ({
            ...r,
            reportDate: Timestamp.fromDate(r.reportDate),
            attachments: r.attachments || [],
          })) || [],
        }
      }
      if (updates.usageReport) {
        updateData.usageReport = {
          ...updates.usageReport,
          lastUpdated: Timestamp.fromDate(updates.usageReport.lastUpdated),
        }
      }
      if (updates.complianceTracking) {
        updateData.complianceTracking = {
          ...updates.complianceTracking,
          complianceIssues: updates.complianceTracking.complianceIssues?.map(i => ({
            ...i,
            resolvedDate: i.resolvedDate ? Timestamp.fromDate(i.resolvedDate) : null,
          })) || [],
          lastComplianceCheck: updates.complianceTracking.lastComplianceCheck ? Timestamp.fromDate(updates.complianceTracking.lastComplianceCheck) : null,
        }
      }

      const cleanedData = removeUndefinedValues(updateData)
      await updateDoc(docRef, cleanedData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['grants'] })
      queryClient.invalidateQueries({ queryKey: ['grant', variables.id] })
      addNotification({ type: 'success', message: 'Grant updated successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update grant',
      })
    },
  })
}

export function useDeleteGrant() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, GRANTS_COLLECTION, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grants'] })
      addNotification({ type: 'success', message: 'Grant deleted successfully' })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete grant',
      })
    },
  })
}
