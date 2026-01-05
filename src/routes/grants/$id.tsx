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
  Calendar,
  FileText,
  Target,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useGrant } from "@/features/donations/hooks/use-donations";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading";
import { useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/grants/$id")({
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
  component: GrantDetailsLayout,
});

function GrantDetailsLayout() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  if (currentPath.includes("/edit")) {
    return <Outlet />;
  }

  return <GrantDetailsPage />;
}

function GrantDetailsPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { data: grant, isLoading, error } = useGrant(id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !grant) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">Grant not found</p>
              <Button
                variant="default"
                onClick={() => navigate({ to: "/grants" })}
                className="mt-4"
              >
                Back to Grants
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const statusColors: Record<string, string> = {
    active:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    completed:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    suspended:
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
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
              onClick={() => navigate({ to: "/grants" })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Grants
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {grant.grantName}
              </h1>
              <p className="text-muted-foreground mt-1">{grant.grantor}</p>
            </div>
          </div>
          <Button
            onClick={() => navigate({ to: "/grants/$id/edit", params: { id } })}
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
                  <FileText className="h-5 w-5" color="yellow"/>
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Grantor</p>
                    <p className="font-medium">{grant.grantor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-semibold text-lg">
                      {new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: grant.currency || "NGN",
                      }).format(grant.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {format(grant.startDate, "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">
                      {format(grant.endDate, "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={statusColors[grant.status]}>
                      {grant.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Purpose</p>
                  <p className="mt-1">{grant.purpose}</p>
                </div>
                {grant.programNames && grant.programNames.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Programs</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {grant.programNames.map((name, index) => (
                        <Badge key={index} variant="secondary">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Milestones */}
            {grant.milestones && grant.milestones.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" color="yellow"/>
                    Milestones ({grant.milestones.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {grant.milestones.map((milestone, index) => (
                      <div
                        key={milestone.id || index}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{milestone.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {milestone.description}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Target: {format(milestone.targetDate, "MMM dd, yyyy")}
                            </p>
                          </div>
                          <Badge
                            variant={
                              milestone.status === "completed"
                                ? "default"
                                : milestone.status === "overdue"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {milestone.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deliverables */}
            {grant.deliverables && grant.deliverables.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" color="green"/>
                    Deliverables ({grant.deliverables.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {grant.deliverables.map((deliverable, index) => (
                      <div
                        key={deliverable.id || index}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{deliverable.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {deliverable.description}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Due: {format(deliverable.dueDate, "MMM dd, yyyy")}
                            </p>
                          </div>
                          <Badge
                            variant={
                              deliverable.status === "approved"
                                ? "default"
                                : deliverable.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {deliverable.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Reporting Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" color="blue"/>
                  Reporting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Frequency</p>
                  <p className="font-medium capitalize">
                    {grant.reportingRequirements.frequency}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Report Due</p>
                  <p className="font-medium">
                    {format(
                      grant.reportingRequirements.nextReportDue,
                      "MMM dd, yyyy"
                    )}
                  </p>
                </div>
                {grant.reportingRequirements.lastReportDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Last Report Date
                    </p>
                    <p className="font-medium">
                      {format(
                        grant.reportingRequirements.lastReportDate,
                        "MMM dd, yyyy"
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compliance Tracking */}
            {grant.complianceTracking && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" color="red" />
                    Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={grant.complianceTracking.isCompliant ? "default" : "destructive"}
                    >
                      {grant.complianceTracking.isCompliant
                        ? "Compliant"
                        : "Non-Compliant"}
                    </Badge>
                  </div>
                  {grant.complianceTracking.complianceIssues &&
                    grant.complianceTracking.complianceIssues.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">Issues:</p>
                        {grant.complianceTracking.complianceIssues.map(
                          (issue, index) => (
                            <div key={issue.id || index} className="text-sm">
                              <p className="font-medium">{issue.issue}</p>
                              <p className="text-muted-foreground">
                                {issue.severity} • {issue.status}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
