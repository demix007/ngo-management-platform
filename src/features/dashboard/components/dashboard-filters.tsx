import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { DashboardFilters } from '@/types'

interface DashboardFiltersProps {
  filters: DashboardFilters
  onFiltersChange: (filters: DashboardFilters) => void
  availableStates?: string[]
  availableLGAs?: string[]
}

export function DashboardFilters({
  filters,
  onFiltersChange,
  availableStates = [],
  availableLGAs = [],
}: DashboardFiltersProps) {
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  
  const debouncedChange = useCallback((newFilters: DashboardFilters) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      onFiltersChange(newFilters)
    }, 300)
  }, [onFiltersChange])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleStateChange = useCallback(
    (state: string) => {
      const newFilters = { ...filters, state: state === 'all' ? undefined : state, lga: undefined }
      debouncedChange(newFilters)
    },
    [filters, debouncedChange]
  )

  const handleLGAChange = useCallback(
    (lga: string) => {
      const newFilters = { ...filters, lga: lga === 'all' ? undefined : lga }
      debouncedChange(newFilters)
    },
    [filters, debouncedChange]
  )

  const handleStartDateChange = useCallback(
    (date: Date | undefined) => {
      const newFilters = { ...filters, startDate: date }
      debouncedChange(newFilters)
      setStartDateOpen(false)
    },
    [filters, debouncedChange]
  )

  const handleEndDateChange = useCallback(
    (date: Date | undefined) => {
      const newFilters = { ...filters, endDate: date }
      debouncedChange(newFilters)
      setEndDateOpen(false)
    },
    [filters, debouncedChange]
  )

  const clearFilters = useCallback(() => {
    const clearedFilters: DashboardFilters = {}
    onFiltersChange(clearedFilters)
  }, [onFiltersChange])

  const hasActiveFilters = Boolean(
    filters.state || filters.lga || filters.startDate || filters.endDate
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-wrap items-center gap-4 p-4 bg-card border rounded-lg shadow-sm"
    >
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Filter className="h-4 w-4 text-primary" />
        </motion.div>
        <span className="text-sm font-semibold text-foreground">Filters:</span>
      </motion.div>

      {/* Date Range */}
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
          <PopoverTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'w-[200px] justify-start text-left font-normal transition-all duration-200',
                  !filters.startDate && 'text-sm',
                  filters.startDate
                    ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20 hover:border-green-600 hover:bg-green-100/70 dark:hover:bg-green-950/30'
                    : 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-600 hover:bg-blue-100/70 dark:hover:bg-blue-950/30'
                )}
              >
                <motion.div
                  animate={startDateOpen ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CalendarIcon className={cn(
                    'mr-2 h-4 w-4 transition-colors',
                    filters.startDate ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                  )} />
                </motion.div>
                <span className={cn(
                  filters.startDate ? 'text-green-700 dark:text-green-300 font-medium' : 'text-muted-foreground'
                )}>
                  {filters.startDate ? format(filters.startDate, 'PPP') : 'Start Date'}
                </span>
              </Button>
            </motion.div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Calendar
                mode="single"
                selected={filters.startDate}
                onSelect={handleStartDateChange}
                initialFocus
              />
            </motion.div>
          </PopoverContent>
        </Popover>

        <motion.span
          className="text-muted-foreground px-1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          to
        </motion.span>

        <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
          <PopoverTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'w-[200px] justify-start text-left font-normal transition-all duration-200',
                  !filters.endDate && 'text-sm',
                  filters.endDate
                    ? 'border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/20 hover:border-purple-600 hover:bg-purple-100/70 dark:hover:bg-purple-950/30'
                    : 'border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20 hover:border-orange-600 hover:bg-orange-100/70 dark:hover:bg-orange-950/30'
                )}
              >
                <motion.div
                  animate={endDateOpen ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CalendarIcon className={cn(
                    'mr-2 h-4 w-4 transition-colors',
                    filters.endDate ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'
                  )} />
                </motion.div>
                <span className={cn(
                  filters.endDate ? 'text-purple-700 dark:text-purple-300 font-medium' : 'text-muted-foreground'
                )}>
                  {filters.endDate ? format(filters.endDate, 'PPP') : 'End Date'}
                </span>
              </Button>
            </motion.div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Calendar
                mode="single"
                selected={filters.endDate}
                onSelect={handleEndDateChange}
                initialFocus
              />
            </motion.div>
          </PopoverContent>
        </Popover>
      </motion.div>

      {/* State Filter */}
      <AnimatePresence>
        {availableStates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <Select
              value={filters.state || 'all'}
              onValueChange={handleStateChange}
            >
              <SelectTrigger className="w-[180px] transition-all duration-200 hover:border-primary/50 hover:ring-2 hover:ring-primary/20">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {availableStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LGA Filter */}
      <AnimatePresence>
        {availableLGAs.length > 0 && filters.state && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Select
              value={filters.lga || 'all'}
              onValueChange={handleLGAChange}
            >
              <SelectTrigger className="w-[180px] transition-all duration-200 hover:border-primary/50 hover:ring-2 hover:ring-primary/20">
                <SelectValue placeholder="All LGAs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All LGAs</SelectItem>
                {availableLGAs.map((lga) => (
                  <SelectItem key={lga} value={lga}>
                    {lga}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Filters */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="destructive"
                onClick={clearFilters}
                className="transition-all duration-200 hover:shadow-lg hover:shadow-destructive/50"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <X className="h-4 w-4 mr-2" />
                </motion.div>
                Clear
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

