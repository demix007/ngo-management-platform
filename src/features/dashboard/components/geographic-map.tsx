import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Users } from 'lucide-react'
import { motion } from 'framer-motion'

interface LocationData {
  id: string
  name: string
  lat: number
  lng: number
  state: string
  lga: string
}

interface GeographicMapProps {
  data: LocationData[]
  title?: string
  description?: string
  delay?: number
}

// Simple map component using CSS and markers
// For production, you'd want to use Leaflet or MapLibre
export function GeographicMap({
  data,
  title = 'Geographic Distribution',
  description = 'Beneficiary locations across states',
  delay = 0,
}: GeographicMapProps) {
  const locationsByState = useMemo(() => {
    const grouped: Record<string, LocationData[]> = {}
    data.forEach((item) => {
      if (!grouped[item.state]) {
        grouped[item.state] = []
      }
      grouped[item.state].push(item)
    })
    return grouped
  }, [data])

  const stateCounts = useMemo(() => {
    return Object.entries(locationsByState).map(([state, locations]) => ({
      state,
      count: locations.length,
      locations,
    }))
  }, [locationsByState])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="border border-border shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <MapPin className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No location data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Map visualization placeholder */}
              <div className="relative bg-gradient-to-br from-blue-50 dark:from-blue-950/20 to-green-50 dark:to-green-950/20 rounded-lg p-6 min-h-[300px] border-2 border-dashed border-border">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-16 w-16 mx-auto mb-4 text-blue-500 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Map visualization ({data.length} locations)
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Integrate Leaflet or MapLibre for interactive map
                    </p>
                  </div>
                </div>
                {/* Simple marker visualization */}
                {data.slice(0, 20).map((location, index) => (
                  <div
                    key={location.id}
                    className="absolute"
                    style={{
                      left: `${(location.lng % 10) * 10}%`,
                      top: `${(location.lat % 10) * 10}%`,
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: delay + index * 0.05 }}
                      className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full border-2 border-white dark:border-gray-800 shadow-lg"
                      title={`${location.name} - ${location.state}`}
                    />
                  </div>
                ))}
              </div>

              {/* State breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {stateCounts
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 9)
                  .map((state) => (
                    <motion.div
                      key={state.state}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: delay + 0.2 }}
                      className="p-3 bg-accent rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{state.state}</p>
                          <p className="text-xs text-muted-foreground">{state.count} locations</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

