import { useMemo } from 'react'
import { useBeneficiaries } from '@/features/beneficiaries/hooks/use-beneficiaries'
import { usePrograms } from '@/features/programs/hooks/use-programs'
import { useDonations, useGrants } from '@/features/donations/hooks/use-donations'
import { usePartners } from '@/features/partners/hooks/use-partners'
import { useCalendarEvents } from '@/features/calendar/hooks/use-calendar-events'
import type { DashboardFilters } from '@/types'
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

export function useDashboardData(filters?: DashboardFilters) {
  const { data: beneficiaries = [], isLoading: beneficiariesLoading } = useBeneficiaries({
    state: filters?.state,
    lga: filters?.lga,
    programId: filters?.programId,
  })

  const { data: programs = [], isLoading: programsLoading } = usePrograms()
  const { data: donations = [], isLoading: donationsLoading } = useDonations()
  const { data: grants = [], isLoading: grantsLoading } = useGrants()
  const { data: partners = [], isLoading: partnersLoading } = usePartners()
  const { data: calendarEvents = [], isLoading: eventsLoading } = useCalendarEvents({
    startDate: filters?.startDate,
    endDate: filters?.endDate,
    state: filters?.state,
  })

  const isLoading =
    beneficiariesLoading ||
    programsLoading ||
    donationsLoading ||
    grantsLoading ||
    partnersLoading ||
    eventsLoading

  // Filter data based on date range
  const filteredDonations = useMemo(() => {
    if (!filters?.startDate && !filters?.endDate) return donations
    return donations.filter((d) => {
      const date = d.donationDate
      if (filters.startDate && date < filters.startDate) return false
      if (filters.endDate && date > filters.endDate) return false
      return true
    })
  }, [donations, filters])

  const filteredPrograms = useMemo(() => {
    if (!filters?.startDate && !filters?.endDate) return programs
    return programs.filter((p) => {
      const startDate = p.startDate
      if (filters.startDate && startDate < filters.startDate) return false
      if (filters.endDate && p.endDate && p.endDate > filters.endDate) return false
      return true
    })
  }, [programs, filters])

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalBeneficiaries = beneficiaries.length
    const activePrograms = programs.filter((p) => p.status === 'active').length
    const totalDonations = filteredDonations.reduce((sum, d) => sum + d.amount, 0)
    const totalGrants = grants.reduce((sum, g) => sum + g.amount, 0)
    const totalFunding = totalDonations + totalGrants
    const activePartners = partners.filter((p) => p.status === 'active').length
    const upcomingEvents = calendarEvents.filter(
      (e) => e.status === 'scheduled' && e.startDate >= new Date()
    ).length

    // Calculate impact metrics
    const programsCompleted = programs.filter((p) => p.status === 'completed').length
    const beneficiariesServed = beneficiaries.filter((b) => b.programParticipations.length > 0).length
    const impactRate =
      totalBeneficiaries > 0 ? (beneficiariesServed / totalBeneficiaries) * 100 : 0

    return {
      totalBeneficiaries,
      activePrograms,
      totalDonations,
      totalGrants,
      totalFunding,
      activePartners,
      upcomingEvents,
      programsCompleted,
      beneficiariesServed,
      impactRate,
    }
  }, [beneficiaries, programs, filteredDonations, grants, partners, calendarEvents])

  // Monthly donations data
  const monthlyDonations = useMemo(() => {
    const months = eachMonthOfInterval({
      start: filters?.startDate || subMonths(new Date(), 11),
      end: filters?.endDate || new Date(),
    })

    return months.map((month) => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      const monthDonations = filteredDonations.filter(
        (d) => d.donationDate >= monthStart && d.donationDate <= monthEnd
      )
      const amount = monthDonations.reduce((sum, d) => sum + d.amount, 0)

      return {
        month: format(month, 'MMM yyyy'),
        monthShort: format(month, 'MMM'),
        amount,
        count: monthDonations.length,
      }
    })
  }, [filteredDonations, filters])

  // Program distribution by type
  const programDistribution = useMemo(() => {
    const distribution: Record<string, number> = {}
    filteredPrograms.forEach((p) => {
      distribution[p.type] = (distribution[p.type] || 0) + 1
    })
    return Object.entries(distribution).map(([type, count]) => ({
      type: type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
      value: count,
    }))
  }, [filteredPrograms])

  // Beneficiaries by state
  const beneficiariesByState = useMemo(() => {
    const byState: Record<string, number> = {}
    beneficiaries.forEach((b) => {
      const state = b.address.state
      byState[state] = (byState[state] || 0) + 1
    })
    return Object.entries(byState)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
  }, [beneficiaries])

  // Programs by state
  const programsByState = useMemo(() => {
    const byState: Record<string, number> = {}
    filteredPrograms.forEach((p) => {
      p.states.forEach((state) => {
        byState[state] = (byState[state] || 0) + 1
      })
    })
    return Object.entries(byState)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
  }, [filteredPrograms])

  // Funding sources breakdown
  const fundingSources = useMemo(() => {
    const donationsAmount = filteredDonations.reduce((sum, d) => sum + d.amount, 0)
    const grantsAmount = grants.reduce((sum, g) => sum + g.amount, 0)
    return [
      { name: 'Donations', value: donationsAmount, color: '#3b82f6' },
      { name: 'Grants', value: grantsAmount, color: '#10b981' },
    ]
  }, [filteredDonations, grants])

  // Impact metrics over time
  const impactOverTime = useMemo(() => {
    const months = eachMonthOfInterval({
      start: filters?.startDate || subMonths(new Date(), 11),
      end: filters?.endDate || new Date(),
    })

    return months.map((month) => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      const monthPrograms = filteredPrograms.filter(
        (p) => p.startDate >= monthStart && (!p.endDate || p.endDate <= monthEnd)
      )
      const monthBeneficiaries = beneficiaries.filter((b) => {
        return b.programParticipations.some((pid) =>
          monthPrograms.some((p) => p.id === pid)
        )
      })

      return {
        month: format(month, 'MMM yyyy'),
        monthShort: format(month, 'MMM'),
        programs: monthPrograms.length,
        beneficiaries: monthBeneficiaries.length,
      }
    })
  }, [filteredPrograms, beneficiaries, filters])

  // Partner categories
  const partnerCategories = useMemo(() => {
    const categories: Record<string, number> = {}
    partners.forEach((p) => {
      categories[p.category] = (categories[p.category] || 0) + 1
    })
    return Object.entries(categories).map(([category, count]) => ({
      category: category.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
    }))
  }, [partners])

  // Recent activity (combining all recent events)
  const recentActivity = useMemo(() => {
    const activities: Array<{
      id: string
      type: 'donation' | 'grant' | 'program' | 'beneficiary' | 'event' | 'partner'
      title: string
      description: string
      timestamp: Date
      icon: string
    }> = []

    // Recent donations
    filteredDonations
      .slice(0, 10)
      .forEach((d) => {
        activities.push({
          id: d.id,
          type: 'donation',
          title: `New Donation: ${formatCurrency(d.amount)}`,
          description: `From ${d.donorName || 'Anonymous'}`,
          timestamp: d.createdAt,
          icon: '💰',
        })
      })

    // Recent grants
    grants.slice(0, 10).forEach((g) => {
      activities.push({
        id: g.id,
        type: 'grant',
        title: `Grant Received: ${formatCurrency(g.amount)}`,
        description: `From ${g.grantor}`,
        timestamp: g.createdAt,
        icon: '🎯',
      })
    })

    // Recent programs
    filteredPrograms.slice(0, 10).forEach((p) => {
      activities.push({
        id: p.id,
        type: 'program',
        title: `Program: ${p.title}`,
        description: `Status: ${p.status}`,
        timestamp: p.createdAt,
        icon: '📋',
      })
    })

    // Recent calendar events
    calendarEvents.slice(0, 10).forEach((e) => {
      activities.push({
        id: e.id,
        type: 'event',
        title: `Event: ${e.title}`,
        description: `Type: ${e.type}`,
        timestamp: e.createdAt,
        icon: '📅',
      })
    })

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 50)
  }, [filteredDonations, grants, filteredPrograms, calendarEvents])

  // Geographic data for map
  const geographicData = useMemo(() => {
    return beneficiaries
      .filter((b) => b.gpsLocation)
      .map((b) => ({
        id: b.id,
        name: `${b.firstName} ${b.lastName}`,
        lat: b.gpsLocation!.latitude,
        lng: b.gpsLocation!.longitude,
        state: b.address.state,
        lga: b.address.lga,
      }))
  }, [beneficiaries])

  return {
    metrics,
    monthlyDonations,
    programDistribution,
    beneficiariesByState,
    programsByState,
    fundingSources,
    impactOverTime,
    partnerCategories,
    recentActivity,
    geographicData,
    rawData: {
      beneficiaries,
      programs: filteredPrograms,
      donations: filteredDonations,
      grants,
      partners,
      calendarEvents,
    },
    isLoading,
  }
}

