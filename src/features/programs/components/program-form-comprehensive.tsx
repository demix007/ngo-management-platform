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
import { useCreateProgram, useUpdateProgram } from "../hooks/use-programs";
import type { Program } from "@/types";
import {
  Plus,
  X,
  Upload,
  FileText,
  DollarSign,
  Users,
  MapPin,
  Target,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { storage, auth } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const programSchema = z.object({
  title: z.string().min(1, "Program title is required"),
  objectives: z
    .array(z.string().min(1, "Objective cannot be empty"))
    .min(1, "At least one objective is required"),
  description: z.string().optional(),
  type: z.enum([
    "health",
    "prison_clearance",
    "women_empowerment",
    "education",
    "other",
  ]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  states: z.array(z.string()).min(1, "At least one state is required"),
  lgas: z.array(z.string()).optional(),
  location: z
    .object({
      address: z.string().optional(),
      city: z.string().optional(),
      gpsLocation: z
        .object({
          latitude: z.number(),
          longitude: z.number(),
        })
        .optional(),
    })
    .optional(),
  partners: z.array(z.string()).optional(),
  targetBeneficiaries: z.coerce.number().min(0),
  actualBeneficiaries: z.coerce.number().min(0).default(0),
  beneficiaryIds: z.array(z.string()).optional(),
  budget: z.object({
    allocated: z.coerce.number().min(0),
    spent: z.coerce.number().min(0).default(0),
    currency: z.string().default("NGN"),
  }),
  expenditures: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        amount: z.coerce.number().min(0),
        date: z.string().min(1, "Date is required"),
        category: z.enum([
          "personnel",
          "equipment",
          "transport",
          "venue",
          "materials",
          "other",
        ]),
        receiptUrl: z.string().nullable().optional(), // Allows string, null, or undefined
      })
    )
    .optional(),
  media: z
    .array(
      z.object({
        type: z.enum(["photo", "video", "document"]),
        url: z.string().min(1, "URL is required"),
        caption: z.string().optional(),
      })
    )
    .optional(),
  documentation: z
    .array(
      z.object({
        title: z.string().min(1, "Title is required"),
        type: z.enum(["report", "proposal", "agreement", "other"]),
        url: z.string().min(1, "URL is required"),
      })
    )
    .optional(),
  monitoringReports: z
    .array(
      z.object({
        title: z.string().min(1, "Title is required"),
        reportDate: z.string().min(1, "Report date is required"),
        reporter: z.string().min(1, "Reporter is required"),
        content: z.string().min(1, "Content is required"),
        metrics: z
          .record(z.string(), z.union([z.number(), z.string()]))
          .optional(),
        attachments: z.array(z.string()).optional(),
      })
    )
    .optional(),
  evaluationReports: z
    .array(
      z.object({
        title: z.string().min(1, "Title is required"),
        reportDate: z.string().min(1, "Report date is required"),
        evaluator: z.string().min(1, "Evaluator is required"),
        content: z.string().min(1, "Content is required"),
        findings: z.array(z.string()).optional(),
        recommendations: z.array(z.string()).optional(),
        attachments: z.array(z.string()).optional(),
      })
    )
    .optional(),
  impactScore: z.coerce.number().min(0).max(100).optional(),
  impactMetrics: z
    .object({
      beneficiariesReached: z.coerce.number().min(0).default(0),
      objectivesAchieved: z.coerce.number().min(0).default(0),
      totalObjectives: z.coerce.number().min(0).default(0),
      satisfactionScore: z.coerce.number().min(0).max(100).optional(),
      outcomes: z.array(z.string()).optional(),
    })
    .optional(),
  status: z.enum(["planning", "active", "completed", "cancelled"]),
});

type ProgramFormData = z.infer<typeof programSchema>;

interface ProgramFormComprehensiveProps {
  program?: Program;
  onSuccess?: () => void;
}

export function ProgramFormComprehensive({
  program,
  onSuccess,
}: ProgramFormComprehensiveProps) {
  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("basic");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    getValues,
  } = useForm<ProgramFormData>({
    // @ts-expect-error - zodResolver type mismatch with react-hook-form versions
    resolver: zodResolver(programSchema),
    defaultValues: program
      ? {
          ...program,
          startDate: program.startDate.toISOString().split("T")[0],
          endDate: program.endDate?.toISOString().split("T")[0],
          expenditures: program.expenditures?.map((e) => ({
            ...e,
            date: e.date.toISOString().split("T")[0],
            receiptUrl: e.receiptUrl || undefined, // Convert null to undefined for form
          })),
          monitoringReports: program.monitoringReports?.map((r) => ({
            ...r,
            reportDate: r.reportDate.toISOString().split("T")[0],
            attachments: r.attachments || [],
          })),
          evaluationReports: program.evaluationReports?.map((r) => ({
            ...r,
            reportDate: r.reportDate.toISOString().split("T")[0],
            attachments: r.attachments || [],
          })),
        }
      : {
          type: "other",
          status: "planning",
          budget: { allocated: 0, spent: 0, currency: "NGN" },
          targetBeneficiaries: 0,
          actualBeneficiaries: 0,
          objectives: [""],
          states: [],
        },
  });

  const objectives = watch("objectives") || [];
  const states = watch("states") || [];

  const {
    fields: expenditureFields,
    append: appendExpenditure,
    remove: removeExpenditure,
  } = useFieldArray({
    control,
    name: "expenditures",
  });

  const {
    fields: mediaFields,
    append: appendMedia,
    remove: removeMedia,
  } = useFieldArray({
    control,
    name: "media",
  });

  const {
    fields: docFields,
    append: appendDoc,
    remove: removeDoc,
  } = useFieldArray({
    control,
    name: "documentation",
  });

  const {
    fields: monitoringFields,
    append: appendMonitoring,
    remove: removeMonitoring,
  } = useFieldArray({
    control,
    name: "monitoringReports",
  });

  const {
    fields: evaluationFields,
    append: appendEvaluation,
    remove: removeEvaluation,
  } = useFieldArray({
    control,
    name: "evaluationReports",
  });

  // File upload handler
  const handleFileUpload = async (
    file: File,
    reportType: "monitoring" | "evaluation",
    reportIndex: number
  ): Promise<string | null> => {
    try {
      // Verify Firebase Auth user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error("User not authenticated in Firebase Auth");
        alert("Please log in again to upload files.");
        return null;
      }

      // Create a unique file path
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${timestamp}_${sanitizedFileName}`;
      
      // Use user-specific temp path for new programs, or program path for existing programs
      const filePath = program?.id 
        ? `programs/${program.id}/reports/${reportType}/${fileName}`
        : `temp/${currentUser.uid}/programs/${reportType}/${fileName}`;
      
      const storageRef = ref(storage, filePath);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update form with the new attachment URL
      const fieldName = `${reportType}Reports.${reportIndex}.attachments` as
        | "monitoringReports.0.attachments"
        | "evaluationReports.0.attachments";
      const currentAttachments = getValues(fieldName) || [];
      setValue(
        fieldName,
        [...currentAttachments, downloadURL],
        { shouldValidate: true }
      );

      return downloadURL;
    } catch (error) {
      console.error("File upload error:", error);
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

  // Remove attachment handler
  const handleRemoveAttachment = (
    reportType: "monitoring" | "evaluation",
    reportIndex: number,
    attachmentIndex: number
  ) => {
    const fieldName = `${reportType}Reports.${reportIndex}.attachments` as
      | "monitoringReports.0.attachments"
      | "evaluationReports.0.attachments";
    const currentAttachments = getValues(fieldName) || [];
    const updatedAttachments = currentAttachments.filter(
      (_, idx) => idx !== attachmentIndex
    );
    setValue(
      fieldName,
      updatedAttachments,
      { shouldValidate: true }
    );
  };

  const onSubmit = async (data: ProgramFormData) => {
    try {
      console.log("Form submitted with data:", data);

      // Validate that objectives are not empty strings
      const validObjectives = data.objectives.filter(
        (obj) => obj.trim().length > 0
      );
      if (validObjectives.length === 0) {
        console.error("At least one non-empty objective is required");
        return;
      }

      // Validate that states are not empty strings
      const validStates = data.states.filter(
        (state) => state.trim().length > 0
      );
      if (validStates.length === 0) {
        console.error("At least one non-empty state is required");
        return;
      }

      // Build program data, explicitly handling each field to avoid undefined values
      const programData: Partial<Program> = {
        title: data.title,
        objectives: validObjectives,
        description: data.description,
        type: data.type,
        status: data.status,
        states: validStates,
        lgas: data.lgas || [],
        location: data.location,
        partners: data.partners || [],
        targetBeneficiaries: data.targetBeneficiaries || 0,
        actualBeneficiaries: data.actualBeneficiaries || 0,
        beneficiaryIds: data.beneficiaryIds || [],
        budget: data.budget,
        startDate: new Date(data.startDate),
        expenditures: data.expenditures?.map((e) => {
          const expenditure: {
            id: string;
            description: string;
            amount: number;
            date: Date;
            category: 'personnel' | 'equipment' | 'transport' | 'venue' | 'materials' | 'other';
            receiptUrl?: string;
          } = {
            id: crypto.randomUUID(),
            description: e.description,
            amount: e.amount,
            date: new Date(e.date),
            category: e.category as 'personnel' | 'equipment' | 'transport' | 'venue' | 'materials' | 'other',
          };
          // Only include receiptUrl if it exists
          if (e.receiptUrl) {
            expenditure.receiptUrl = e.receiptUrl;
          }
          return expenditure;
        }),
        media: data.media?.map((m) => {
          const mediaItem: {
            id: string;
            type: 'photo' | 'video' | 'document';
            url: string;
            uploadedAt: Date;
            caption?: string;
          } = {
            id: crypto.randomUUID(),
            type: m.type as 'photo' | 'video' | 'document',
            url: m.url,
            uploadedAt: new Date(),
          };
          // Only include caption if it exists
          if (m.caption) {
            mediaItem.caption = m.caption;
          }
          return mediaItem;
        }),
        documentation: data.documentation?.map((d) => ({
          id: crypto.randomUUID(),
          title: d.title,
          type: d.type,
          url: d.url,
          uploadedAt: new Date(),
        })),
        monitoringReports: data.monitoringReports?.map((r) => {
          const report: {
            id: string;
            title: string;
            reportDate: Date;
            reporter: string;
            content: string;
            attachments: string[];
            metrics?: Record<string, string | number>;
          } = {
            id: crypto.randomUUID(),
            title: r.title,
            reportDate: new Date(r.reportDate),
            reporter: r.reporter,
            content: r.content,
            attachments: r.attachments || [],
          };
          // Only include metrics if it exists and has values
          if (r.metrics && Object.keys(r.metrics).length > 0) {
            report.metrics = r.metrics as Record<string, string | number>;
          }
          return report;
        }),
        evaluationReports: data.evaluationReports?.map((r) => ({
          id: crypto.randomUUID(),
          title: r.title,
          reportDate: new Date(r.reportDate),
          evaluator: r.evaluator,
          content: r.content,
          findings: r.findings || [],
          recommendations: r.recommendations || [],
          attachments: r.attachments || [],
        })),
        impactScore: data.impactScore,
        impactMetrics: data.impactMetrics,
        createdBy: program?.createdBy || user?.id || "",
      };
      
      // Handle endDate - always include it in updates to allow setting or clearing
      if (program) {
        // For updates, always include startDate and endDate explicitly
        const updatePayload: Partial<Program> & { id: string } = {
          id: program.id,
          ...programData,
          // Explicitly include startDate to ensure it's always updated
          startDate: new Date(data.startDate),
        };
        
        // Explicitly set endDate - if empty string, set to undefined to clear it
        if (data.endDate && data.endDate.trim() !== '') {
          updatePayload.endDate = new Date(data.endDate);
        } else {
          // Explicitly set to undefined - the update hook will convert this to null for Firestore
          updatePayload.endDate = undefined;
        }
        
        await updateMutation.mutateAsync(updatePayload);
      } else {
        // For create, ensure all required fields are present
        const createData: Omit<Program, "id" | "createdAt" | "updatedAt"> = {
          title: programData.title!,
          objectives: programData.objectives!,
          type: programData.type!,
          status: programData.status!,
          states: programData.states!,
          lgas: programData.lgas || [],
          partners: programData.partners || [],
          targetBeneficiaries: programData.targetBeneficiaries || 0,
          actualBeneficiaries: programData.actualBeneficiaries || 0,
          beneficiaryIds: programData.beneficiaryIds || [],
          budget: programData.budget || { allocated: 0, spent: 0, currency: 'NGN' },
          startDate: programData.startDate!,
          createdBy: programData.createdBy || "",
          ...(programData.description && { description: programData.description }),
          ...(programData.endDate && { endDate: programData.endDate }),
          ...(programData.location && { location: programData.location }),
          ...(programData.expenditures && { expenditures: programData.expenditures }),
          ...(programData.media && { media: programData.media }),
          ...(programData.documentation && { documentation: programData.documentation }),
          ...(programData.monitoringReports && { monitoringReports: programData.monitoringReports }),
          ...(programData.evaluationReports && { evaluationReports: programData.evaluationReports }),
          ...(programData.impactScore !== undefined && { impactScore: programData.impactScore }),
          ...(programData.impactMetrics && { impactMetrics: programData.impactMetrics }),
        };
        console.log("Creating program with data:", createData);
        await createMutation.mutateAsync(createData);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Form submission error:", error);
      // Error notification is handled by the mutation hooks
    }
  };

  const handleFormError = (validationErrors: FieldErrors<ProgramFormData>) => {
    console.error("Form validation errors:", validationErrors);
    // Show validation errors to user
    const errorMessages = Object.entries(validationErrors).map(
      ([key, value]) => {
        const error = value as { message?: string } | undefined;
        return `${key}: ${error?.message || "Invalid value"}`;
      }
    );
    console.error("Validation errors:", errorMessages);
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: FileText },
    { id: "location", label: "Location", icon: MapPin },
    { id: "budget", label: "Budget & Expenditures", icon: DollarSign },
    { id: "beneficiaries", label: "Beneficiaries", icon: Users },
    { id: "media", label: "Media & Docs", icon: Upload },
    { id: "monitoring", label: "M&E Reports", icon: Target },
    { id: "impact", label: "Impact", icon: TrendingUp },
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
            {program ? "Edit Program" : "Create New Program"}
          </CardTitle>
          <CardDescription className="text-blue-100">
            {program
              ? "Update program information"
              : "Enter comprehensive program details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form
            // @ts-expect-error - react-hook-form type inference issue with complex zod schemas
            onSubmit={handleSubmit(onSubmit, handleFormError)}
            className="space-y-6"
          >
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b overflow-x-auto">
              {tabs.map((tab) => {
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
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
                <div className="space-y-2">
                  <Label htmlFor="title">Program Title *</Label>
                  <Input id="title" {...register("title")} />
                  {errors.title && (
                    <p className="text-sm text-destructive">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Objectives *</Label>
                  {objectives.map((_, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        {...register(`objectives.${index}`, {
                          required: "Objective cannot be empty",
                          validate: (value) =>
                            value.trim().length > 0 ||
                            "Objective cannot be empty",
                        })}
                        placeholder={`Objective ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newObjectives = objectives.filter(
                            (_, i) => i !== index
                          );
                          setValue(
                            "objectives",
                            newObjectives.length > 0 ? newObjectives : [""],
                            { shouldValidate: true }
                          );
                        }}
                        disabled={objectives.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() =>
                      setValue("objectives", [...objectives, ""], {
                        shouldValidate: true,
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Objective
                  </Button>
                  {errors.objectives && (
                    <p className="text-sm text-destructive">
                      {errors.objectives.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Program Type *</Label>
                    <Select
                      value={watch("type") || ""}
                      onValueChange={(value) => {
                        setValue("type", value as ProgramFormData["type"], {
                          shouldValidate: true,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="prison_clearance">
                          Prison Clearance
                        </SelectItem>
                        <SelectItem value="women_empowerment">
                          Women Empowerment
                        </SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-sm text-destructive">
                        {errors.type.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={watch("status") || ""}
                      onValueChange={(value) => {
                        setValue("status", value as ProgramFormData["status"], {
                          shouldValidate: true,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <CustomDatePicker
                      control={control}
                      name="startDate"
                      label="Start Date *"
                      placeholder="Select start date"
                    />
                  </div>
                  <div className="space-y-2">
                    <CustomDatePicker
                      control={control}
                      name="endDate"
                      label="End Date"
                      placeholder="Select end date"
                    />
                  </div>
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
                <div className="space-y-2 flex flex-col gap-2   ">
                  <Label>States *</Label>
                  {states.map((_, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        {...register(`states.${index}`)}
                        placeholder="State name" />
                        </div>))}
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setValue("states", [...states, ""])}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add State
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" {...register("location.address")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register("location.city")} />
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <Label>GPS Location (Optional)</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        {...register("location.gpsLocation.latitude", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        {...register("location.gpsLocation.longitude", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Budget & Expenditures Tab */}
            {activeTab === "budget" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="allocated">Budget Allocated *</Label>
                    <Input
                      id="allocated"
                      type="number"
                      step="0.01"
                      {...register("budget.allocated", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spent">Amount Spent</Label>
                    <Input
                      id="spent"
                      type="number"
                      step="0.01"
                      {...register("budget.spent", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" {...register("budget.currency")} />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Label>Expenditures</Label>
                  <Button
                    type="button"
                        variant="default"
                    size="sm"
                    onClick={() =>
                      appendExpenditure({
                        description: "",
                        amount: 0,
                        date: "",
                        category: "other",
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expenditure
                  </Button>
                </div>

                {expenditureFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Expenditure {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExpenditure(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Description *</Label>
                        <Input
                          {...register(`expenditures.${index}.description`)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`expenditures.${index}.amount`, {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <CustomDatePicker
                          control={control}
                          name={`expenditures.${index}.date`}
                          label="Date *"
                          placeholder="Select date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={watch(`expenditures.${index}.category`)}
                          onValueChange={(value) =>
                            setValue(
                              `expenditures.${index}.category`,
                              value as
                                | "personnel"
                                | "equipment"
                                | "transport"
                                | "venue"
                                | "materials"
                                | "other"
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personnel">Personnel</SelectItem>
                            <SelectItem value="equipment">Equipment</SelectItem>
                            <SelectItem value="transport">Transport</SelectItem>
                            <SelectItem value="venue">Venue</SelectItem>
                            <SelectItem value="materials">Materials</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}

            {/* Beneficiaries Tab */}
            {activeTab === "beneficiaries" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetBeneficiaries">
                      Targeted Beneficiaries *
                    </Label>
                    <Input
                      id="targetBeneficiaries"
                      type="number"
                      {...register("targetBeneficiaries", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actualBeneficiaries">
                      Actual Beneficiaries
                    </Label>
                    <Input
                      id="actualBeneficiaries"
                      type="number"
                      {...register("actualBeneficiaries", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Note: Beneficiary enrollment will be managed separately
                  through the beneficiary management system.
                </p>
              </motion.div>
            )}

            {/* Media & Documentation Tab */}
            {activeTab === "media" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-semibold">Media</Label>
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
                    <Card key={field.id} className="p-4 mb-4">
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
                                value as "photo" | "video" | "document"
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="photo">Photo</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="document">Document</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>URL *</Label>
                          <Input {...register(`media.${index}.url`)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Caption</Label>
                          <Input {...register(`media.${index}.caption`)} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-semibold">
                      Documentation
                    </Label>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() =>
                        appendDoc({
                          title: "",
                          type: "other",
                          url: "",
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Document
                    </Button>
                  </div>

                  {docFields.map((field, index) => (
                    <Card key={field.id} className="p-4 mb-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Document {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDoc(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Title *</Label>
                          <Input
                            {...register(`documentation.${index}.title`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={watch(`documentation.${index}.type`)}
                            onValueChange={(value) =>
                              setValue(
                                `documentation.${index}.type`,
                                value as
                                  | "report"
                                  | "proposal"
                                  | "agreement"
                                  | "other"
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="report">Report</SelectItem>
                              <SelectItem value="proposal">Proposal</SelectItem>
                              <SelectItem value="agreement">
                                Agreement
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>URL *</Label>
                          <Input {...register(`documentation.${index}.url`)} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Monitoring & Evaluation Tab */}
            {activeTab === "monitoring" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-semibold">
                      Monitoring Reports
                    </Label>
                    <Button
                      type="button"
                        variant="default"
                      size="sm"
                      onClick={() =>
                        appendMonitoring({
                          title: "",
                          reportDate: "",
                          reporter: "",
                          content: "",
                          attachments: [],
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Report
                    </Button>
                  </div>

                  {monitoringFields.map((field, index) => (
                    <Card key={field.id} className="p-4 mb-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">
                          Monitoring Report {index + 1}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMonitoring(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input
                              {...register(`monitoringReports.${index}.title`)}
                            />
                            {errors.monitoringReports?.[index]?.title && (
                              <p className="text-sm text-destructive">
                                {errors.monitoringReports[index]?.title?.message}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <CustomDatePicker
                              control={control}
                              name={`monitoringReports.${index}.reportDate`}
                              label="Report Date *"
                              placeholder="Select date"
                            />
                            {errors.monitoringReports?.[index]?.reportDate && (
                              <p className="text-sm text-destructive">
                                {errors.monitoringReports[index]?.reportDate?.message}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Reporter *</Label>
                            <Input
                              {...register(
                                `monitoringReports.${index}.reporter`
                              )}
                            />
                            {errors.monitoringReports?.[index]?.reporter && (
                              <p className="text-sm text-destructive">
                                {errors.monitoringReports[index]?.reporter?.message}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Content *</Label>
                            <Textarea
                              {...register(
                                `monitoringReports.${index}.content`
                              )}
                              rows={4}
                            />
                            {errors.monitoringReports?.[index]?.content && (
                              <p className="text-sm text-destructive">
                                {errors.monitoringReports[index]?.content?.message}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Attachments</Label>
                            <div className="space-y-2">
                              <Input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files) {
                                    Array.from(files).forEach((file) => {
                                      handleFileUpload(
                                        file,
                                        "monitoring",
                                        index
                                      );
                                    });
                                  }
                                  // Reset input
                                  e.target.value = "";
                                }}
                                className="cursor-pointer"
                              />
                              <p className="text-xs text-muted-foreground">
                                Accepted formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
                              </p>
                              {(watch(`monitoringReports.${index}.attachments`)?.length ?? 0) > 0 && (
                                <div className="space-y-1 mt-2">
                                  {watch(`monitoringReports.${index}.attachments`)?.map(
                                    (url, urlIndex) => (
                                      <div
                                        key={urlIndex}
                                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                                      >
                                        <a
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-blue-600 hover:underline flex-1 truncate"
                                        >
                                          {url.split("/").pop() || `Attachment ${urlIndex + 1}`}
                                        </a>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleRemoveAttachment(
                                              "monitoring",
                                              index,
                                              urlIndex
                                            )
                                          }
                                          className="h-6 w-6 p-0"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {errors.monitoringReports?.[index] && (
                          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                            <p className="text-sm text-destructive">
                              {errors.monitoringReports[index]?.title?.message ||
                                errors.monitoringReports[index]?.reportDate?.message ||
                                errors.monitoringReports[index]?.reporter?.message ||
                                errors.monitoringReports[index]?.content?.message}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-semibold">
                      Evaluation Reports
                    </Label>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() =>
                        appendEvaluation({
                          title: "",
                          reportDate: "",
                          evaluator: "",
                          content: "",
                          findings: [],
                          recommendations: [],
                          attachments: [],
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Report
                    </Button>
                  </div>

                  {evaluationFields.map((field, index) => (
                    <Card key={field.id} className="p-4 mb-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">
                          Evaluation Report {index + 1}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEvaluation(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input
                              {...register(`evaluationReports.${index}.title`)}
                            />
                            {errors.evaluationReports?.[index]?.title && (
                              <p className="text-sm text-destructive">
                                {errors.evaluationReports[index]?.title?.message}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <CustomDatePicker
                              control={control}
                              name={`evaluationReports.${index}.reportDate`}
                              label="Report Date *"
                              placeholder="Select date"
                            />
                            {errors.evaluationReports?.[index]?.reportDate && (
                              <p className="text-sm text-destructive">
                                {errors.evaluationReports[index]?.reportDate?.message}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Evaluator *</Label>
                            <Input
                              {...register(
                                `evaluationReports.${index}.evaluator`
                              )}
                            />
                            {errors.evaluationReports?.[index]?.evaluator && (
                              <p className="text-sm text-destructive">
                                {errors.evaluationReports[index]?.evaluator?.message}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Content *</Label>
                            <Textarea
                              {...register(
                                `evaluationReports.${index}.content`
                              )}
                              rows={4}
                            />
                            {errors.evaluationReports?.[index]?.content && (
                              <p className="text-sm text-destructive">
                                {errors.evaluationReports[index]?.content?.message}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Attachments</Label>
                            <div className="space-y-2">
                              <Input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files) {
                                    Array.from(files).forEach((file) => {
                                      handleFileUpload(
                                        file,
                                        "evaluation",
                                        index
                                      );
                                    });
                                  }
                                  // Reset input
                                  e.target.value = "";
                                }}
                                className="cursor-pointer"
                              />
                              <p className="text-xs text-muted-foreground">
                                Accepted formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
                              </p>
                              {(watch(`evaluationReports.${index}.attachments`)?.length ?? 0) > 0 && (
                                <div className="space-y-1 mt-2">
                                  {watch(`evaluationReports.${index}.attachments`)?.map(
                                    (url, urlIndex) => (
                                      <div
                                        key={urlIndex}
                                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                                      >
                                        <a
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-blue-600 hover:underline flex-1 truncate"
                                        >
                                          {url.split("/").pop() || `Attachment ${urlIndex + 1}`}
                                        </a>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleRemoveAttachment(
                                              "evaluation",
                                              index,
                                              urlIndex
                                            )
                                          }
                                          className="h-6 w-6 p-0"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {errors.evaluationReports?.[index] && (
                          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                            <p className="text-sm text-destructive">
                              {errors.evaluationReports[index]?.title?.message ||
                                errors.evaluationReports[index]?.reportDate?.message ||
                                errors.evaluationReports[index]?.evaluator?.message ||
                                errors.evaluationReports[index]?.content?.message}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Impact Tab */}
            {activeTab === "impact" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="impactScore">Impact Score (0-100)</Label>
                  <Input
                    id="impactScore"
                    type="number"
                    min="0"
                    max="100"
                    {...register("impactScore", { valueAsNumber: true })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="beneficiariesReached">
                      Beneficiaries Reached
                    </Label>
                    <Input
                      id="beneficiariesReached"
                      type="number"
                      {...register("impactMetrics.beneficiariesReached", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="objectivesAchieved">
                      Objectives Achieved
                    </Label>
                    <Input
                      id="objectivesAchieved"
                      type="number"
                      {...register("impactMetrics.objectivesAchieved", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalObjectives">Total Objectives</Label>
                    <Input
                      id="totalObjectives"
                      type="number"
                      {...register("impactMetrics.totalObjectives", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="satisfactionScore">
                      Satisfaction Score (0-100)
                    </Label>
                    <Input
                      id="satisfactionScore"
                      type="number"
                      min="0"
                      max="100"
                      {...register("impactMetrics.satisfactionScore", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Form Validation Errors Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium text-destructive mb-2">
                  Please fix the following errors:
                </p>
                <ul className="text-sm text-destructive space-y-1 list-disc list-inside">
                  {errors.title && <li>{errors.title.message}</li>}
                  {errors.objectives && <li>{errors.objectives.message}</li>}
                  {errors.startDate && <li>{errors.startDate.message}</li>}
                  {errors.states && <li>{errors.states.message}</li>}
                  {errors.type && <li>{errors.type.message}</li>}
                  {errors.status && <li>{errors.status.message}</li>}
                  {errors.targetBeneficiaries && (
                    <li>{errors.targetBeneficiaries.message}</li>
                  )}
                  {errors.budget?.allocated && (
                    <li>Budget allocated: {errors.budget.allocated.message}</li>
                  )}
                  {errors.monitoringReports && (
                    <li>
                      Monitoring Reports: {errors.monitoringReports.message || "Please check monitoring report fields"}
                    </li>
                  )}
                  {errors.evaluationReports && (
                    <li>
                      Evaluation Reports: {errors.evaluationReports.message || "Please check evaluation report fields"}
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="destructive" onClick={onSuccess}>
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
                  : program
                    ? "Update Program"
                    : "Create Program"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
