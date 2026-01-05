import { useMemo } from 'react'
import {
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

interface AreaChartWidgetProps {
  data: Array<{ name: string; partners?: number; projects?: number }>
  title?: string
  description?: string
  dataKeys: Array<{ key: string; name: string; color: string }>
  onExport?: () => void
  onDrillDown?: () => void
  delay?: number
}

export function AreaChartWidget({
  data,
  dataKeys,
  title = 'Area Chart',
  description,
  onExport,
  onDrillDown,
  delay = 0,
}: AreaChartWidgetProps) {
  const CustomTooltip = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-card border border-border rounded-lg shadow-lg p-3">
            <p className="font-semibold text-foreground mb-2">{payload[0]?.payload?.name}</p>
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: <span className="font-medium">{entry.value}</span>
              </p>
            ))}
          </div>
        )
      }
      return null
    }
  }, [])

  return (
    <ChartCard
      title={title}
      description={description}
      onExport={onExport}
      onDrillDown={onDrillDown}
      delay={delay}
    >
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            {dataKeys.map((dataKey, index) => (
              <linearGradient
                key={dataKey.key}
                id={`color${dataKey.key}${index}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={dataKey.color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={dataKey.color} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            stroke="hsl(var(--border))"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            stroke="hsl(var(--border))"
            tickLine={false}
            axisLine={false}
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
          {dataKeys.map((dataKey, index) => (
            <Area
              key={dataKey.key}
              type="monotone"
              dataKey={dataKey.key}
              stroke={dataKey.color}
              strokeWidth={2}
              fill={`url(#color${dataKey.key}${index})`}
              name={dataKey.name}
              dot={{ fill: dataKey.color, r: 4, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: dataKey.color, stroke: '#fff', strokeWidth: 2 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

