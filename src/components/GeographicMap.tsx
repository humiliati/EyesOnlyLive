import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Globe, 
  MapPin, 
  MapTrifold,
  Target,
  Crosshair,
  ArrowsOut,
  ArrowsIn,
  NavigationArrow,
  RadioButton,
  Eye,
  Path,
  Plus,
  Minus
} from '@phosphor-icons/react'
import { toast } from 'sonner'

export interface AssetLocation {
  id: string
  callsign: string
  agentId: string
  gridX: number
  gridY: number
  latitude: number
  longitude: number
  altitude?: number
  speed?: number
  heading?: number
  status: 'active' | 'inactive' | 'alert' | 'enroute'
  lastUpdate: number
}

export interface ActiveLane {
  id: string
  name: string
  startGrid: { x: number; y: number }
  endGrid: { x: number; y: number }
  assignedAssets: string[]
  status: 'active' | 'completed' | 'compromised'
  priority: 'low' | 'normal' | 'high' | 'critical'
  createdAt: number
}

interface GeographicMapProps {
  assets: AssetLocation[]
  lanes?: ActiveLane[]
  onAssetClick?: (asset: AssetLocation) => void
  onMapClick?: (lat: number, lng: number) => void
}

interface MapBounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

const MAP_WIDTH = 340
const MAP_HEIGHT = 280
const PADDING = 20

export function GeographicMap({ assets, lanes = [], onAssetClick, onMapClick }: GeographicMapProps) {
  const [selectedAsset, setSelectedAsset] = useState<AssetLocation | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const mapRef = useRef<SVGSVGElement>(null)

  const bounds = useMemo((): MapBounds => {
    if (assets.length === 0) {
      return {
        minLat: 40.70,
        maxLat: 40.72,
        minLng: -74.02,
        maxLng: -74.00
      }
    }

    const lats = assets.map(a => a.latitude)
    const lngs = assets.map(a => a.longitude)
    
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    const latPadding = (maxLat - minLat) * 0.2 || 0.01
    const lngPadding = (maxLng - minLng) * 0.2 || 0.01

    return {
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding,
      minLng: minLng - lngPadding,
      maxLng: maxLng + lngPadding
    }
  }, [assets])

  const latLngToPixel = useCallback((lat: number, lng: number): { x: number; y: number } => {
    const latRange = bounds.maxLat - bounds.minLat
    const lngRange = bounds.maxLng - bounds.minLng
    
    const x = ((lng - bounds.minLng) / lngRange) * (MAP_WIDTH - 2 * PADDING) + PADDING
    const y = ((bounds.maxLat - lat) / latRange) * (MAP_HEIGHT - 2 * PADDING) + PADDING
    
    return { 
      x: x * zoomLevel + panOffset.x, 
      y: y * zoomLevel + panOffset.y 
    }
  }, [bounds, zoomLevel, panOffset])

  const pixelToLatLng = useCallback((x: number, y: number): { lat: number; lng: number } => {
    const adjustedX = (x - panOffset.x) / zoomLevel
    const adjustedY = (y - panOffset.y) / zoomLevel
    
    const latRange = bounds.maxLat - bounds.minLat
    const lngRange = bounds.maxLng - bounds.minLng
    
    const lng = ((adjustedX - PADDING) / (MAP_WIDTH - 2 * PADDING)) * lngRange + bounds.minLng
    const lat = bounds.maxLat - ((adjustedY - PADDING) / (MAP_HEIGHT - 2 * PADDING)) * latRange
    
    return { lat, lng }
  }, [bounds, zoomLevel, panOffset])

  const handleAssetClick = useCallback((asset: AssetLocation) => {
    setSelectedAsset(asset)
    setShowDetailsDialog(true)
    onAssetClick?.(asset)
  }, [onAssetClick])

  const handleMapMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 0) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    }
  }, [panOffset])

  const handleMapMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }, [isPanning, panStart])

  const handleMapMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.3, 5))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.3, 0.5))
  }, [])

  const handleResetView = useCallback(() => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }, [])

  const getStatusColor = (status: AssetLocation['status']) => {
    switch (status) {
      case 'active': return 'oklch(0.75 0.18 145)'
      case 'inactive': return 'oklch(0.45 0.02 240)'
      case 'alert': return 'oklch(0.65 0.25 25)'
      case 'enroute': return 'oklch(0.75 0.16 75)'
      default: return 'oklch(0.45 0.02 240)'
    }
  }

  const getStatusBadgeColor = (status: AssetLocation['status']) => {
    switch (status) {
      case 'active': return 'bg-primary text-primary-foreground'
      case 'inactive': return 'bg-muted text-muted-foreground'
      case 'alert': return 'bg-destructive text-destructive-foreground'
      case 'enroute': return 'bg-accent text-accent-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const formatLatitude = (lat: number) => {
    const direction = lat >= 0 ? 'N' : 'S'
    return `${Math.abs(lat).toFixed(6)}° ${direction}`
  }

  const formatLongitude = (lng: number) => {
    const direction = lng >= 0 ? 'E' : 'W'
    return `${Math.abs(lng).toFixed(6)}° ${direction}`
  }

  const formatTimeSince = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const gridLines = useMemo(() => {
    const lines = []
    const latStep = (bounds.maxLat - bounds.minLat) / 8
    const lngStep = (bounds.maxLng - bounds.minLng) / 8

    for (let i = 0; i <= 8; i++) {
      const lat = bounds.minLat + i * latStep
      const lng = bounds.minLng + i * lngStep
      
      const startHoriz = latLngToPixel(lat, bounds.minLng)
      const endHoriz = latLngToPixel(lat, bounds.maxLng)
      lines.push({
        key: `lat-${i}`,
        x1: startHoriz.x,
        y1: startHoriz.y,
        x2: endHoriz.x,
        y2: endHoriz.y
      })

      const startVert = latLngToPixel(bounds.minLat, lng)
      const endVert = latLngToPixel(bounds.maxLat, lng)
      lines.push({
        key: `lng-${i}`,
        x1: startVert.x,
        y1: startVert.y,
        x2: endVert.x,
        y2: endVert.y
      })
    }

    return lines
  }, [bounds, latLngToPixel])

  const laneLines = useMemo(() => {
    return lanes.map(lane => {
      const startAsset = assets.find(a => a.gridX === lane.startGrid.x && a.gridY === lane.startGrid.y)
      const endAsset = assets.find(a => a.gridX === lane.endGrid.x && a.gridY === lane.endGrid.y)
      
      if (!startAsset || !endAsset) return null

      const start = latLngToPixel(startAsset.latitude, startAsset.longitude)
      const end = latLngToPixel(endAsset.latitude, endAsset.longitude)

      const color = lane.priority === 'critical' ? 'oklch(0.65 0.25 25)' 
        : lane.priority === 'high' ? 'oklch(0.75 0.16 75)'
        : 'oklch(0.75 0.18 145)'

      return {
        key: lane.id,
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        color,
        name: lane.name
      }
    }).filter(Boolean)
  }, [lanes, assets, latLngToPixel])

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe weight="bold" className="text-primary" size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Geographic Map View</span>
          </div>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary text-primary">
            <RadioButton weight="bold" size={10} className="mr-1 animate-pulse" />
            GPS LIVE
          </Badge>
        </div>

        <Separator className="bg-border" />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-muted-foreground">
              {assets.length} asset{assets.length !== 1 ? 's' : ''} tracked
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomOut}
                className="h-6 w-6 p-0"
              >
                <Minus weight="bold" size={12} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetView}
                className="h-6 px-2 text-[9px]"
              >
                RESET
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomIn}
                className="h-6 w-6 p-0"
              >
                <Plus weight="bold" size={12} />
              </Button>
            </div>
          </div>

          <div className="relative bg-secondary/30 border border-border rounded overflow-hidden">
            <svg
              ref={mapRef}
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              className="cursor-move select-none"
              onMouseDown={handleMapMouseDown}
              onMouseMove={handleMapMouseMove}
              onMouseUp={handleMapMouseUp}
              onMouseLeave={handleMapMouseUp}
            >
              <defs>
                <pattern id="grid-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="5" cy="5" r="0.5" fill="oklch(0.45 0.02 240)" opacity="0.3" />
                </pattern>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="oklch(0.11 0.01 240)" />
              <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#grid-dots)" />

              {gridLines.map(line => (
                <line
                  key={line.key}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="oklch(0.25 0.02 240)"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              ))}

              {laneLines.map(lane => lane && (
                <g key={lane.key}>
                  <line
                    x1={lane.x1}
                    y1={lane.y1}
                    x2={lane.x2}
                    y2={lane.y2}
                    stroke={lane.color}
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />
                  <line
                    x1={lane.x1}
                    y1={lane.y1}
                    x2={lane.x2}
                    y2={lane.y2}
                    stroke={lane.color}
                    strokeWidth="1"
                    opacity="0.3"
                    filter="url(#glow)"
                  />
                </g>
              ))}

              {assets.map(asset => {
                const pos = latLngToPixel(asset.latitude, asset.longitude)
                const isHovered = hoveredAsset === asset.id
                const isSelected = selectedAsset?.id === asset.id
                const color = getStatusColor(asset.status)

                return (
                  <g
                    key={asset.id}
                    onMouseEnter={() => setHoveredAsset(asset.id)}
                    onMouseLeave={() => setHoveredAsset(null)}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAssetClick(asset)
                    }}
                    className="cursor-pointer"
                    style={{ pointerEvents: 'all' }}
                  >
                    {(isHovered || isSelected) && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="14"
                        fill={color}
                        opacity="0.2"
                        className="animate-pulse"
                      />
                    )}

                    {asset.status === 'alert' && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="10"
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        opacity="0.6"
                        className="animate-pulse"
                      />
                    )}

                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="6"
                      fill={color}
                      stroke="oklch(0.15 0.01 240)"
                      strokeWidth="2"
                      filter={asset.status === 'alert' ? 'url(#glow)' : undefined}
                    />

                    {asset.heading !== undefined && (
                      <line
                        x1={pos.x}
                        y1={pos.y}
                        x2={pos.x + Math.sin((asset.heading * Math.PI) / 180) * 12}
                        y2={pos.y - Math.cos((asset.heading * Math.PI) / 180) * 12}
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.8"
                      />
                    )}

                    {isHovered && (
                      <g>
                        <rect
                          x={pos.x + 12}
                          y={pos.y - 8}
                          width={asset.callsign.length * 5 + 8}
                          height="16"
                          fill="oklch(0.11 0.01 240)"
                          stroke={color}
                          strokeWidth="1"
                          rx="2"
                        />
                        <text
                          x={pos.x + 16}
                          y={pos.y + 2}
                          fill="oklch(0.75 0.18 145)"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {asset.callsign}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}
            </svg>

            <div className="absolute top-2 left-2 bg-card/90 border border-border rounded p-1.5 text-[9px] space-y-0.5">
              <div className="font-bold tracking-wider text-primary">MAP BOUNDS</div>
              <div className="font-mono tabular-nums text-muted-foreground">
                {formatLatitude(bounds.maxLat)}
              </div>
              <div className="font-mono tabular-nums text-muted-foreground">
                {formatLongitude(bounds.minLng)} - {formatLongitude(bounds.maxLng)}
              </div>
              <div className="font-mono tabular-nums text-muted-foreground">
                {formatLatitude(bounds.minLat)}
              </div>
            </div>

            <div className="absolute bottom-2 right-2 bg-card/90 border border-border rounded p-1.5 text-[9px]">
              <div className="font-bold tracking-wider text-primary mb-1">ZOOM</div>
              <div className="font-mono tabular-nums">{zoomLevel.toFixed(1)}x</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[9px]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">ACTIVE</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-muted-foreground">ENROUTE</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-muted-foreground">ALERT</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-muted-foreground">INACTIVE</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-primary/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MapPin weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Asset GPS List</span>
        </div>

        <ScrollArea className="h-[200px]">
          <div className="space-y-2 pr-3">
            {assets.length === 0 ? (
              <div className="text-[10px] text-muted-foreground text-center py-4">
                No assets tracked
              </div>
            ) : (
              assets.map(asset => (
                <div 
                  key={asset.id} 
                  onClick={() => handleAssetClick(asset)}
                  className="bg-card border border-border p-2.5 space-y-2 hover:border-primary/50 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        asset.status === 'active' ? 'bg-primary' :
                        asset.status === 'enroute' ? 'bg-accent' :
                        asset.status === 'alert' ? 'bg-destructive animate-pulse' :
                        'bg-muted-foreground'
                      }`} />
                      <span className="text-xs font-bold">{asset.callsign}</span>
                    </div>
                    <Badge className={`${getStatusBadgeColor(asset.status)} text-[8px] px-1.5 py-0`}>
                      {asset.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-start gap-1.5">
                      <Crosshair weight="bold" className="text-primary mt-0.5" size={10} />
                      <div className="flex-1 space-y-0.5">
                        <div className="text-[10px] font-mono tabular-nums text-primary">
                          {formatLatitude(asset.latitude)}
                        </div>
                        <div className="text-[10px] font-mono tabular-nums text-primary">
                          {formatLongitude(asset.longitude)}
                        </div>
                      </div>
                      <div className="text-[9px] text-muted-foreground tabular-nums">
                        {formatTimeSince(asset.lastUpdate)}
                      </div>
                    </div>

                    {(asset.altitude !== undefined || asset.speed !== undefined || asset.heading !== undefined) && (
                      <div className="flex gap-3 pt-1 border-t border-border">
                        {asset.altitude !== undefined && (
                          <div className="space-y-0.5">
                            <div className="text-[8px] tracking-[0.08em] uppercase text-muted-foreground">ALT</div>
                            <div className="text-[10px] font-bold tabular-nums">{asset.altitude.toFixed(0)}m</div>
                          </div>
                        )}
                        {asset.speed !== undefined && (
                          <div className="space-y-0.5">
                            <div className="text-[8px] tracking-[0.08em] uppercase text-muted-foreground">SPD</div>
                            <div className="text-[10px] font-bold tabular-nums">{asset.speed.toFixed(1)} m/s</div>
                          </div>
                        )}
                        {asset.heading !== undefined && (
                          <div className="space-y-0.5 flex items-center gap-1">
                            <div className="space-y-0.5">
                              <div className="text-[8px] tracking-[0.08em] uppercase text-muted-foreground">HDG</div>
                              <div className="text-[10px] font-bold tabular-nums">{asset.heading.toFixed(0)}°</div>
                            </div>
                            <NavigationArrow 
                              weight="bold" 
                              size={12} 
                              className="text-primary mt-2"
                              style={{ transform: `rotate(${asset.heading}deg)` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-sm tracking-[0.08em] uppercase flex items-center gap-2">
              <Target weight="bold" className="text-primary" size={16} />
              GPS Asset Details
            </DialogTitle>
          </DialogHeader>

          {selectedAsset && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedAsset.status === 'active' ? 'bg-primary' :
                    selectedAsset.status === 'enroute' ? 'bg-accent' :
                    selectedAsset.status === 'alert' ? 'bg-destructive animate-pulse' :
                    'bg-muted-foreground'
                  }`} />
                  <span className="text-base font-bold">{selectedAsset.callsign}</span>
                </div>
                <Badge className={`${getStatusBadgeColor(selectedAsset.status)} text-[9px] px-2 py-0.5`}>
                  {selectedAsset.status.toUpperCase()}
                </Badge>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin weight="bold" className="text-primary" size={14} />
                    <span className="text-xs tracking-[0.08em] uppercase text-muted-foreground">GPS Coordinates</span>
                  </div>
                  <div className="bg-secondary/30 p-3 rounded border border-border space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Latitude</span>
                      <span className="text-sm font-mono font-bold tabular-nums text-primary">
                        {formatLatitude(selectedAsset.latitude)}
                      </span>
                    </div>
                    <Separator className="bg-border" />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Longitude</span>
                      <span className="text-sm font-mono font-bold tabular-nums text-primary">
                        {formatLongitude(selectedAsset.longitude)}
                      </span>
                    </div>
                  </div>
                </div>

                {(selectedAsset.altitude !== undefined || selectedAsset.speed !== undefined || selectedAsset.heading !== undefined) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <NavigationArrow weight="bold" className="text-primary" size={14} />
                      <span className="text-xs tracking-[0.08em] uppercase text-muted-foreground">Telemetry Data</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedAsset.altitude !== undefined && (
                        <div className="bg-secondary/30 p-2 rounded border border-border text-center">
                          <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground mb-1">Altitude</div>
                          <div className="text-lg font-bold tabular-nums text-primary">{selectedAsset.altitude.toFixed(0)}</div>
                          <div className="text-[9px] text-muted-foreground">meters</div>
                        </div>
                      )}
                      {selectedAsset.speed !== undefined && (
                        <div className="bg-secondary/30 p-2 rounded border border-border text-center">
                          <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground mb-1">Speed</div>
                          <div className="text-lg font-bold tabular-nums text-primary">{selectedAsset.speed.toFixed(1)}</div>
                          <div className="text-[9px] text-muted-foreground">m/s</div>
                        </div>
                      )}
                      {selectedAsset.heading !== undefined && (
                        <div className="bg-secondary/30 p-2 rounded border border-border text-center">
                          <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground mb-1">Heading</div>
                          <div className="text-lg font-bold tabular-nums text-primary flex items-center justify-center gap-1">
                            {selectedAsset.heading.toFixed(0)}°
                            <NavigationArrow 
                              weight="bold" 
                              size={14} 
                              className="text-primary"
                              style={{ transform: `rotate(${selectedAsset.heading}deg)` }}
                            />
                          </div>
                          <div className="text-[9px] text-muted-foreground">degrees</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioButton weight="bold" className="text-primary" size={14} />
                    <span className="text-xs tracking-[0.08em] uppercase text-muted-foreground">Status Info</span>
                  </div>
                  <div className="bg-secondary/30 p-2.5 rounded border border-border space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground">Last Update</span>
                      <span className="text-[10px] font-mono tabular-nums">
                        {formatTimeSince(selectedAsset.lastUpdate)}
                      </span>
                    </div>
                    <Separator className="bg-border" />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground">Agent ID</span>
                      <span className="text-[10px] font-mono font-bold text-primary">{selectedAsset.agentId}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowDetailsDialog(false)}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                CLOSE
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
