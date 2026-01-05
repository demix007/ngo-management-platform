import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, getDocFromServer, getDocFromCache } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading'
import { motion } from 'framer-motion'
import type { User } from '@/types'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { setUser, isAuthenticated } = useAuthStore()
  const { addNotification } = useUIStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Try to get user document - prioritize server read for fresh data
      let userDoc
      let docExists = false
      
      try {
        // Try server first for fresh data
        userDoc = await getDocFromServer(doc(db, 'users', userCredential.user.uid))
        docExists = userDoc.exists()
      } catch (serverError) {
        const firebaseError = serverError as { code?: string; message?: string }
        console.log('Server read failed, trying alternatives:', firebaseError.code)
        
        // If server fails due to offline/unavailable, try regular getDoc
        if (firebaseError.code === 'unavailable' || firebaseError.code === 'failed-precondition') {
          try {
            // getDoc will try cache first, then server if online
            userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
            docExists = userDoc.exists()
          } catch (docError) {
            const docFirebaseError = docError as { code?: string; message?: string }
            console.log('getDoc failed, trying cache:', docFirebaseError.code)
            
            // If still failing, try cache only
            if (docFirebaseError.code === 'unavailable') {
              try {
                userDoc = await getDocFromCache(doc(db, 'users', userCredential.user.uid))
                docExists = userDoc.exists()
              } catch (cacheError) {
                // Document doesn't exist in cache either
                const cacheFirebaseError = cacheError as { code?: string; message?: string }
                console.error('User document not found in cache or server:', {
                  uid: userCredential.user.uid,
                  errorCode: cacheFirebaseError.code,
                  errorMessage: cacheFirebaseError.message,
                  path: `users/${userCredential.user.uid}`
                })
                throw new Error(`User profile not found in system. Document ID "${userCredential.user.uid}" does not exist in Firestore collection "users". Please contact an administrator to create your account in Firestore.`)
              }
            } else {
              throw new Error('User profile not found. Please contact an administrator.')
            }
          }
        } else {
          // For other errors, try regular getDoc as fallback
          try {
            userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
            docExists = userDoc.exists()
          } catch {
            throw new Error('Failed to load user profile. Please try again.')
          }
        }
      }
      
      if (!docExists || !userDoc.exists()) {
        const errorMessage = `User profile not found in system. Your Firebase Auth user exists (UID: ${userCredential.user.uid}), but the corresponding document is missing in Firestore.\n\n` +
          `Please verify:\n` +
          `1. Document ID in Firestore matches exactly: ${userCredential.user.uid}\n` +
          `2. Collection name is exactly: "users" (case-sensitive)\n` +
          `3. Document exists at: users/${userCredential.user.uid}\n\n` +
          `To fix: Run "npm run create-user-doc" or create the document manually in Firebase Console.`
        console.error('User document lookup failed:', {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          collection: 'users',
          path: `users/${userCredential.user.uid}`
        })
        throw new Error(errorMessage)
      }

      const userData = userDoc.data()
      const user: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || userData.displayName || '',
        role: userData.role,
        state: userData.state,
        lga: userData.lga,
        phoneNumber: userData.phoneNumber,
        photoURL: userCredential.user.photoURL || userData.photoURL,
        isActive: userData.isActive ?? true,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        lastLoginAt: new Date(),
        twoFactorEnabled: userData.twoFactorEnabled ?? false,
      }

      // Set user in store
      setUser(user)
      
      // Wait for Zustand store to persist and update
      // Check state multiple times to ensure it's set
      let attempts = 0
      let stateReady = false
      while (attempts < 10 && !stateReady) {
        await new Promise((resolve) => setTimeout(resolve, 50))
        const currentState = useAuthStore.getState()
        if (currentState.isAuthenticated && currentState.user?.id === userCredential.user.uid) {
          stateReady = true
          console.log('Login state verified:', {
            isAuthenticated: currentState.isAuthenticated,
            userId: currentState.user?.id,
            userRole: currentState.user?.role
          })
        }
        attempts++
      }
      
      // Final verification
      const finalState = useAuthStore.getState()
      if (finalState.isAuthenticated && finalState.user?.id === userCredential.user.uid) {
        addNotification({ type: 'success', message: 'Login successful!' })
        // Use replace to prevent back navigation to login
        navigate({ to: '/dashboard', replace: true })
      } else {
        console.error('State verification failed after retries:', {
          isAuthenticated: finalState.isAuthenticated,
          userId: finalState.user?.id,
          expectedId: userCredential.user.uid,
          attempts
        })
        throw new Error('Failed to set user state. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to login',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Integrated Management System</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <LoadingSpinner size="sm" /> : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

