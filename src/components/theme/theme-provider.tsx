import { useEffect } from 'react'
import { useUIStore } from '@/stores/ui-store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useUIStore()

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  // Listen for system theme changes (optional - only if user hasn't set a preference)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (_e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      // This is handled by the store's initial theme detection
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return <>{children}</>
}

