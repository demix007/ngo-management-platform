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
  useCreateProject,
  useUpdateProject,
} from "../hooks/use-projects";
import { usePartners } from "@/features/partners/hooks/use-partners";
import type { Project } from "@/types";
import {
  Plus,
  X,
  Building2,
  DollarSign,
  Calendar,
  Users,
  FileText,
  TrendingUp,
  Image,
  Target,
  MapPin,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  type: z.enum([
    "construction",
    "renovation",
    "hospitals",
    "water_projects",
    "skill_empowerment",
    "community_outreach",
    "grants",
    "institutional_support",
  ]),
  description: z.string().optional(),
  objectives: z.array(z.string()).optional(),
  location: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    lga: z.string().optional(),
    country: z.string().optional(),
    gpsLocation: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }).optional(),
  budget: z.object({
    allocated: z.number().min(0, "Allocated budget must be positive"),
    spent: z.number().min(0, "Spent amount must be positive"),
    currency: z.string().min(1, "Currency is required"),
    breakdown: z.array(z.object({
      id: z.string().optional(),
      category: z.string().min(1, "Category is required"),
      amount: z.number().min(0),
      description: z.string().optional(),
    })).optional(),
  }),
  timeline: z.object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    milestones: z.array(z.object({
      id: z.string().optional(),
      title: z.string().min(1, "Milestone title is required"),
      description: z.string().optional(),
      targetDate: z.string().min(1, "Target date is required"),
      status: z.enum(["pending", "in_progress", "completed", "overdue"]),
      completionDate: z.string().optional(),
    })).optional(),
  }),
  contractors: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Contractor name is required"),
    type: z.enum(["contractor", "partner", "supplier"]),
    contactPerson: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phoneNumber: z.string().optional(),
    contractAmount: z.number().optional(),
    contractStartDate: z.string().optional(),
    contractEndDate: z.string().optional(),
    status: z.enum(["active", "completed", "terminated"]),
  })).optional(),
  partnerIds: z.array(z.string()).optional(),
  documents: z.array(z.object({
    id: z.string().optional(),
    title: z.string().min(1, "Document title is required"),
    type: z.enum(["contract", "proposal", "report", "permit", "certificate", "other"]),
    documentUrl: z.string().min(1, "Document URL is required").or(z.literal("")),
    uploadedAt: z.string().optional(),
    uploadedBy: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  activityLog: z.array(z.object({
    id: z.string().optional(),
    date: z.string().min(1, "Date is required"),
    user: z.string().min(1, "User is required"),
    userName: z.string().optional(),
    action: z.string().min(1, "Action is required"),
    description: z.string().min(1, "Description is required"),
    attachments: z.array(z.string()).optional(),
  })).optional(),
  progress: z.object({
    percentage: z.number().min(0).max(100, "Progress must be between 0 and 100"),
    lastUpdated: z.string().optional(),
    notes: z.string().optional(),
  }),
  media: z.array(z.object({
    id: z.string().optional(),
    type: z.enum(["photo", "video"]),
    url: z.string().min(1, "Media URL is required").or(z.literal("")),
    caption: z.string().optional(),
    uploadedAt: z.string().optional(),
    uploadedBy: z.string().optional(),
  })).optional(),
  completionCertificate: z.object({
    certificateUrl: z.string().url("Invalid URL").min(1, "Certificate URL is required"),
    issuedDate: z.string().optional(),
    issuedBy: z.string().optional(),
    certificateNumber: z.string().optional(),
  }).optional(),
  impactSummary: z.object({
    beneficiariesReached: z.number().optional(),
    communitiesImpacted: z.number().optional(),
    outcomes: z.union([z.array(z.string()), z.string()]).optional(),
    metrics: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
    notes: z.string().optional(),
  }).optional(),
  status: z.enum(["planning", "in_progress", "on_hold", "completed", "cancelled"]),
  notes: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormComprehensiveProps {
  project?: Project;
  onSuccess?: () => void;
}

export function ProjectFormComprehensive({
  project,
  onSuccess,
}: ProjectFormComprehensiveProps) {
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const { user } = useAuthStore();
  const { data: partners } = usePartners();
  const [activeTab, setActiveTab] = useState("basic");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<ProjectFormData>({
    mode: "onChange",
    resolver: zodResolver(projectSchema),
    defaultValues: project
      ? {
          ...project,
          timeline: {
            ...project.timeline,
            startDate: project.timeline.startDate.toISOString().split("T")[0],
            endDate: project.timeline.endDate?.toISOString().split("T")[0],
            milestones: project.timeline.milestones?.map((m) => ({
              ...m,
              targetDate: m.targetDate.toISOString().split("T")[0],
              completionDate: m.completionDate?.toISOString().split("T")[0],
            })),
          },
          contractors: project.contractors?.map((c) => ({
            ...c,
            contractStartDate: c.contractStartDate?.toISOString().split("T")[0],
            contractEndDate: c.contractEndDate?.toISOString().split("T")[0],
          })),
          documents: project.documents?.map((d) => ({
            ...d,
            uploadedAt: d.uploadedAt.toISOString().split("T")[0],
          })),
          activityLog: project.activityLog?.map((a) => ({
            ...a,
            date: a.date.toISOString().split("T")[0],
          })),
          progress: {
            ...project.progress,
            lastUpdated: project.progress.lastUpdated.toISOString().split("T")[0],
          },
          media: project.media?.map((m) => ({
            ...m,
            uploadedAt: m.uploadedAt.toISOString().split("T")[0],
          })),
          completionCertificate: project.completionCertificate ? {
            ...project.completionCertificate,
            issuedDate: project.completionCertificate.issuedDate?.toISOString().split("T")[0],
          } : undefined,
          impactSummary: project.impactSummary ? {
            ...project.impactSummary,
            outcomes: project.impactSummary.outcomes 
              ? (Array.isArray(project.impactSummary.outcomes)
                  ? project.impactSummary.outcomes.join('\n')
                  : project.impactSummary.outcomes)
              : undefined,
          } : undefined,
        }
      : {
          type: "construction",
          status: "planning",
          objectives: [],
          budget: {
            allocated: 0,
            spent: 0,
            currency: "NGN",
          },
          timeline: {
            startDate: new Date().toISOString().split("T")[0],
          },
          progress: {
            percentage: 0,
            lastUpdated: new Date().toISOString().split("T")[0],
          },
        },
  });

  const {
    fields: objectiveFields,
    append: appendObjective,
    remove: removeObjective,
  } = useFieldArray({
    control,
    // @ts-expect-error - TypeScript inference issue with optional array fields
    name: "objectives",
  });

  const {
    fields: breakdownFields,
    append: appendBreakdown,
    remove: removeBreakdown,
  } = useFieldArray({
    control,
    name: "budget.breakdown",
  });

  const {
    fields: milestoneFields,
    append: appendMilestone,
    remove: removeMilestone,
  } = useFieldArray({
    control,
    name: "timeline.milestones",
  });

  const {
    fields: contractorFields,
    append: appendContractor,
    remove: removeContractor,
  } = useFieldArray({
    control,
    name: "contractors",
  });

  const {
    fields: documentFields,
    append: appendDocument,
    remove: removeDocument,
  } = useFieldArray({
    control,
    name: "documents",
  });

  const {
    fields: activityFields,
    append: appendActivity,
    remove: removeActivity,
  } = useFieldArray({
    control,
    name: "activityLog",
  });

  const {
    fields: mediaFields,
    append: appendMedia,
    remove: removeMedia,
  } = useFieldArray({
    control,
    name: "media",
  });

  const selectedPartners = watch("partnerIds") || [];

  // File upload handler for documents
  const handleDocumentUpload = async (
    file: File,
    documentIndex: number
  ): Promise<string | null> => {
    try {
      // Create a unique file path
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `projects/${project?.id || "new"}/documents/${fileName}`;
      const storageRef = ref(storage, filePath);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update form with the new document URL
      setValue(
        `documents.${documentIndex}.documentUrl`,
        downloadURL,
        { shouldValidate: true }
      );

      // Set uploaded date and user
      setValue(
        `documents.${documentIndex}.uploadedAt`,
        new Date().toISOString().split("T")[0],
        { shouldValidate: true }
      );
      setValue(
        `documents.${documentIndex}.uploadedBy`,
        user?.id || "",
        { shouldValidate: true }
      );

      return downloadURL;
    } catch (error) {
      console.error("Document upload error:", error);
      return null;
    }
  };

  // Remove document handler
  const handleRemoveDocument = (documentIndex: number) => {
    setValue(
      `documents.${documentIndex}.documentUrl`,
      "",
      { shouldValidate: true }
    );
  };

  // File upload handler for media (photos/videos)
  const handleMediaUpload = async (
    file: File,
    mediaIndex: number,
    mediaType: "photo" | "video"
  ): Promise<string | null> => {
    try {
      // Create a unique file path
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${timestamp}_${sanitizedFileName}`;
      const filePath = `projects/${project?.id || "new"}/media/${mediaType}/${fileName}`;
      const storageRef = ref(storage, filePath);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update form with the new media URL
      setValue(
        `media.${mediaIndex}.url`,
        downloadURL,
        { shouldValidate: true }
      );

      // Set uploaded date and user
      setValue(
        `media.${mediaIndex}.uploadedAt`,
        new Date().toISOString().split("T")[0],
        { shouldValidate: true }
      );
      setValue(
        `media.${mediaIndex}.uploadedBy`,
        user?.id || "",
        { shouldValidate: true }
      );

      return downloadURL;
    } catch (error) {
      console.error("Media upload error:", error);
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'storage/unauthorized') {
        alert("Permission denied. Please check that you are logged in and have permission to upload files.");
      } else if (firebaseError.code === 'storage/quota-exceeded') {
        alert("Storage quota exceeded. Please contact administrator.");
      } else {
        alert(`Upload failed: ${firebaseError.message || "Unknown error"}`);
      }
      return null;
    }
  };

  // Remove media handler
  const handleRemoveMedia = (mediaIndex: number) => {
    setValue(
      `media.${mediaIndex}.url`,
      "",
      { shouldValidate: true }
    );
  };

  const onSubmit = async (data: ProjectFormData) => {
    try {
      console.log("Form submitted with data:", data);

      const projectData: Omit<
        Project,
        "id" | "createdAt" | "updatedAt"
      > = {
        ...data,
        budget: {
          ...data.budget,
          breakdown: data.budget.breakdown?.map((item) => ({
            id: item.id || crypto.randomUUID(),
            category: item.category,
            amount: item.amount,
            description: item.description,
          })),
        },
        timeline: {
          startDate: new Date(data.timeline.startDate),
          endDate: data.timeline.endDate ? new Date(data.timeline.endDate) : undefined,
          milestones: data.timeline.milestones?.map((m) => ({
            id: m.id || crypto.randomUUID(),
            title: m.title,
            description: m.description,
            targetDate: new Date(m.targetDate),
            status: m.status,
            completionDate: m.completionDate ? new Date(m.completionDate) : undefined,
          })),
        },
        contractors: data.contractors?.map((c) => ({
          id: c.id || crypto.randomUUID(),
          name: c.name,
          type: c.type,
          contactPerson: c.contactPerson,
          email: c.email,
          phoneNumber: c.phoneNumber,
          contractAmount: c.contractAmount,
          contractStartDate: c.contractStartDate ? new Date(c.contractStartDate) : undefined,
          contractEndDate: c.contractEndDate ? new Date(c.contractEndDate) : undefined,
          status: c.status,
        })),
        partnerIds: data.partnerIds || [],
        partnerNames: partners
          ?.filter((p) => data.partnerIds?.includes(p.id))
          .map((p) => p.name),
        documents: data.documents?.map((d) => ({
          id: d.id || crypto.randomUUID(),
          title: d.title,
          type: d.type,
          documentUrl: d.documentUrl || "",
          uploadedAt: d.uploadedAt ? new Date(d.uploadedAt) : new Date(),
          uploadedBy: d.uploadedBy || user?.id || "",
          description: d.description,
        })),
        activityLog: data.activityLog?.map((a) => ({
          id: a.id || crypto.randomUUID(),
          date: new Date(a.date),
          user: a.user,
          userName: a.userName || user?.displayName,
          action: a.action,
          description: a.description,
          attachments: a.attachments || [],
        })),
        progress: {
          percentage: data.progress.percentage,
          lastUpdated: data.progress.lastUpdated ? new Date(data.progress.lastUpdated) : new Date(),
          notes: data.progress.notes,
        },
        media: data.media?.map((m) => ({
          id: m.id || crypto.randomUUID(),
          type: m.type,
          url: m.url,
          caption: m.caption,
          uploadedAt: m.uploadedAt ? new Date(m.uploadedAt) : new Date(),
          uploadedBy: m.uploadedBy || user?.id,
        })),
        completionCertificate: data.completionCertificate ? {
          certificateUrl: data.completionCertificate.certificateUrl,
          issuedDate: data.completionCertificate.issuedDate ? new Date(data.completionCertificate.issuedDate) : undefined,
          issuedBy: data.completionCertificate.issuedBy,
          certificateNumber: data.completionCertificate.certificateNumber,
        } : undefined,
        impactSummary: data.impactSummary ? {
          ...data.impactSummary,
          outcomes: data.impactSummary.outcomes 
            ? (typeof data.impactSummary.outcomes === 'string' 
                ? data.impactSummary.outcomes.split('\n').filter(o => o.trim())
                : data.impactSummary.outcomes)
            : undefined,
        } : undefined,
        createdBy: project?.createdBy || user?.id || "",
      };

      if (project) {
        await updateMutation.mutateAsync({ id: project.id, ...projectData });
      } else {
        console.log("Creating project with data:", projectData);
        await createMutation.mutateAsync(projectData);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleFormError = (validationErrors: FieldErrors<ProjectFormData>) => {
    console.error("Form validation errors:", validationErrors);
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: Building2 },
    { id: "location", label: "Location", icon: MapPin },
    { id: "budget", label: "Budget", icon: DollarSign },
    { id: "timeline", label: "Timeline", icon: Calendar },
    { id: "contractors", label: "Contractors/Partners", icon: Users },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "media", label: "Photos/Videos", icon: Image },
    { id: "impact", label: "Impact Summary", icon: Target },
  ];

  const typeOptions = [
    { value: "construction", label: "Construction" },
    { value: "renovation", label: "Renovation" },
    { value: "hospitals", label: "Hospitals" },
    { value: "water_projects", label: "Water Projects" },
    { value: "skill_empowerment", label: "Skill Empowerment" },
    { value: "community_outreach", label: "Community Outreach" },
    { value: "grants", label: "Grants" },
    { value: "institutional_support", label: "Institutional Support" },
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
            {project ? "Edit Project" : "Create New Project"}
          </CardTitle>
          <CardDescription className="text-blue-100">
            {project
              ? "Update project information"
              : "Enter comprehensive project details"}
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
                    className={`px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
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
                    <Label htmlFor="name">Project Name *</Label>
                    <Input id="name" {...register("name")} />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Project Type *</Label>
                    <Select
                      value={watch("type") || ""}
                      onValueChange={(value) => {
                        setValue(
                          "type",
                          value as ProjectFormData["type"],
                          { shouldValidate: true }
                        );
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-sm text-destructive">
                        {errors.type.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    rows={4}
                    placeholder="Enter project description..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Objectives</Label>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => (appendObjective as unknown as (value: string) => void)("")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Objective
                    </Button>
                  </div>
                  {objectiveFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <Input
                        {...register(`objectives.${index}`)}
                        placeholder="Enter objective..."
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeObjective(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={watch("status") || ""}
                    onValueChange={(value) => {
                      setValue(
                        "status",
                        value as ProjectFormData["status"],
                        { shouldValidate: true }
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-destructive">
                      {errors.status.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    rows={3}
                    placeholder="Enter any additional notes..."
                  />
                </div>
              </motion.div>
            )}

            {/* Location Tab */}
            {activeTab === "location" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="location.address">Address</Label>
                    <Input
                      id="location.address"
                      {...register("location.address")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location.city">City</Label>
                    <Input id="location.city" {...register("location.city")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location.state">State</Label>
                    <Input
                      id="location.state"
                      {...register("location.state")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location.lga">LGA</Label>
                    <Input id="location.lga" {...register("location.lga")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location.country">Country</Label>
                    <Input
                      id="location.country"
                      {...register("location.country")}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Budget Tab */}
            {activeTab === "budget" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget.allocated">Allocated Budget *</Label>
                    <Input
                      id="budget.allocated"
                      type="number"
                      step="0.01"
                      {...register("budget.allocated", { valueAsNumber: true })}
                    />
                    {errors.budget?.allocated && (
                      <p className="text-sm text-destructive">
                        {errors.budget.allocated.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget.spent">Spent Amount *</Label>
                    <Input
                      id="budget.spent"
                      type="number"
                      step="0.01"
                      {...register("budget.spent", { valueAsNumber: true })}
                    />
                    {errors.budget?.spent && (
                      <p className="text-sm text-destructive">
                        {errors.budget.spent.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget.currency">Currency *</Label>
                    <Input
                      id="budget.currency"
                      {...register("budget.currency")}
                    />
                    {errors.budget?.currency && (
                      <p className="text-sm text-destructive">
                        {errors.budget.currency.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Budget Breakdown</Label>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() =>
                        appendBreakdown({
                          category: "",
                          amount: 0,
                          description: "",
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                  {breakdownFields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Item {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBreakdown(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Category *</Label>
                          <Input
                            {...register(`budget.breakdown.${index}.category`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Amount *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`budget.breakdown.${index}.amount`, {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            {...register(`budget.breakdown.${index}.description`)}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <CustomDatePicker
                      control={control}
                      name="timeline.startDate"
                      label="Start Date *"
                      placeholder="Select start date"
                    />
                    {errors.timeline?.startDate && (
                      <p className="text-sm text-destructive">
                        {errors.timeline.startDate.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <CustomDatePicker
                      control={control}
                      name="timeline.endDate"
                      label="End Date"
                      placeholder="Select end date"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Milestones</Label>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() =>
                        appendMilestone({
                          title: "",
                          description: "",
                          targetDate: new Date().toISOString().split("T")[0],
                          status: "pending",
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Milestone
                    </Button>
                  </div>
                  {milestoneFields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Milestone {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMilestone(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Title *</Label>
                          <Input
                            {...register(`timeline.milestones.${index}.title`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={watch(`timeline.milestones.${index}.status`)}
                            onValueChange={(value) =>
                              setValue(
                                `timeline.milestones.${index}.status`,
                                value as "pending" | "in_progress" | "completed" | "overdue"
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <CustomDatePicker
                            control={control}
                            name={`timeline.milestones.${index}.targetDate`}
                            label="Target Date *"
                            placeholder="Select target date"
                          />
                        </div>
                        <div className="space-y-2">
                          <CustomDatePicker
                            control={control}
                            name={`timeline.milestones.${index}.completionDate`}
                            label="Completion Date"
                            placeholder="Select completion date"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Description</Label>
                          <Textarea
                            {...register(`timeline.milestones.${index}.description`)}
                            rows={2}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Contractors/Partners Tab */}
            {activeTab === "contractors" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Partners</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                    {partners?.map((partner) => (
                      <div key={partner.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`partner-${partner.id}`}
                          checked={selectedPartners.includes(partner.id)}
                          onChange={(e) => {
                            const currentPartners = selectedPartners;
                            if (e.target.checked) {
                              setValue(
                                "partnerIds",
                                [...currentPartners, partner.id]
                              );
                            } else {
                              setValue(
                                "partnerIds",
                                currentPartners.filter((id) => id !== partner.id)
                              );
                            }
                          }}
                          className="rounded"
                        />
                        <Label
                          htmlFor={`partner-${partner.id}`}
                          className="font-normal cursor-pointer"
                        >
                          {partner.name}
                        </Label>
                      </div>
                    ))}
                    {(!partners || partners.length === 0) && (
                      <p className="text-sm text-muted-foreground">
                        No partners available
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Contractors/Partners</Label>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() =>
                        appendContractor({
                          name: "",
                          type: "contractor",
                          status: "active",
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contractor / Partner
                    </Button>
                  </div>
                  {contractorFields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Contractor {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContractor(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Name *</Label>
                          <Input
                            {...register(`contractors.${index}.name`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={watch(`contractors.${index}.type`)}
                            onValueChange={(value) =>
                              setValue(
                                `contractors.${index}.type`,
                                value as "contractor" | "partner" | "supplier"
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="contractor">Contractor</SelectItem>
                              <SelectItem value="partner">Partner</SelectItem>
                              <SelectItem value="supplier">Supplier</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Contact Person</Label>
                          <Input
                            {...register(`contractors.${index}.contactPerson`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            {...register(`contractors.${index}.email`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <Input
                            {...register(`contractors.${index}.phoneNumber`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Contract Amount</Label>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`contractors.${index}.contractAmount`, {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <CustomDatePicker
                            control={control}
                            name={`contractors.${index}.contractStartDate`}
                            label="Contract Start Date"
                            placeholder="Select date"
                          />
                        </div>
                        <div className="space-y-2">
                          <CustomDatePicker
                            control={control}
                            name={`contractors.${index}.contractEndDate`}
                            label="Contract End Date"
                            placeholder="Select date"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={watch(`contractors.${index}.status`)}
                            onValueChange={(value) =>
                              setValue(
                                `contractors.${index}.status`,
                                value as "active" | "completed" | "terminated"
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="terminated">Terminated</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">Documents</Label>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() =>
                      appendDocument({
                        title: "",
                        type: "other",
                        documentUrl: "",
                        description: "",
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </div>

                {documentFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Document {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          {...register(`documents.${index}.title`)}
                        />
                        {errors.documents?.[index]?.title && (
                          <p className="text-sm text-destructive">
                            {errors.documents[index]?.title?.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={watch(`documents.${index}.type`)}
                          onValueChange={(value) =>
                            setValue(
                              `documents.${index}.type`,
                              value as "contract" | "proposal" | "report" | "permit" | "certificate" | "other"
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="proposal">Proposal</SelectItem>
                            <SelectItem value="report">Report</SelectItem>
                            <SelectItem value="permit">Permit</SelectItem>
                            <SelectItem value="certificate">Certificate</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Document *</Label>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleDocumentUpload(file, index);
                              }
                              // Reset input
                              e.target.value = "";
                            }}
                            className="cursor-pointer"
                          />
                          <p className="text-xs text-muted-foreground">
                            Accepted formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
                          </p>
                          {watch(`documents.${index}.documentUrl`) && (
                            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                              <a
                                href={watch(`documents.${index}.documentUrl`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex-1 truncate"
                              >
                                {watch(`documents.${index}.documentUrl`)?.split("/").pop() || "Document"}
                              </a>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveDocument(index)}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          <Input
                            {...register(`documents.${index}.documentUrl`)}
                            placeholder="Or enter document URL manually"
                            className="mt-2"
                          />
                          {errors.documents?.[index]?.documentUrl && (
                            <p className="text-sm text-destructive">
                              {errors.documents[index]?.documentUrl?.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          {...register(`documents.${index}.description`)}
                          rows={2}
                        />
                      </div>
                    </div>
                    {errors.documents?.[index] && (
                      <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-sm text-destructive">
                          {errors.documents[index]?.title?.message ||
                            errors.documents[index]?.documentUrl?.message}
                        </p>
                      </div>
                    )}
                  </Card>
                ))}
              </motion.div>
            )}

            {/* Progress Tab */}
            {activeTab === "progress" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="progress.percentage">Progress Percentage *</Label>
                  <Input
                    id="progress.percentage"
                    type="number"
                    min="0"
                    max="100"
                    {...register("progress.percentage", { valueAsNumber: true })}
                  />
                  {errors.progress?.percentage && (
                    <p className="text-sm text-destructive">
                      {errors.progress.percentage.message}
                    </p>
                  )}
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all"
                        style={{
                          width: `${watch("progress.percentage") || 0}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {watch("progress.percentage") || 0}% Complete
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="progress.notes">Progress Notes</Label>
                  <Textarea
                    id="progress.notes"
                    {...register("progress.notes")}
                    rows={4}
                    placeholder="Enter progress notes..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Activity Log</Label>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() =>
                        appendActivity({
                          date: new Date().toISOString().split("T")[0],
                          user: user?.id || "",
                          userName: user?.displayName,
                          action: "",
                          description: "",
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Activity
                    </Button>
                  </div>
                  {activityFields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Activity {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeActivity(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <CustomDatePicker
                            control={control}
                            name={`activityLog.${index}.date`}
                            label="Date *"
                            placeholder="Select date"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Action *</Label>
                          <Input
                            {...register(`activityLog.${index}.action`)}
                            placeholder="e.g., Site Visit, Meeting, etc."
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Description *</Label>
                          <Textarea
                            {...register(`activityLog.${index}.description`)}
                            rows={3}
                            placeholder="Enter activity description..."
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Media Tab */}
            {activeTab === "media" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">Photos/Videos</Label>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() =>
                      appendMedia({
                        type: "photo",
                        url: "",
                        caption: "",
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Media
                  </Button>
                </div>

                {mediaFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Media {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedia(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={watch(`media.${index}.type`)}
                          onValueChange={(value) =>
                            setValue(
                              `media.${index}.type`,
                              value as "photo" | "video"
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="photo">Photo</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Media *</Label>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept={watch(`media.${index}.type`) === "video" 
                              ? "video/*,.mp4,.mov,.avi,.wmv,.flv,.webm" 
                              : "image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp"}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const mediaType = watch(`media.${index}.type`) as "photo" | "video";
                                handleMediaUpload(file, index, mediaType);
                              }
                              // Reset input
                              e.target.value = "";
                            }}
                            className="cursor-pointer"
                          />
                          <p className="text-xs text-muted-foreground">
                            {watch(`media.${index}.type`) === "video"
                              ? "Accepted formats: MP4, MOV, AVI, WMV, FLV, WEBM"
                              : "Accepted formats: JPG, PNG, GIF, WEBP, BMP"}
                          </p>
                          {watch(`media.${index}.url`) && (
                            <div className="space-y-2">
                              {watch(`media.${index}.type`) === "photo" ? (
                                <div className="relative">
                                  <img
                                    src={watch(`media.${index}.url`)}
                                    alt={watch(`media.${index}.caption`) || "Uploaded photo"}
                                    className="w-full h-48 object-cover rounded-md border"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveMedia(index)}
                                    className="absolute top-2 right-2 bg-destructive/80 hover:bg-destructive text-white"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="relative">
                                  <video
                                    src={watch(`media.${index}.url`)}
                                    controls
                                    className="w-full h-48 rounded-md border"
                                    onError={(e) => {
                                      (e.target as HTMLVideoElement).style.display = 'none';
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveMedia(index)}
                                    className="absolute top-2 right-2 bg-destructive/80 hover:bg-destructive text-white"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                              <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                                <a
                                  href={watch(`media.${index}.url`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex-1 truncate"
                                >
                                  {watch(`media.${index}.url`)?.split("/").pop() || "Media file"}
                                </a>
                              </div>
                            </div>
                          )}
                          <Input
                            {...register(`media.${index}.url`)}
                            placeholder="Or enter media URL manually"
                            className="mt-2"
                          />
                          {errors.media?.[index]?.url && (
                            <p className="text-sm text-destructive">
                              {errors.media[index]?.url?.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Caption</Label>
                        <Input
                          {...register(`media.${index}.caption`)}
                          placeholder="Enter caption..."
                        />
                      </div>
                    </div>
                    {errors.media?.[index] && (
                      <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-sm text-destructive">
                          {errors.media[index]?.url?.message}
                        </p>
                      </div>
                    )}
                  </Card>
                ))}

                <div className="space-y-2">
                  <Label htmlFor="completionCertificate.certificateUrl">
                    Completion Certificate URL
                  </Label>
                  <Input
                    id="completionCertificate.certificateUrl"
                    {...register("completionCertificate.certificateUrl")}
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="completionCertificate.certificateNumber">
                      Certificate Number
                    </Label>
                    <Input
                      id="completionCertificate.certificateNumber"
                      {...register("completionCertificate.certificateNumber")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="completionCertificate.issuedBy">
                      Issued By
                    </Label>
                    <Input
                      id="completionCertificate.issuedBy"
                      {...register("completionCertificate.issuedBy")}
                    />
                  </div>
                  <div className="space-y-2">
                    <CustomDatePicker
                      control={control}
                      name="completionCertificate.issuedDate"
                      label="Issued Date"
                      placeholder="Select date"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Impact Summary Tab */}
            {activeTab === "impact" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="impactSummary.beneficiariesReached">
                      Beneficiaries Reached
                    </Label>
                    <Input
                      id="impactSummary.beneficiariesReached"
                      type="number"
                      {...register("impactSummary.beneficiariesReached", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="impactSummary.communitiesImpacted">
                      Communities Impacted
                    </Label>
                    <Input
                      id="impactSummary.communitiesImpacted"
                      type="number"
                      {...register("impactSummary.communitiesImpacted", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="impactSummary.outcomes">Outcomes</Label>
                  <Textarea
                    id="impactSummary.outcomes"
                    {...register("impactSummary.outcomes")}
                    rows={4}
                    placeholder="Enter outcomes (one per line)..."
                    value={(() => {
                      const outcomes = watch("impactSummary.outcomes")
                      if (!outcomes) return ''
                      if (Array.isArray(outcomes)) {
                        return outcomes.join('\n')
                      }
                      return outcomes
                    })()}
                    onChange={(e) => {
                      const value = e.target.value
                      setValue("impactSummary.outcomes", value, { shouldValidate: false })
                    }}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter each outcome on a new line
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="impactSummary.notes">Impact Notes</Label>
                  <Textarea
                    id="impactSummary.notes"
                    {...register("impactSummary.notes")}
                    rows={6}
                    placeholder="Enter impact summary notes..."
                  />
                </div>
              </motion.div>
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
                  : project
                    ? "Update Project"
                    : "Create Project"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

