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
  useCreateDonation,
  useUpdateDonation,
  useDonors,
} from "../hooks/use-donations";
import { usePrograms } from "@/features/programs/hooks/use-programs";
import type { Donation } from "@/types";
import {
  Plus,
  X,
  DollarSign,
  FileText,
  AlertCircle,
  TrendingDown,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const donationSchema = z.object({
  donorId: z.string().min(1, "Donor is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  currency: z.string().default("NGN"),
  donationDate: z.string().min(1, "Donation date is required"),
  paymentMethod: z.enum(["bank_transfer", "cash", "cheque", "online"]),
  receiptNumber: z.string().min(1, "Receipt number is required"),
  programId: z.string().optional(),
  purpose: z.string().optional(),
  expenditures: z
    .array(
      z.object({
        id: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        amount: z.coerce.number().min(0),
        date: z.string().min(1, "Date is required"),
        programId: z.string().optional(),
        category: z.enum([
          "personnel",
          "equipment",
          "transport",
          "venue",
          "materials",
          "other",
        ]),
        receiptUrl: z.string().optional(),
      })
    )
    .optional(),
  donorRestrictions: z.array(z.string()).optional(),
  donorReporting: z
    .object({
      reportFrequency: z.enum(["monthly", "quarterly", "annually"]).optional(),
      nextReportDue: z.string().optional(),
    })
    .optional(),
  relatedDonationIds: z.array(z.string()).optional(),
  status: z.enum(["pending", "confirmed", "cancelled"]),
  notes: z.string().optional(),
});

type DonationFormData = z.infer<typeof donationSchema>;

interface DonationFormComprehensiveProps {
  donation?: Donation;
  onSuccess?: () => void;
}

export function DonationFormComprehensive({
  donation,
  onSuccess,
}: DonationFormComprehensiveProps) {
  const createMutation = useCreateDonation();
  const updateMutation = useUpdateDonation();
  const { user } = useAuthStore();
  const { data: donors } = useDonors();
  const { data: programs } = usePrograms();
  const [activeTab, setActiveTab] = useState("basic");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<DonationFormData>({
    mode: "onChange",
    // @ts-expect-error - zodResolver type mismatch with react-hook-form versions
    resolver: zodResolver(donationSchema),
    defaultValues: donation
      ? {
          ...donation,
          donationDate: donation.donationDate.toISOString().split("T")[0],
          expenditures: donation.expenditures?.map((e) => ({
            ...e,
            date: e.date.toISOString().split("T")[0],
          })),
          donorReporting: donation.donorReporting
            ? {
                ...donation.donorReporting,
                nextReportDue: donation.donorReporting.nextReportDue
                  ?.toISOString()
                  .split("T")[0],
              }
            : undefined,
        }
      : {
          paymentMethod: "bank_transfer",
          status: "pending",
          currency: "NGN",
        },
  });

  const expenditures = watch("expenditures") || [];
  const amount = watch("amount") || 0;
  const totalExpenditures = expenditures.reduce(
    (sum, exp) => sum + (exp.amount || 0),
    0
  );
  const balanceRemaining = amount - totalExpenditures;

  const {
    fields: expenditureFields,
    append: appendExpenditure,
    remove: removeExpenditure,
  } = useFieldArray({
    control,
    name: "expenditures",
  });

  const donorRestrictions = watch("donorRestrictions") || [];

  const onSubmit = async (data: DonationFormData) => {
    try {
      console.log("Form submitted with data:", data);

      const donationData: Omit<
        Donation,
        "id" | "createdAt" | "updatedAt" | "balanceRemaining"
      > = {
        ...data,
        donorId: data.donorId,
        donorName: donors?.find((d) => d.id === data.donorId)?.name,
        amount: data.amount,
        currency: data.currency,
        donationDate: new Date(data.donationDate),
        paymentMethod: data.paymentMethod,
        receiptNumber: data.receiptNumber,
        programId: data.programId,
        programName: programs?.find(
          (p: { id: string; title: string }) => p.id === data.programId
        )?.title,
        expenditures: data.expenditures?.map((e) => ({
          id: e.id || crypto.randomUUID(),
          description: e.description,
          amount: e.amount,
          date: new Date(e.date),
          programId: e.programId,
          category: e.category,
          receiptUrl: e.receiptUrl || undefined,
        })),
        donorRestrictions: data.donorRestrictions || [],
        donorReporting: data.donorReporting
          ? {
              ...data.donorReporting,
              nextReportDue: data.donorReporting.nextReportDue
                ? new Date(data.donorReporting.nextReportDue)
                : undefined,
            }
          : undefined,
        relatedDonationIds: data.relatedDonationIds || [],
        purpose: data.purpose,
        status: data.status,
        notes: data.notes,
        createdBy: donation?.createdBy || user?.id || "",
      };

      if (donation) {
        await updateMutation.mutateAsync({ id: donation.id, ...donationData });
      } else {
        console.log("Creating donation with data:", donationData);
        await createMutation.mutateAsync(donationData);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleFormError = (validationErrors: FieldErrors<DonationFormData>) => {
    console.error("Form validation errors:", validationErrors);
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
    { id: "expenditures", label: "Expenditures", icon: DollarSign },
    {
      id: "restrictions",
      label: "Restrictions & Reporting",
      icon: AlertCircle,
    },
    { id: "notes", label: "Notes", icon: FileText },
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
            {donation ? "Edit Donation" : "Create New Donation"}
          </CardTitle>
          <CardDescription className="text-blue-100">
            {donation
              ? "Update donation information"
              : "Enter comprehensive donation details"}
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
                    <Label htmlFor="donorId">Donor *</Label>
                    <Select
                      value={watch("donorId") || ""}
                      onValueChange={(value) => {
                        setValue("donorId", value, { shouldValidate: true });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select donor" />
                      </SelectTrigger>
                      <SelectContent>
                        {donors?.map((donor) => (
                          <SelectItem key={donor.id} value={donor.id}>
                            {donor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.donorId && (
                      <p className="text-sm text-destructive">
                        {errors.donorId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="programId">Program (Optional)</Label>
                    <Select
                      value={watch("programId") || undefined}
                      onValueChange={(value) => {
                        setValue("programId", value || undefined);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select program (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs?.map(
                          (program: { id: string; title: string }) => (
                            <SelectItem key={program.id} value={program.id}>
                              {program.title}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="receiptNumber">Receipt Number *</Label>
                    <Input id="receiptNumber" {...register("receiptNumber")} />
                    {errors.receiptNumber && (
                      <p className="text-sm text-destructive">
                        {errors.receiptNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <CustomDatePicker
                      control={control}
                      name="donationDate"
                      label="Donation Date *"
                      placeholder="Select donation date"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select
                      value={watch("paymentMethod") || ""}
                      onValueChange={(value) => {
                        setValue(
                          "paymentMethod",
                          value as DonationFormData["paymentMethod"],
                          { shouldValidate: true }
                        );
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.paymentMethod && (
                      <p className="text-sm text-destructive">
                        {errors.paymentMethod.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Textarea
                    id="purpose"
                    {...register("purpose")}
                    rows={3}
                    placeholder="Purpose of donation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={watch("status") || ""}
                    onValueChange={(value) => {
                      setValue("status", value as DonationFormData["status"], {
                        shouldValidate: true,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-destructive">
                      {errors.status.message}
                    </p>
                  )}
                </div>

                {/* Balance Summary */}
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-5 w-5 text-blue-600" />
                    <Label className="text-lg font-semibold">
                      Balance Summary
                    </Label>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Total Amount:
                      </span>
                      <p className="font-semibold">
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: watch("currency") || "NGN",
                        }).format(amount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Total Expenditures:
                      </span>
                      <p className="font-semibold">
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: watch("currency") || "NGN",
                        }).format(totalExpenditures)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Balance Remaining:
                      </span>
                      <p
                        className={`font-semibold ${
                          balanceRemaining < 0
                            ? "text-destructive"
                            : "text-blue-600"
                        }`}
                      >
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: watch("currency") || "NGN",
                        }).format(balanceRemaining)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Expenditures Tab */}
            {activeTab === "expenditures" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">Expenditures</Label>
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
                      <div className="space-y-2">
                        <Label>Program (Optional)</Label>
                        <Select
                          value={
                            watch(`expenditures.${index}.programId`) ||
                            undefined
                          }
                          onValueChange={(value) =>
                            setValue(
                              `expenditures.${index}.programId`,
                              value || undefined
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select program (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {programs?.map(
                              (program: { id: string; title: string }) => (
                                <SelectItem key={program.id} value={program.id}>
                                  {program.title}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Receipt URL (Optional)</Label>
                        <Input
                          {...register(`expenditures.${index}.receiptUrl`)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}

            {/* Restrictions & Reporting Tab */}
            {activeTab === "restrictions" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Donor Restrictions</Label>
                  {donorRestrictions.map((_, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        {...register(`donorRestrictions.${index}`)}
                        placeholder="Enter restriction"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newRestrictions = donorRestrictions.filter(
                            (_, i) => i !== index
                          );
                          setValue("donorRestrictions", newRestrictions);
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
                      setValue("donorRestrictions", [...donorRestrictions, ""]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Restriction
                  </Button>
                </div>

                <div className="space-y-4">
                  <Label className="text-lg font-semibold">
                    Donor Reporting
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Report Frequency</Label>
                      <Select
                        value={
                          watch("donorReporting.reportFrequency") || undefined
                        }
                        onValueChange={(value) =>
                          setValue(
                            "donorReporting.reportFrequency",
                            value as
                              | "monthly"
                              | "quarterly"
                              | "annually"
                              | undefined
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <CustomDatePicker
                        control={control}
                        name="donorReporting.nextReportDue"
                        label="Next Report Due"
                        placeholder="Select date"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    rows={6}
                    placeholder="Enter any additional notes or comments about this donation..."
                  />
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
                  {errors.donorId && <li>{errors.donorId.message}</li>}
                  {errors.amount && <li>{errors.amount.message}</li>}
                  {errors.donationDate && (
                    <li>{errors.donationDate.message}</li>
                  )}
                  {errors.receiptNumber && (
                    <li>{errors.receiptNumber.message}</li>
                  )}
                  {errors.paymentMethod && (
                    <li>{errors.paymentMethod.message}</li>
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
                  : donation
                    ? "Update Donation"
                    : "Create Donation"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
