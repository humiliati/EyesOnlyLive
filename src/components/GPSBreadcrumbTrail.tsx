import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MapPin, 
  Path, 
  Clock,
  NavigationArrow,
  Crosshair,
  Eye,
  Download,
  Trash,
  ArrowsOut,
  CaretDown
} from '@phosphor-icons/react'
import { toast } from 'sonner'

export interface GPSCoordinate {
  latitude: number
  longitude: number
  altitude?: number
  timestamp: number
}

export interface AssetTrail {
  assetId: string
  callsign: string
  coordinates: GPSCoordinate[]
  status: 'active' | 'inactive' | 'alert' | 'enroute'
  color: string
}

interface GPSBreadcrumbTrailProps {
  trails: AssetTrail[]
  onClearTrail?: (assetId: string) => void
  onExportTrail?: (assetId: string) => void
}

export function GPSBreadcrumbTrail({ trails, onClearTrail, onExportTrail }: GPSBreadcrumbTrailProps) {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'timeline' | 'map'>('timeline')
  const [selectedCoordinate, setSelectedCoordinate] = useState<GPSCoordinate | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isListCollapsed, setIsListCollapsed] = useState(false)

  const getSelectedTrail = useCallback(() => {
    if (!selectedAsset) return null
    return trails.find(t => t.assetId === selectedAsset) || null
  }, [selectedAsset, trails])

  const formatLatitude = (lat: number) => {
    const direction = lat >= 0 ? 'N' : 'S'
    return `${Math.abs(lat).toFixed(6)}° ${direction}`
  }

  const formatLongitude = (lng: number) => {
    const direction = lng >= 0 ? 'E' : 'W'
    return `${Math.abs(lng).toFixed(6)}° ${direction}`
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toTimeString().slice(0, 8)
  }

  const formatTimeSince = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const calculateDistance = (coord1: GPSCoordinate, coord2: GPSCoordinate) => {
    const R = 6371e3
    const φ1 = coord1.latitude * Math.PI / 180
    const φ2 = coord2.latitude * Math.PI / 180
    const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  const calculateTotalDistance = (coordinates: GPSCoordinate[]) => {
    if (coordinates.length < 2) return 0
    let total = 0
    for (let i = 1; i < coordinates.length; i++) {
      total += calculateDistance(coordinates[i - 1], coordinates[i])
    }
    return total
  }

  const calculateHeading = (coord1: GPSCoordinate, coord2: GPSCoordinate) => {
    const φ1 = coord1.latitude * Math.PI / 180
    const φ2 = coord2.latitude * Math.PI / 180
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180

    const y = Math.sin(Δλ) * Math.cos(φ2)
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
    const θ = Math.atan2(y, x)
    return (θ * 180 / Math.PI + 360) % 360
  }

  const handleClearTrail = useCallback((assetId: string, callsign: string) => {
    if (confirm(`Clear GPS history for ${callsign}?`)) {
      onClearTrail?.(assetId)
      toast.success(`GPS history cleared for ${callsign}`)
      if (selectedAsset === assetId) {
        setSelectedAsset(null)
        setShowDetailsDialog(false)
      }
    }
  }, [onClearTrail, selectedAsset])

  const handleExportTrail = useCallback((assetId: string, callsign: string) => {
    const trail = trails.find(t => t.assetId === assetId)
    if (!trail) return

    const data = {
      assetId: trail.assetId,
      callsign: trail.callsign,
      exportedAt: new Date().toISOString(),
      totalCoordinates: trail.coordinates.length,
      totalDistance: calculateTotalDistance(trail.coordinates),
      coordinates: trail.coordinates.map((coord, idx) => ({
        index: idx,
        latitude: coord.latitude,
        longitude: coord.longitude,
        altitude: coord.altitude,
        timestamp: coord.timestamp,
        datetime: new Date(coord.timestamp).toISOString()
      }))
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gps-trail-${callsign}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    onExportTrail?.(assetId)
    toast.success(`GPS trail exported for ${callsign}`)
  }, [trails, onExportTrail])

  const openDetailsDialog = useCallback((assetId: string) => {
    setSelectedAsset(assetId)
    setShowDetailsDialog(true)
  }, [])

  const getStatusColor = (status: AssetTrail['status']) => {
    switch (status) {
      case 'active': return 'text-primary'
      case 'inactive': return 'text-muted-foreground'
      case 'alert': return 'text-destructive'
      case 'enroute': return 'text-accent'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusBadgeColor = (status: AssetTrail['status']) => {
    switch (status) {
      case 'active': return 'bg-primary text-primary-foreground'
      case 'inactive': return 'bg-muted text-muted-foreground'
      case 'alert': return 'bg-destructive text-destructive-foreground'
      case 'enroute': return 'bg-accent text-accent-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 p-4 space-y-3">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
            <Path weight="bold" className="text-primary" size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">GPS Breadcrumb Trails</span>
            <CaretDown 
              weight="bold" 
              size={12} 
              className={`text-primary transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
            />
          </div>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary text-primary">
            {trails.length} ASSET{trails.length !== 1 ? 'S' : ''}
          </Badge>
        </div>

        {!isCollapsed && (
          <>
            <Separator className="bg-border" />

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Total Points</div>
            <div className="text-lg font-bold tabular-nums text-primary">
              {trails.reduce((sum, trail) => sum + trail.coordinates.length, 0)}
            </div>
          </div>
          <div>
            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Active Trails</div>
            <div className="text-lg font-bold tabular-nums text-primary">
              {trails.filter(t => t.coordinates.length > 0).length}
            </div>
          </div>
          <div>
            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Total Dist</div>
            <div className="text-lg font-bold tabular-nums text-primary">
              {(trails.reduce((sum, trail) => sum + calculateTotalDistance(trail.coordinates), 0) / 1000).toFixed(2)}
              <span className="text-[9px] ml-0.5">km</span>
            </div>
          </div>
        </div>
          </>
        )}
      </Card>

      <Card className="border-primary/30 p-4 space-y-3">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setIsListCollapsed(!isListCollapsed)}
        >
          <Crosshair weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Asset Movement History</span>
          <CaretDown 
            weight="bold" 
            size={12} 
            className={`text-primary transition-transform ${isListCollapsed ? '-rotate-90' : ''}`}
          />
        </div>

        {!isListCollapsed && (
          <>
            <Separator className="bg-border" />

        <ScrollArea className="h-[300px]">
          <div className="space-y-2 pr-3">
            {trails.length === 0 ? (
              <div className="text-[10px] text-muted-foreground text-center py-8">
                No GPS trail data recorded
              </div>
            ) : (
              trails.map(trail => {
                const totalDist = calculateTotalDistance(trail.coordinates)
                const lastCoord = trail.coordinates[trail.coordinates.length - 1]
                const firstCoord = trail.coordinates[0]
                
                return (
                  <div 
                    key={trail.assetId}
                    className="bg-card border border-border p-3 space-y-2 hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: trail.color }}
                        />
                        <span className="text-xs font-bold">{trail.callsign}</span>
                        <Badge className={`${getStatusBadgeColor(trail.status)} text-[8px] px-1.5 py-0`}>
                          {trail.status.toUpperCase()}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDetailsDialog(trail.assetId)}
                        className="h-5 px-2 text-[9px]"
                      >
                        <Eye weight="bold" size={10} className="mr-1" />
                        VIEW
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-0.5">
                        <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Points</div>
                        <div className="text-sm font-bold tabular-nums">{trail.coordinates.length}</div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Distance</div>
                        <div className="text-sm font-bold tabular-nums">{(totalDist / 1000).toFixed(2)} km</div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Duration</div>
                        <div className="text-sm font-bold tabular-nums">
                          {trail.coordinates.length > 1 
                            ? `${Math.floor((lastCoord.timestamp - firstCoord.timestamp) / 60000)}m`
                            : '0m'
                          }
                        </div>
                      </div>
                    </div>

                    {lastCoord && (
                      <div className="pt-1 border-t border-border space-y-1">
                        <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Last Position</div>
                        <div className="flex items-start gap-1.5">
                          <MapPin weight="bold" className="text-primary mt-0.5" size={10} />
                          <div className="flex-1 space-y-0.5">
                            <div className="text-[10px] font-mono tabular-nums text-primary">
                              {formatLatitude(lastCoord.latitude)}
                            </div>
                            <div className="text-[10px] font-mono tabular-nums text-primary">
                              {formatLongitude(lastCoord.longitude)}
                            </div>
                          </div>
                          <span className="text-[9px] text-muted-foreground tabular-nums">
                            {formatTimeSince(lastCoord.timestamp)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportTrail(trail.assetId, trail.callsign)}
                        className="flex-1 h-6 text-[9px]"
                        disabled={trail.coordinates.length === 0}
                      >
                        <Download weight="bold" size={10} className="mr-1" />
                        EXPORT
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClearTrail(trail.assetId, trail.callsign)}
                        className="flex-1 h-6 text-[9px] hover:border-destructive hover:text-destructive"
                        disabled={trail.coordinates.length === 0}
                      >
                        <Trash weight="bold" size={10} className="mr-1" />
                        CLEAR
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
            </div>
          </ScrollArea>
          </>
        )}
      </Card>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-card border-primary/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm tracking-[0.08em] uppercase flex items-center gap-2">
              <Path weight="bold" className="text-primary" size={16} />
              GPS Trail Details
            </DialogTitle>
          </DialogHeader>

          {getSelectedTrail() && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getSelectedTrail()!.color }}
                  />
                  <span className="text-base font-bold">{getSelectedTrail()!.callsign}</span>
                </div>
                <Badge className={`${getStatusBadgeColor(getSelectedTrail()!.status)} text-[9px] px-2 py-0.5`}>
                  {getSelectedTrail()!.status.toUpperCase()}
                </Badge>
              </div>

              <Separator className="bg-border" />

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/30 p-2 rounded border border-border text-center">
                  <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground mb-1">Waypoints</div>
                  <div className="text-xl font-bold tabular-nums text-primary">
                    {getSelectedTrail()!.coordinates.length}
                  </div>
                </div>
                <div className="bg-secondary/30 p-2 rounded border border-border text-center">
                  <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground mb-1">Distance</div>
                  <div className="text-xl font-bold tabular-nums text-primary">
                    {(calculateTotalDistance(getSelectedTrail()!.coordinates) / 1000).toFixed(2)}
                  </div>
                  <div className="text-[9px] text-muted-foreground">km</div>
                </div>
                <div className="bg-secondary/30 p-2 rounded border border-border text-center">
                  <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground mb-1">Duration</div>
                  <div className="text-xl font-bold tabular-nums text-primary">
                    {getSelectedTrail()!.coordinates.length > 1 
                      ? Math.floor((getSelectedTrail()!.coordinates[getSelectedTrail()!.coordinates.length - 1].timestamp - getSelectedTrail()!.coordinates[0].timestamp) / 60000)
                      : 0
                    }
                  </div>
                  <div className="text-[9px] text-muted-foreground">min</div>
                </div>
              </div>

              <Tabs value={viewMode} onValueChange={(val) => setViewMode(val as 'timeline' | 'map')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-7">
                  <TabsTrigger value="timeline" className="text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Clock weight="bold" size={12} className="mr-1" />
                    TIMELINE
                  </TabsTrigger>
                  <TabsTrigger value="map" className="text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <MapPin weight="bold" size={12} className="mr-1" />
                    BREADCRUMBS
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="mt-3">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2 pr-3">
                      {getSelectedTrail()!.coordinates.length === 0 ? (
                        <div className="text-[10px] text-muted-foreground text-center py-8">
                          No coordinates recorded
                        </div>
                      ) : (
                        [...getSelectedTrail()!.coordinates].reverse().map((coord, idx) => {
                          const originalIdx = getSelectedTrail()!.coordinates.length - 1 - idx
                          const prevCoord = originalIdx > 0 ? getSelectedTrail()!.coordinates[originalIdx - 1] : null
                          const heading = prevCoord ? calculateHeading(prevCoord, coord) : null
                          const distance = prevCoord ? calculateDistance(prevCoord, coord) : null

                          return (
                            <div 
                              key={idx}
                              onClick={() => setSelectedCoordinate(coord)}
                              className={`bg-card border p-2 space-y-1.5 cursor-pointer transition-all ${
                                selectedCoordinate === coord 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <MapPin weight="bold" className="text-primary" size={12} />
                                  <span className="text-[10px] font-bold">
                                    WAYPOINT #{originalIdx + 1}
                                  </span>
                                </div>
                                <span className="text-[9px] text-muted-foreground tabular-nums">
                                  {formatTime(coord.timestamp)}
                                </span>
                              </div>

                              <div className="space-y-0.5">
                                <div className="text-[9px] font-mono tabular-nums text-primary">
                                  {formatLatitude(coord.latitude)}
                                </div>
                                <div className="text-[9px] font-mono tabular-nums text-primary">
                                  {formatLongitude(coord.longitude)}
                                </div>
                              </div>

                              <div className="flex gap-3 pt-1">
                                {coord.altitude !== undefined && (
                                  <div className="space-y-0.5">
                                    <div className="text-[8px] tracking-[0.08em] uppercase text-muted-foreground">ALT</div>
                                    <div className="text-[9px] font-bold tabular-nums">{coord.altitude.toFixed(0)}m</div>
                                  </div>
                                )}
                                {distance !== null && (
                                  <div className="space-y-0.5">
                                    <div className="text-[8px] tracking-[0.08em] uppercase text-muted-foreground">DIST</div>
                                    <div className="text-[9px] font-bold tabular-nums">{distance.toFixed(0)}m</div>
                                  </div>
                                )}
                                {heading !== null && (
                                  <div className="space-y-0.5 flex items-center gap-1">
                                    <div className="space-y-0.5">
                                      <div className="text-[8px] tracking-[0.08em] uppercase text-muted-foreground">HDG</div>
                                      <div className="text-[9px] font-bold tabular-nums">{heading.toFixed(0)}°</div>
                                    </div>
                                    <NavigationArrow 
                                      weight="bold" 
                                      size={12} 
                                      className="text-primary mt-2"
                                      style={{ transform: `rotate(${heading}deg)` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="map" className="mt-3">
                  <div className="space-y-3">
                    <div className="bg-secondary/30 p-3 rounded border border-border min-h-[300px] relative overflow-hidden">
                      {getSelectedTrail()!.coordinates.length < 2 ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-[10px] text-muted-foreground text-center">
                            Minimum 2 waypoints required<br />for breadcrumb visualization
                          </div>
                        </div>
                      ) : (
                        <svg className="w-full h-[300px]" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
                          <defs>
                            <marker
                              id="arrowhead"
                              markerWidth="6"
                              markerHeight="6"
                              refX="5"
                              refY="3"
                              orient="auto"
                            >
                              <polygon 
                                points="0 0, 6 3, 0 6" 
                                fill="currentColor"
                                className="text-primary"
                              />
                            </marker>
                          </defs>
                          
                          {(() => {
                            const coords = getSelectedTrail()!.coordinates
                            const lats = coords.map(c => c.latitude)
                            const lngs = coords.map(c => c.longitude)
                            const minLat = Math.min(...lats)
                            const maxLat = Math.max(...lats)
                            const minLng = Math.min(...lngs)
                            const maxLng = Math.max(...lngs)
                            const latRange = maxLat - minLat || 0.0001
                            const lngRange = maxLng - minLng || 0.0001
                            const padding = 30

                            const normalize = (coord: GPSCoordinate) => ({
                              x: padding + ((coord.longitude - minLng) / lngRange) * (400 - 2 * padding),
                              y: 300 - padding - ((coord.latitude - minLat) / latRange) * (300 - 2 * padding)
                            })

                            const points = coords.map(normalize)

                            return (
                              <>
                                <path
                                  d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`}
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-primary opacity-50"
                                  markerEnd="url(#arrowhead)"
                                />
                                
                                {points.map((point, idx) => (
                                  <g key={idx}>
                                    <circle
                                      cx={point.x}
                                      cy={point.y}
                                      r={idx === 0 ? 5 : idx === points.length - 1 ? 7 : 3}
                                      fill="currentColor"
                                      className={
                                        idx === 0 
                                          ? 'text-accent' 
                                          : idx === points.length - 1 
                                          ? 'text-primary' 
                                          : 'text-primary opacity-70'
                                      }
                                    />
                                    {idx === 0 && (
                                      <text
                                        x={point.x}
                                        y={point.y - 10}
                                        textAnchor="middle"
                                        className="text-[10px] fill-accent font-bold"
                                      >
                                        START
                                      </text>
                                    )}
                                    {idx === points.length - 1 && (
                                      <text
                                        x={point.x}
                                        y={point.y - 12}
                                        textAnchor="middle"
                                        className="text-[10px] fill-primary font-bold"
                                      >
                                        CURRENT
                                      </text>
                                    )}
                                  </g>
                                ))}
                              </>
                            )
                          })()}
                        </svg>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[9px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                        <span className="text-muted-foreground">START POINT</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-70" />
                        <span className="text-muted-foreground">WAYPOINT</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-muted-foreground">CURRENT</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportTrail(getSelectedTrail()!.assetId, getSelectedTrail()!.callsign)}
                  className="flex-1"
                  disabled={getSelectedTrail()!.coordinates.length === 0}
                >
                  <Download weight="bold" size={12} className="mr-1" />
                  EXPORT JSON
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleClearTrail(getSelectedTrail()!.assetId, getSelectedTrail()!.callsign)}
                  className="flex-1 hover:border-destructive hover:text-destructive"
                  disabled={getSelectedTrail()!.coordinates.length === 0}
                >
                  <Trash weight="bold" size={12} className="mr-1" />
                  CLEAR TRAIL
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
