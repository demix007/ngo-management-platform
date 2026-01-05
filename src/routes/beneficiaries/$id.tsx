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
  MapPin,
  Phone,
  Mail,
  Calendar,
  User,
  FileText,
  DollarSign,
  Activity,
  TrendingUp,
  NotebookText,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useBeneficiary } from "@/features/beneficiaries/hooks/use-beneficiaries";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading";
import { useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/beneficiaries/$id")({
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
  component: BeneficiaryDetailsLayout,
});

function BeneficiaryDetailsLayout() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  // Check if we're on the edit route
  if (currentPath.includes("/edit")) {
    return <Outlet />;
  }

  return <BeneficiaryDetailsPage />;
}

function BeneficiaryDetailsPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { data: beneficiary, isLoading, error } = useBeneficiary(id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !beneficiary) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">Beneficiary not found</p>
              <Button
                variant="default"
                onClick={() => navigate({ to: "/beneficiaries" })}
                className="mt-4"
              >
                Back to Beneficiaries
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    inactive:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
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
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: "/beneficiaries" })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {beneficiary.firstName} {beneficiary.lastName}
              </h1>
              <p className="text-muted-foreground">Beneficiary Details</p>
            </div>
          </div>
          <Button
            onClick={() => navigate({ to: `/beneficiaries/${id}/edit` })}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio Data */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" color="blue" />
                    Bio Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">
                        {beneficiary.firstName} {beneficiary.middleName}{" "}
                        {beneficiary.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Date of Birth
                      </p>
                      <p className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(beneficiary.dateOfBirth, "MMMM dd, yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium capitalize">
                        {beneficiary.gender}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={statusColors[beneficiary.status]}>
                        {beneficiary.status.charAt(0).toUpperCase() +
                          beneficiary.status.slice(1)}
                      </Badge>
                    </div>
                    {beneficiary.phoneNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {beneficiary.phoneNumber}
                        </p>
                      </div>
                    )}
                    {beneficiary.email && (
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {beneficiary.email}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" color="blue" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{beneficiary.address.street}</p>
                    <p className="text-muted-foreground">
                      {beneficiary.address.city}, {beneficiary.address.lga},{" "}
                      {beneficiary.address.state}
                    </p>
                    <p className="text-muted-foreground">
                      {beneficiary.address.country}
                    </p>
                    {beneficiary.gpsLocation && (
                      <p className="text-sm text-muted-foreground mt-2">
                        GPS: {beneficiary.gpsLocation.latitude.toFixed(6)},{" "}
                        {beneficiary.gpsLocation.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Programs */}
            {beneficiary.programsReceived &&
              beneficiary.programsReceived.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" color="green" />
                        Programs Received
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {beneficiary.programsReceived.map((program, index) => (
                          <div
                            key={index}
                            className="border-l-4 border-blue-600 pl-4 py-2"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {program.programName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(program.startDate, "MMM dd, yyyy")}
                                  {program.endDate &&
                                    ` - ${format(program.endDate, "MMM dd, yyyy")}`}
                                </p>
                              </div>
                              <Badge variant="secondary">
                                {program.status}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium mt-1">
                              Amount:{" "}
                              {new Intl.NumberFormat("en-NG", {
                                style: "currency",
                                currency: "NGN",
                              }).format(program.amountSpent)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

            {/* Medical & Bail Bills */}
            {(beneficiary.medicalBills &&
              beneficiary.medicalBills.length > 0) ||
            (beneficiary.bailBills && beneficiary.bailBills.length > 0) ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" color="green" />
                      Medical & Bail Bills
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {beneficiary.medicalBills &&
                      beneficiary.medicalBills.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Medical Bills</h4>
                          {beneficiary.medicalBills.map((bill, index) => (
                            <div
                              key={index}
                              className="border rounded-lg p-3 mb-2"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">
                                    {bill.description}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(bill.date, "MMM dd, yyyy")}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    {new Intl.NumberFormat("en-NG", {
                                      style: "currency",
                                      currency: "NGN",
                                    }).format(bill.amount)}
                                  </p>
                                  <Badge
                                    className={
                                      bill.cleared
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }
                                  >
                                    {bill.cleared ? "Cleared" : "Pending"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    {beneficiary.bailBills &&
                      beneficiary.bailBills.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Bail Bills</h4>
                          {beneficiary.bailBills.map((bill, index) => (
                            <div
                              key={index}
                              className="border rounded-lg p-3 mb-2"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">
                                    {bill.description}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(bill.date, "MMM dd, yyyy")}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    {new Intl.NumberFormat("en-NG", {
                                      style: "currency",
                                      currency: "NGN",
                                    }).format(bill.amount)}
                                  </p>
                                  <Badge
                                    className={
                                      bill.cleared
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }
                                  >
                                    {bill.cleared ? "Cleared" : "Pending"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : null}

            {/* Follow-up Reports */}
            {beneficiary.followUpReports &&
              beneficiary.followUpReports.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" color="yellow" />
                        Follow-up Reports
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {beneficiary.followUpReports.map((report, index) => {
                          const statusColors: Record<string, string> = {
                            positive: "bg-green-100 text-green-800",
                            needs_attention: "bg-yellow-100 text-yellow-800",
                            critical: "bg-red-100 text-red-800",
                          };
                          return (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium">
                                    {report.reporter}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(report.date, "MMM dd, yyyy")}
                                  </p>
                                </div>
                                <Badge className={statusColors[report.status]}>
                                  {report.status.replace("_", " ")}
                                </Badge>
                              </div>
                              <p className="text-sm">{report.report}</p>
                              {report.nextFollowUpDate && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Next follow-up:{" "}
                                  {format(
                                    report.nextFollowUpDate,
                                    "MMM dd, yyyy"
                                  )}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

            {/* Impact & Reintegration */}
            {(beneficiary.impactNotes ||
              beneficiary.reintegrationSuccessScore !== undefined) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.7 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" color="green" />
                      Impact & Reintegration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {beneficiary.impactNotes && (
                      <div>
                        <p className="text-sm font-medium mb-2">Impact Notes</p>
                        <p className="text-sm">{beneficiary.impactNotes}</p>
                      </div>
                    )}
                    {beneficiary.reintegrationSuccessScore !== undefined && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium">
                            Reintegration Success Score
                          </p>
                          <p className="text-2xl font-bold text-blue-600">
                            {beneficiary.reintegrationSuccessScore}%
                          </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${beneficiary.reintegrationSuccessScore}%`,
                            }}
                            transition={{ duration: 1, delay: 0.8 }}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 h-3 rounded-full"
                          />
                        </div>
                      </div>
                    )}
                    {beneficiary.reintegrationDetails && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        {beneficiary.reintegrationDetails.employmentStatus && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Employment
                            </p>
                            <p className="font-medium capitalize">
                              {beneficiary.reintegrationDetails.employmentStatus.replace(
                                "_",
                                " "
                              )}
                            </p>
                          </div>
                        )}
                        {beneficiary.reintegrationDetails.housingStatus && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Housing
                            </p>
                            <p className="font-medium capitalize">
                              {beneficiary.reintegrationDetails.housingStatus}
                            </p>
                          </div>
                        )}
                        {beneficiary.reintegrationDetails.familyReunited !==
                          undefined && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Family Reunited
                            </p>
                            <Badge
                              className={
                                beneficiary.reintegrationDetails.familyReunited
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {beneficiary.reintegrationDetails.familyReunited
                                ? "Yes"
                                : "No"}
                            </Badge>
                          </div>
                        )}
                        {beneficiary.reintegrationDetails.communitySupport !==
                          undefined && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Community Support
                            </p>
                            <Badge
                              className={
                                beneficiary.reintegrationDetails
                                  .communitySupport
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {beneficiary.reintegrationDetails.communitySupport
                                ? "Yes"
                                : "No"}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Notes */}
            {beneficiary.notes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.8 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <NotebookText className="h-5 w-5" color="blue" />
                      Additional Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">
                      {beneficiary.notes}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Programs
                    </p>
                    <p className="text-2xl font-bold">
                      {beneficiary.programsReceived?.length ||
                        beneficiary.programParticipations.length ||
                        0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Amount Spent
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: "NGN",
                      }).format(
                        beneficiary.amountSpent ||
                          beneficiary.impactMetrics.totalBenefitAmount ||
                          0
                      )}
                    </p>
                  </div>
                  {beneficiary.followUpReports &&
                    beneficiary.followUpReports.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Follow-up Reports
                        </p>
                        <p className="text-2xl font-bold">
                          {beneficiary.followUpReports.length}
                        </p>
                      </div>
                    )}
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">
                      {format(beneficiary.createdAt, "MMM dd, yyyy")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
