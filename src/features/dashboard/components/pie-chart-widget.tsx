import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartCard } from './chart-card'
import { formatCurrency } from '@/lib/utils'

interface PieChartWidgetProps {
  data: Array<{ name: string; value: number; color?: string }>
  title?: string
  description?: string
  showCurrency?: boolean
  onExport?: () => void
  onDrillDown?: () => void
  delay?: number
}

// Vibrant colors that work well in both light and dark modes
const DEFAULT_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#14b8a6', // Teal
]

export function PieChartWidget({
  data,
  title = 'Distribution',
  description,
  showCurrency = false,
  onExport,
  onDrillDown,
  delay = 0,
}: PieChartWidgetProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0)
  }, [data])

  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }))
  }, [data])

  const CustomTooltip = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const dataPoint = payload[0]
        const value = typeof dataPoint.value === 'number' ? dataPoint.value : 0
        const name = dataPoint.name || ''
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border rounded-lg shadow-xl p-3 backdrop-blur-sm"
          >
            <p className="font-semibold text-foreground">{name}</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-blue-600 dark:text-blue-400 font-medium mt-1"
            >
              {showCurrency
                ? formatCurrency(value)
                : `${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`}
            </motion.p>
          </motion.div>
        )
      }
      return null
    }
  }, [showCurrency, total])

  const dataWithPercentages = useMemo(() => {
    return chartData.map((item) => ({
      ...item,
      percentage: ((item.value / total) * 100).toFixed(1),
    }))
  }, [chartData, total])

  const handlePieEnter = (_: unknown, index: number) => {
    setHoveredIndex(index)
    setActiveIndex(index)
  }

  const handlePieLeave = () => {
    setHoveredIndex(null)
    setActiveIndex(null)
  }

  return (
    <ChartCard
      title={title}
      description={description}
      onExport={onExport}
      onDrillDown={onDrillDown}
      delay={delay}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.5 }}
        className="relative"
      >
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={dataWithPercentages}
              cx="50%"
              cy="45%"
              labelLine={false}
              label={({ name, percent }) => {
                const percentValue = percent ? (percent * 100).toFixed(1) : '0'
                return `${name}: ${percentValue}%`
              }}
              outerRadius={hoveredIndex !== null && hoveredIndex === activeIndex ? 105 : 90}
              innerRadius={0}
              fill="#8884d8"
              dataKey="value"
              animationBegin={delay * 1000}
              animationDuration={1200}
              animationEasing="ease-out"
              stroke="hsl(var(--card))"
              strokeWidth={2}
              onMouseEnter={handlePieEnter}
              onMouseLeave={handlePieLeave}
            >
              {dataWithPercentages.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={entry.color}
                  strokeWidth={hoveredIndex === index ? 4 : 2}
                  opacity={hoveredIndex !== null && hoveredIndex !== index ? 0.5 : 1}
                  style={{
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    filter: hoveredIndex === index ? 'brightness(1.15) drop-shadow(0 4px 12px rgba(0,0,0,0.3))' : 'none',
                    transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: 'center',
                  }}
                />
              ))}
            </Pie>
            <Tooltip 
              content={CustomTooltip}
              animationDuration={200}
              cursor={{ fill: 'transparent' }}
            />
            <Legend 
              wrapperStyle={{ 
                color: 'hsl(var(--foreground))',
                marginTop: '40px',
                paddingTop: '16px',
              }}
              formatter={(value, entry) => {
                const entryValue = entry.payload?.value
                const numValue = typeof entryValue === 'number' ? entryValue : 0
                const isHovered = hoveredIndex !== null && dataWithPercentages.findIndex((d) => d.name === value) === hoveredIndex
                return (
                  <motion.span
                    initial={false}
                    animate={{
                      opacity: hoveredIndex !== null && !isHovered ? 0.5 : 1,
                      scale: isHovered ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    style={{ 
                      color: entry.color as string,
                      cursor: 'pointer',
                      display: 'inline-block',
                    }}
                  >
                    {value}: {showCurrency ? formatCurrency(numValue) : numValue.toLocaleString()}
                  </motion.span>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>
    </ChartCard>
  )
}

