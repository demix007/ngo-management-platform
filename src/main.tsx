import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './index.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Initialize theme from localStorage on app load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('ui-storage')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      const theme = parsed.state?.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(theme)
    } catch {
      // Use system preference if parsing fails
      const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(theme)
    }
  } else {
    // Use system preference if no stored theme
    const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
