import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
import { AppLayout } from "@/components/layout/app-layout";
import { DonationFormComprehensive } from "@/features/donations/components/donation-form-comprehensive";

export const Route = createFileRoute("/donations/create")({
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
  component: CreateDonationPage,
});

function CreateDonationPage() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto p-6"
      >
        <DonationFormComprehensive
          onSuccess={() => navigate({ to: "/donations" })}
        />
      </motion.div>
    </AppLayout>
  );
}
