import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useProject } from "@/features/projects/hooks/use-projects";
import { ProjectFormComprehensive } from "@/features/projects/components/project-form-comprehensive";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/projects/$id/edit")({
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
  component: EditProjectPage,
});

function EditProjectPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { data: project, isLoading, error } = useProject(id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !project) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">Project not found</p>
              <Button
                variant="default"
                onClick={() => navigate({ to: "/projects" })}
                className="mt-4"
              >
                Back to Projects
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto p-6 max-w-6xl"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/projects/$id", params: { id } })}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Button>
        </motion.div>

        <ProjectFormComprehensive
          project={project}
          onSuccess={() => navigate({ to: "/projects/$id", params: { id } })}
        />
      </motion.div>
    </AppLayout>
  );
}
