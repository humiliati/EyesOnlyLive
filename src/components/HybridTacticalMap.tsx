import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Globe, 
  MapPin, 
  Target,
  Crosshair,
  Plus,
  Minus,
  RadioButton,
  Path,
  ArrowRight,
  CheckCircle,
  Eye,
  GridFour,
  NavigationArrow,
  Users,
  WarningDiamond
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

interface HybridTacticalMapProps {
  assets: AssetLocation[]
  lanes?: ActiveLane[]
  onAssetClick?: (asset: AssetLocation) => void
  onDispatchAsset?: (assetId: string, targetGrid: { x: number; y: number }, message: string) => void
  onCreateLane?: (lane: Omit<ActiveLane, 'id' | 'createdAt'>) => void
}

interface MapBounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

const MAP_WIDTH = 340
const MAP_HEIGHT = 340
const PADDING = 20
const GRID_SIZE = 8
const GRID_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export function HybridTacticalMap({ 
  assets, 
  lanes = [], 
  onAssetClick, 
  onDispatchAsset,
  onCreateLane 
}: HybridTacticalMapProps) {
  const [selectedAsset, setSelectedAsset] = useState<AssetLocation | null>(null)
  const [selectedGrid, setSelectedGrid] = useState<{ x: number; y: number } | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showDispatchDialog, setShowDispatchDialog] = useState(false)
  const [showLaneDialog, setShowLaneDialog] = useState(false)
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null)
  const [hoveredGrid, setHoveredGrid] = useState<{ x: number; y: number } | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [showGridOverlay, setShowGridOverlay] = useState(true)
  const [dispatchMessage, setDispatchMessage] = useState('')
  const [selectedDispatchAsset, setSelectedDispatchAsset] = useState('')
  const [laneName, setLaneName] = useState('')
  const [laneStartGrid, setLaneStartGrid] = useState<{ x: number; y: number } | null>(null)
  const [laneEndGrid, setLaneEndGrid] = useState<{ x: number; y: number } | null>(null)
  const [laneAssets, setLaneAssets] = useState<string[]>([])
  const [lanePriority, setLanePriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal')
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

  const gridToPixel = useCallback((gridX: number, gridY: number): { x: number; y: number } => {
    const cellWidth = (MAP_WIDTH - 2 * PADDING) / GRID_SIZE
    const cellHeight = (MAP_HEIGHT - 2 * PADDING) / GRID_SIZE
    
    const x = PADDING + (gridX + 0.5) * cellWidth
    const y = PADDING + (gridY + 0.5) * cellHeight
    
    return { 
      x: x * zoomLevel + panOffset.x, 
      y: y * zoomLevel + panOffset.y 
    }
  }, [zoomLevel, panOffset])

  const pixelToGrid = useCallback((x: number, y: number): { x: number; y: number } | null => {
    const adjustedX = (x - panOffset.x) / zoomLevel
    const adjustedY = (y - panOffset.y) / zoomLevel
    
    const cellWidth = (MAP_WIDTH - 2 * PADDING) / GRID_SIZE
    const cellHeight = (MAP_HEIGHT - 2 * PADDING) / GRID_SIZE
    
    const gridX = Math.floor((adjustedX - PADDING) / cellWidth)
    const gridY = Math.floor((adjustedY - PADDING) / cellHeight)
    
    if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
      return { x: gridX, y: gridY }
    }
    
    return null
  }, [zoomLevel, panOffset])

  const handleAssetClick = useCallback((asset: AssetLocation, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedAsset(asset)
    setShowDetailsDialog(true)
    onAssetClick?.(asset)
  }, [onAssetClick])

  const handleGridClick = useCallback((gridX: number, gridY: number) => {
    setSelectedGrid({ x: gridX, y: gridY })
    
    const assetsInGrid = assets.filter(a => a.gridX === gridX && a.gridY === gridY)
    if (assetsInGrid.length === 1) {
      setSelectedAsset(assetsInGrid[0])
    }
  }, [assets])

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

  const openDispatchDialog = useCallback((gridX: number, gridY: number) => {
    setSelectedGrid({ x: gridX, y: gridY })
    setShowDispatchDialog(true)
  }, [])

  const handleDispatch = useCallback(() => {
    if (!selectedGrid || !selectedDispatchAsset || !dispatchMessage) {
      toast.error('Missing dispatch parameters')
      return
    }

    const asset = assets.find(a => a.id === selectedDispatchAsset)
    if (!asset) return

    const gridLabel = `${GRID_LABELS[selectedGrid.y]}${selectedGrid.x + 1}`
    
    onDispatchAsset?.(selectedDispatchAsset, selectedGrid, dispatchMessage)
    
    toast.success(`${asset.callsign} dispatched to ${gridLabel}`)
    
    setShowDispatchDialog(false)
    setDispatchMessage('')
    setSelectedDispatchAsset('')
  }, [selectedGrid, selectedDispatchAsset, dispatchMessage, assets, onDispatchAsset])

  const handleCreateLane = useCallback(() => {
    if (!laneName || !laneStartGrid || !laneEndGrid || laneAssets.length === 0) {
      toast.error('Missing lane parameters')
      return
    }

    const startLabel = `${GRID_LABELS[laneStartGrid.y]}${laneStartGrid.x + 1}`
    const endLabel = `${GRID_LABELS[laneEndGrid.y]}${laneEndGrid.x + 1}`

    const newLane: Omit<ActiveLane, 'id' | 'createdAt'> = {
      name: laneName,
      startGrid: laneStartGrid,
      endGrid: laneEndGrid,
      assignedAssets: laneAssets,
      status: 'active',
      priority: lanePriority
    }

    onCreateLane?.(newLane)

    toast.success(`Lane "${laneName}" created`)

    setShowLaneDialog(false)
    setLaneName('')
    setLaneStartGrid(null)
    setLaneEndGrid(null)
    setLaneAssets([])
    setLanePriority('normal')
  }, [laneName, laneStartGrid, laneEndGrid, laneAssets, lanePriority, onCreateLane])

  const getGridAssets = useCallback((x: number, y: number) => {
    return assets.filter(a => a.gridX === x && a.gridY === y)
  }, [assets])

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

  const getPriorityColor = (priority: ActiveLane['priority']) => {
    switch (priority) {
      case 'critical': return 'oklch(0.65 0.25 25)'
      case 'high': return 'oklch(0.75 0.16 75)'
      case 'normal': return 'oklch(0.75 0.18 145)'
      case 'low': return 'oklch(0.45 0.02 240)'
      default: return 'oklch(0.45 0.02 240)'
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

  const gridCells = useMemo(() => {
    const cells = []
    const cellWidth = (MAP_WIDTH - 2 * PADDING) / GRID_SIZE
    const cellHeight = (MAP_HEIGHT - 2 * PADDING) / GRID_SIZE

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const pixelX = PADDING + x * cellWidth
        const pixelY = PADDING + y * cellHeight
        
        cells.push({
          x,
          y,
          pixelX: pixelX * zoomLevel + panOffset.x,
          pixelY: pixelY * zoomLevel + panOffset.y,
          width: cellWidth * zoomLevel,
          height: cellHeight * zoomLevel
        })
      }
    }

    return cells
  }, [zoomLevel, panOffset])

  const gridLines = useMemo(() => {
    const lines = []
    const cellWidth = (MAP_WIDTH - 2 * PADDING) / GRID_SIZE
    const cellHeight = (MAP_HEIGHT - 2 * PADDING) / GRID_SIZE

    for (let i = 0; i <= GRID_SIZE; i++) {
      const x = PADDING + i * cellWidth
      const y = PADDING + i * cellHeight
      
      lines.push({
        key: `v-${i}`,
        x1: x * zoomLevel + panOffset.x,
        y1: PADDING * zoomLevel + panOffset.y,
        x2: x * zoomLevel + panOffset.x,
        y2: (MAP_HEIGHT - PADDING) * zoomLevel + panOffset.y
      })

      lines.push({
        key: `h-${i}`,
        x1: PADDING * zoomLevel + panOffset.x,
        y1: y * zoomLevel + panOffset.y,
        x2: (MAP_WIDTH - PADDING) * zoomLevel + panOffset.x,
        y2: y * zoomLevel + panOffset.y
      })
    }

    return lines
  }, [zoomLevel, panOffset])

  const laneLines = useMemo(() => {
    return lanes.map(lane => {
      const start = gridToPixel(lane.startGrid.x, lane.startGrid.y)
      const end = gridToPixel(lane.endGrid.x, lane.endGrid.y)

      const color = getPriorityColor(lane.priority)

      return {
        key: lane.id,
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        color,
        name: lane.name,
        priority: lane.priority
      }
    })
  }, [lanes, gridToPixel])

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe weight="bold" className="text-primary" size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Hybrid Tactical Map</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={showGridOverlay ? "default" : "outline"}
              onClick={() => setShowGridOverlay(!showGridOverlay)}
              className="text-[9px] h-6 px-2"
            >
              <GridFour weight="bold" size={12} className="mr-1" />
              GRID
            </Button>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary text-primary">
              <RadioButton weight="bold" size={10} className="mr-1 animate-pulse" />
              SYNC LIVE
            </Badge>
          </div>
        </div>

        <Separator className="bg-border" />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-muted-foreground">
              {assets.length} asset{assets.length !== 1 ? 's' : ''} | {lanes.length} lane{lanes.length !== 1 ? 's' : ''}
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

              {showGridOverlay && gridCells.map(cell => {
                const isSelected = selectedGrid?.x === cell.x && selectedGrid?.y === cell.y
                const isHovered = hoveredGrid?.x === cell.x && hoveredGrid?.y === cell.y
                const assetsInGrid = getGridAssets(cell.x, cell.y)
                
                return (
                  <rect
                    key={`cell-${cell.x}-${cell.y}`}
                    x={cell.pixelX}
                    y={cell.pixelY}
                    width={cell.width}
                    height={cell.height}
                    fill={isSelected ? 'oklch(0.75 0.18 145 / 0.15)' : 'transparent'}
                    stroke={isHovered ? 'oklch(0.75 0.16 75)' : 'oklch(0.25 0.02 240)'}
                    strokeWidth={isHovered ? '2' : '1'}
                    opacity={isHovered ? '1' : '0.5'}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredGrid({ x: cell.x, y: cell.y })}
                    onMouseLeave={() => setHoveredGrid(null)}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleGridClick(cell.x, cell.y)
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      openDispatchDialog(cell.x, cell.y)
                    }}
                  />
                )
              })}

              {showGridOverlay && gridLines.map(line => (
                <line
                  key={line.key}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="oklch(0.25 0.02 240)"
                  strokeWidth="1"
                  opacity="0.6"
                />
              ))}

              {showGridOverlay && gridCells.map(cell => {
                const centerX = cell.pixelX + cell.width / 2
                const centerY = cell.pixelY + cell.height / 2
                const label = `${GRID_LABELS[cell.y]}${cell.x + 1}`
                
                return (
                  <text
                    key={`label-${cell.x}-${cell.y}`}
                    x={centerX}
                    y={centerY}
                    fill="oklch(0.45 0.02 240)"
                    fontSize={`${8 * zoomLevel}px`}
                    fontWeight="bold"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    opacity="0.4"
                    pointerEvents="none"
                  >
                    {label}
                  </text>
                )
              })}

              {laneLines.map(lane => (
                <g key={lane.key}>
                  <line
                    x1={lane.x1}
                    y1={lane.y1}
                    x2={lane.x2}
                    y2={lane.y2}
                    stroke={lane.color}
                    strokeWidth={lane.priority === 'critical' ? '3' : '2'}
                    strokeDasharray="6 4"
                    opacity="0.7"
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
                    onClick={(e) => handleAssetClick(asset, e)}
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
              <div className="font-bold tracking-wider text-primary">GPS + GRID</div>
              {selectedGrid && (
                <div className="font-mono font-bold text-accent">
                  {GRID_LABELS[selectedGrid.y]}{selectedGrid.x + 1}
                </div>
              )}
              <div className="font-mono tabular-nums text-muted-foreground text-[8px]">
                {formatLatitude(bounds.maxLat)}
              </div>
            </div>

            <div className="absolute bottom-2 right-2 bg-card/90 border border-border rounded p-1.5 text-[9px]">
              <div className="font-bold tracking-wider text-primary mb-1">ZOOM</div>
              <div className="font-mono tabular-nums">{zoomLevel.toFixed(1)}x</div>
            </div>

            <div className="absolute bottom-2 left-2 flex gap-1">
              <Button
                size="sm"
                onClick={() => setShowLaneDialog(true)}
                className="text-[9px] h-6 px-2 bg-primary/90 text-primary-foreground hover:bg-primary"
              >
                <Path weight="bold" size={10} className="mr-1" />
                LANE
              </Button>
              {selectedGrid && (
                <Button
                  size="sm"
                  onClick={() => openDispatchDialog(selectedGrid.x, selectedGrid.y)}
                  className="text-[9px] h-6 px-2 bg-accent/90 text-accent-foreground hover:bg-accent"
                >
                  <ArrowRight weight="bold" size={10} className="mr-1" />
                  DISPATCH
                </Button>
              )}
            </div>
          </div>

          {selectedGrid && (
            <div className="bg-card border border-primary/30 p-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold tracking-wider text-primary">
                  GRID {GRID_LABELS[selectedGrid.y]}{selectedGrid.x + 1}
                </div>
                <Badge variant="outline" className="text-[8px] px-1.5 py-0">
                  {getGridAssets(selectedGrid.x, selectedGrid.y).length} ASSETS
                </Badge>
              </div>
              
              {getGridAssets(selectedGrid.x, selectedGrid.y).length > 0 ? (
                <div className="space-y-1">
                  {getGridAssets(selectedGrid.x, selectedGrid.y).map(asset => (
                    <div key={asset.id} className="flex items-center justify-between text-[10px] bg-secondary/30 p-1.5 rounded border border-border">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: getStatusColor(asset.status) }} />
                        <span className="font-bold">{asset.callsign}</span>
                      </div>
                      <span className="text-muted-foreground">{formatTimeSince(asset.lastUpdate)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-muted-foreground text-center py-2">
                  Empty grid cell
                </div>
              )}
            </div>
          )}

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
          </div>
        </div>
      </Card>

      <Dialog open={showDispatchDialog} onOpenChange={setShowDispatchDialog}>
        <DialogContent className="bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-sm tracking-[0.08em] uppercase flex items-center gap-2">
              <ArrowRight weight="bold" className="text-primary" size={16} />
              Dispatch to Grid {selectedGrid && `${GRID_LABELS[selectedGrid.y]}${selectedGrid.x + 1}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs tracking-[0.08em] uppercase">Select Asset</Label>
              <Select value={selectedDispatchAsset} onValueChange={setSelectedDispatchAsset}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Choose asset to dispatch..." />
                </SelectTrigger>
                <SelectContent>
                  {assets.map(asset => (
                    <SelectItem key={asset.id} value={asset.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(asset.status) }} />
                        {asset.callsign}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs tracking-[0.08em] uppercase">Mission Directive</Label>
              <Input
                value={dispatchMessage}
                onChange={(e) => setDispatchMessage(e.target.value)}
                placeholder="Enter dispatch orders..."
                className="text-xs"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleDispatch}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!selectedDispatchAsset || !dispatchMessage}
              >
                <CheckCircle weight="bold" size={14} className="mr-1" />
                CONFIRM DISPATCH
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDispatchDialog(false)}
                className="flex-1"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLaneDialog} onOpenChange={setShowLaneDialog}>
        <DialogContent className="bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-sm tracking-[0.08em] uppercase flex items-center gap-2">
              <Path weight="bold" className="text-primary" size={16} />
              Create Active Lane
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs tracking-[0.08em] uppercase">Lane Name</Label>
              <Input
                value={laneName}
                onChange={(e) => setLaneName(e.target.value)}
                placeholder="SECTOR ALPHA PATROL"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs tracking-[0.08em] uppercase">Start Grid</Label>
                <Select 
                  value={laneStartGrid ? `${laneStartGrid.x}-${laneStartGrid.y}` : ''} 
                  onValueChange={(val) => {
                    const [x, y] = val.split('-').map(Number)
                    setLaneStartGrid({ x, y })
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: GRID_SIZE }, (_, y) =>
                      Array.from({ length: GRID_SIZE }, (_, x) => (
                        <SelectItem key={`${x}-${y}`} value={`${x}-${y}`} className="text-xs">
                          {GRID_LABELS[y]}{x + 1}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs tracking-[0.08em] uppercase">End Grid</Label>
                <Select 
                  value={laneEndGrid ? `${laneEndGrid.x}-${laneEndGrid.y}` : ''} 
                  onValueChange={(val) => {
                    const [x, y] = val.split('-').map(Number)
                    setLaneEndGrid({ x, y })
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: GRID_SIZE }, (_, y) =>
                      Array.from({ length: GRID_SIZE }, (_, x) => (
                        <SelectItem key={`${x}-${y}`} value={`${x}-${y}`} className="text-xs">
                          {GRID_LABELS[y]}{x + 1}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs tracking-[0.08em] uppercase">Priority Level</Label>
              <Select value={lanePriority} onValueChange={(val) => setLanePriority(val as any)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="text-xs">Low</SelectItem>
                  <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                  <SelectItem value="high" className="text-xs">High</SelectItem>
                  <SelectItem value="critical" className="text-xs">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs tracking-[0.08em] uppercase">Assigned Assets</Label>
              <ScrollArea className="h-24 border border-border rounded p-2">
                <div className="space-y-1">
                  {assets.map(asset => (
                    <label key={asset.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-secondary/50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={laneAssets.includes(asset.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLaneAssets(prev => [...prev, asset.id])
                          } else {
                            setLaneAssets(prev => prev.filter(id => id !== asset.id))
                          }
                        }}
                        className="w-3 h-3"
                      />
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(asset.status) }} />
                      <span>{asset.callsign}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateLane}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!laneName || !laneStartGrid || !laneEndGrid || laneAssets.length === 0}
              >
                <CheckCircle weight="bold" size={14} className="mr-1" />
                CREATE LANE
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowLaneDialog(false)}
                className="flex-1"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-sm tracking-[0.08em] uppercase flex items-center gap-2">
              <Target weight="bold" className="text-primary" size={16} />
              Asset Details
            </DialogTitle>
          </DialogHeader>

          {selectedAsset && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor(selectedAsset.status) }} />
                  <span className="text-base font-bold">{selectedAsset.callsign}</span>
                </div>
                <Badge className={`${getStatusBadgeColor(selectedAsset.status)} text-[9px] px-2 py-0.5`}>
                  {selectedAsset.status.toUpperCase()}
                </Badge>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-3">
                <div className="bg-secondary/30 p-3 rounded border border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Grid Position</span>
                    <span className="text-sm font-mono font-bold text-primary">
                      {GRID_LABELS[selectedAsset.gridY]}{selectedAsset.gridX + 1}
                    </span>
                  </div>
                  <Separator className="bg-border" />
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

                {(selectedAsset.altitude !== undefined || selectedAsset.speed !== undefined || selectedAsset.heading !== undefined) && (
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
                        <div className="text-lg font-bold tabular-nums text-primary">{selectedAsset.heading.toFixed(0)}°</div>
                        <div className="text-[9px] text-muted-foreground">degrees</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[10px] text-center text-muted-foreground">
                  Updated {formatTimeSince(selectedAsset.lastUpdate)}
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
