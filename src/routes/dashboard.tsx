import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
import { AppLayout } from "@/components/layout/app-layout";
import { LoadingSpinner } from "@/components/ui/loading";
import {
  RefreshCw,
  Clock,
  Calendar as CalendarIcon,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
} from "lucide-react";
import { format } from "date-fns";
import { useDashboardData } from "@/features/dashboard/hooks/use-dashboard-data";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { BarChartWidget } from "@/features/dashboard/components/bar-chart-widget";
import { PieChartWidget } from "@/features/dashboard/components/pie-chart-widget";
import { UpcomingEventsCalendar } from "@/features/dashboard/components/upcoming-events-calendar";
import { ActivityFeed } from "@/features/dashboard/components/activity-feed";
import { DashboardFilters } from "@/features/dashboard/components/dashboard-filters";
import { DrillDownModal } from "@/features/dashboard/components/drill-down-modal";
import { DataTableWidget } from "@/features/dashboard/components/data-table-widget";
import { AreaChartWidget } from "@/features/dashboard/components/area-chart-widget";
import { RadarChartWidget } from "@/features/dashboard/components/radar-chart-widget";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  Calendar as CalendarIconLucide,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { DashboardFilters as DashboardFiltersType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { isLoading } = useAuthStore.getState();

    // Wait a bit if still loading
    if (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const finalState = useAuthStore.getState();
    if (!finalState.isAuthenticated || !finalState.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DashboardFiltersType>({});
  const [drillDownModal, setDrillDownModal] = useState<{
    open: boolean;
    type: string;
    data?: Record<string, unknown>[];
  }>({ open: false, type: "" });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock weather data - in production, you'd fetch from a weather API
  const weatherData = useMemo(
    () => ({
      temperature: 28,
      condition: "sunny", // 'sunny', 'cloudy', 'rainy', 'snowy'
      location: "Lagos",
      humidity: 72,
      windSpeed: 15,
    }),
    []
  );

  const { metrics, recentActivity, rawData, isLoading } =
    useDashboardData(filters);

  // Auto-refresh every 5 seconds
  const handleRefresh = async () => {
    setIsRefreshing(true);
    queryClient.invalidateQueries();
    // Simulate refresh duration for animation
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Get unique states and LGAs for filters
  const availableStates = useMemo(() => {
    const states = new Set<string>();
    rawData.beneficiaries.forEach((b) => states.add(b.address.state));
    rawData.programs.forEach((p) => p.states.forEach((s) => states.add(s)));
    return Array.from(states).sort();
  }, [rawData]);

  const availableLGAs = useMemo(() => {
    if (!filters.state) return [];
    const lgas = new Set<string>();
    rawData.beneficiaries
      .filter((b) => b.address.state === filters.state)
      .forEach((b) => lgas.add(b.address.lga));
    return Array.from(lgas).sort();
  }, [rawData, filters.state]);

  // Enhanced stats with better mock data and varied colors
  const stats = [
    {
      title: "Total Beneficiaries",
      // value: (metrics.totalBeneficiaries || 2847).toLocaleString(),
      value: 2847,
      change: "+52.5%",
      note: `Serving ${(metrics.beneficiariesServed || 2156).toLocaleString()} beneficiaries across 24 active programs`,
      icon: Users,
      iconBgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      title: "Active Programs",
      value: metrics.activePrograms || 24,
      change: "+38.3%",
      note: `${metrics.programsCompleted || 47} programs completed successfully this year`,
      icon: CalendarIconLucide,
      iconBgColor: "bg-gradient-to-br from-green-500 to-emerald-600",
    },
    {
      title: "Impact Rate",
      value: `${(metrics.impactRate || 87.5).toFixed(1)}%`,
      change: "+45.2%",
      note: `${(metrics.beneficiariesServed || 2489).toLocaleString()} beneficiaries actively engaged with positive outcomes`,
      icon: TrendingUp,
      iconBgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    {
      title: "Total Funding",
      value: formatCurrency(metrics.totalFunding || 94500000),
      change: "+48.7%",
      note: `#76.5M total donations and grants received across all programs`,
      icon: DollarSign,
      iconBgColor: "bg-gradient-to-br from-amber-500 to-orange-600",
    },
  ];

  // Table columns for drill-down
  const beneficiaryColumns: ColumnDef<{
    firstName: string;
    lastName: string;
    address: { state: string; lga: string };
    programParticipations: string[];
  }>[] = [
    {
      accessorKey: "firstName",
      header: "Name",
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
    },
    {
      accessorKey: "address.state",
      header: "State",
    },
    {
      accessorKey: "address.lga",
      header: "LGA",
    },
    {
      accessorKey: "programParticipations",
      header: "Programs",
      cell: ({ row }) => row.original.programParticipations.length,
    },
  ];

  const programColumns: ColumnDef<{
    title: string;
    type: string;
    status: string;
    actualBeneficiaries: number;
  }>[] = [
    {
      accessorKey: "title",
      header: "Program",
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      accessorKey: "actualBeneficiaries",
      header: "Beneficiaries",
    },
  ];

  // Mock monthly beneficiaries data for radar chart visualization
  const beneficiariesMonthlyData = useMemo(() => {
    return [
      { month: "Jan", beneficiaries: 145 },
      { month: "Feb", beneficiaries: 132 },
      { month: "Mar", beneficiaries: 168 },
      { month: "Apr", beneficiaries: 189 },
      { month: "May", beneficiaries: 176 },
      { month: "Jun", beneficiaries: 203 },
      { month: "Jul", beneficiaries: 195 },
      { month: "Aug", beneficiaries: 218 },
      { month: "Sep", beneficiaries: 201 },
      { month: "Oct", beneficiaries: 187 },
      { month: "Nov", beneficiaries: 162 },
      { month: "Dec", beneficiaries: 149 },
    ];
  }, []);

  // Mock monthly donations and grants data for area chart visualization (values in millions)
  const donationsGrantsData = useMemo(() => {
    return [
      { name: "Jan", donations: 2.45, grants: 1.82 },
      { name: "Feb", donations: 2.18, grants: 1.65 },
      { name: "Mar", donations: 2.67, grants: 2.14 },
      { name: "Apr", donations: 3.12, grants: 2.48 },
      { name: "May", donations: 2.89, grants: 2.31 },
      { name: "Jun", donations: 3.45, grants: 2.76 },
      { name: "Jul", donations: 3.28, grants: 2.92 },
      { name: "Aug", donations: 3.67, grants: 3.18 },
      { name: "Sep", donations: 3.34, grants: 3.05 },
      { name: "Oct", donations: 2.96, grants: 2.71 },
      { name: "Nov", donations: 2.74, grants: 2.38 },
      { name: "Dec", donations: 3.21, grants: 2.89 },
    ];
  }, []);

  // Calculate event dates once using useMemo to avoid calling Date.now() during render
  const eventDates = useMemo(() => {
    const baseDate = new Date();
    const now = baseDate.getTime();
    return {
      twoDaysFromNow: new Date(now + 2 * 24 * 60 * 60 * 1000),
      fiveDaysFromNow: new Date(now + 5 * 24 * 60 * 60 * 1000),
      sevenDaysFromNow: new Date(now + 7 * 24 * 60 * 60 * 1000),
      threeDaysAgo: new Date(now - 3 * 24 * 60 * 60 * 1000),
      tenDaysAgo: new Date(now - 10 * 24 * 60 * 60 * 1000),
      fiveDaysAgo: new Date(now - 5 * 24 * 60 * 60 * 1000),
      now: baseDate,
    };
  }, []);

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 bg-gradient-to-r from-card via-card/95 to-card border rounded-xl shadow-sm">
              {/* Left Section - Welcome & Title */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="flex-1"
              >
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2 mb-1">
                  Dashboard Overview
                </h1>
                <p className="text-muted-foreground text-sm">
                  Welcome back,{" "}
                  <span className="font-semibold text-foreground">
                    {user?.displayName || "User"}
                  </span>
                </p>
              </motion.div>

              {/* Middle Section - Time, Date & Weather */}
              <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                {/* Current Time */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  >
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </motion.div>
                  <div className="flex flex-col">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={format(currentTime, "HH:mm:ss")}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="text-sm font-bold text-blue-700 dark:text-blue-300 tabular-nums"
                      >
                        {format(currentTime, "HH:mm:ss")}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Current Date */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-200/50 dark:border-purple-800/50"
                >
                  <CalendarIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <div className="flex flex-col">
                    <span className="text-xs text-purple-600/70 dark:text-purple-400/70">
                      {format(currentTime, "EEEE")}
                    </span>
                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                      {format(currentTime, "MMM dd, yyyy")}
                    </span>
                  </div>
                </motion.div>

                {/* Weather Info */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-200/50 dark:border-amber-800/50"
                >
                  <motion.div
                    animate={{
                      rotate:
                        weatherData.condition === "sunny" ? [0, 15, -15, 0] : 0,
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  >
                    {weatherData.condition === "sunny" && (
                      <Sun className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    )}
                    {weatherData.condition === "cloudy" && (
                      <Cloud className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    )}
                    {weatherData.condition === "rainy" && (
                      <CloudRain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                    {weatherData.condition === "snowy" && (
                      <CloudSnow className="h-5 w-5 text-blue-400" />
                    )}
                  </motion.div>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                        {weatherData.temperature}°
                      </span>
                      <span className="text-xs text-amber-600/70 dark:text-amber-400/70">
                        C
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wind className="h-3 w-3 text-amber-600/70 dark:text-amber-400/70" />
                      <span className="text-xs text-amber-600/70 dark:text-amber-400/70">
                        {weatherData.location}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right Section - Action Buttons */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50 cursor-pointer transition-all duration-200 hover:border-emerald-300/70 dark:hover:border-emerald-700/70 hover:bg-gradient-to-r hover:from-emerald-100/70 hover:to-green-100/70 dark:hover:from-emerald-950/30 dark:hover:to-green-950/30"
                onClick={handleRefresh}
              >
                <motion.div
                  animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                  transition={
                    isRefreshing
                      ? { duration: 1, repeat: Infinity, ease: "linear" }
                      : { duration: 0.3 }
                  }
                >
                  <RefreshCw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </motion.div>
                <div className="flex flex-col">
                  <AnimatePresence mode="wait">
                    {isRefreshing ? (
                      <motion.span
                        key="refreshing"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="text-sm font-semibold text-emerald-700 dark:text-emerald-300"
                      >
                        Refreshing...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="refresh"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="text-sm font-semibold text-emerald-700 dark:text-emerald-300"
                      >
                        Refresh
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Filters */}
          <DashboardFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableStates={availableStates}
            availableLGAs={availableLGAs}
          />

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Top Metrics Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                {stats.map((stat, index) => (
                  <MetricCard
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    change={stat.change}
                    note={stat.note}
                    icon={stat.icon}
                    iconBgColor={stat.iconBgColor}
                    delay={index * 0.1}
                    animated
                  />
                ))}
              </div>

              {/* Activity Feed & Upcoming Events */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-card rounded-lg shadow-sm border border-border p-6 min-w-0">
                  <ActivityFeed
                    activities={recentActivity}
                    maxItems={10}
                    autoScroll
                  />
                </div>
                <div className="bg-card rounded-lg shadow-sm border border-border p-6 min-w-0">
                  <UpcomingEventsCalendar
                    events={[
                      // Upcoming events
                      {
                        id: "1",
                        title: "Health Outreach Program",
                        description: "Community health screening event",
                        type: "monthly_program",
                        scope: "state",
                        startDate: eventDates.twoDaysFromNow,
                        allDay: true,
                        status: "scheduled",
                        priority: "high",
                        reminders: [],
                        isRecurring: false,
                        followUpRequired: false,
                        createdBy: "",
                        createdAt: eventDates.now,
                        updatedAt: eventDates.now,
                        location: { address: "Community Center, Lagos" },
                      },
                      {
                        id: "2",
                        title: "Grant Reporting Deadline",
                        description: "Submit quarterly grant report",
                        type: "grant_reporting_deadline",
                        scope: "national",
                        startDate: eventDates.fiveDaysFromNow,
                        allDay: true,
                        status: "scheduled",
                        priority: "urgent",
                        reminders: [],
                        isRecurring: false,
                        followUpRequired: false,
                        createdBy: "",
                        createdAt: eventDates.now,
                        updatedAt: eventDates.now,
                      },
                      {
                        id: "3",
                        title: "Partner Meeting",
                        description: "Quarterly partnership review",
                        type: "meeting",
                        scope: "national",
                        startDate: eventDates.sevenDaysFromNow,
                        allDay: false,
                        startTime: "10:00",
                        status: "scheduled",
                        priority: "medium",
                        reminders: [],
                        isRecurring: false,
                        followUpRequired: false,
                        createdBy: "",
                        createdAt: eventDates.now,
                        updatedAt: eventDates.now,
                        location: { address: "Head Office, Abuja" },
                      },
                      // Past events
                      {
                        id: "4",
                        title: "Training Workshop",
                        description: "Field officer training session",
                        type: "training",
                        scope: "state",
                        startDate: eventDates.threeDaysAgo,
                        allDay: true,
                        status: "completed",
                        priority: "medium",
                        reminders: [],
                        isRecurring: false,
                        followUpRequired: false,
                        createdBy: "",
                        createdAt: eventDates.now,
                        updatedAt: eventDates.now,
                      },
                      {
                        id: "5",
                        title: "Donor Feedback Session",
                        description: "Monthly donor engagement",
                        type: "donor_feedback",
                        scope: "national",
                        startDate: eventDates.tenDaysAgo,
                        allDay: false,
                        startTime: "14:00",
                        status: "completed",
                        priority: "high",
                        reminders: [],
                        isRecurring: false,
                        followUpRequired: false,
                        createdBy: "",
                        createdAt: eventDates.now,
                        updatedAt: eventDates.now,
                      },
                      // Cancelled events
                      {
                        id: "6",
                        title: "Community Outreach",
                        description: "Cancelled due to weather",
                        type: "other",
                        scope: "lga",
                        startDate: eventDates.fiveDaysAgo,
                        allDay: true,
                        status: "cancelled",
                        priority: "low",
                        reminders: [],
                        isRecurring: false,
                        followUpRequired: false,
                        createdBy: "",
                        createdAt: eventDates.now,
                        updatedAt: eventDates.now,
                      },
                      ...rawData.calendarEvents,
                    ]}
                    title="Upcoming Events"
                    description="Events calendar with status indicators"
                    delay={0.4}
                  />
                </div>
              </div>

              {/* Main Charts Row - Matching Screenshot Layout */}
              <div className="grid gap-6 md:grid-cols-2 mb-6">
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                  <BarChartWidget
                    data={[
                      { month: "Jan", amount: 1250000 },
                      { month: "Feb", amount: 1890000 },
                      { month: "Mar", amount: 2150000 },
                      { month: "Apr", amount: 1680000 },
                      { month: "May", amount: 2340000 },
                      { month: "Jun", amount: 2870000 },
                      { month: "Jul", amount: 3120000 },
                      { month: "Aug", amount: 2750000 },
                      { month: "Sep", amount: 2980000 },
                      { month: "Oct", amount: 3450000 },
                      { month: "Nov", amount: 3890000 },
                      { month: "Dec", amount: 4250000 },
                    ]}
                    dataKey="amount"
                    nameKey="month"
                    title="Donations"
                    description="Monthly donation trends"
                    delay={0.2}
                    onExport={() => {
                      // Export logic
                    }}
                    onDrillDown={() => {
                      setDrillDownModal({
                        open: true,
                        type: "donations",
                        data: rawData.donations as unknown as Record<
                          string,
                          unknown
                        >[],
                      });
                    }}
                  />
                </div>

                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                  <PieChartWidget
                    data={[
                      { name: "Health Programs", value: 45, color: "#3b82f6" },
                      { name: "Education", value: 32, color: "#10b981" },
                      {
                        name: "Women Empowerment",
                        value: 28,
                        color: "#f59e0b",
                      },
                      { name: "Prison Clearance", value: 22, color: "#ef4444" },
                      {
                        name: "Community Outreach",
                        value: 18,
                        color: "#8b5cf6",
                      },
                      {
                        name: "Skill Development",
                        value: 15,
                        color: "#ec4899",
                      },
                    ]}
                    title="Program Distribution"
                    description="Programs by type breakdown"
                    delay={0.3}
                    onExport={() => {
                      // Export logic
                    }}
                    onDrillDown={() => {
                      setDrillDownModal({
                        open: true,
                        type: "programs",
                        data: rawData.programs as unknown as Record<
                          string,
                          unknown
                        >[],
                      });
                    }}
                  />
                </div>
              </div>

              {/* Beneficiaries Radar Chart */}
              <div className="grid gap-6 md:grid-cols-2 mb-6">
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                  <RadarChartWidget
                    data={beneficiariesMonthlyData}
                    dataKeys={["beneficiaries"]}
                    angleKey="month"
                    title="Beneficiaries by Month"
                    description="Monthly distribution of beneficiary registrations"
                    colors={["#3b82f6"]}
                    delay={0.45}
                    onExport={() => {
                      // Export logic
                    }}
                    onDrillDown={() => {
                      setDrillDownModal({
                        open: true,
                        type: "beneficiaries",
                        data: rawData.beneficiaries as unknown as Record<
                          string,
                          unknown
                        >[],
                      });
                    }}
                  />
                </div>

                {/* Donations & Grants Area Chart */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                  <AreaChartWidget
                    data={donationsGrantsData}
                    dataKeys={[
                      { key: "donations", name: "Donations", color: "#3b82f6" },
                      { key: "grants", name: "Grants", color: "#10b981" },
                    ]}
                    title="Donations & Grants Overview"
                    description="Monthly financial trends - Donations vs Grants (in millions)"
                    delay={0.5}
                    onExport={() => {
                      // Export logic
                    }}
                    onDrillDown={() => {
                      setDrillDownModal({
                        open: true,
                        type: "donations-grants",
                        data: [
                          ...rawData.donations.map((d) => ({
                            donorName: d.donorName,
                            amount: d.amount,
                            donationDate: d.donationDate,
                            type: "donation",
                          })),
                          ...rawData.grants.map((g) => ({
                            grantor: g.grantor,
                            grantName: g.grantName,
                            amount: g.amount,
                            startDate: g.startDate,
                            type: "grant",
                          })),
                        ] as unknown as Record<string, unknown>[],
                      });
                    }}
                  />
                </div>
              </div>

              {/*Table Section */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Persistent Widgets - Always Visible */}
                <div className="lg:col-span-3 grid gap-6 md:grid-cols-2">
                  <div className="bg-card rounded-lg shadow-sm border border-border p-4">
                    <DataTableWidget
                      data={
                        rawData.beneficiaries.slice(0, 8) as Array<{
                          firstName: string;
                          lastName: string;
                          address: { state: string; lga: string };
                          programParticipations: string[];
                        }>
                      }
                      columns={beneficiaryColumns}
                      title="Recent Beneficiaries"
                      description="Latest beneficiaries overview"
                      searchable
                      delay={0.5}
                    />
                  </div>

                  <div className="bg-card rounded-lg shadow-sm border border-border p-4">
                    <DataTableWidget
                      data={
                        rawData.programs.slice(0, 8) as Array<{
                          title: string;
                          type: string;
                          status: string;
                          actualBeneficiaries: number;
                        }>
                      }
                      columns={programColumns}
                      title="Active Programs"
                      description="Current programs overview"
                      searchable
                      delay={0.6}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Drill-Down Modals */}
          <DrillDownModal
            open={
              drillDownModal.open && drillDownModal.type === "beneficiaries"
            }
            onOpenChange={(open) =>
              setDrillDownModal({ ...drillDownModal, open })
            }
            title="Beneficiaries Details"
            description="Complete list of beneficiaries"
            data={drillDownModal.data}
            exportFilename="beneficiaries"
          >
            {drillDownModal.data && (
              <DataTableWidget
                data={
                  drillDownModal.data as Array<{
                    firstName: string;
                    lastName: string;
                    address: { state: string; lga: string };
                    programParticipations: string[];
                  }>
                }
                columns={beneficiaryColumns}
                title=""
                searchable
              />
            )}
          </DrillDownModal>

          <DrillDownModal
            open={drillDownModal.open && drillDownModal.type === "programs"}
            onOpenChange={(open) =>
              setDrillDownModal({ ...drillDownModal, open })
            }
            title="Programs Details"
            description="Complete list of programs"
            data={drillDownModal.data}
            exportFilename="programs"
          >
            {drillDownModal.data && (
              <DataTableWidget
                data={
                  drillDownModal.data as Array<{
                    title: string;
                    type: string;
                    status: string;
                    actualBeneficiaries: number;
                  }>
                }
                columns={programColumns}
                title=""
                searchable
              />
            )}
          </DrillDownModal>
        </div>
      </div>
    </AppLayout>
  );
}
