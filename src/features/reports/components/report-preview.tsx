import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  X,
  Download,
  Loader2,
  Users,
  Calendar,
  DollarSign,
  Award,
  TrendingUp,
  MapPin,
  FileText,
  BarChart3,
} from 'lucide-react'
import { formatReportContent } from '../utils/report-formatters'
import { exportReport } from '../utils/export-utils'
import { formatCurrency } from '@/lib/utils'
import { format as formatDate } from 'date-fns'
import { useUIStore } from '@/stores/ui-store'
import { MetricCard } from '@/features/dashboard/components/metric-card'
import type { ReportFilters, ReportFormat } from '../types'
import type { Beneficiary, Program, Donation, Grant } from '@/types'

interface ReportPreviewProps {
  filters: ReportFilters
  data: {
    beneficiaries: unknown[]
    programs: unknown[]
    donations: unknown[]
    grants: unknown[]
    partners: unknown[]
    projects: unknown[]
    events: unknown[]
  }
  metrics: {
    totalBeneficiaries: number
    totalPrograms: number
    totalDonations: number
    totalGrants: number
    totalFunding: number
    totalPartners: number
    totalProjects: number
    programStatusCounts: Record<string, number>
    beneficiariesByState: Record<string, number>
  }
  title: string
  format: ReportFormat
  onClose: () => void
  onExport?: () => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
}

export function ReportPreview({
  filters,
  data,
  metrics,
  title,
  format,
  onClose,
  onExport,
}: ReportPreviewProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { addNotification } = useUIStore()

  const reportContent = useMemo(() => {
    // Flatten the data structure to match what the formatter expects
    const reportData = {
      ...data,
      metrics,
    }
    return formatReportContent(filters.type, reportData as never, filters)
  }, [filters, data, metrics])

  // Type-safe data casting
  const beneficiaries = (data.beneficiaries || []) as Beneficiary[]
  const programs = (data.programs || []) as Program[]
  const donations = (data.donations || []) as Donation[]
  const grants = (data.grants || []) as Grant[]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Convert data to exportable format
      const exportData = convertDataForExport(filters.type, data)

      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate processing

      exportReport(format, title, reportContent, exportData, title.toLowerCase().replace(/\s+/g, '_'))

      addNotification({
        type: 'success',
        message: `Report exported successfully as ${format.toUpperCase()}`,
      })
      
      if (onExport) {
        onExport()
      }
    } catch (error) {
      console.error('Export error:', error)
      addNotification({
        type: 'error',
        message: 'Failed to export report. Please try again.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const renderReportContent = () => {
    switch (filters.type) {
      case 'beneficiaries':
        return <BeneficiariesReportView data={beneficiaries} metrics={metrics} />
      case 'programs':
        return <ProgramsReportView data={programs} metrics={metrics} />
      case 'donations':
        return <DonationsReportView data={donations} metrics={metrics} />
      case 'grants':
        return <GrantsReportView data={grants} metrics={metrics} />
      case 'financial':
        return <FinancialReportView donations={donations} grants={grants} metrics={metrics} />
      case 'impact':
        return <ImpactReportView data={programs} metrics={metrics} />
      case 'comprehensive':
        return (
          <ComprehensiveReportView
            beneficiaries={beneficiaries}
            programs={programs}
            donations={donations}
            grants={grants}
            metrics={metrics}
          />
        )
      default:
        return (
          <ComprehensiveReportView
            beneficiaries={beneficiaries}
            programs={programs}
            donations={donations}
            grants={grants}
            metrics={metrics}
          />
        )
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                {title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Generated on {formatDate(new Date(), 'PPP p')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="gap-2"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Export {format.toUpperCase()}
                    </>
                  )}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={filters.type}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {renderReportContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Beneficiaries Report View
function BeneficiariesReportView({
  data,
  metrics,
}: {
  data: Beneficiary[]
  metrics: ReportPreviewProps['metrics']
}) {
  const displayData = data.slice(0, 50) // Limit for preview

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Total Beneficiaries"
          value={metrics.totalBeneficiaries}
          icon={Users}
          iconBgColor="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0}
          animated
        />
        <MetricCard
          title="States Covered"
          value={Object.keys(metrics.beneficiariesByState || {}).length}
          icon={MapPin}
          iconBgColor="bg-gradient-to-br from-green-500 to-emerald-600"
          delay={0.1}
          animated
        />
        <MetricCard
          title="Avg Programs per Beneficiary"
          value={data.length > 0
            ? parseFloat((data.reduce((sum, b) => sum + (b.programParticipations?.length || 0), 0) / data.length).toFixed(1))
            : 0}
          icon={BarChart3}
          iconBgColor="bg-gradient-to-br from-purple-500 to-purple-600"
          delay={0.2}
          animated
        />
      </div>

      {/* Distribution by State */}
      {Object.keys(metrics.beneficiariesByState || {}).length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Distribution by State
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(metrics.beneficiariesByState)
                  .sort(([, a], [, b]) => b - a)
                  .map(([state, count], index) => {
                    const percentage = metrics.totalBeneficiaries > 0
                      ? ((count / metrics.totalBeneficiaries) * 100).toFixed(1)
                      : '0'
                    return (
                      <motion.div
                        key={state}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <p className="text-sm font-medium text-muted-foreground">{state}</p>
                        <p className="text-2xl font-bold mt-1">{count.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">{percentage}%</p>
                      </motion.div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Beneficiaries Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Beneficiary Details</CardTitle>
            <CardDescription>
              Showing {displayData.length} of {data.length} beneficiaries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>LGA</TableHead>
                    <TableHead>Programs</TableHead>
                    <TableHead className="text-right">Amount Spent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {displayData.map((beneficiary, index) => (
                      <motion.tr
                        key={beneficiary.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {beneficiary.firstName} {beneficiary.lastName}
                        </TableCell>
                        <TableCell className="capitalize">{beneficiary.gender}</TableCell>
                        <TableCell>
                          {formatDate(beneficiary.dateOfBirth, 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{beneficiary.address.state}</TableCell>
                        <TableCell>{beneficiary.address.lga}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {beneficiary.programParticipations?.length || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(beneficiary.amountSpent || 0)}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}

// Programs Report View
function ProgramsReportView({
  data,
  metrics,
}: {
  data: Program[]
  metrics: ReportPreviewProps['metrics']
}) {
  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Programs"
          value={metrics.totalPrograms}
          icon={Calendar}
          iconBgColor="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0}
          animated
        />
        {Object.entries(metrics.programStatusCounts || {}).map(([status, count], index) => {
          const colors = [
            'bg-gradient-to-br from-green-500 to-emerald-600',
            'bg-gradient-to-br from-orange-500 to-orange-600',
            'bg-gradient-to-br from-purple-500 to-purple-600',
            'bg-gradient-to-br from-red-500 to-red-600'
          ]
          return (
            <MetricCard
              key={status}
              title={`${status.charAt(0).toUpperCase() + status.slice(1)} Programs`}
              value={count}
              icon={Calendar}
              iconBgColor={colors[index % 4]}
              delay={(index + 1) * 0.1}
              animated
            />
          )
        })}
      </div>

      {/* Programs Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
            <CardDescription>{data.length} programs found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Beneficiaries</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {data.map((program, index) => (
                      <motion.tr
                        key={program.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">{program.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {program.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(program.startDate, 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          {program.endDate ? formatDate(program.endDate, 'MMM dd, yyyy') : 'Ongoing'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              program.status === 'active'
                                ? 'default'
                                : program.status === 'completed'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="capitalize"
                          >
                            {program.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(program.budget?.allocated || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {program.actualBeneficiaries || 0}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}

// Donations Report View
function DonationsReportView({
  data,
  metrics,
}: {
  data: Donation[]
  metrics: ReportPreviewProps['metrics']
}) {
  const displayData = data.slice(0, 50)

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Total Donations"
          value={formatCurrency(metrics.totalDonations)}
          icon={DollarSign}
          iconBgColor="bg-gradient-to-br from-green-500 to-green-600"
          delay={0}
          animated={false}
        />
        <MetricCard
          title="Number of Donations"
          value={data.length}
          icon={FileText}
          iconBgColor="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0.1}
          animated
        />
        <MetricCard
          title="Average Donation"
          value={data.length > 0
            ? formatCurrency(metrics.totalDonations / data.length)
            : formatCurrency(0)}
          icon={TrendingUp}
          iconBgColor="bg-gradient-to-br from-purple-500 to-purple-600"
          delay={0.2}
          animated={false}
        />
      </div>

      {/* Donations Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Donation Details</CardTitle>
            <CardDescription>
              Showing {displayData.length} of {data.length} donations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Receipt #</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {displayData.map((donation, index) => (
                      <motion.tr
                        key={donation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {donation.donorName || 'N/A'}
                        </TableCell>
                        <TableCell>{formatDate(donation.donationDate, 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(donation.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {donation.paymentMethod?.replace('_', ' ') || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>{donation.programName || 'Unassigned'}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {donation.receiptNumber || 'N/A'}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}

// Grants Report View
function GrantsReportView({
  data,
  metrics,
}: {
  data: Grant[]
  metrics: ReportPreviewProps['metrics']
}) {
  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <MetricCard
          title="Total Grants"
          value={formatCurrency(metrics.totalGrants)}
          icon={Award}
          iconBgColor="bg-gradient-to-br from-amber-500 to-amber-600"
          delay={0}
          animated={false}
        />
        <MetricCard
          title="Number of Grants"
          value={data.length}
          icon={FileText}
          iconBgColor="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0.1}
          animated
        />
      </div>

      {/* Grants Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Grant Details</CardTitle>
            <CardDescription>{data.length} grants found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grantor</TableHead>
                    <TableHead>Grant Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {data.map((grant, index) => (
                      <motion.tr
                        key={grant.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">{grant.grantor}</TableCell>
                        <TableCell>{grant.grantName}</TableCell>
                        <TableCell>{formatDate(grant.startDate, 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{formatDate(grant.endDate, 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(grant.amount)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{grant.purpose}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              grant.status === 'active'
                                ? 'default'
                                : grant.status === 'completed'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="capitalize"
                          >
                            {grant.status}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}

// Financial Report View
function FinancialReportView({
  donations,
  grants,
  metrics,
}: {
  donations: Donation[]
  grants: Grant[]
  metrics: ReportPreviewProps['metrics']
}) {
  return (
    <>
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Total Funding"
          value={formatCurrency(metrics.totalFunding)}
          icon={DollarSign}
          iconBgColor="bg-gradient-to-br from-green-500 to-green-600"
          delay={0}
          animated={false}
        />
        <MetricCard
          title="Total Donations"
          value={formatCurrency(metrics.totalDonations)}
          icon={DollarSign}
          iconBgColor="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0.1}
          animated={false}
        />
        <MetricCard
          title="Total Grants"
          value={formatCurrency(metrics.totalGrants)}
          icon={Award}
          iconBgColor="bg-gradient-to-br from-amber-500 to-amber-600"
          delay={0.2}
          animated={false}
        />
      </div>

      {/* Donations Summary */}
      {donations.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Donations</CardTitle>
              <CardDescription>Latest {Math.min(10, donations.length)} donations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Donor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Program</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.slice(0, 10).map((donation, index) => (
                      <motion.tr
                        key={donation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {donation.donorName || 'N/A'}
                        </TableCell>
                        <TableCell>{formatDate(donation.donationDate, 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(donation.amount)}
                        </TableCell>
                        <TableCell>{donation.programName || 'Unassigned'}</TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Grants Summary */}
      {grants.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Active Grants</CardTitle>
              <CardDescription>{grants.length} grants found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grantor</TableHead>
                      <TableHead>Grant Name</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grants.map((grant, index) => (
                      <motion.tr
                        key={grant.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">{grant.grantor}</TableCell>
                        <TableCell>{grant.grantName}</TableCell>
                        <TableCell>
                          {formatDate(grant.startDate, 'MMM yyyy')} - {formatDate(grant.endDate, 'MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(grant.amount)}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </>
  )
}

// Impact Report View
function ImpactReportView({
  data,
  metrics,
}: {
  data: Program[]
  metrics: ReportPreviewProps['metrics']
}) {
  const activePrograms = (metrics.programStatusCounts?.['active'] || 0)

  return (
    <>
      {/* Impact Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Beneficiaries Served"
          value={metrics.totalBeneficiaries}
          icon={Users}
          iconBgColor="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0}
          animated
        />
        <MetricCard
          title="Active Programs"
          value={activePrograms}
          icon={Calendar}
          iconBgColor="bg-gradient-to-br from-green-500 to-emerald-600"
          delay={0.1}
          animated
        />
        <MetricCard
          title="Total Funding"
          value={formatCurrency(metrics.totalFunding)}
          icon={DollarSign}
          iconBgColor="bg-gradient-to-br from-purple-500 to-purple-600"
          delay={0.2}
          animated={false}
        />
      </div>

      {/* Program Impact Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Program Impact Analysis</CardTitle>
            <CardDescription>Impact metrics across all programs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Beneficiaries</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {data.map((program, index) => (
                      <motion.tr
                        key={program.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">{program.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {program.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {program.actualBeneficiaries || 0}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(program.budget?.allocated || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              program.status === 'active'
                                ? 'default'
                                : program.status === 'completed'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="capitalize"
                          >
                            {program.status}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}

// Comprehensive Report View
function ComprehensiveReportView({
  beneficiaries,
  programs,
  donations,
  grants,
  metrics,
}: {
  beneficiaries: Beneficiary[]
  programs: Program[]
  donations: Donation[]
  grants: Grant[]
  metrics: ReportPreviewProps['metrics']
}) {
  return (
    <>
      {/* Executive Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <MetricCard
          title="Beneficiaries"
          value={metrics.totalBeneficiaries}
          icon={Users}
          iconBgColor="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0}
          animated
        />
        <MetricCard
          title="Programs"
          value={metrics.totalPrograms}
          icon={Calendar}
          iconBgColor="bg-gradient-to-br from-green-500 to-emerald-600"
          delay={0.1}
          animated
        />
        <MetricCard
          title="Funding"
          value={formatCurrency(metrics.totalFunding)}
          icon={DollarSign}
          iconBgColor="bg-gradient-to-br from-amber-500 to-amber-600"
          delay={0.2}
          animated={false}
        />
        <MetricCard
          title="Donations"
          value={donations.length}
          icon={DollarSign}
          iconBgColor="bg-gradient-to-br from-green-500 to-green-600"
          delay={0.3}
          animated
        />
        <MetricCard
          title="Grants"
          value={grants.length}
          icon={Award}
          iconBgColor="bg-gradient-to-br from-purple-500 to-purple-600"
          delay={0.4}
          animated
        />
        <MetricCard
          title="Partners"
          value={metrics.totalPartners}
          icon={TrendingUp}
          iconBgColor="bg-gradient-to-br from-pink-500 to-pink-600"
          delay={0.5}
          animated
        />
      </div>

      {/* Beneficiaries Summary */}
      {beneficiaries.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <BeneficiariesReportView data={beneficiaries} metrics={metrics} />
        </motion.div>
      )}

      {/* Programs Summary */}
      {programs.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <ProgramsReportView data={programs} metrics={metrics} />
        </motion.div>
      )}

      {/* Financial Summary */}
      {(donations.length > 0 || grants.length > 0) && (
        <motion.div variants={itemVariants}>
          <FinancialReportView donations={donations} grants={grants} metrics={metrics} />
        </motion.div>
      )}
    </>
  )
}


function convertDataForExport(
  type: string,
  data: ReportPreviewProps['data']
): Array<Record<string, unknown>> {
  switch (type) {
    case 'beneficiaries':
      return (data.beneficiaries as Array<Record<string, unknown>>).map((b: Record<string, unknown>) => {
        const address = (b.address as Record<string, unknown>) || {}
        const programParticipations = (b.programParticipations as unknown[]) || []
        return {
          'First Name': b.firstName || '',
          'Last Name': b.lastName || '',
          'Gender': b.gender || '',
          'Date of Birth': b.dateOfBirth || '',
          'State': address.state || '',
          'LGA': address.lga || '',
          'Programs': programParticipations.length || 0,
          'Amount Spent': b.amountSpent || 0,
        }
      })
    case 'programs':
      return (data.programs as Array<Record<string, unknown>>).map((p: Record<string, unknown>) => {
        const budget = (p.budget as Record<string, unknown>) || {}
        return {
          'Title': p.title || '',
          'Type': p.type || '',
          'Start Date': p.startDate || '',
          'End Date': p.endDate || '',
          'Status': p.status || '',
          'Budget': budget.allocated || 0,
          'Beneficiaries': p.actualBeneficiaries || 0,
        }
      })
    case 'donations':
      return (data.donations as Array<Record<string, unknown>>).map((d: Record<string, unknown>) => ({
        'Donor': d.donorName || '',
        'Date': d.donationDate || '',
        'Amount': d.amount || 0,
        'Payment Method': d.paymentMethod || '',
        'Program': d.programName || '',
        'Receipt Number': d.receiptNumber || '',
      }))
    case 'grants':
      return (data.grants as Array<Record<string, unknown>>).map((g: Record<string, unknown>) => ({
        'Grantor': g.grantor || '',
        'Grant Name': g.grantName || '',
        'Start Date': g.startDate || '',
        'End Date': g.endDate || '',
        'Amount': g.amount || 0,
        'Purpose': g.purpose || '',
        'Status': g.status || '',
      }))
    default:
      return []
  }
}
