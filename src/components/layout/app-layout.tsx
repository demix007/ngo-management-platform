import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  Handshake,
  LogOut,
  Menu,
  X,
  Award,
  BriefcaseBusiness,
  CalendarSync,
  ClipboardPlus,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Beneficiaries", href: "/beneficiaries", icon: Users },
  { name: "Programs", href: "/programs", icon: Calendar },
  { name: "Donations", href: "/donations", icon: DollarSign },
  { name: "Grants", href: "/grants", icon: Award },
  { name: "Partners", href: "/partners", icon: Handshake },
  { name: "Projects", href: "/projects", icon: BriefcaseBusiness },
  { name: "Calendar & Workflows", href: "/calendar", icon: CalendarSync },
  { name: "Reports", href: "/reports", icon: ClipboardPlus },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, hasPermission } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const handleSignOut = async () => {
    try {
      await signOut();
      // Wait for state to clear and persist
      await new Promise((resolve) => setTimeout(resolve, 150));
      // Verify logout was successful
      const currentState = useAuthStore.getState();
      console.log("Logout state check:", {
        isAuthenticated: currentState.isAuthenticated,
        hasUser: !!currentState.user,
      });
      if (!currentState.isAuthenticated) {
        navigate({ to: "/login", replace: true });
      } else {
        // Force clear if still authenticated
        useAuthStore.getState().logout();
        navigate({ to: "/login", replace: true });
      }
    } catch (error) {
      console.error("Sign out error:", error);
      // Force navigation even on error
      navigate({ to: "/login", replace: true });
    }
  };

  console.log(hasPermission("grants:read"));
  console.log("item href", navigation);

  // const filteredNavigation = navigation.filter((item) => {
  //   if (item.href === "/donations") {
  //     return hasPermission("donations:read");
  //   }
  //   if (item.href === "/grants") {
  //     return hasPermission("grants:read");
  //   }
  //   if (item.href === "/beneficiaries") {
  //     return hasPermission("beneficiaries:read");
  //   }
  //   return true;
  // });

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? "16rem" : "0",
          opacity: sidebarOpen ? 1 : 0,
        }}
        className="hidden md:flex flex-col border-r bg-card overflow-hidden"
      >
        <div className="flex h-16 flex-col items-center border-b px-6 my-2">
          <h1 className="text-xl font-bold">Integrated</h1>
          <h1 className="text-xl font-bold">Management System</h1>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <div className="mb-2 px-3 py-2 text-sm">
            <p className="font-medium">{user?.displayName}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role?.replace("_", " ")}
            </p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : "-100%",
        }}
        className="fixed left-0 top-0 z-50 h-full w-64 bg-card border-r md:hidden"
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-xl font-bold">Integrated Management System</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
