import { createRootRoute, Outlet } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { useAuth } from '@/features/auth/hooks/use-auth'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  useAuth() // Initialize auth state listener

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="min-h-screen bg-background">
          <Outlet />
        </div>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
