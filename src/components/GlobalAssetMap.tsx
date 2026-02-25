import { useState, useEffect, useCallback, useRef } from 'react'
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
  WarningDiamond,
  CheckCircle,
  RadioButton,
  Path,
  Eye,
  ArrowRight,
  Users,
  ListBullets,
  Crosshair,
  NavigationArrow
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

export interface DispatchLog {
  id: string
  timestamp: number
  action: 'dispatch' | 'recall' | 'lane-created' | 'lane-completed' | 'alert'
  targetGrid?: { x: number; y: number }
  assetCallsign?: string
  laneId?: string
  message: string
  priority: 'low' | 'normal' | 'high' | 'critical'
}

interface GlobalAssetMapProps {
  assets: AssetLocation[]
  onDispatchAsset?: (assetId: string, targetGrid: { x: number; y: number }, message: string) => void
  onCreateLane?: (lane: Omit<ActiveLane, 'id' | 'createdAt'>) => void
}

const GRID_SIZE = 8
const GRID_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export function GlobalAssetMap({ assets, onDispatchAsset, onCreateLane }: GlobalAssetMapProps) {
  const [selectedGrid, setSelectedGrid] = useState<{ x: number; y: number } | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<AssetLocation | null>(null)
  const [activeLanes, setActiveLanes] = useState<ActiveLane[]>([])
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>([])
  const [showDispatchDialog, setShowDispatchDialog] = useState(false)
  const [showLaneDialog, setShowLaneDialog] = useState(false)
  const [showAssetDetailsDialog, setShowAssetDetailsDialog] = useState(false)
  const [dispatchMessage, setDispatchMessage] = useState('')
  const [selectedDispatchAsset, setSelectedDispatchAsset] = useState('')
  const [laneName, setLaneName] = useState('')
  const [laneStartGrid, setLaneStartGrid] = useState<{ x: number; y: number } | null>(null)
  const [laneEndGrid, setLaneEndGrid] = useState<{ x: number; y: number } | null>(null)
  const [laneAssets, setLaneAssets] = useState<string[]>([])
  const [lanePriority, setLanePriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal')
  const [hoveredGrid, setHoveredGrid] = useState<{ x: number; y: number } | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const addDispatchLog = useCallback((log: Omit<DispatchLog, 'id' | 'timestamp'>) => {
    const newLog: DispatchLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...log
    }
    setDispatchLogs((prev) => [newLog, ...prev])
  }, [])

  const handleGridClick = useCallback((x: number, y: number) => {
    setSelectedGrid({ x, y })
    
    const assetsInGrid = assets.filter(a => a.gridX === x && a.gridY === y)
    if (assetsInGrid.length === 1) {
      setSelectedAsset(assetsInGrid[0])
    } else {
      setSelectedAsset(null)
    }
  }, [assets])

  const handleDispatch = useCallback(() => {
    if (!selectedGrid || !selectedDispatchAsset || !dispatchMessage) {
      toast.error('Missing dispatch parameters')
      return
    }

    const asset = assets.find(a => a.id === selectedDispatchAsset)
    if (!asset) return

    const gridLabel = `${GRID_LABELS[selectedGrid.y]}${selectedGrid.x + 1}`
    
    onDispatchAsset?.(selectedDispatchAsset, selectedGrid, dispatchMessage)
    
    addDispatchLog({
      action: 'dispatch',
      targetGrid: selectedGrid,
      assetCallsign: asset.callsign,
      message: `${asset.callsign} dispatched to grid ${gridLabel}: ${dispatchMessage}`,
      priority: 'high'
    })

    toast.success(`${asset.callsign} dispatched to ${gridLabel}`)
    
    setShowDispatchDialog(false)
    setDispatchMessage('')
    setSelectedDispatchAsset('')
  }, [selectedGrid, selectedDispatchAsset, dispatchMessage, assets, onDispatchAsset, addDispatchLog])

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

    const laneId = `lane-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const createdLane: ActiveLane = {
      ...newLane,
      id: laneId,
      createdAt: Date.now()
    }

    setActiveLanes((prev) => [...prev, createdLane])
    onCreateLane?.(newLane)

    addDispatchLog({
      action: 'lane-created',
      laneId: laneId,
      message: `Lane "${laneName}" created (${startLabel} → ${endLabel}) - ${laneAssets.length} asset(s) assigned`,
      priority: lanePriority
    })

    toast.success(`Lane "${laneName}" created`)

    setShowLaneDialog(false)
    setLaneName('')
    setLaneStartGrid(null)
    setLaneEndGrid(null)
    setLaneAssets([])
    setLanePriority('normal')
  }, [laneName, laneStartGrid, laneEndGrid, laneAssets, lanePriority, onCreateLane, addDispatchLog])

  const openDispatchDialog = useCallback((gridX: number, gridY: number) => {
    setSelectedGrid({ x: gridX, y: gridY })
    setShowDispatchDialog(true)
  }, [])

  const getGridAssets = useCallback((x: number, y: number) => {
    return assets.filter(a => a.gridX === x && a.gridY === y)
  }, [assets])

  const getStatusColor = (status: AssetLocation['status']) => {
    switch (status) {
      case 'active': return 'bg-primary'
      case 'inactive': return 'bg-muted-foreground'
      case 'alert': return 'bg-destructive'
      case 'enroute': return 'bg-accent'
      default: return 'bg-muted-foreground'
    }
  }

  const getPriorityColor = (priority: ActiveLane['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-destructive text-destructive-foreground'
      case 'high': return 'bg-accent text-accent-foreground'
      case 'normal': return 'bg-primary text-primary-foreground'
      case 'low': return 'bg-muted text-muted-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const isGridInLane = useCallback((x: number, y: number) => {
    return activeLanes.some(lane => {
      const minX = Math.min(lane.startGrid.x, lane.endGrid.x)
      const maxX = Math.max(lane.startGrid.x, lane.endGrid.x)
      const minY = Math.min(lane.startGrid.y, lane.endGrid.y)
      const maxY = Math.max(lane.startGrid.y, lane.endGrid.y)
      
      return x >= minX && x <= maxX && y >= minY && y <= maxY
    })
  }, [activeLanes])

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

  const formatCoordinate = (value: number, precision: number = 6) => {
    return value.toFixed(precision)
  }

  const formatLatitude = (lat: number) => {
    const direction = lat >= 0 ? 'N' : 'S'
    return `${formatCoordinate(Math.abs(lat), 6)}° ${direction}`
  }

  const formatLongitude = (lng: number) => {
    const direction = lng >= 0 ? 'E' : 'W'
    return `${formatCoordinate(Math.abs(lng), 6)}° ${direction}`
  }

  const openAssetDetails = useCallback((asset: AssetLocation) => {
    setSelectedAsset(asset)
    setShowAssetDetailsDialog(true)
  }, [])

  useEffect(() => {
    if (activeLanes.length === 0 && assets.length > 0) {
      const lane: ActiveLane = {
        id: `lane-init-${Date.now()}`,
        name: 'SECTOR ALPHA PATROL',
        startGrid: { x: 1, y: 1 },
        endGrid: { x: 3, y: 3 },
        assignedAssets: assets.slice(0, 2).map(a => a.id),
        status: 'active',
        priority: 'normal',
        createdAt: Date.now()
      }
      setActiveLanes([lane])

      addDispatchLog({
        action: 'lane-created',
        laneId: lane.id,
        message: `Lane "SECTOR ALPHA PATROL" initialized - 2 asset(s) assigned`,
        priority: 'normal'
      })
    }
  }, [activeLanes.length, assets, addDispatchLog])

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe weight="bold" className="text-primary" size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Global Asset Tracking</span>
          </div>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary text-primary">
            M CONSOLE
          </Badge>
        </div>

        <Separator className="bg-border" />

        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Assets</div>
            <div className="text-lg font-bold tabular-nums text-primary">{assets.length}</div>
          </div>
          <div>
            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Active</div>
            <div className="text-lg font-bold tabular-nums text-primary">
              {assets.filter(a => a.status === 'active').length}
            </div>
          </div>
          <div>
            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Lanes</div>
            <div className="text-lg font-bold tabular-nums text-primary">{activeLanes.length}</div>
          </div>
          <div>
            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Alerts</div>
            <div className="text-lg font-bold tabular-nums text-destructive">
              {assets.filter(a => a.status === 'alert').length}
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-primary/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair weight="bold" className="text-primary" size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Live GPS Tracking</span>
          </div>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary text-primary">
            <RadioButton weight="bold" size={10} className="mr-1 animate-pulse" />
            LIVE
          </Badge>
        </div>

        <Separator className="bg-border" />

        <Tabs value={viewMode} onValueChange={(val) => setViewMode(val as 'grid' | 'list')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-7">
            <TabsTrigger value="grid" className="text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              GRID VIEW
            </TabsTrigger>
            <TabsTrigger value="list" className="text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              GPS LIST
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-3 space-y-2">
            <ScrollArea className="h-[280px]">
              <div className="space-y-2 pr-3">
                {assets.length === 0 ? (
                  <div className="text-[10px] text-muted-foreground text-center py-4">
                    No assets tracked
                  </div>
                ) : (
                  assets.map(asset => (
                    <div 
                      key={asset.id} 
                      onClick={() => openAssetDetails(asset)}
                      className="bg-card border border-border p-2.5 space-y-2 hover:border-primary/50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(asset.status)} ${
                            asset.status === 'alert' ? 'animate-pulse' : ''
                          }`} />
                          <span className="text-xs font-bold">{asset.callsign}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary text-primary">
                            {GRID_LABELS[asset.gridY]}{asset.gridX + 1}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground tabular-nums">
                            {formatTimeSince(asset.lastUpdate)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-start gap-1.5">
                          <MapPin weight="bold" className="text-primary mt-0.5" size={10} />
                          <div className="flex-1 space-y-0.5">
                            <div className="text-[10px] font-mono tabular-nums text-primary">
                              {formatLatitude(asset.latitude)}
                            </div>
                            <div className="text-[10px] font-mono tabular-nums text-primary">
                              {formatLongitude(asset.longitude)}
                            </div>
                          </div>
                        </div>

                        {(asset.altitude !== undefined || asset.speed !== undefined || asset.heading !== undefined) && (
                          <div className="flex gap-3 pt-1">
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
                                  size={14} 
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
          </TabsContent>

          <TabsContent value="grid" className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target weight="bold" className="text-primary" size={16} />
                <span className="text-xs tracking-[0.08em] uppercase">Tactical Grid</span>
              </div>
              <Button
                size="sm"
                onClick={() => setShowLaneDialog(true)}
                className="text-[9px] h-6 px-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Path weight="bold" size={12} className="mr-1" />
                CREATE LANE
              </Button>
            </div>

        <div className="bg-secondary/30 p-2 rounded border border-border">
          <div className="grid grid-cols-9 gap-0.5">
            <div className="w-6 h-6"></div>
            {Array.from({ length: GRID_SIZE }, (_, i) => (
              <div key={`col-${i}`} className="w-6 h-6 flex items-center justify-center text-[8px] text-muted-foreground font-bold">
                {i + 1}
              </div>
            ))}
            
            {Array.from({ length: GRID_SIZE }, (_, y) => (
              <>
                <div key={`row-${y}`} className="w-6 h-6 flex items-center justify-center text-[8px] text-muted-foreground font-bold">
                  {GRID_LABELS[y]}
                </div>
                {Array.from({ length: GRID_SIZE }, (_, x) => {
                  const gridAssets = getGridAssets(x, y)
                  const inLane = isGridInLane(x, y)
                  const isSelected = selectedGrid?.x === x && selectedGrid?.y === y
                  const isHovered = hoveredGrid?.x === x && hoveredGrid?.y === y
                  
                  return (
                    <button
                      key={`grid-${x}-${y}`}
                      onClick={() => handleGridClick(x, y)}
                      onDoubleClick={() => openDispatchDialog(x, y)}
                      onMouseEnter={() => setHoveredGrid({ x, y })}
                      onMouseLeave={() => setHoveredGrid(null)}
                      className={`
                        w-6 h-6 border transition-all relative
                        ${isSelected ? 'border-primary bg-primary/20' : 'border-border'}
                        ${isHovered ? 'border-accent bg-accent/10' : ''}
                        ${inLane ? 'bg-primary/5' : 'bg-card'}
                        hover:border-primary/50
                      `}
                    >
                      {gridAssets.length > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {gridAssets.map((asset, idx) => (
                            <div
                              key={asset.id}
                              className={`w-1.5 h-1.5 rounded-full ${getStatusColor(asset.status)} ${
                                asset.status === 'alert' ? 'animate-pulse' : ''
                              }`}
                              style={{
                                position: 'absolute',
                                transform: `translate(${(idx % 2) * 4 - 2}px, ${Math.floor(idx / 2) * 4 - 2}px)`
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </>
            ))}
          </div>
        </div>

        {selectedGrid && (
          <div className="bg-card border border-border p-2 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold">
                GRID {GRID_LABELS[selectedGrid.y]}{selectedGrid.x + 1}
              </div>
              <Button
                size="sm"
                onClick={() => openDispatchDialog(selectedGrid.x, selectedGrid.y)}
                className="text-[9px] h-5 px-2"
              >
                <ArrowRight weight="bold" size={10} className="mr-1" />
                DISPATCH
              </Button>
            </div>
            
            {getGridAssets(selectedGrid.x, selectedGrid.y).length > 0 ? (
              <div className="space-y-1">
                {getGridAssets(selectedGrid.x, selectedGrid.y).map(asset => (
                  <div key={asset.id} className="flex items-center justify-between text-[10px] bg-secondary/50 p-1.5 rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(asset.status)}`} />
                      <span className="font-bold">{asset.callsign}</span>
                    </div>
                    <span className="text-muted-foreground">{formatTimeSince(asset.lastUpdate)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground text-center py-2">
                No assets in this grid
              </div>
            )}
          </div>
        )}
          </TabsContent>
        </Tabs>
      </Card>

      {activeLanes.length > 0 && (
        <Card className="border-primary/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Path weight="bold" className="text-primary" size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Active Lanes</span>
          </div>

          <div className="space-y-2">
            {activeLanes.map(lane => {
              const startLabel = `${GRID_LABELS[lane.startGrid.y]}${lane.startGrid.x + 1}`
              const endLabel = `${GRID_LABELS[lane.endGrid.y]}${lane.endGrid.x + 1}`
              
              return (
                <div key={lane.id} className="bg-card border border-border p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold">{lane.name}</div>
                    <Badge className={`${getPriorityColor(lane.priority)} text-[8px] px-1.5 py-0`}>
                      {lane.priority.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <MapPin weight="bold" size={10} />
                    <span>{startLabel}</span>
                    <ArrowRight weight="bold" size={10} />
                    <span>{endLabel}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-[10px]">
                    <Users weight="bold" size={10} className="text-primary" />
                    <span className="text-muted-foreground">{lane.assignedAssets.length} asset(s)</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card className="border-primary/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ListBullets weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Dispatch Log</span>
        </div>

        <ScrollArea className="h-[200px]">
          <div className="space-y-2 pr-3">
            {dispatchLogs.length === 0 ? (
              <div className="text-[10px] text-muted-foreground text-center py-4">
                No dispatch activity logged
              </div>
            ) : (
              dispatchLogs.map(log => (
                <div key={log.id} className="bg-card border border-border p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge className={`${getPriorityColor(log.priority)} text-[8px] px-1.5 py-0`}>
                      {log.action.toUpperCase().replace('-', ' ')}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground tabular-nums">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  
                  <div className="text-[10px]">{log.message}</div>
                  
                  {log.targetGrid && (
                    <div className="text-[9px] text-muted-foreground">
                      Target: {GRID_LABELS[log.targetGrid.y]}{log.targetGrid.x + 1}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
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
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(asset.status)}`} />
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
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(asset.status)}`} />
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

      <Dialog open={showAssetDetailsDialog} onOpenChange={setShowAssetDetailsDialog}>
        <DialogContent className="bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-sm tracking-[0.08em] uppercase flex items-center gap-2">
              <Crosshair weight="bold" className="text-primary" size={16} />
              Asset GPS Details
            </DialogTitle>
          </DialogHeader>

          {selectedAsset && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedAsset.status)} ${
                    selectedAsset.status === 'alert' ? 'animate-pulse' : ''
                  }`} />
                  <span className="text-base font-bold">{selectedAsset.callsign}</span>
                </div>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary text-primary">
                  {GRID_LABELS[selectedAsset.gridY]}{selectedAsset.gridX + 1}
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
                      <span className="text-xs tracking-[0.08em] uppercase text-muted-foreground">Telemetry</span>
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
                    <span className="text-xs tracking-[0.08em] uppercase text-muted-foreground">Status</span>
                  </div>
                  <div className="bg-secondary/30 p-2.5 rounded border border-border">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(selectedAsset.status)}`} />
                        <span className="text-xs font-bold uppercase">{selectedAsset.status}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        Updated {formatTimeSince(selectedAsset.lastUpdate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-accent/10 border border-accent/30 p-2.5 rounded">
                  <div className="text-[10px] text-center">
                    <span className="text-muted-foreground">Agent ID:</span>{' '}
                    <span className="font-mono font-bold text-primary">{selectedAsset.agentId}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowAssetDetailsDialog(false)}
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
