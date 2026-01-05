import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
// import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { BeneficiaryFormComprehensive } from "@/features/beneficiaries/components/beneficiary-form-comprehensive";
import { AppLayout } from "@/components/layout/app-layout";
// import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/beneficiaries/create")({
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
  component: CreateBeneficiaryPage,
});

function CreateBeneficiaryPage() {
  const navigate = useNavigate();

  return (
    // <AppLayout>
    //   <motion.div
    //     initial={{ opacity: 0, y: 20 }}
    //     animate={{ opacity: 1, y: 0 }}
    //     transition={{ duration: 0.3 }}
    //     className="container mx-auto p-6 max-w-6xl"
    //   >
    //     <motion.div
    //       initial={{ opacity: 0, x: -20 }}
    //       animate={{ opacity: 1, x: 0 }}
    //       transition={{ duration: 0.3, delay: 0.1 }}
    //       className="mb-6"
    //     >
    //       <Button
    //         variant="ghost"
    //         onClick={() => navigate({ to: '/beneficiaries' })}
    //         className="mb-4"
    //       >
    //         <ArrowLeft className="mr-2 h-4 w-4" />
    //         Back to Beneficiaries
    //       </Button>
    //     </motion.div>

    //     <BeneficiaryFormComprehensive
    //       onSuccess={() => navigate({ to: '/beneficiaries' })}
    //     />
    //   </motion.div>
    // </AppLayout>

    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto p-6"
      >
        <BeneficiaryFormComprehensive
          onSuccess={() => navigate({ to: "/beneficiaries" })}
        />
      </motion.div>
    </AppLayout>
  );
}
