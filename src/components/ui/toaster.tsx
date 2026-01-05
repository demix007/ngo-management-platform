import { useUIStore } from '@/stores/ui-store'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from './button'
import { useEffect, useRef } from 'react'

export function Toaster() {
  const { notifications, removeNotification } = useUIStore()
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Auto-dismiss notifications after a delay
  useEffect(() => {
    const timeouts = timeoutsRef.current
    
    notifications.forEach((notification) => {
      // Skip if timeout already exists for this notification
      if (timeouts.has(notification.id)) {
        return
      }

      // Set different durations based on notification type
      const duration =
        notification.type === 'error' ? 6000 : // 6 seconds for errors
        notification.type === 'warning' ? 5000 : // 5 seconds for warnings
        4000 // 4 seconds for success/info

      const timeout = setTimeout(() => {
        removeNotification(notification.id)
        timeouts.delete(notification.id)
      }, duration)

      timeouts.set(notification.id, timeout)
    })

    // Cleanup: remove timeouts for notifications that no longer exist
    const existingIds = new Set(notifications.map((n) => n.id))
    timeouts.forEach((timeout, id) => {
      if (!existingIds.has(id)) {
        clearTimeout(timeout)
        timeouts.delete(id)
      }
    })

    // Cleanup function
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout))
      timeouts.clear()
    }
  }, [notifications, removeNotification])

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 max-w-sm w-full">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`rounded-lg border p-4 shadow-lg ${
              notification.type === 'error'
                ? 'bg-destructive text-destructive-foreground'
                : notification.type === 'success'
                ? 'bg-green-600 text-white'
                : notification.type === 'warning'
                ? 'bg-yellow-600 text-white'
                : 'bg-blue-600 text-white'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{notification.message}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => {
                  // Clear timeout if manually dismissed
                  const timeouts = timeoutsRef.current
                  const timeout = timeouts.get(notification.id)
                  if (timeout) {
                    clearTimeout(timeout)
                    timeouts.delete(notification.id)
                  }
                  removeNotification(notification.id)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

