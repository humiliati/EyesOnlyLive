import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  CloudRain, 
  CaretDown, 
  CaretUp,
  Thermometer,
  Wind,
  Eye,
  Drop,
  Sun,
  Moon
} from '@phosphor-icons/react'

interface EnvironmentalDataProps {
  latitude: number
  longitude: number
}

export function EnvironmentalData({ latitude, longitude }: EnvironmentalDataProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [temperature, setTemperature] = useState(18)
  const [humidity, setHumidity] = useState(65)
  const [windSpeed, setWindSpeed] = useState(12)
  const [windDirection, setWindDirection] = useState(245)
  const [visibility, setVisibility] = useState(10)
  const [precipitation, setPrecipitation] = useState(0)
  const [isDay, setIsDay] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setTemperature(prev => Math.max(-20, Math.min(45, prev + (Math.random() - 0.5) * 2)))
      setHumidity(prev => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 5)))
      setWindSpeed(prev => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 3)))
      setWindDirection(prev => (prev + (Math.random() - 0.5) * 10 + 360) % 360)
      setVisibility(prev => Math.max(0.1, Math.min(20, prev + (Math.random() - 0.5) * 1)))
      setPrecipitation(prev => Math.max(0, Math.min(50, prev + (Math.random() - 0.6) * 2)))
      
      const hour = new Date().getHours()
      setIsDay(hour >= 6 && hour < 20)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getWindDirectionLabel = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(degrees / 22.5) % 16
    return directions[index]
  }

  const getVisibilityStatus = () => {
    if (visibility < 1) return { text: 'POOR', color: 'text-destructive' }
    if (visibility < 5) return { text: 'MODERATE', color: 'text-accent' }
    return { text: 'GOOD', color: 'text-primary' }
  }

  const getWindStatus = () => {
    if (windSpeed > 50) return { text: 'DANGEROUS', color: 'text-destructive' }
    if (windSpeed > 25) return { text: 'HIGH', color: 'text-accent' }
    return { text: 'NORMAL', color: 'text-primary' }
  }

  const visStatus = getVisibilityStatus()
  const windStatus = getWindStatus()

  return (
    <Card className="border-primary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudRain weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Environmental</span>
          {precipitation > 5 && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-accent text-accent">
              ACTIVE
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6 p-0"
        >
          {isExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
        </Button>
      </div>

      {isExpanded && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Thermometer weight="bold" className="text-primary" size={12} />
                <span className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Temperature</span>
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {temperature.toFixed(1)}
                <span className="text-sm ml-1">°C</span>
              </div>
              <div className="text-[9px] text-muted-foreground">
                {(temperature * 9/5 + 32).toFixed(1)}°F
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Drop weight="bold" className="text-primary" size={12} />
                <span className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Humidity</span>
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {Math.round(humidity)}
                <span className="text-sm ml-1">%</span>
              </div>
              <div className="text-[9px] text-muted-foreground">
                {humidity > 70 ? 'High' : humidity > 40 ? 'Normal' : 'Low'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Wind weight="bold" className="text-primary" size={12} />
                <span className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Wind</span>
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {windSpeed.toFixed(1)}
                <span className="text-sm ml-1">km/h</span>
              </div>
              <div className={`text-[9px] font-bold ${windStatus.color}`}>
                {getWindDirectionLabel(windDirection)} • {windStatus.text}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Eye weight="bold" className="text-primary" size={12} />
                <span className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Visibility</span>
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {visibility.toFixed(1)}
                <span className="text-sm ml-1">km</span>
              </div>
              <div className={`text-[9px] font-bold ${visStatus.color}`}>
                {visStatus.text}
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CloudRain weight="bold" className={precipitation > 5 ? 'text-accent' : 'text-muted-foreground'} size={12} />
                <span className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Precipitation</span>
              </div>
              <span className="text-sm font-bold tabular-nums">
                {precipitation.toFixed(1)} mm/h
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {isDay ? (
                  <Sun weight="bold" className="text-accent" size={12} />
                ) : (
                  <Moon weight="bold" className="text-primary" size={12} />
                )}
                <span className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Time of Day</span>
              </div>
              <span className="text-sm font-bold">
                {isDay ? 'DAY' : 'NIGHT'}
              </span>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-1">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
              Location Reference
            </div>
            <div className="text-[10px] font-mono text-primary">
              {latitude.toFixed(4)}°N, {Math.abs(longitude).toFixed(4)}°W
            </div>
          </div>

          {(windSpeed > 50 || visibility < 1 || precipitation > 20) && (
            <div className="border border-destructive bg-destructive/10 rounded p-2">
              <div className="text-[10px] font-bold text-destructive uppercase">
                ⚠ ADVERSE CONDITIONS
              </div>
              <div className="text-[9px] text-muted-foreground mt-1">
                Environmental conditions may impact operations
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
