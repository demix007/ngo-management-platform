import { createFileRoute, useNavigate, redirect, Outlet } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, Calendar, DollarSign, Users, Target, TrendingUp, FileText, Image as ImageIcon } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useProgram } from '@/features/programs/hooks/use-programs'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { LoadingSpinner } from '@/components/ui/loading'
import { useRouterState } from '@tanstack/react-router'

export const Route = createFileRoute('/programs/$id')({
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
  component: ProgramDetailsLayout,
})

function ProgramDetailsLayout() {
  const router = useRouterState()
  const currentPath = router.location.pathname
  
  // Check if we're on the edit route
  if (currentPath.includes('/edit')) {
    return <Outlet />
  }
  
  return <ProgramDetailsPage />
}

function ProgramDetailsPage() {
  const navigate = useNavigate()
  const { id } = Route.useParams()
  const { data: program, isLoading, error } = useProgram(id)

  // Debug logging
  if (error) {
    console.error('Error fetching program:', error)
  }
  if (program) {
    console.log('Program fetched:', program)
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    )
  }

  if (error || !program) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">Program not found</p>
              <Button
                variant="default"
                onClick={() => navigate({ to: '/programs' })}
                className="mt-4"
              >
                Back to Programs
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  const statusColors: Record<string, string> = {
    planning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto p-6 max-w-7xl space-y-6"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/programs' })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2 text-blue-600">
              <h1 className="text-3xl font-bold">{program.title}</h1>
            </div>
          </div>
          <Button
            onClick={() => navigate({ to: '/programs/$id/edit', params: { id: program.id } })}
            variant="default"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Program
          </Button>
        </motion.div>

        {/* Status and Type */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex flex-wrap gap-2"
        >
          <Badge className={statusColors[program.status]}>{program.status}</Badge>
          <Badge variant="default" className="capitalize">{program.type.replace('_', ' ')}</Badge>
          {program.impactScore !== undefined && (
            <Badge variant="secondary">
              Impact Score: {program.impactScore}/100
            </Badge>
          )}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Objectives */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" color='red'/>
                    Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    {program.objectives.map((objective, idx) => (
                      <li key={idx} className="text-muted-foreground">{objective}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Dates and Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" color='blue' />
                    Timeline & Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium">{format(program.startDate, 'PPP')}</p>
                    </div>
                    {/* {program.endDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">End Date</p>
                        <p className="font-medium">{format(program.endDate, 'PPP')}</p>
                      </div>
                    )} */}
                     <div>
                        <p className="text-sm text-muted-foreground">End Date</p>
                        <p className="font-medium">{program?.endDate ? format(program.endDate, 'PPP') : '-'}</p>
                      </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">States</p>
                    <div className="flex flex-wrap gap-2">
                      {program.states.map((state, idx) => (
                        <Badge key={idx} variant="secondary">{state}</Badge>
                      ))}
                    </div>
                  </div>
                  {program.location?.address && (
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{program.location.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Budget & Expenditures */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" color='green' />
                    Budget & Expenditures
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Allocated</p>
                      <p className="font-medium text-lg">
                        {new Intl.NumberFormat('en-NG', {
                          style: 'currency',
                          currency: program.budget.currency || 'NGN',
                        }).format(program.budget.allocated)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Spent</p>
                      <p className="font-medium text-lg">
                        {new Intl.NumberFormat('en-NG', {
                          style: 'currency',
                          currency: program.budget.currency || 'NGN',
                        }).format(program.budget.spent)}
                      </p>
                    </div>
                  </div>
                  {program.expenditures && program.expenditures.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Expenditures</p>
                      <div className="space-y-2">
                        {program.expenditures.map((exp, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                            <div>
                              <p className="font-medium text-sm">{exp.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(exp.date, 'MMM dd, yyyy')} • {exp.category}
                              </p>
                            </div>
                            <p className="font-medium">
                              {new Intl.NumberFormat('en-NG', {
                                style: 'currency',
                                currency: program.budget.currency || 'NGN',
                              }).format(exp.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Monitoring & Evaluation Reports */}
            {(program.monitoringReports && program.monitoringReports.length > 0) ||
             (program.evaluationReports && program.evaluationReports.length > 0) ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" color='yellow' />
                      Monitoring & Evaluation Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {program.monitoringReports && program.monitoringReports.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">Monitoring Reports</p>
                        <div className="space-y-2">
                          {program.monitoringReports.map((report, idx) => (
                            <div key={idx} className="p-3 bg-muted rounded">
                              <p className="font-medium">{report.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(report.reportDate, 'MMM dd, yyyy')} by {report.reporter}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {program.evaluationReports && program.evaluationReports.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">Evaluation Reports</p>
                        <div className="space-y-2">
                          {program.evaluationReports.map((report, idx) => (
                            <div key={idx} className="p-3 bg-muted rounded">
                              <p className="font-medium">{report.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(report.reportDate, 'MMM dd, yyyy')} by {report.evaluator}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : null}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Beneficiaries */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" color='blue' />
                    Beneficiaries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Actual</span>
                      <span className="font-medium">{program.actualBeneficiaries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Targeted</span>
                      <span className="font-medium">{program.targetBeneficiaries}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${Math.min((program.actualBeneficiaries / program.targetBeneficiaries) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Impact Metrics */}
            {program.impactMetrics && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" color='green'/>
                      Impact Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Beneficiaries Reached</span>
                      <span className="font-medium">{program.impactMetrics.beneficiariesReached}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Objectives Achieved</span>
                      <span className="font-medium">
                        {program.impactMetrics.objectivesAchieved} / {program.impactMetrics.totalObjectives}
                      </span>
                    </div>
                    {program.impactMetrics.satisfactionScore !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Satisfaction Score</span>
                        <span className="font-medium">{program.impactMetrics.satisfactionScore}/100</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Media & Documentation */}
            {(program.media && program.media.length > 0) ||
             (program.documentation && program.documentation.length > 0) ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" color='yellow' />
                      Media & Documentation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {program.media && program.media.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Media ({program.media.length})</p>
                        <div className="space-y-1">
                          {program.media.slice(0, 3).map((item, idx) => (
                            <a
                              key={idx}
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline block"
                            >
                              {item.caption || `${item.type} ${idx + 1}`}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {program.documentation && program.documentation.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Documents ({program.documentation.length})</p>
                        <div className="space-y-1">
                          {program.documentation.slice(0, 3).map((doc, idx) => (
                            <a
                              key={idx}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline block"
                            >
                              {doc.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </AppLayout>
  )
}
