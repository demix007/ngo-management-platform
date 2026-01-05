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
import { useCreateGrant, useUpdateGrant } from "../hooks/use-donations";
import { usePrograms } from "@/features/programs/hooks/use-programs";
import type { Grant } from "@/types";
import {
  Plus,
  X,
  DollarSign,
  FileText,
  Target,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const grantSchema = z.object({
  grantor: z.string().min(1, "Grantor is required"),
  grantName: z.string().min(1, "Grant name is required"),
  grantorContact: z
    .object({
      email: z.string().email().optional(),
      phoneNumber: z.string().optional(),
      address: z.string().optional(),
      contactPerson: z.string().optional(),
    })
    .optional(),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  currency: z.string().default("NGN"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  purpose: z.string().min(1, "Purpose is required"),
  programIds: z.array(z.string()).optional(),
  termsAndConditions: z.string().optional(),
  conditions: z.array(z.string()).optional(),
  disbursementSchedule: z
    .array(
      z.object({
        id: z.string().optional(),
        scheduledDate: z.string().min(1, "Scheduled date is required"),
        amount: z.coerce.number().min(0),
        status: z.enum(["pending", "disbursed", "overdue"]),
        actualDisbursementDate: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  milestones: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().min(1, "Title is required"),
        description: z.string().min(1, "Description is required"),
        targetDate: z.string().min(1, "Target date is required"),
        status: z.enum(["pending", "in_progress", "completed", "overdue"]),
        completionDate: z.string().optional(),
        deliverables: z.array(z.string()).optional(),
      })
    )
    .optional(),
  deliverables: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().min(1, "Title is required"),
        description: z.string().min(1, "Description is required"),
        dueDate: z.string().min(1, "Due date is required"),
        status: z.enum(["pending", "submitted", "approved", "rejected"]),
        submissionDate: z.string().optional(),
        documentUrl: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  reportingRequirements: z.object({
    frequency: z.enum(["monthly", "quarterly", "annually"]),
    nextReportDue: z.string().min(1, "Next report due date is required"),
    lastReportDate: z.string().optional(),
  }),
  status: z.enum(["active", "completed", "suspended"]),
});

type GrantFormData = z.infer<typeof grantSchema>;

interface GrantFormComprehensiveProps {
  grant?: Grant;
  onSuccess?: () => void;
}

export function GrantFormComprehensive({
  grant,
  onSuccess,
}: GrantFormComprehensiveProps) {
  const createMutation = useCreateGrant();
  const updateMutation = useUpdateGrant();
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
  } = useForm<GrantFormData>({
    mode: "onChange",
    // @ts-expect-error - zodResolver type mismatch with react-hook-form versions
    resolver: zodResolver(grantSchema),
    defaultValues: grant
      ? {
          ...grant,
          startDate: grant.startDate.toISOString().split("T")[0],
          endDate: grant.endDate.toISOString().split("T")[0],
          disbursementSchedule: grant.disbursementSchedule?.map((d) => ({
            ...d,
            scheduledDate: d.scheduledDate.toISOString().split("T")[0],
            actualDisbursementDate: d.actualDisbursementDate?.toISOString().split("T")[0],
          })),
          milestones: grant.milestones?.map((m) => ({
            ...m,
            targetDate: m.targetDate.toISOString().split("T")[0],
            completionDate: m.completionDate?.toISOString().split("T")[0],
          })),
          deliverables: grant.deliverables?.map((d) => ({
            ...d,
            dueDate: d.dueDate.toISOString().split("T")[0],
            submissionDate: d.submissionDate?.toISOString().split("T")[0],
          })),
          reportingRequirements: {
            ...grant.reportingRequirements,
            nextReportDue: grant.reportingRequirements.nextReportDue.toISOString().split("T")[0],
            lastReportDate: grant.reportingRequirements.lastReportDate?.toISOString().split("T")[0],
          },
        }
      : {
          currency: "NGN",
          status: "active",
          reportingRequirements: {
            frequency: "quarterly",
            nextReportDue: "",
          },
        },
  });

  const conditions = watch("conditions") || [];

  const {
    fields: disbursementFields,
    append: appendDisbursement,
    remove: removeDisbursement,
  } = useFieldArray({
    control,
    name: "disbursementSchedule",
  });

  const {
    fields: milestoneFields,
    append: appendMilestone,
    remove: removeMilestone,
  } = useFieldArray({
    control,
    name: "milestones",
  });

  const {
    fields: deliverableFields,
    append: appendDeliverable,
    remove: removeDeliverable,
  } = useFieldArray({
    control,
    name: "deliverables",
  });

  const selectedProgramIds = watch("programIds") || [];

  const onSubmit = async (data: GrantFormData) => {
    try {
      console.log("Form submitted with data:", data);

      const grantData: Omit<Grant, "id" | "createdAt" | "updatedAt"> = {
        ...data,
        grantor: data.grantor,
        grantName: data.grantName,
        grantorContact: data.grantorContact,
        amount: data.amount,
        currency: data.currency,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        purpose: data.purpose,
        programIds: data.programIds || [],
        programNames: programs
          ?.filter((p: { id: string; title: string }) => data.programIds?.includes(p.id))
          .map((p: { id: string; title: string }) => p.title),
        termsAndConditions: data.termsAndConditions,
        conditions: data.conditions || [],
        disbursementSchedule: data.disbursementSchedule?.map((d) => ({
          id: d.id || crypto.randomUUID(),
          scheduledDate: new Date(d.scheduledDate),
          amount: d.amount,
          status: d.status,
          actualDisbursementDate: d.actualDisbursementDate
            ? new Date(d.actualDisbursementDate)
            : undefined,
          notes: d.notes,
        })),
        milestones: data.milestones?.map((m) => ({
          id: m.id || crypto.randomUUID(),
          title: m.title,
          description: m.description,
          targetDate: new Date(m.targetDate),
          status: m.status,
          completionDate: m.completionDate
            ? new Date(m.completionDate)
            : undefined,
          deliverables: m.deliverables || [],
        })),
        deliverables: data.deliverables?.map((d) => ({
          id: d.id || crypto.randomUUID(),
          title: d.title,
          description: d.description,
          dueDate: new Date(d.dueDate),
          status: d.status,
          submissionDate: d.submissionDate ? new Date(d.submissionDate) : undefined,
          documentUrl: d.documentUrl,
          notes: d.notes,
        })),
        reportingRequirements: {
          frequency: data.reportingRequirements.frequency,
          nextReportDue: new Date(data.reportingRequirements.nextReportDue),
          lastReportDate: data.reportingRequirements.lastReportDate
            ? new Date(data.reportingRequirements.lastReportDate)
            : undefined,
          reports: grant?.reportingRequirements.reports || [],
        },
        usageReport: grant?.usageReport,
        complianceTracking: grant?.complianceTracking,
        status: data.status,
        createdBy: grant?.createdBy || user?.id || "",
      };

      if (grant) {
        await updateMutation.mutateAsync({ id: grant.id, ...grantData });
      } else {
        console.log("Creating grant with data:", grantData);
        await createMutation.mutateAsync(grantData);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleFormError = (validationErrors: FieldErrors<GrantFormData>) => {
    console.error("Form validation errors:", validationErrors);
    const errorMessages = Object.entries(validationErrors).map(([key, value]) => {
      const error = value as { message?: string } | undefined;
      return `${key}: ${error?.message || "Invalid value"}`;
    });
    console.error("Validation errors:", errorMessages);
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: FileText },
    { id: "disbursement", label: "Disbursement", icon: DollarSign },
    { id: "milestones", label: "Milestones", icon: Target },
    { id: "deliverables", label: "Deliverables", icon: CheckCircle2 },
    { id: "reporting", label: "Reporting", icon: Calendar },
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
            {grant ? "Edit Grant" : "Create New Grant"}
          </CardTitle>
          <CardDescription className="text-blue-100">
            {grant
              ? "Update grant information"
              : "Enter comprehensive grant details"}
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
                    <Label htmlFor="grantor">Grantor *</Label>
                    <Input id="grantor" {...register("grantor")} />
                    {errors.grantor && (
                      <p className="text-sm text-destructive">
                        {errors.grantor.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grantName">Grant Name *</Label>
                    <Input id="grantName" {...register("grantName")} />
                    {errors.grantName && (
                      <p className="text-sm text-destructive">
                        {errors.grantName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      {...register("amount", { valueAsNumber: true })}
                    />
                    {errors.amount && (
                      <p className="text-sm text-destructive">
                        {errors.amount.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency *</Label>
                    <Input id="currency" {...register("currency")} />
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
                      label="End Date *"
                      placeholder="Select end date"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose *</Label>
                  <Textarea
                    id="purpose"
                    {...register("purpose")}
                    rows={3}
                  />
                  {errors.purpose && (
                    <p className="text-sm text-destructive">
                      {errors.purpose.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Programs</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {programs?.map((program: { id: string; title: string }) => (
                      <label
                        key={program.id}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProgramIds.includes(program.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setValue("programIds", [
                                ...selectedProgramIds,
                                program.id,
                              ]);
                            } else {
                              setValue(
                                "programIds",
                                selectedProgramIds.filter(
                                  (id) => id !== program.id
                                )
                              );
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{program.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
                  <Textarea
                    id="termsAndConditions"
                    {...register("termsAndConditions")}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conditions</Label>
                  {conditions.map((_, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        {...register(`conditions.${index}`)}
                        placeholder="Enter condition"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newConditions = conditions.filter(
                            (_, i) => i !== index
                          );
                          setValue("conditions", newConditions);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="ml-4"
                    onClick={() => {
                      setValue("conditions", [...conditions, ""]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Condition
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={watch("status") || ""}
                    onValueChange={(value) => {
                      setValue(
                        "status",
                        value as GrantFormData["status"],
                        { shouldValidate: true }
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
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

            {/* Disbursement Schedule Tab */}
            {activeTab === "disbursement" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">
                    Disbursement Schedule
                  </Label>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() =>
                      appendDisbursement({
                        scheduledDate: "",
                        amount: 0,
                        status: "pending",
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Disbursement
                  </Button>
                </div>

                {disbursementFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Disbursement {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDisbursement(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <CustomDatePicker
                          control={control}
                          name={`disbursementSchedule.${index}.scheduledDate`}
                          label="Scheduled Date *"
                          placeholder="Select date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(
                            `disbursementSchedule.${index}.amount`,
                            {
                              valueAsNumber: true,
                            }
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={watch(
                            `disbursementSchedule.${index}.status`
                          )}
                          onValueChange={(value) =>
                            setValue(
                              `disbursementSchedule.${index}.status`,
                              value as "pending" | "disbursed" | "overdue"
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="disbursed">Disbursed</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <CustomDatePicker
                          control={control}
                          name={`disbursementSchedule.${index}.actualDisbursementDate`}
                          label="Actual Disbursement Date"
                          placeholder="Select date"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Notes</Label>
                        <Textarea
                          {...register(
                            `disbursementSchedule.${index}.notes`
                          )}
                          rows={2}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}

            {/* Milestones Tab */}
            {activeTab === "milestones" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">Milestones</Label>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() =>
                      appendMilestone({
                        title: "",
                        description: "",
                        targetDate: "",
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
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Title *</Label>
                          <Input
                            {...register(`milestones.${index}.title`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <CustomDatePicker
                            control={control}
                            name={`milestones.${index}.targetDate`}
                            label="Target Date *"
                            placeholder="Select date"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={watch(`milestones.${index}.status`)}
                            onValueChange={(value) =>
                              setValue(
                                `milestones.${index}.status`,
                                value as
                                  | "pending"
                                  | "in_progress"
                                  | "completed"
                                  | "overdue"
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">
                                In Progress
                              </SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <CustomDatePicker
                            control={control}
                            name={`milestones.${index}.completionDate`}
                            label="Completion Date"
                            placeholder="Select date"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description *</Label>
                        <Textarea
                          {...register(`milestones.${index}.description`)}
                          rows={3}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}

            {/* Deliverables Tab */}
            {activeTab === "deliverables" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">Deliverables</Label>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() =>
                      appendDeliverable({
                        title: "",
                        description: "",
                        dueDate: "",
                        status: "pending",
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Deliverable
                  </Button>
                </div>

                {deliverableFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Deliverable {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDeliverable(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Title *</Label>
                          <Input
                            {...register(`deliverables.${index}.title`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <CustomDatePicker
                            control={control}
                            name={`deliverables.${index}.dueDate`}
                            label="Due Date *"
                            placeholder="Select date"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={watch(`deliverables.${index}.status`)}
                            onValueChange={(value) =>
                              setValue(
                                `deliverables.${index}.status`,
                                value as
                                  | "pending"
                                  | "submitted"
                                  | "approved"
                                  | "rejected"
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <CustomDatePicker
                            control={control}
                            name={`deliverables.${index}.submissionDate`}
                            label="Submission Date"
                            placeholder="Select date"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Document URL</Label>
                          <Input
                            {...register(`deliverables.${index}.documentUrl`)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description *</Label>
                        <Textarea
                          {...register(`deliverables.${index}.description`)}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          {...register(`deliverables.${index}.notes`)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}

            {/* Reporting Tab */}
            {activeTab === "reporting" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Report Frequency *</Label>
                    <Select
                      value={
                        watch("reportingRequirements.frequency") || ""
                      }
                      onValueChange={(value) =>
                        setValue(
                          "reportingRequirements.frequency",
                          value as "monthly" | "quarterly" | "annually",
                          { shouldValidate: true }
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.reportingRequirements?.frequency && (
                      <p className="text-sm text-destructive">
                        {errors.reportingRequirements.frequency.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <CustomDatePicker
                      control={control}
                      name="reportingRequirements.nextReportDue"
                      label="Next Report Due *"
                      placeholder="Select date"
                    />
                  </div>

                  <div className="space-y-2">
                    <CustomDatePicker
                      control={control}
                      name="reportingRequirements.lastReportDate"
                      label="Last Report Date"
                      placeholder="Select date"
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
                  {errors.grantor && <li>{errors.grantor.message}</li>}
                  {errors.grantName && <li>{errors.grantName.message}</li>}
                  {errors.amount && <li>{errors.amount.message}</li>}
                  {errors.startDate && <li>{errors.startDate.message}</li>}
                  {errors.endDate && <li>{errors.endDate.message}</li>}
                  {errors.purpose && <li>{errors.purpose.message}</li>}
                  {errors.reportingRequirements?.nextReportDue && (
                    <li>
                      {errors.reportingRequirements.nextReportDue.message}
                    </li>
                  )}
                  {errors.status && <li>{errors.status.message}</li>}
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
                  : grant
                    ? "Update Grant"
                    : "Create Grant"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

