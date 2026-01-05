import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useBeneficiary } from '@/features/beneficiaries/hooks/use-beneficiaries'
import { BeneficiaryFormComprehensive } from '@/features/beneficiaries/components/beneficiary-form-comprehensive'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/beneficiaries/$id/edit')({
  beforeLoad: async () => {
    const { isLoading } = useAuthStore.getState()
    if (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    const finalState = useAuthStore.getState()
    if (!finalState.isAuthenticated || !finalState.user) {
      throw redirect({ to: '/login' })
    }
  },
  component: EditBeneficiaryPage,
})

function EditBeneficiaryPage() {
  const navigate = useNavigate()
  const { id } = Route.useParams()
  const { data: beneficiary, isLoading, error } = useBeneficiary(id)

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    )
  }

  if (error || !beneficiary) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">Beneficiary not found</p>
              <Button
                variant="default"
                onClick={() => navigate({ to: '/beneficiaries' })}
                className="mt-4"
              >
                Back to Beneficiaries
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
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
            onClick={() => navigate({ to: '/beneficiaries/$id', params: { id } })}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Button>
        </motion.div>

        <BeneficiaryFormComprehensive
          beneficiary={beneficiary}
          onSuccess={() => navigate({ to: '/beneficiaries/$id', params: { id } })}
        />
      </motion.div>
    </AppLayout>
  )
}
