import { useMemo } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { ChartCard } from './chart-card'
import { formatCurrency } from '@/lib/utils'

interface TimeSeriesChartProps {
  data: Array<{ month: string; monthShort: string; amount: number; count?: number }>
  title?: string
  description?: string
  variant?: 'line' | 'area'
  showCount?: boolean
  onExport?: () => void
  onDrillDown?: () => void
  delay?: number
}

export function TimeSeriesChart({
  data,
  title = 'Time Series',
  description,
  variant = 'area',
  showCount = false,
  onExport,
  onDrillDown,
  delay = 0,
}: TimeSeriesChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      amountFormatted: item.amount / 1000000, // Convert to millions
    }))
  }, [data])

  const CustomTooltip = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
          <div className="bg-card border border-border rounded-lg shadow-lg p-3">
            <p className="font-semibold text-foreground">{data.month}</p>
            <p className="text-blue-600 dark:text-blue-400 font-medium">
              Amount: {formatCurrency(data.amount)}
            </p>
            {showCount && data.count && (
              <p className="text-green-600 dark:text-green-400 font-medium">Count: {data.count}</p>
            )}
          </div>
        )
      }
      return null
    }
  }, [showCount])

  const ChartComponent = variant === 'area' ? AreaChart : LineChart
  const DataComponent = variant === 'area' ? Area : Line

  return (
    <ChartCard
      title={title}
      description={description}
      onExport={onExport}
      onDrillDown={onDrillDown}
      delay={delay}
      timeframe="Monthly"
    >
      <ResponsiveContainer width="100%" height={280}>
        <ChartComponent data={chartData}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorAmountDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="monthShort"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            stroke="hsl(var(--border))"
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            stroke="hsl(var(--border))"
            tickFormatter={(value) => `₦${value}M`}
          />
          <Tooltip 
            content={CustomTooltip}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
          <DataComponent
            type="monotone"
            dataKey="amountFormatted"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="url(#colorAmount)"
            name="Amount (Millions)"
            dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
          />
          {showCount && (
            <Line
              type="monotone"
              dataKey="count"
              stroke="#10b981"
              strokeWidth={3}
              name="Count"
              dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </ChartCard>
  )
}

