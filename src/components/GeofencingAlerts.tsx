import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  WarningCircle, 
  MapPin, 
  Eye,
  X,
  CaretDown,
  CaretUp,
  BellRinging
} from '@phosphor-icons/react'
import type { MapAnnotation } from '@/components/HybridTacticalMap'
import type { AssetLocation } from '@/components/GlobalAssetMap'

export interface GeofenceViolation {
  id: string
  redTeamPlayerId: string
  redTeamCallsign: string
  annotationId: string
  annotationLabel: string
  zoneType: string
  detectedAt: number
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: number
  currentLat: number
  currentLng: number
  zoneLat: number
  zoneLng: number
  distance: number
}

interface GeofencingAlertsProps {
  annotations: MapAnnotation[]
  redTeamAssets: AssetLocation[]
  maxHeight?: string
  onViolationDetected?: (violation: GeofenceViolation) => void
}

const RESTRICTED_ZONE_TYPES = ['danger']
const GEOFENCE_RADIUS_KM = 0.1
const CHECK_INTERVAL_MS = 5000

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function GeofencingAlerts({
  annotations,
  redTeamAssets,
  maxHeight = '400px',
  onViolationDetected
}: GeofencingAlertsProps) {
  const [violations, setViolations] = useState<GeofenceViolation[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [lastCheckTimestamp, setLastCheckTimestamp] = useState(Date.now())

  const checkGeofenceViolations = useCallback(() => {
    const restrictedZones = annotations.filter(ann => 
      RESTRICTED_ZONE_TYPES.includes(ann.type) && ann.points && ann.points.length > 0
    )

    const newViolations: GeofenceViolation[] = []

    redTeamAssets.forEach(asset => {
      restrictedZones.forEach(zone => {
        const zoneCenterLat = zone.points[0].lat
        const zoneCenterLng = zone.points[0].lng
        
        const distance = calculateDistance(
          asset.latitude,
          asset.longitude,
          zoneCenterLat,
          zoneCenterLng
        )

        const effectiveRadius = zone.radius || GEOFENCE_RADIUS_KM

        if (distance <= effectiveRadius) {
          const existingViolation = violations.find(v => 
            v.redTeamPlayerId === asset.agentId && 
            v.annotationId === zone.id &&
            !v.acknowledged
          )

          if (!existingViolation) {
            const violation: GeofenceViolation = {
              id: `violation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              redTeamPlayerId: asset.agentId,
              redTeamCallsign: asset.callsign,
              annotationId: zone.id,
              annotationLabel: zone.label,
              zoneType: zone.type,
              detectedAt: Date.now(),
              acknowledged: false,
              currentLat: asset.latitude,
              currentLng: asset.longitude,
              zoneLat: zoneCenterLat,
              zoneLng: zoneCenterLng,
              distance: distance
            }

            newViolations.push(violation)
            
            if (onViolationDetected) {
              onViolationDetected(violation)
            }
          }
        }
      })
    })

    if (newViolations.length > 0) {
      setViolations(prev => [...newViolations, ...prev])
    }

    setLastCheckTimestamp(Date.now())
  }, [annotations, redTeamAssets, violations, onViolationDetected])

  useEffect(() => {
    const interval = setInterval(() => {
      checkGeofenceViolations()
    }, CHECK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [checkGeofenceViolations])

  const handleAcknowledge = useCallback((violationId: string, acknowledgedBy: string) => {
    setViolations(prev => prev.map(v => 
      v.id === violationId 
        ? { ...v, acknowledged: true, acknowledgedBy, acknowledgedAt: Date.now() }
        : v
    ))
  }, [])

  const handleDismiss = useCallback((violationId: string) => {
    setViolations(prev => prev.filter(v => v.id !== violationId))
  }, [])

  const handleClearAll = useCallback(() => {
    setViolations(prev => prev.filter(v => !v.acknowledged))
  }, [])

  const activeViolations = violations.filter(v => !v.acknowledged)
  const acknowledgedViolations = violations.filter(v => v.acknowledged)

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return `${seconds}s ago`
  }

  const getZoneTypeColor = (zoneType: string) => {
    switch (zoneType) {
      case 'danger':
        return 'bg-destructive text-destructive-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const restrictedZoneCount = annotations.filter(ann => 
    RESTRICTED_ZONE_TYPES.includes(ann.type)
  ).length

  return (
    <Card className="border-destructive/50 bg-card">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WarningCircle 
              weight="bold" 
              className={activeViolations.length > 0 ? 'text-destructive animate-pulse' : 'text-muted-foreground'} 
              size={16} 
            />
            <span className="text-xs tracking-[0.08em] uppercase font-bold">Geofencing Alerts</span>
            {activeViolations.length > 0 && (
              <Badge className="bg-destructive text-destructive-foreground text-[9px] px-2 py-0 animate-pulse">
                {activeViolations.length} ACTIVE
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {acknowledgedViolations.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-6 px-2 text-[10px]"
              >
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <CaretUp weight="bold" size={14} />
              ) : (
                <CaretDown weight="bold" size={14} />
              )}
            </Button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Monitoring: {redTeamAssets.length} Red Team</span>
              <span>Zones: {restrictedZoneCount} Restricted</span>
            </div>
            <span>Last check: {formatTime(lastCheckTimestamp)}</span>
          </div>
        )}
      </div>

      {isExpanded && (
        <ScrollArea style={{ maxHeight }}>
          <div className="p-3 space-y-3">
            {violations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Eye weight="bold" size={32} className="mx-auto mb-2 opacity-50" />
                <div className="text-xs">No geofence violations detected</div>
                <div className="text-[10px] mt-1">
                  Monitoring {redTeamAssets.length} Red Team player{redTeamAssets.length !== 1 ? 's' : ''} against {restrictedZoneCount} restricted zone{restrictedZoneCount !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            {activeViolations.length > 0 && (
              <>
                <div className="text-[10px] tracking-[0.08em] uppercase text-destructive font-bold flex items-center gap-1">
                  <BellRinging weight="bold" size={12} />
                  Active Alerts ({activeViolations.length})
                </div>
                {activeViolations.map(violation => (
                  <Alert key={violation.id} className="border-destructive bg-destructive/10 animate-pulse-border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <WarningCircle weight="bold" className="text-destructive" size={16} />
                          <AlertDescription className="text-xs font-bold text-destructive">
                            RESTRICTED ZONE BREACH
                          </AlertDescription>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-destructive text-destructive">
                              {violation.redTeamCallsign}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">entered</span>
                            <Badge className={`${getZoneTypeColor(violation.zoneType)} text-[9px] px-1.5 py-0`}>
                              {violation.annotationLabel}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <div className="text-muted-foreground">Time</div>
                              <div className="font-mono tabular-nums">{formatTime(violation.detectedAt)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Distance</div>
                              <div className="font-mono tabular-nums">{(violation.distance * 1000).toFixed(0)}m</div>
                            </div>
                          </div>
                          
                          <div className="text-[10px]">
                            <div className="text-muted-foreground">Player Position</div>
                            <div className="font-mono tabular-nums text-primary">
                              {violation.currentLat.toFixed(4)}°N, {Math.abs(violation.currentLng).toFixed(4)}°W
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => handleAcknowledge(violation.id, 'M-CONSOLE')}
                            className="h-7 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            Acknowledge
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDismiss(violation.id)}
                            className="h-7 text-[10px]"
                          >
                            <X weight="bold" size={12} className="mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Alert>
                ))}
              </>
            )}

            {acknowledgedViolations.length > 0 && (
              <>
                <Separator className="bg-border" />
                <div className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground font-bold">
                  Acknowledged ({acknowledgedViolations.length})
                </div>
                {acknowledgedViolations.map(violation => (
                  <div key={violation.id} className="border border-border p-2 bg-muted/20 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin weight="bold" className="text-muted-foreground" size={12} />
                          <span className="text-[10px] font-medium">
                            {violation.redTeamCallsign}
                          </span>
                          <span className="text-[10px] text-muted-foreground">→</span>
                          <span className="text-[10px]">{violation.annotationLabel}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                          <span>Detected: {formatTime(violation.detectedAt)}</span>
                          {violation.acknowledgedAt && (
                            <span>Ack'd: {formatTime(violation.acknowledgedAt)}</span>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismiss(violation.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X weight="bold" size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      )}
    </Card>
  )
}
