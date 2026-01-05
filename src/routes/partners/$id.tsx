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
  User,
  MapPin,
  FileCheck,
  Briefcase,
  Star,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { usePartner } from "@/features/partners/hooks/use-partners";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading";
import { useRouterState } from "@tanstack/react-router";
import type { Partner } from "@/types";

export const Route = createFileRoute("/partners/$id")({
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
  component: PartnerDetailsLayout,
});

function PartnerDetailsLayout() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  if (currentPath.includes("/edit")) {
    return <Outlet />;
  }

  return <PartnerDetailsPage />;
}

function PartnerDetailsPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { data: partner, isLoading, error } = usePartner(id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !partner) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">Partner not found</p>
              <Button
                variant="default"
                onClick={() => navigate({ to: "/partners" })}
                className="mt-4"
              >
                Back to Partners
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const getCategoryLabel = (category: Partner['category']): string => {
    const labels: Record<Partner['category'], string> = {
      government_ministry: 'Government Ministry',
      hospital: 'Hospital',
      correctional_center: 'Correctional Center',
      ngo: 'NGO',
      cso: 'CSO',
      international_agency: 'International Agency',
      foundation: 'Foundation',
      media_partner: 'Media Partner',
      donor_sponsor: 'Donor/Sponsor',
      private: 'Private',
    }
    return labels[category] || category
  }

  const statusColors: Record<Partner['status'], string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    dormant: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    past: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  };

  const ratingColors: Record<NonNullable<Partner['relationshipRating']>, string> = {
    excellent: "text-green-600 dark:text-green-400",
    very_good: "text-green-500 dark:text-green-500",
    good: "text-blue-600 dark:text-blue-400",
    fair: "text-yellow-600 dark:text-yellow-400",
    poor: "text-red-600 dark:text-red-400",
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
              onClick={() => navigate({ to: "/partners" })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Partners
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Partner Details
              </h1>
              <p className="text-muted-foreground mt-1">
                {partner.name}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate({ to: "/partners/$id/edit", params: { id } })}
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
                    <p className="text-sm text-muted-foreground">Institution Name</p>
                    <p className="font-medium">{partner.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{getCategoryLabel(partner.category)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={statusColors[partner.status]}>
                      {partner.status}
                    </Badge>
                  </div>
                  {partner.relationshipRating && (
                    <div>
                      <p className="text-sm text-muted-foreground">Relationship Rating</p>
                      <p className={`font-medium capitalize ${ratingColors[partner.relationshipRating]}`}>
                        {partner.relationshipRating.replace('_', ' ')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Focal Person */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" color="blue"/>
                  Focal Person
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{partner.focalPerson.name}</p>
                  </div>
                  {partner.focalPerson.title && (
                    <div>
                      <p className="text-sm text-muted-foreground">Title</p>
                      <p className="font-medium">{partner.focalPerson.title}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {partner.focalPerson.email}
                    </p>
                  </div>
                  {partner.focalPerson.phoneNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {partner.focalPerson.phoneNumber}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" color="yellow"/>
                  Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{partner.contactDetails.email}</p>
                  </div>
                  {partner.contactDetails.phoneNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                      <p className="font-medium">{partner.contactDetails.phoneNumber}</p>
                    </div>
                  )}
                  {partner.contactDetails.alternatePhone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Alternate Phone</p>
                      <p className="font-medium">{partner.contactDetails.alternatePhone}</p>
                    </div>
                  )}
                  {partner.contactDetails.website && (
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <p className="font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <a
                          href={partner.contactDetails.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {partner.contactDetails.website}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" color="green"/>
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {partner.address.street && (
                  <p className="font-medium">{partner.address.street}</p>
                )}
                <p>
                  {partner.address.city}, {partner.address.state}
                  {partner.address.lga && `, ${partner.address.lga}`}
                </p>
                <p className="text-muted-foreground">
                  {partner.address.country}
                  {partner.address.postalCode && ` - ${partner.address.postalCode}`}
                </p>
              </CardContent>
            </Card>

            {/* MoU Documents */}
            {partner.mouDocuments && partner.mouDocuments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" color="yellow"/>
                    MoU/Agreement Documents ({partner.mouDocuments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {partner.mouDocuments.map((doc, index) => (
                      <div
                        key={doc.id || index}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{doc.title}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              {doc.signedDate && (
                                <span>
                                  Signed: {format(doc.signedDate, "MMM dd, yyyy")}
                                </span>
                              )}
                              {doc.expiryDate && (
                                <span>
                                  Expires: {format(doc.expiryDate, "MMM dd, yyyy")}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant="default" className="capitalize">
                            {doc.status}
                          </Badge>
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

            {/* Programs */}
            {partner.programsPartneredOn && partner.programsPartneredOn.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" color="blue"/>
                    Programs Partnered On ({partner.programsPartneredOn.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {partner.programNames?.map((programName, index) => (
                      <Badge key={index} variant="secondary">
                        {programName}
                      </Badge>
                    ))}
                    {!partner.programNames && partner.programsPartneredOn.map((programId) => (
                      <Badge key={programId} variant="secondary">
                        {programId}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Remarks */}
            {partner.remarks && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" color="yellow"/>
                    Remarks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{partner.remarks}</p>
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
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{getCategoryLabel(partner.category)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[partner.status]}>
                    {partner.status}
                  </Badge>
                </div>
                {partner.relationshipRating && (
                  <div>
                    <p className="text-sm text-muted-foreground">Relationship Rating</p>
                    <p className={`font-medium capitalize ${ratingColors[partner.relationshipRating]}`}>
                      {partner.relationshipRating.replace('_', ' ')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Programs</p>
                  <p className="font-medium">
                    {partner.programsPartneredOn.length}{' '}
                    {partner.programsPartneredOn.length === 1 ? 'program' : 'programs'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">MoU Documents</p>
                  <p className="font-medium">
                    {partner.mouDocuments?.length || 0} document{partner.mouDocuments?.length !== 1 ? 's' : ''}
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
                  <p>{format(partner.createdAt, "MMM dd, yyyy")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p>{format(partner.updatedAt, "MMM dd, yyyy")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
