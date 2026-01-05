import { useMemo } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { ChartCard } from './chart-card'

interface RadarChartWidgetProps {
  data: Array<{ [key: string]: string | number }>
  dataKeys: string[]
  angleKey: string
  title?: string
  description?: string
  colors?: string[]
  onExport?: () => void
  onDrillDown?: () => void
  delay?: number
}

// Vibrant colors that work well in both light and dark modes
const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function RadarChartWidget({
  data,
  dataKeys,
  angleKey,
  title = 'Radar Chart',
  description,
  colors = DEFAULT_COLORS,
  onExport,
  onDrillDown,
  delay = 0,
}: RadarChartWidgetProps) {
  const CustomTooltip = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-card border border-border rounded-lg shadow-lg p-3">
            {payload.map((entry: { color?: string; name?: string; value?: number }, index: number) => (
              <p key={index} style={{ color: entry.color }} className="font-medium">
                {entry.name}: {entry.value}
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
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis 
            dataKey={angleKey} 
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            stroke="hsl(var(--border))"
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 'auto']}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            stroke="hsl(var(--border))"
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
          {dataKeys.map((key, index) => (
            <Radar
              key={key}
              name={key}
              dataKey={key}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.7}
              strokeWidth={2}
              dot={{ fill: colors[index % colors.length], r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, fill: colors[index % colors.length], stroke: '#fff', strokeWidth: 2 }}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

