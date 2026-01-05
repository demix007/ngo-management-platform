import {
  createFileRoute,
  useNavigate,
  redirect,
  Outlet,
} from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Building2,
  DollarSign,
  Calendar,
  Users,
  FileText,
  Activity,
  Image,
  Award,
  Target,
  MapPin,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useProject } from "@/features/projects/hooks/use-projects";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading";
import { useRouterState } from "@tanstack/react-router";
import type { Project } from "@/types";

export const Route = createFileRoute("/projects/$id")({
  beforeLoad: async () => {
    const { isLoading } = useAuthStore.getState();
    if (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const finalState = useAuthStore.getState();
    if (!finalState.isAuthenticated || !finalState.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: ProjectDetailsLayout,
});

function ProjectDetailsLayout() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  if (currentPath.includes("/edit")) {
    return <Outlet />;
  }

  return <ProjectDetailsPage />;
}

function ProjectDetailsPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { data: project, isLoading, error } = useProject(id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !project) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">Project not found</p>
              <Button
                variant="default"
                onClick={() => navigate({ to: "/projects" })}
                className="mt-4"
              >
                Back to Projects
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const getTypeLabel = (type: Project['type']): string => {
    const labels: Record<Project['type'], string> = {
      construction: 'Construction',
      renovation: 'Renovation',
      hospitals: 'Hospitals',
      water_projects: 'Water Projects',
      skill_empowerment: 'Skill Empowerment',
      community_outreach: 'Community Outreach',
      grants: 'Grants',
      institutional_support: 'Institutional Support',
    }
    return labels[type] || type
  }

  const statusColors: Record<Project['status'], string> = {
    planning: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

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
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: "/projects" })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Project Details
              </h1>
              <p className="text-muted-foreground mt-1">
                {project.name}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate({ to: "/projects/$id/edit", params: { id } })}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" color="blue"/>
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Project Name</p>
                    <p className="font-medium">{project.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Project Type</p>
                    <p className="font-medium">{getTypeLabel(project.type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={statusColors[project.status]}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2 max-w-[150px]">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${project.progress.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{project.progress.percentage}%</span>
                    </div>
                  </div>
                </div>
                {project.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="mt-1">{project.description}</p>
                  </div>
                )}
                {project.objectives && project.objectives.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Objectives</p>
                    <ul className="list-disc list-inside space-y-1">
                      {project.objectives.map((objective, index) => (
                        <li key={index} className="text-sm">{objective}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            {project.location && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" color="green"/>
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {project.location.address && (
                    <p className="font-medium">{project.location.address}</p>
                  )}
                  <p>
                    {project.location.city && project.location.state && (
                      <>
                        {project.location.city}, {project.location.state}
                        {project.location.lga && `, ${project.location.lga}`}
                      </>
                    )}
                  </p>
                  {project.location.country && (
                    <p className="text-muted-foreground">
                      {project.location.country}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Budget */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" color="yellow"/>
                  Budget
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Allocated</p>
                    <p className="font-medium text-lg">
                      {project.budget.currency} {project.budget.allocated.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Spent</p>
                    <p className="font-medium text-lg">
                      {project.budget.currency} {project.budget.spent.toLocaleString()}
                    </p>
                  </div>
                </div>
                {project.budget.breakdown && project.budget.breakdown.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Budget Breakdown</p>
                    <div className="space-y-2">
                      {project.budget.breakdown.map((item) => (
                        <div key={item.id} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <p className="font-medium">{item.category}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                          <p className="font-medium">
                            {project.budget.currency} {item.amount.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" color="blue"/>
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {format(project.timeline.startDate, "MMM dd, yyyy")}
                    </p>
                  </div>
                  {project.timeline.endDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">End Date</p>
                      <p className="font-medium">
                        {format(project.timeline.endDate, "MMM dd, yyyy")}
                      </p>
                    </div>
                  )}
                </div>
                {project.timeline.milestones && project.timeline.milestones.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Milestones</p>
                    <div className="space-y-3">
                      {project.timeline.milestones.map((milestone) => (
                        <div key={milestone.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium">{milestone.title}</p>
                            <Badge variant="default" className="capitalize">
                              {milestone.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {milestone.description}
                            </p>
                          )}
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Target: {format(milestone.targetDate, "MMM dd, yyyy")}</span>
                            {milestone.completionDate && (
                              <span>Completed: {format(milestone.completionDate, "MMM dd, yyyy")}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contractors/Partners */}
            {(project.contractors && project.contractors.length > 0) || 
             (project.partnerNames && project.partnerNames.length > 0) ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" color="blue"/>
                    Contractors & Partners
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.partnerNames && project.partnerNames.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Partners</p>
                      <div className="flex flex-wrap gap-2">
                        {project.partnerNames.map((name, index) => (
                          <Badge key={index} variant="secondary">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.contractors && project.contractors.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Contractors/Suppliers</p>
                      <div className="space-y-3">
                        {project.contractors.map((contractor) => (
                          <div key={contractor.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-medium">{contractor.name}</p>
                              <Badge variant="default" className="capitalize">
                                {contractor.type}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {contractor.contactPerson && (
                                <div>
                                  <span className="text-muted-foreground">Contact: </span>
                                  <span>{contractor.contactPerson}</span>
                                </div>
                              )}
                              {contractor.email && (
                                <div>
                                  <span className="text-muted-foreground">Email: </span>
                                  <span>{contractor.email}</span>
                                </div>
                              )}
                              {contractor.contractAmount && (
                                <div>
                                  <span className="text-muted-foreground">Amount: </span>
                                  <span>{contractor.contractAmount.toLocaleString()}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground">Status: </span>
                                <Badge variant="default" className="capitalize">
                                  {contractor.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Documents */}
            {project.documents && project.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" color="yellow"/>
                    Documents ({project.documents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-medium">{doc.title}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="capitalize">{doc.type}</span>
                              {doc.uploadedAt && (
                                <span>
                                  Uploaded: {format(doc.uploadedAt, "MMM dd, yyyy")}
                                </span>
                              )}
                            </div>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {doc.documentUrl && (
                          <a
                            href={doc.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View Document →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Log */}
            {project.activityLog && project.activityLog.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" color="blue"/>
                    Activity Log ({project.activityLog.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.activityLog.map((activity) => (
                      <div key={activity.id} className="border-l-2 border-blue-500 pl-4 py-2">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium">{activity.action}</p>
                          <span className="text-sm text-muted-foreground">
                            {format(activity.date, "MMM dd, yyyy")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {activity.description}
                        </p>
                        {activity.userName && (
                          <p className="text-xs text-muted-foreground">
                            By {activity.userName}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Media */}
            {project.media && project.media.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" color="yellow"/>
                    Photos/Videos ({project.media.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {project.media.map((item) => (
                      <div key={item.id} className="border rounded-lg p-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center">
                            <Badge variant="default" className="capitalize">
                              {item.type}
                            </Badge>
                          </div>
                          {item.caption && (
                            <p className="text-sm text-muted-foreground truncate">
                              {item.caption}
                            </p>
                          )}
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completion Certificate */}
            {project.completionCertificate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" color="yellow"/>
                    Completion Certificate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {project.completionCertificate.certificateNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Certificate Number</p>
                      <p className="font-medium">{project.completionCertificate.certificateNumber}</p>
                    </div>
                  )}
                  {project.completionCertificate.issuedBy && (
                    <div>
                      <p className="text-sm text-muted-foreground">Issued By</p>
                      <p className="font-medium">{project.completionCertificate.issuedBy}</p>
                    </div>
                  )}
                  {project.completionCertificate.issuedDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Issued Date</p>
                      <p className="font-medium">
                        {format(project.completionCertificate.issuedDate, "MMM dd, yyyy")}
                      </p>
                    </div>
                  )}
                  {project.completionCertificate.certificateUrl && (
                    <a
                      href={project.completionCertificate.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Certificate →
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Impact Summary */}
            {project.impactSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" color="yellow" />
                    Impact Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {project.impactSummary.beneficiariesReached !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Beneficiaries Reached</p>
                        <p className="font-medium text-lg">
                          {project.impactSummary.beneficiariesReached.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {project.impactSummary.communitiesImpacted !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Communities Impacted</p>
                        <p className="font-medium text-lg">
                          {project.impactSummary.communitiesImpacted.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  {project.impactSummary.outcomes && project.impactSummary.outcomes.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Outcomes</p>
                      <ul className="list-disc list-inside space-y-1">
                        {project.impactSummary.outcomes.map((outcome, index) => (
                          <li key={index} className="text-sm">{outcome}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {project.impactSummary.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Notes</p>
                      <p className="text-sm whitespace-pre-wrap">
                        {project.impactSummary.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {project.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" color="yellow"/>
                    Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{project.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{getTypeLabel(project.type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[project.status]}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${project.progress.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{project.progress.percentage}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium">
                    {project.budget.currency} {project.budget.allocated.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Spent: {project.budget.currency} {project.budget.spent.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contractors/Partners</p>
                  <p className="font-medium">
                    {(project.contractors?.length || 0) + (project.partnerNames?.length || 0)}{' '}
                    {((project.contractors?.length || 0) + (project.partnerNames?.length || 0)) === 1 ? 'partner' : 'partners'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="font-medium">
                    {project.documents?.length || 0} document{project.documents?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Media</p>
                  <p className="font-medium">
                    {project.media?.length || 0} item{project.media?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p>{format(project.createdAt, "MMM dd, yyyy")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p>{format(project.updatedAt, "MMM dd, yyyy")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
