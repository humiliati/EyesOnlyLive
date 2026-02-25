import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { gameStateSync, type PlayerTelemetry } from '@/lib/gameStateSync'
import { 
  Users, 
  MapPin, 
  Heart,
  CaretDown,
  CaretRight
} from '@phosphor-icons/react'

interface RedTeamTelemetryPanelProps {
  maxHeight?: string
}

export function RedTeamTelemetryPanel({ maxHeight = '400px' }: RedTeamTelemetryPanelProps) {
  const [telemetry, setTelemetry] = useState<PlayerTelemetry[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const loadTelemetry = async () => {
      const allTelemetry = await gameStateSync.getAllTelemetry()
      const redTeamOnly = allTelemetry.filter(t => t.playerTeam === 'red')
      setTelemetry(redTeamOnly)
    }

    loadTelemetry()

    const unsubscribe = gameStateSync.onTelemetryUpdate((update) => {
      if (update.playerTeam === 'red') {
        setTelemetry((current) => {
          const filtered = current.filter(t => t.playerId !== update.playerId)
          return [update, ...filtered].slice(0, 20)
        })
      }
    })

    const refreshInterval = setInterval(loadTelemetry, 5000)

    return () => {
      unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [])

  const formatCoordinate = (value: number, precision: number = 4) => {
    return value.toFixed(precision)
  }

  const getTimeSinceUpdate = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ago`
  }

  const isStale = (timestamp: number) => {
    return Date.now() - timestamp > 30000
  }

  return (
    <Card className="border-destructive/50 bg-card">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-destructive/5"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <CaretRight weight="bold" className="text-destructive" size={14} />
          ) : (
            <CaretDown weight="bold" className="text-destructive" size={14} />
          )}
          <Users weight="bold" className="text-destructive" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase font-bold">Red Team Telemetry</span>
        </div>
        <Badge variant="outline" className="text-[9px] px-2 py-0 border-destructive text-destructive">
          {telemetry.length} ACTIVE
        </Badge>
      </div>

      {!isCollapsed && (
        <>
          <Separator className="bg-border" />
          <ScrollArea style={{ maxHeight }} className="p-4">
            {telemetry.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No Red Team players transmitting
              </div>
            ) : (
              <div className="space-y-3">
                {telemetry.map((player) => (
                  <Card 
                    key={player.playerId} 
                    className={`p-3 space-y-2 ${isStale(player.lastUpdate) ? 'opacity-50 border-muted' : 'border-destructive/30'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-sm text-destructive">{player.playerCallsign}</div>
                        <div className="text-[10px] text-muted-foreground">{player.playerId}</div>
                      </div>
                      <Badge 
                        variant={isStale(player.lastUpdate) ? 'outline' : 'default'}
                        className="text-[9px] px-2 py-0"
                      >
                        {getTimeSinceUpdate(player.lastUpdate)}
                      </Badge>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <MapPin weight="bold" size={10} className="text-primary" />
                          <span className="text-[9px] tracking-wider uppercase text-muted-foreground">Location</span>
                        </div>
                        <div className="text-[10px] font-mono tabular-nums">
                          {formatCoordinate(player.latitude, 4)}°N
                        </div>
                        <div className="text-[10px] font-mono tabular-nums">
                          {formatCoordinate(Math.abs(player.longitude), 4)}°W
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Heart weight="bold" size={10} className="text-primary" />
                          <span className="text-[9px] tracking-wider uppercase text-muted-foreground">Vitals</span>
                        </div>
                        <div className="text-[10px]">
                          HR: <span className="font-bold">{Math.round(player.heartRate)}</span> BPM
                        </div>
                        <div className="text-[10px]">
                          Stress: <span className="font-bold">{Math.round(player.stressLevel)}</span>%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-1">
                      <div>
                        <div className="text-[9px] text-muted-foreground">Alt</div>
                        <div className="text-[10px] font-bold tabular-nums">{Math.round(player.altitude)}m</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-muted-foreground">Speed</div>
                        <div className="text-[10px] font-bold tabular-nums">{player.speed.toFixed(1)}m/s</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-muted-foreground">O₂</div>
                        <div className="text-[10px] font-bold tabular-nums">{Math.round(player.bloodOxygen)}%</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-muted-foreground">Temp</div>
                        <div className="text-[10px] font-bold tabular-nums">{player.temperature.toFixed(1)}°C</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </>
      )}
    </Card>
  )
}
