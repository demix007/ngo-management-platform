import { useForm, useFieldArray, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomDatePicker } from "@/components/ui/date-picker";
import {
  useCreatePartner,
  useUpdatePartner,
} from "../hooks/use-partners";
import { usePrograms } from "@/features/programs/hooks/use-programs";
import type { Partner } from "@/types";
import {
  Plus,
  X,
  Building2,
  User,
  MapPin,
  FileCheck,
  Briefcase,
  Star,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const partnerSchema = z.object({
  name: z.string().min(1, "Institution name is required"),
  category: z.enum([
    "government_ministry",
    "hospital",
    "correctional_center",
    "ngo",
    "cso",
    "international_agency",
    "foundation",
    "media_partner",
    "donor_sponsor",
    "private",
  ]),
  focalPerson: z.object({
    name: z.string().min(1, "Focal person name is required"),
    title: z.string().optional(),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().optional(),
  }),
  contactDetails: z.object({
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().optional(),
    alternatePhone: z.string().optional(),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
  }),
  address: z.object({
    street: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    lga: z.string().optional(),
    country: z.string().min(1, "Country is required"),
    postalCode: z.string().optional(),
  }),
  mouDocuments: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().min(1, "Document title is required"),
        documentUrl: z.string().min(1, "Document URL is required").refine(
          (url) => url === "" || z.string().url().safeParse(url).success,
          { message: "Invalid URL format" }
        ),
        signedDate: z.string().optional(),
        expiryDate: z.string().optional(),
        status: z.enum(["draft", "signed", "expired", "renewed"]),
      })
    )
    .optional(),
  programsPartneredOn: z.array(z.string()).optional(),
  status: z.enum(["active", "dormant", "past"]),
  relationshipRating: z
    .enum(["excellent", "very_good", "good", "fair", "poor"])
    .optional(),
  remarks: z.string().optional(),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

interface PartnerFormComprehensiveProps {
  partner?: Partner;
  onSuccess?: () => void;
}

export function PartnerFormComprehensive({
  partner,
  onSuccess,
}: PartnerFormComprehensiveProps) {
  const createMutation = useCreatePartner();
  const updateMutation = useUpdatePartner();
  const { user } = useAuthStore();
  const { data: programs } = usePrograms();
  const [activeTab, setActiveTab] = useState("basic");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<PartnerFormData>({
    mode: "onChange",
    resolver: zodResolver(partnerSchema),
    defaultValues: partner
      ? {
          ...partner,
          mouDocuments: partner.mouDocuments?.map((doc) => ({
            ...doc,
            signedDate: doc.signedDate?.toISOString().split("T")[0],
            expiryDate: doc.expiryDate?.toISOString().split("T")[0],
          })),
        }
      : {
          category: "private",
          status: "active",
          address: {
            country: "Nigeria",
          },
        },
  });

  const {
    fields: mouFields,
    append: appendMou,
    remove: removeMou,
  } = useFieldArray({
    control,
    name: "mouDocuments",
  });

  const selectedPrograms = watch("programsPartneredOn") || [];

  const onSubmit = async (data: PartnerFormData) => {
    try {
      console.log("Form submitted with data:", data);

      const partnerData: Omit<
        Partner,
        "id" | "createdAt" | "updatedAt"
      > = {
        ...data,
        mouDocuments: data.mouDocuments?.map((doc) => ({
          id: doc.id || crypto.randomUUID(),
          title: doc.title,
          documentUrl: doc.documentUrl,
          signedDate: doc.signedDate ? new Date(doc.signedDate) : undefined,
          expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : undefined,
          status: doc.status,
          uploadedAt: new Date(),
        })),
        programsPartneredOn: data.programsPartneredOn || [],
        programNames: programs
          ?.filter((p: { id: string; title: string }) =>
            data.programsPartneredOn?.includes(p.id)
          )
          .map((p: { id: string; title: string }) => p.title),
        createdBy: partner?.createdBy || user?.id || "",
      };

      if (partner) {
        await updateMutation.mutateAsync({ id: partner.id, ...partnerData });
      } else {
        console.log("Creating partner with data:", partnerData);
        await createMutation.mutateAsync(partnerData);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleFormError = (validationErrors: FieldErrors<PartnerFormData>) => {
    console.error("Form validation errors:", validationErrors);
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: Building2 },
    { id: "contact", label: "Contact Details", icon: User },
    { id: "address", label: "Address", icon: MapPin },
    { id: "mou", label: "MoU Documents", icon: FileCheck },
    { id: "programs", label: "Programs", icon: Briefcase },
    { id: "rating", label: "Rating & Remarks", icon: Star },
  ];

  const categoryOptions = [
    { value: "government_ministry", label: "Government Ministry" },
    { value: "hospital", label: "Hospital" },
    { value: "correctional_center", label: "Correctional Center" },
    { value: "ngo", label: "NGO" },
    { value: "cso", label: "CSO" },
    { value: "international_agency", label: "International Agency" },
    { value: "foundation", label: "Foundation" },
    { value: "media_partner", label: "Media Partner" },
    { value: "donor_sponsor", label: "Donor/Sponsor" },
    { value: "private", label: "Private" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <CardTitle className="text-2xl">
            {partner ? "Edit Partner" : "Create New Partner"}
          </CardTitle>
          <CardDescription className="text-blue-100">
            {partner
              ? "Update partner information"
              : "Enter comprehensive partner details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form
            onSubmit={handleSubmit(onSubmit, handleFormError)}
            className="space-y-6"
          >
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Basic Info Tab */}
            {activeTab === "basic" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Institution Name *</Label>
                    <Input id="name" {...register("name")} />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={watch("category") || ""}
                      onValueChange={(value) => {
                        setValue(
                          "category",
                          value as PartnerFormData["category"],
                          { shouldValidate: true }
                        );
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-destructive">
                        {errors.category.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={watch("status") || ""}
                    onValueChange={(value) => {
                      setValue(
                        "status",
                        value as PartnerFormData["status"],
                        { shouldValidate: true }
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="dormant">Dormant</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-destructive">
                      {errors.status.message}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Contact Details Tab */}
            {activeTab === "contact" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Focal Person</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="focalPerson.name">Name *</Label>
                      <Input
                        id="focalPerson.name"
                        {...register("focalPerson.name")}
                      />
                      {errors.focalPerson?.name && (
                        <p className="text-sm text-destructive">
                          {errors.focalPerson.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="focalPerson.title">Title</Label>
                      <Input
                        id="focalPerson.title"
                        {...register("focalPerson.title")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="focalPerson.email">Email *</Label>
                      <Input
                        id="focalPerson.email"
                        type="email"
                        {...register("focalPerson.email")}
                      />
                      {errors.focalPerson?.email && (
                        <p className="text-sm text-destructive">
                          {errors.focalPerson.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="focalPerson.phoneNumber">
                        Phone Number
                      </Label>
                      <Input
                        id="focalPerson.phoneNumber"
                        {...register("focalPerson.phoneNumber")}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Contact Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactDetails.email">Email *</Label>
                      <Input
                        id="contactDetails.email"
                        type="email"
                        {...register("contactDetails.email")}
                      />
                      {errors.contactDetails?.email && (
                        <p className="text-sm text-destructive">
                          {errors.contactDetails.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactDetails.phoneNumber">
                        Phone Number
                      </Label>
                      <Input
                        id="contactDetails.phoneNumber"
                        {...register("contactDetails.phoneNumber")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactDetails.alternatePhone">
                        Alternate Phone
                      </Label>
                      <Input
                        id="contactDetails.alternatePhone"
                        {...register("contactDetails.alternatePhone")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactDetails.website">Website</Label>
                      <Input
                        id="contactDetails.website"
                        type="url"
                        {...register("contactDetails.website")}
                        placeholder="https://..."
                      />
                      {errors.contactDetails?.website && (
                        <p className="text-sm text-destructive">
                          {errors.contactDetails.website.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Address Tab */}
            {activeTab === "address" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address.street">Street Address</Label>
                    <Input id="address.street" {...register("address.street")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address.city">City *</Label>
                    <Input id="address.city" {...register("address.city")} />
                    {errors.address?.city && (
                      <p className="text-sm text-destructive">
                        {errors.address.city.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address.state">State *</Label>
                    <Input id="address.state" {...register("address.state")} />
                    {errors.address?.state && (
                      <p className="text-sm text-destructive">
                        {errors.address.state.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address.lga">LGA</Label>
                    <Input id="address.lga" {...register("address.lga")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address.country">Country *</Label>
                    <Input id="address.country" {...register("address.country")} />
                    {errors.address?.country && (
                      <p className="text-sm text-destructive">
                        {errors.address.country.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address.postalCode">Postal Code</Label>
                    <Input
                      id="address.postalCode"
                      {...register("address.postalCode")}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* MoU Documents Tab */}
            {activeTab === "mou" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">MoU/Agreement Documents</Label>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() =>
                      appendMou({
                        title: "",
                        documentUrl: "",
                        status: "draft",
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </div>

                {mouFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Document {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMou(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          {...register(`mouDocuments.${index}.title`)}
                        />
                        {errors.mouDocuments?.[index]?.title && (
                          <p className="text-sm text-destructive">
                            {errors.mouDocuments[index]?.title?.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Document URL *</Label>
                        <Input
                          {...register(`mouDocuments.${index}.documentUrl`)}
                          placeholder="https://..."
                        />
                        {errors.mouDocuments?.[index]?.documentUrl && (
                          <p className="text-sm text-destructive">
                            {errors.mouDocuments[index]?.documentUrl?.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <CustomDatePicker
                          control={control}
                          name={`mouDocuments.${index}.signedDate`}
                          label="Signed Date"
                          placeholder="Select date"
                        />
                      </div>
                      <div className="space-y-2">
                        <CustomDatePicker
                          control={control}
                          name={`mouDocuments.${index}.expiryDate`}
                          label="Expiry Date"
                          placeholder="Select date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={watch(`mouDocuments.${index}.status`)}
                          onValueChange={(value) =>
                            setValue(
                              `mouDocuments.${index}.status`,
                              value as "draft" | "signed" | "expired" | "renewed",
                              { shouldValidate: true }
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="signed">Signed</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="renewed">Renewed</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.mouDocuments?.[index]?.status && (
                          <p className="text-sm text-destructive">
                            {errors.mouDocuments[index]?.status?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}

            {/* Programs Tab */}
            {activeTab === "programs" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Programs Partnered On</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                    {programs?.map((program: { id: string; title: string }) => (
                      <div key={program.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`program-${program.id}`}
                          checked={selectedPrograms.includes(program.id)}
                          onChange={(e) => {
                            const currentPrograms = selectedPrograms;
                            if (e.target.checked) {
                              setValue(
                                "programsPartneredOn",
                                [...currentPrograms, program.id]
                              );
                            } else {
                              setValue(
                                "programsPartneredOn",
                                currentPrograms.filter((id) => id !== program.id)
                              );
                            }
                          }}
                          className="rounded"
                        />
                        <Label
                          htmlFor={`program-${program.id}`}
                          className="font-normal cursor-pointer"
                        >
                          {program.title}
                        </Label>
                      </div>
                    ))}
                    {(!programs || programs.length === 0) && (
                      <p className="text-sm text-muted-foreground">
                        No programs available
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rating & Remarks Tab */}
            {activeTab === "rating" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="relationshipRating">Relationship Rating</Label>
                  <Select
                    value={watch("relationshipRating") || undefined}
                    onValueChange={(value) =>
                      setValue(
                        "relationshipRating",
                        value as PartnerFormData["relationshipRating"]
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="very_good">Very Good</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    {...register("remarks")}
                    rows={6}
                    placeholder="Enter any additional remarks or notes about this partner..."
                  />
                </div>
              </motion.div>
            )}

            {/* Form Validation Errors Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h4 className="font-semibold text-destructive mb-2">
                  Please fix the following errors:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                  {errors.name && (
                    <li>Basic Info: {errors.name.message}</li>
                  )}
                  {errors.category && (
                    <li>Basic Info: {errors.category.message}</li>
                  )}
                  {errors.status && (
                    <li>Basic Info: {errors.status.message}</li>
                  )}
                  {errors.focalPerson?.name && (
                    <li>Contact: Focal Person Name - {errors.focalPerson.name.message}</li>
                  )}
                  {errors.focalPerson?.email && (
                    <li>Contact: Focal Person Email - {errors.focalPerson.email.message}</li>
                  )}
                  {errors.contactDetails?.email && (
                    <li>Contact: Email - {errors.contactDetails.email.message}</li>
                  )}
                  {errors.contactDetails?.website && (
                    <li>Contact: Website - {errors.contactDetails.website.message}</li>
                  )}
                  {errors.address?.city && (
                    <li>Address: City - {errors.address.city.message}</li>
                  )}
                  {errors.address?.state && (
                    <li>Address: State - {errors.address.state.message}</li>
                  )}
                  {errors.address?.country && (
                    <li>Address: Country - {errors.address.country.message}</li>
                  )}
                  {errors.mouDocuments && Array.isArray(errors.mouDocuments) && errors.mouDocuments.length > 0 && (
                    <>
                      {errors.mouDocuments.map((docError, idx) => {
                        if (!docError) return null;
                        return (
                          <li key={idx}>
                            MoU Document {idx + 1}:{" "}
                            {docError.title?.message || docError.documentUrl?.message || docError.status?.message || "Has errors"}
                          </li>
                        );
                      })}
                    </>
                  )}
                </ul>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="default" onClick={onSuccess}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                {isSubmitting ||
                createMutation.isPending ||
                updateMutation.isPending
                  ? "Saving..."
                  : partner
                    ? "Update Partner"
                    : "Create Partner"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

