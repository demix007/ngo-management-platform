import { useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { TrendingUp } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ActivityItem {
  id: string
  type: 'donation' | 'grant' | 'program' | 'beneficiary' | 'event' | 'partner'
  title: string
  description: string
  timestamp: Date
  icon: string
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  maxItems?: number
  autoScroll?: boolean
}

export function ActivityFeed({ activities, maxItems = 20, autoScroll = true }: ActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const displayedActivities = useMemo(() => activities.slice(0, maxItems), [activities, maxItems])

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activities, autoScroll])

  const getActivityColor = (type: ActivityItem['type']) => {
    const colors = {
      donation: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50 shadow-sm hover:shadow-md',
      grant: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-200 dark:hover:bg-green-900/50 shadow-sm hover:shadow-md',
      program: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-200 dark:hover:bg-purple-900/50 shadow-sm hover:shadow-md',
      beneficiary: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700 hover:border-orange-400 dark:hover:border-orange-600 hover:bg-orange-200 dark:hover:bg-orange-900/50 shadow-sm hover:shadow-md',
      event: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-700 hover:border-pink-400 dark:hover:border-pink-600 hover:bg-pink-200 dark:hover:bg-pink-900/50 shadow-sm hover:shadow-md',
      partner: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700 hover:border-cyan-400 dark:hover:border-cyan-600 hover:bg-cyan-200 dark:hover:bg-cyan-900/50 shadow-sm hover:shadow-md',
    }
    return colors[type] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-900/50 shadow-sm hover:shadow-md'
  }

  return (
    <div className="space-y-4">
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h3 className="text-lg font-semibold text-foreground">Events & Activities History</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Recent events and activities</p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Select defaultValue="7days">
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="60days">Last 60 days</SelectItem>  
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
      </motion.div>
      <div
        ref={scrollRef}
        className="space-y-2 max-h-[400px] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-0.5"
      >
        <AnimatePresence mode="popLayout">
          {displayedActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.05,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              whileHover={{ 
                scale: 1.01,
                transition: { duration: 0.2 }
              }}
              style={{ transformOrigin: 'center' }}
              className={`relative p-4 rounded-xl border-2 cursor-pointer group overflow-hidden ${getActivityColor(activity.type)}`}
            >
              {/* Shimmer effect on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
              
              <div className="flex items-start gap-3 relative z-10">
                <motion.div 
                  className="text-2xl relative"
                  whileHover={{ 
                    scale: 1.2,
                    rotate: [0, -10, 10, 0],
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {activity.icon}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <motion.p 
                    className="font-semibold text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                  >
                    {activity.title}
                  </motion.p>
                  <motion.p 
                    className="text-xs opacity-80 mt-1.5 line-clamp-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ delay: index * 0.05 + 0.15 }}
                  >
                    {activity.description}
                  </motion.p>
                  <motion.div
                    className="flex items-center gap-1 mt-2"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 + 0.2 }}
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-1.5 h-1.5 rounded-full bg-current opacity-60"
                    />
                    <p className="text-xs opacity-60">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {displayedActivities.length === 0 && (
          <motion.div 
            className="text-center py-8 text-muted-foreground"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            </motion.div>
            <p>No recent activity</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

