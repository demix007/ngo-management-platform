import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/auth-store'
import { AppLayout } from '@/components/layout/app-layout'
import { LoadingSpinner } from '@/components/ui/loading'
import {
  Eye,
  FileDown,
  FileType,
  RefreshCw,
  Users,
  Calendar,
  DollarSign,
  Handshake,
} from 'lucide-react'
import { format } from 'date-fns'
import { useReportData } from '@/features/reports/hooks/use-report-data'
import { ReportFiltersComponent } from '@/features/reports/components/report-filters'
import { ReportPreview } from '@/features/reports/components/report-preview'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { MetricCard } from '@/features/dashboard/components/metric-card'
import type { ReportFilters, ReportFormat } from '@/features/reports/types'
import { usePrograms } from '@/features/programs/hooks/use-programs'

export const Route = createFileRoute('/reports/')({
  beforeLoad: async () => {
    const { isLoading } = useAuthStore.getState()
    if (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    const finalState = useAuthStore.getState()
    if (!finalState.isAuthenticated || !finalState.user) {
      throw redirect({ to: '/login' })
    }
  },
  component: ReportsPage,
})

function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    type: 'comprehensive',
  })
  const [exportFormat, setExportFormat] = useState<ReportFormat>('pdf')
  const [showPreview, setShowPreview] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const { data: programs } = usePrograms()
  const { data, metrics, isLoading } = useReportData(filters)

  const availableStates = useMemo(() => {
    const states = new Set<string>()
    data.beneficiaries.forEach((b) => {
      if (b.address.state) states.add(b.address.state)
    })
    data.programs.forEach((p) => {
      p.states?.forEach((s) => states.add(s))
    })
    return Array.from(states).sort()
  }, [data])

  const availableLGAs = useMemo(() => {
    if (!filters.state) return []
    const lgas = new Set<string>()
    data.beneficiaries.forEach((b) => {
      if (b.address.state === filters.state && b.address.lga) {
        lgas.add(b.address.lga)
      }
    })
    return Array.from(lgas).sort()
  }, [data, filters.state])

  const availablePrograms = useMemo(() => {
    return programs?.map((p) => ({ id: p.id, title: p.title })) || []
  }, [programs])

  const handleGenerate = () => {
    setShowPreview(true)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Export will be handled by ReportPreview component
      // This is just to show loading state
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } finally {
      setIsExporting(false)
    }
  }

  const reportTitle = useMemo(() => {
    const typeLabel =
      filters.type.charAt(0).toUpperCase() + filters.type.slice(1)
    const dateRange =
      filters.startDate || filters.endDate
        ? ` (${filters.startDate ? format(filters.startDate, 'MMM dd') : 'Start'} - ${
            filters.endDate ? format(filters.endDate, 'MMM dd, yyyy') : 'End'
          })`
        : ''
    return `${typeLabel} Report${dateRange}`
  }, [filters])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Generate and export comprehensive reports from all modules
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <ReportFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          availableStates={availableStates}
          availableLGAs={availableLGAs}
          availablePrograms={availablePrograms}
        />

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <MetricCard
            title="Total Beneficiaries"
            value={metrics.totalBeneficiaries}
            icon={Users}
            iconBgColor="bg-gradient-to-br from-blue-500 to-blue-600"
            delay={0}
            animated
            note={`Across ${metrics.totalPrograms} programs`}
          />
          <MetricCard
            title="Total Programs"
            value={metrics.totalPrograms}
            icon={Calendar}
            iconBgColor="bg-gradient-to-br from-green-500 to-emerald-600"
            delay={0.1}
            animated
            note={`${Object.keys(metrics.programStatusCounts || {}).reduce((sum, key) => sum + (metrics.programStatusCounts?.[key] || 0), 0)} total programs tracked`}
          />
          <MetricCard
            title="Total Funding"
            value={formatCurrency(metrics.totalFunding)}
            icon={DollarSign}
            iconBgColor="bg-gradient-to-br from-amber-500 to-orange-600"
            delay={0.2}
            animated={false}
            note={`Includes donations and grants`}
          />
          <MetricCard
            title="Total Partners"
            value={metrics.totalPartners}
            icon={Handshake}
            iconBgColor="bg-gradient-to-br from-purple-500 to-purple-600"
            delay={0.3}
            animated
            note={`Active partnerships`}
          />
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-wrap items-center gap-4 p-4 bg-card border rounded-lg"
        >
          <div className="flex items-center gap-2">
            <FileType className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Export Format:</span>
            <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ReportFormat)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="doc">DOC</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1" />

          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview Report
          </Button>

          <Button
            onClick={handleGenerate}
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Generate & Download
              </>
            )}
          </Button>
        </motion.div>

        {/* Report Preview */}
        <AnimatePresence>
          {showPreview && (
            <ReportPreview
              filters={filters}
              data={data}
              metrics={metrics}
              title={reportTitle}
              format={exportFormat}
              onClose={() => setShowPreview(false)}
              onExport={handleExport}
            />
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
