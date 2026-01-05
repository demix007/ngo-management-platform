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
  DollarSign,
  Calendar,
  FileText,
  AlertCircle,
  TrendingDown,
  Receipt,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useDonation } from "@/features/donations/hooks/use-donations";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading";
import { useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/donations/$id")({
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
  component: DonationDetailsLayout,
});

function DonationDetailsLayout() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  if (currentPath.includes("/edit")) {
    return <Outlet />;
  }

  return <DonationDetailsPage />;
}

function DonationDetailsPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { data: donation, isLoading, error } = useDonation(id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !donation) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">Donation not found</p>
              <Button
                variant="default"
                onClick={() => navigate({ to: "/donations" })}
                className="mt-4"
              >
                Back to Donations
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const statusColors: Record<string, string> = {
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    confirmed:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    cancelled:
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const totalExpenditures = donation.expenditures?.reduce(
    (sum, exp) => sum + exp.amount,
    0
  ) || 0;

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
              onClick={() => navigate({ to: "/donations" })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Donations
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                Donation Details
              </h1>
              <p className="text-muted-foreground mt-1">
                Receipt: {donation.receiptNumber}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate({ to: "/donations/$id/edit", params: { id } })}
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
                  <Receipt className="h-5 w-5" color="yellow"/>
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Donor</p>
                    <p className="font-medium">{donation.donorName || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-semibold text-lg">
                      {new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: donation.currency || "NGN",
                      }).format(donation.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Donation Date</p>
                    <p className="font-medium">
                      {format(donation.donationDate, "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-medium capitalize">
                      {donation.paymentMethod.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={statusColors[donation.status]}>
                      {donation.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Program</p>
                    <p className="font-medium">
                      {donation.programName || "Not assigned"}
                    </p>
                  </div>
                </div>
                {donation.purpose && (
                  <div>
                    <p className="text-sm text-muted-foreground">Purpose</p>
                    <p className="mt-1">{donation.purpose}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expenditures */}
            {donation.expenditures && donation.expenditures.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" color="yellow"/>
                    Expenditures ({donation.expenditures.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {donation.expenditures.map((exp, index) => (
                      <div
                        key={exp.id || index}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{exp.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(exp.date, "MMM dd, yyyy")} •{" "}
                              <span className="capitalize">{exp.category}</span>
                            </p>
                          </div>
                          <p className="font-semibold">
                            {new Intl.NumberFormat("en-NG", {
                              style: "currency",
                              currency: donation.currency || "NGN",
                            }).format(exp.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Donor Restrictions */}
            {donation.donorRestrictions &&
              donation.donorRestrictions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" color="red"/>
                      Donor Restrictions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2">
                      {donation.donorRestrictions.map((restriction, index) => (
                        <li key={index}>{restriction}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
            )}

            {/* Notes */}
            {donation.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" color="yellow"/>
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{donation.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" color="yellow"/>
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-lg">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: donation.currency || "NGN",
                    }).format(donation.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Expenditures
                  </p>
                  <p className="font-semibold">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: donation.currency || "NGN",
                    }).format(totalExpenditures)}
                  </p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Balance Remaining
                  </p>
                  <p
                    className={`font-semibold text-lg ${
                      donation.balanceRemaining < 0
                        ? "text-destructive"
                        : "text-green-600"
                    }`}
                  >
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: donation.currency || "NGN",
                    }).format(donation.balanceRemaining)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Donor Reporting */}
            {donation.donorReporting && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" color="blue" />
                    Reporting Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {donation.donorReporting.reportFrequency && (
                    <div>
                      <p className="text-sm text-muted-foreground">Frequency</p>
                      <p className="font-medium capitalize">
                        {donation.donorReporting.reportFrequency}
                      </p>
                    </div>
                  )}
                  {donation.donorReporting.nextReportDue && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Next Report Due
                      </p>
                      <p className="font-medium">
                        {format(
                          donation.donorReporting.nextReportDue,
                          "MMM dd, yyyy"
                        )}
                      </p>
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
