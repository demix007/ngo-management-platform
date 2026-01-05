import { motion } from 'framer-motion'
import { CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Maximize2, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ChartCardProps {
  title: string
  description?: string
  children: ReactNode
  onExport?: () => void
  onDrillDown?: () => void
  delay?: number
  timeframe?: string
  onTimeframeChange?: (value: string) => void
}

export function ChartCard({
  title,
  description,
  children,
  onExport,
  onDrillDown,
  delay = 0,
  timeframe = 'Monthly',
  onTimeframeChange,
}: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {onTimeframeChange && (
              <Select value={timeframe} onValueChange={onTimeframeChange}>
                <SelectTrigger className="w-[120px] h-8 text-sm">
                  <SelectValue />
                  <ChevronDown className="h-4 w-4 ml-2" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            )}
            {onDrillDown && (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDrillDown}>
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </motion.div>
                </Button>
              </motion.div>
            )}
            {onExport && (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onExport}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Download className="h-4 w-4" />
                  </motion.div>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
        <CardContent className="p-0">{children}</CardContent>
      </div>
    </motion.div>
  )
}

