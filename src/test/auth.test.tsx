import { describe, it, expect } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'

describe('Authentication', () => {
  it('should initialize with no user', () => {
    const { user, isAuthenticated } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
  })

  it('should check role permissions correctly', () => {
    const { hasRole } = useAuthStore.getState()
    
    // Test with no user
    expect(hasRole('national_admin')).toBe(false)
    
    // Test with user (would need to set user first)
    // This is a basic test structure
  })
})

