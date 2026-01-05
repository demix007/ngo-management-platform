import { useEffect } from 'react'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, getDocFromServer, getDocFromCache } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import type { User } from '@/types'

export function useAuth() {
  const { setUser, setLoading, logout: storeLogout } = useAuthStore()
  const { addNotification } = useUIStore()

  useEffect(() => {
    let isMounted = true
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return
      
      // Don't override if we're in the middle of a login process
      // The login page will handle setting the user
      const currentUser = useAuthStore.getState().user
      if (currentUser && firebaseUser?.uid === currentUser.id) {
        // User already set and matches, skip this update to avoid race conditions
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        if (firebaseUser) {
          // Try to get from server first, fallback to cache if offline
          let userDoc
          try {
            userDoc = await getDocFromServer(doc(db, 'users', firebaseUser.uid))
          } catch (error) {
            // If server read fails (offline), try cache
            const firebaseError = error as { code?: string; message?: string }
            if (firebaseError.code === 'unavailable' || firebaseError.code === 'failed-precondition') {
              try {
                userDoc = await getDocFromCache(doc(db, 'users', firebaseUser.uid))
              } catch (cacheError) {
                console.warn('User document not found in cache:', cacheError)
                throw error // Re-throw original error
              }
            } else {
              throw error
            }
          }
          
          if (userDoc.exists()) {
            const userData = userDoc.data()
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || userData.displayName || '',
              role: userData.role,
              state: userData.state,
              lga: userData.lga,
              phoneNumber: userData.phoneNumber,
              photoURL: firebaseUser.photoURL || userData.photoURL,
              isActive: userData.isActive ?? true,
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
              lastLoginAt: userData.lastLoginAt?.toDate(),
              twoFactorEnabled: userData.twoFactorEnabled ?? false,
            }
            setUser(user)
          } else {
            console.warn('User document does not exist in Firestore for:', firebaseUser.uid)
            setUser(null)
            addNotification({
              type: 'error',
              message: 'User profile not found. Please contact an administrator.',
            })
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        const firebaseError = error as { code?: string; message?: string }
        const errorCode = firebaseError.code
        
        // Handle offline/unavailable errors silently - try cache
        if (errorCode === 'unavailable' || errorCode === 'failed-precondition') {
          if (firebaseUser) {
            console.warn('Network unavailable, attempting to load from cache...')
            try {
              const cachedDoc = await getDocFromCache(doc(db, 'users', firebaseUser.uid))
              if (cachedDoc.exists()) {
                const userData = cachedDoc.data()
                const user: User = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  displayName: firebaseUser.displayName || userData.displayName || '',
                  role: userData.role,
                  state: userData.state,
                  lga: userData.lga,
                  phoneNumber: userData.phoneNumber,
                  photoURL: firebaseUser.photoURL || userData.photoURL,
                  isActive: userData.isActive ?? true,
                  createdAt: userData.createdAt?.toDate() || new Date(),
                  updatedAt: userData.updatedAt?.toDate() || new Date(),
                  lastLoginAt: userData.lastLoginAt?.toDate(),
                  twoFactorEnabled: userData.twoFactorEnabled ?? false,
                }
                setUser(user)
                return // Successfully loaded from cache
              }
            } catch {
              // Cache read failed - document doesn't exist
              console.warn('User document not found in cache')
            }
          }
          // If we get here, document doesn't exist - set user to null silently
          // Don't show error notification for offline scenarios
          setUser(null)
        } else {
          // For other errors, log but don't show notification during auth state change
          // (login page will handle showing errors)
          console.error('Auth state change error:', error)
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [setUser, setLoading, addNotification])

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      storeLogout()
      addNotification({ type: 'success', message: 'Signed out successfully' })
      // Navigate will be handled by the component that calls signOut
    } catch (error) {
      console.error('Sign out error:', error)
      addNotification({
        type: 'error',
        message: 'Failed to sign out',
      })
    }
  }

  return { signOut }
}

