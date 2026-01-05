import { useMemo } from 'react'
import { useBeneficiaries } from '@/features/beneficiaries/hooks/use-beneficiaries'
import { usePrograms } from '@/features/programs/hooks/use-programs'
import { useDonations, useGrants } from '@/features/donations/hooks/use-donations'
import { usePartners } from '@/features/partners/hooks/use-partners'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { useCalendarEvents } from '@/features/calendar/hooks/use-calendar-events'
import type { ReportFilters } from '../types'
import type { Beneficiary, Program, Donation, Grant, Project, CalendarEvent } from '@/types'

export function useReportData(filters: ReportFilters) {
  // Fetch all relevant data
  const { data: beneficiaries = [], isLoading: beneficiariesLoading } = useBeneficiaries({
    state: filters.state,
    lga: filters.lga,
    programId: filters.programId,
  })

  const { data: programs = [], isLoading: programsLoading } = usePrograms()
  const { data: donations = [], isLoading: donationsLoading } = useDonations()
  const { data: grants = [], isLoading: grantsLoading } = useGrants()
  const { data: partners = [], isLoading: partnersLoading } = usePartners()
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: events = [], isLoading: eventsLoading } = useCalendarEvents({
    startDate: filters.startDate,
    endDate: filters.endDate,
    state: filters.state,
  })

  const isLoading =
    beneficiariesLoading ||
    programsLoading ||
    donationsLoading ||
    grantsLoading ||
    partnersLoading ||
    projectsLoading ||
    eventsLoading

  // Filter data based on date range and other filters
  const filteredBeneficiaries = useMemo(() => {
    let filtered: Beneficiary[] = beneficiaries

    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter((b) => {
        const createdAt = b.createdAt || new Date(0)
        if (filters.startDate && createdAt < filters.startDate) return false
        if (filters.endDate && createdAt > filters.endDate) return false
        return true
      })
    }

    if (filters.status) {
      // Filter by beneficiary status if applicable
    }

    return filtered
  }, [beneficiaries, filters])

  const filteredPrograms = useMemo(() => {
    let filtered: Program[] = programs

    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter((p) => {
        const startDate = p.startDate
        if (filters.startDate && startDate < filters.startDate) return false
        if (filters.endDate && startDate > filters.endDate) return false
        return true
      })
    }

    if (filters.status) {
      filtered = filtered.filter((p) => p.status === filters.status)
    }

    if (filters.programId) {
      filtered = filtered.filter((p) => p.id === filters.programId)
    }

    return filtered
  }, [programs, filters])

  const filteredDonations = useMemo(() => {
    let filtered: Donation[] = donations

    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter((d) => {
        const date = d.donationDate
        if (filters.startDate && date < filters.startDate) return false
        if (filters.endDate && date > filters.endDate) return false
        return true
      })
    }

    if (filters.donorId) {
      filtered = filtered.filter((d) => d.donorId === filters.donorId)
    }

    if (filters.programId) {
      filtered = filtered.filter((d) => d.programId === filters.programId)
    }

    return filtered
  }, [donations, filters])

  const filteredGrants = useMemo(() => {
    let filtered: Grant[] = grants

    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter((g) => {
        const startDate = g.startDate
        if (filters.startDate && startDate < filters.startDate) return false
        if (filters.endDate && startDate > filters.endDate) return false
        return true
      })
    }

    return filtered
  }, [grants, filters])

  const filteredProjects = useMemo(() => {
    let filtered: Project[] = projects

    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter((p) => {
        const startDate = p.timeline?.startDate || new Date(0)
        if (filters.startDate && startDate < filters.startDate) return false
        if (filters.endDate && startDate > filters.endDate) return false
        return true
      })
    }

    if (filters.status) {
      filtered = filtered.filter((p) => p.status === filters.status)
    }

    return filtered
  }, [projects, filters])

  // Calculate aggregated metrics
  const metrics = useMemo(() => {
    const totalBeneficiaries = filteredBeneficiaries.length
    const totalPrograms = filteredPrograms.length
    const totalDonations = filteredDonations.reduce((sum, d) => sum + (d.amount || 0), 0)
    const totalGrants = filteredGrants.reduce((sum, g) => sum + (g.amount || 0), 0)
    const totalFunding = totalDonations + totalGrants
    const totalPartners = partners.length
    const totalProjects = filteredProjects.length

    // Program status distribution
    const programStatusCounts = filteredPrograms.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Beneficiary distribution by state
    const beneficiariesByState = filteredBeneficiaries.reduce((acc, b) => {
      const state = b.address.state || 'Unknown'
      acc[state] = (acc[state] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalBeneficiaries,
      totalPrograms,
      totalDonations,
      totalGrants,
      totalFunding,
      totalPartners,
      totalProjects,
      programStatusCounts,
      beneficiariesByState,
    }
  }, [filteredBeneficiaries, filteredPrograms, filteredDonations, filteredGrants, partners, filteredProjects])

  return {
    data: {
      beneficiaries: filteredBeneficiaries,
      programs: filteredPrograms,
      donations: filteredDonations,
      grants: filteredGrants,
      partners,
      projects: filteredProjects,
      events: events as CalendarEvent[],
    },
    metrics,
    isLoading,
  }
}

