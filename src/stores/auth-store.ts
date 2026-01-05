import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  hasRole: (role: UserRole | UserRole[]) => boolean
  hasPermission: (permission: string) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => {
        console.log('Setting user in store:', { userId: user?.id, email: user?.email, role: user?.role })
        set({ user, isAuthenticated: !!user, isLoading: false })
      },
      setLoading: (loading) => set({ isLoading: loading }),
      hasRole: (role) => {
        const { user } = get()
        if (!user) return false
        if (Array.isArray(role)) {
          return role.includes(user.role)
        }
        return user.role === role
      },
      hasPermission: (permission) => {
        const { user, hasRole } = get()
        if (!user) return false
        
        // National admin has all permissions
        if (hasRole('national_admin')) return true
        
        // Define permission mappings
        const permissions: Record<string, UserRole[]> = {
          'beneficiaries:create': ['field_officer', 'state_admin'],
          'beneficiaries:read': ['field_officer', 'state_admin', 'm_e', 'national_admin'],
          'beneficiaries:update': ['field_officer', 'state_admin', 'm_e', 'national_admin'],
          'programs:create': ['state_admin', 'national_admin'],
          'programs:read': ['field_officer', 'state_admin', 'm_e', 'national_admin'],
          'donations:read': ['finance', 'national_admin', 'donor'],
          'donations:create': ['finance', 'national_admin'],
          'dashboard:view': ['field_officer', 'state_admin', 'm_e', 'finance', 'national_admin'],
        }
        
        const allowedRoles = permissions[permission] || []
        return allowedRoles.some((role) => hasRole(role))
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

