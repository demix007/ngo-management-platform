import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import { ChartCard } from './chart-card'

interface BarChartWidgetProps {
  data: Array<{ [key: string]: string | number }>
  dataKey: string
  nameKey: string
  title?: string
  description?: string
  colors?: string[]
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

export function BarChartWidget({
  data,
  dataKey,
  nameKey,
  title = 'Bar Chart',
  description,
  colors = DEFAULT_COLORS,
  onExport,
  onDrillDown,
  delay = 0,
}: BarChartWidgetProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      color: colors[index % colors.length],
    }))
  }, [data, colors])

  const CustomTooltip = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border rounded-lg shadow-xl p-3 backdrop-blur-sm"
          >
            <p className="font-semibold text-foreground">{data[nameKey]}</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-blue-600 dark:text-blue-400 font-medium mt-1"
            >
              {dataKey}: {data[dataKey].toLocaleString()}
            </motion.p>
          </motion.div>
        )
      }
      return null
    }
  }, [nameKey, dataKey])

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
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            onMouseMove={(e: any) => {
              if (e?.activeTooltipIndex !== undefined) {
                setHoveredIndex(e.activeTooltipIndex)
              }
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey={nameKey}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--border))"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--border))"
            />
            <Tooltip 
              content={CustomTooltip}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)', radius: 8 }}
              animationDuration={200}
            />
            <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
            <Bar 
              dataKey={dataKey} 
              radius={[8, 8, 0, 0]}
              animationBegin={delay * 1000}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={hoveredIndex === index ? entry.color : entry.color}
                  stroke={entry.color}
                  strokeWidth={hoveredIndex === index ? 3 : 1}
                  opacity={hoveredIndex !== null && hoveredIndex !== index ? 0.5 : 1}
                  style={{
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    filter: hoveredIndex === index ? 'brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none',
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </ChartCard>
  )
}

