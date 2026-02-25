import { useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Ruler, 
  MapPin, 
  Path,
  Target,
  Crosshair,
  Plus,
  Trash,
  Download,
  X,
  Compass,
  ArrowRight,
  NavigationArrow
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { AssetLocation } from './GeographicMap'

export interface Waypoint {
  id: string
  name: string
  latitude: number
  longitude: number
  altitude?: number
  description?: string
  createdAt: number
}

export interface DistanceMeasurement {
  id: string
  name: string
  points: { latitude: number; longitude: number; label?: string }[]
  totalDistance: number
  segments: { distance: number; bearing: number }[]
  createdAt: number
}

interface MissionPlannerProps {
  assets: AssetLocation[]
  onWaypointCreated?: (waypoint: Waypoint) => void
  onMeasurementCreated?: (measurement: DistanceMeasurement) => void
}

const MAP_WIDTH = 340
const MAP_HEIGHT = 280
const PADDING = 20

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180)
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon)
  const bearing = Math.atan2(y, x) * 180 / Math.PI
  return (bearing + 360) % 360
}

function getBearingLabel(bearing: number): string {
  const labels = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(bearing / 22.5) % 16
  return labels[index]
}

export function MissionPlanner({ assets, onWaypointCreated, onMeasurementCreated }: MissionPlannerProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [waypoints, setWaypoints] = useState<Waypoint[]>([])
  const [measurements, setMeasurements] = useState<DistanceMeasurement[]>([])
  const [activeTab, setActiveTab] = useState<'waypoints' | 'measurements' | 'tools'>('tools')
  
  const [newWaypoint, setNewWaypoint] = useState({
    name: '',
    latitude: '',
    longitude: '',
    altitude: '',
    description: ''
  })
  
  const [measurementPoints, setMeasurementPoints] = useState<{ latitude: number; longitude: number; label?: string }[]>([])
  const [measurementName, setMeasurementName] = useState('')

  const bounds = useMemo(() => {
    const allPoints = [
      ...assets.map(a => ({ lat: a.latitude, lng: a.longitude })),
      ...waypoints.map(w => ({ lat: w.latitude, lng: w.longitude }))
    ]

    if (allPoints.length === 0) {
      return {
        minLat: 40.70,
        maxLat: 40.72,
        minLng: -74.02,
        maxLng: -74.00
      }
    }

    const lats = allPoints.map(p => p.lat)
    const lngs = allPoints.map(p => p.lng)
    
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
  }, [assets, waypoints])

  const latLngToPixel = useCallback((lat: number, lng: number): { x: number; y: number } => {
    const latRange = bounds.maxLat - bounds.minLat
    const lngRange = bounds.maxLng - bounds.minLng
    
    const x = ((lng - bounds.minLng) / lngRange) * (MAP_WIDTH - 2 * PADDING) + PADDING
    const y = ((bounds.maxLat - lat) / latRange) * (MAP_HEIGHT - 2 * PADDING) + PADDING
    
    return { x, y }
  }, [bounds])

  const handleCreateWaypoint = useCallback(() => {
    const lat = parseFloat(newWaypoint.latitude)
    const lng = parseFloat(newWaypoint.longitude)
    const alt = newWaypoint.altitude ? parseFloat(newWaypoint.altitude) : undefined

    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Invalid coordinates')
      return
    }

    if (lat < -90 || lat > 90) {
      toast.error('Latitude must be between -90 and 90')
      return
    }

    if (lng < -180 || lng > 180) {
      toast.error('Longitude must be between -180 and 180')
      return
    }

    if (!newWaypoint.name.trim()) {
      toast.error('Waypoint name is required')
      return
    }

    const waypoint: Waypoint = {
      id: `wp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newWaypoint.name.trim(),
      latitude: lat,
      longitude: lng,
      altitude: alt,
      description: newWaypoint.description.trim() || undefined,
      createdAt: Date.now()
    }

    setWaypoints(prev => [...prev, waypoint])
    onWaypointCreated?.(waypoint)
    
    setNewWaypoint({
      name: '',
      latitude: '',
      longitude: '',
      altitude: '',
      description: ''
    })
    
    toast.success(`Waypoint "${waypoint.name}" created`)
  }, [newWaypoint, onWaypointCreated])

  const handleDeleteWaypoint = useCallback((id: string) => {
    const waypoint = waypoints.find(w => w.id === id)
    setWaypoints(prev => prev.filter(w => w.id !== id))
    if (waypoint) {
      toast.success(`Waypoint "${waypoint.name}" deleted`)
    }
  }, [waypoints])

  const handleAddMeasurementPoint = useCallback((lat: number, lng: number, label?: string) => {
    setMeasurementPoints(prev => [...prev, { latitude: lat, longitude: lng, label }])
    toast.success(`Point ${measurementPoints.length + 1} added`)
  }, [measurementPoints.length])

  const handleAddAssetToMeasurement = useCallback((asset: AssetLocation) => {
    handleAddMeasurementPoint(asset.latitude, asset.longitude, asset.callsign)
  }, [handleAddMeasurementPoint])

  const handleAddWaypointToMeasurement = useCallback((waypoint: Waypoint) => {
    handleAddMeasurementPoint(waypoint.latitude, waypoint.longitude, waypoint.name)
  }, [handleAddMeasurementPoint])

  const handleRemoveMeasurementPoint = useCallback((index: number) => {
    setMeasurementPoints(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleClearMeasurementPoints = useCallback(() => {
    setMeasurementPoints([])
    setMeasurementName('')
    toast.success('Measurement cleared')
  }, [])

  const handleSaveMeasurement = useCallback(() => {
    if (measurementPoints.length < 2) {
      toast.error('Need at least 2 points to create measurement')
      return
    }

    const segments = []
    let totalDistance = 0

    for (let i = 0; i < measurementPoints.length - 1; i++) {
      const p1 = measurementPoints[i]
      const p2 = measurementPoints[i + 1]
      const distance = calculateDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude)
      const bearing = calculateBearing(p1.latitude, p1.longitude, p2.latitude, p2.longitude)
      segments.push({ distance, bearing })
      totalDistance += distance
    }

    const measurement: DistanceMeasurement = {
      id: `meas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: measurementName.trim() || `Measurement ${measurements.length + 1}`,
      points: [...measurementPoints],
      totalDistance,
      segments,
      createdAt: Date.now()
    }

    setMeasurements(prev => [...prev, measurement])
    onMeasurementCreated?.(measurement)
    
    setMeasurementPoints([])
    setMeasurementName('')
    
    toast.success(`Measurement "${measurement.name}" saved`)
  }, [measurementPoints, measurementName, measurements.length, onMeasurementCreated])

  const handleDeleteMeasurement = useCallback((id: string) => {
    const measurement = measurements.find(m => m.id === id)
    setMeasurements(prev => prev.filter(m => m.id !== id))
    if (measurement) {
      toast.success(`Measurement "${measurement.name}" deleted`)
    }
  }, [measurements])

  const handleExportData = useCallback(() => {
    const data = {
      waypoints,
      measurements,
      exportedAt: Date.now()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mission-planning-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Mission planning data exported')
  }, [waypoints, measurements])

  const formatLatitude = (lat: number) => {
    const direction = lat >= 0 ? 'N' : 'S'
    return `${Math.abs(lat).toFixed(6)}° ${direction}`
  }

  const formatLongitude = (lng: number) => {
    const direction = lng >= 0 ? 'E' : 'W'
    return `${Math.abs(lng).toFixed(6)}° ${direction}`
  }

  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${(km * 1000).toFixed(0)}m`
    }
    return `${km.toFixed(2)}km`
  }

  const currentMeasurementStats = useMemo(() => {
    if (measurementPoints.length < 2) return null

    let totalDistance = 0
    const segments = []

    for (let i = 0; i < measurementPoints.length - 1; i++) {
      const p1 = measurementPoints[i]
      const p2 = measurementPoints[i + 1]
      const distance = calculateDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude)
      const bearing = calculateBearing(p1.latitude, p1.longitude, p2.latitude, p2.longitude)
      segments.push({ distance, bearing, from: p1.label || `Point ${i + 1}`, to: p2.label || `Point ${i + 2}` })
      totalDistance += distance
    }

    return { totalDistance, segments }
  }, [measurementPoints])

  return (
    <>
      <Card className="border-primary/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ruler weight="bold" className="text-primary" size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Mission Planner</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDialog(true)}
            className="text-[9px] h-6 px-2"
          >
            <Target weight="bold" size={12} className="mr-1" />
            OPEN TOOLS
          </Button>
        </div>

        <Separator className="bg-border" />

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="border border-border rounded p-2 bg-card/50">
            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Waypoints</div>
            <div className="text-lg font-bold tabular-nums text-primary">{waypoints.length}</div>
          </div>
          <div className="border border-border rounded p-2 bg-card/50">
            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Measurements</div>
            <div className="text-lg font-bold tabular-nums text-primary">{measurements.length}</div>
          </div>
        </div>

        {waypoints.length > 0 && (
          <div className="space-y-1">
            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Recent Waypoints</div>
            <div className="space-y-1">
              {waypoints.slice(-3).reverse().map(wp => (
                <div key={wp.id} className="flex items-center justify-between text-[10px] p-1.5 border border-border rounded bg-card/30">
                  <div className="flex items-center gap-1">
                    <MapPin weight="fill" className="text-primary" size={10} />
                    <span className="font-medium">{wp.name}</span>
                  </div>
                  <span className="text-muted-foreground font-mono">{formatLatitude(wp.latitude)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {measurements.length > 0 && (
          <div className="space-y-1">
            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Recent Measurements</div>
            <div className="space-y-1">
              {measurements.slice(-2).reverse().map(m => (
                <div key={m.id} className="flex items-center justify-between text-[10px] p-1.5 border border-border rounded bg-card/30">
                  <div className="flex items-center gap-1">
                    <Path weight="bold" className="text-accent" size={10} />
                    <span className="font-medium">{m.name}</span>
                  </div>
                  <span className="text-primary font-bold">{formatDistance(m.totalDistance)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ruler weight="bold" className="text-primary" size={18} />
              Mission Planning Tools
            </DialogTitle>
            <DialogDescription className="text-[10px]">
              Create waypoints and measure distances for mission planning
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tools" className="text-[10px]">Tools</TabsTrigger>
              <TabsTrigger value="waypoints" className="text-[10px]">
                Waypoints
                {waypoints.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[8px] h-4 px-1">{waypoints.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="measurements" className="text-[10px]">
                Measure
                {measurements.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[8px] h-4 px-1">{measurements.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tools" className="flex-1 overflow-hidden mt-2">
              <ScrollArea className="h-[50vh]">
                <div className="space-y-4 pr-4">
                  <div className="space-y-3 border border-primary/30 rounded p-3 bg-card/50">
                    <div className="flex items-center gap-2">
                      <MapPin weight="bold" className="text-primary" size={14} />
                      <span className="text-xs font-bold tracking-[0.08em] uppercase">Create Waypoint</span>
                    </div>
                    <Separator className="bg-border" />
                    
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] tracking-[0.08em] uppercase">Name</Label>
                        <Input
                          value={newWaypoint.name}
                          onChange={(e) => setNewWaypoint(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Extraction Point Alpha"
                          className="text-xs h-8 mt-1"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] tracking-[0.08em] uppercase">Latitude</Label>
                          <Input
                            value={newWaypoint.latitude}
                            onChange={(e) => setNewWaypoint(prev => ({ ...prev, latitude: e.target.value }))}
                            placeholder="40.712800"
                            className="text-xs h-8 mt-1 font-mono"
                            type="number"
                            step="0.000001"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] tracking-[0.08em] uppercase">Longitude</Label>
                          <Input
                            value={newWaypoint.longitude}
                            onChange={(e) => setNewWaypoint(prev => ({ ...prev, longitude: e.target.value }))}
                            placeholder="-74.006000"
                            className="text-xs h-8 mt-1 font-mono"
                            type="number"
                            step="0.000001"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-[10px] tracking-[0.08em] uppercase">Altitude (Optional)</Label>
                        <Input
                          value={newWaypoint.altitude}
                          onChange={(e) => setNewWaypoint(prev => ({ ...prev, altitude: e.target.value }))}
                          placeholder="10"
                          className="text-xs h-8 mt-1 font-mono"
                          type="number"
                          step="0.1"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px] tracking-[0.08em] uppercase">Description (Optional)</Label>
                        <Input
                          value={newWaypoint.description}
                          onChange={(e) => setNewWaypoint(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Additional notes"
                          className="text-xs h-8 mt-1"
                        />
                      </div>

                      <Button
                        onClick={handleCreateWaypoint}
                        className="w-full text-[10px] h-8"
                        disabled={!newWaypoint.name.trim() || !newWaypoint.latitude || !newWaypoint.longitude}
                      >
                        <Plus weight="bold" size={12} className="mr-1" />
                        CREATE WAYPOINT
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 border border-accent/30 rounded p-3 bg-card/50">
                    <div className="flex items-center gap-2">
                      <Path weight="bold" className="text-accent" size={14} />
                      <span className="text-xs font-bold tracking-[0.08em] uppercase">Distance Measurement</span>
                    </div>
                    <Separator className="bg-border" />

                    {measurementPoints.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-[0.08em] uppercase">Measurement Name</Label>
                        <Input
                          value={measurementName}
                          onChange={(e) => setMeasurementName(e.target.value)}
                          placeholder={`Measurement ${measurements.length + 1}`}
                          className="text-xs h-8"
                        />
                      </div>
                    )}

                    <div className="text-[10px] text-muted-foreground">
                      Add points from assets or waypoints to create distance measurements
                    </div>

                    <div className="space-y-2">
                      <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Add from Assets</div>
                      <div className="grid grid-cols-2 gap-1">
                        {assets.slice(0, 6).map(asset => (
                          <Button
                            key={asset.id}
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddAssetToMeasurement(asset)}
                            className="text-[9px] h-7 px-2"
                          >
                            <Target weight="fill" size={10} className="mr-1" />
                            {asset.callsign}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {waypoints.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Add from Waypoints</div>
                        <div className="grid grid-cols-2 gap-1">
                          {waypoints.slice(0, 6).map(wp => (
                            <Button
                              key={wp.id}
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddWaypointToMeasurement(wp)}
                              className="text-[9px] h-7 px-2"
                            >
                              <MapPin weight="fill" size={10} className="mr-1" />
                              {wp.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {measurementPoints.length > 0 && (
                      <div className="space-y-2 border-t border-border pt-2">
                        <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">
                          Selected Points ({measurementPoints.length})
                        </div>
                        <div className="space-y-1">
                          {measurementPoints.map((point, index) => (
                            <div key={index} className="flex items-center justify-between text-[10px] p-1.5 border border-border rounded bg-card">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-primary">{index + 1}.</span>
                                <span className="font-medium">{point.label || `Point ${index + 1}`}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveMeasurementPoint(index)}
                                className="h-5 w-5 p-0"
                              >
                                <X weight="bold" size={10} />
                              </Button>
                            </div>
                          ))}
                        </div>

                        {currentMeasurementStats && (
                          <div className="border border-primary/30 rounded p-2 bg-primary/5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Total Distance</span>
                              <span className="text-sm font-bold text-primary">{formatDistance(currentMeasurementStats.totalDistance)}</span>
                            </div>
                            <Separator className="bg-border/50" />
                            <div className="space-y-1">
                              {currentMeasurementStats.segments.map((seg, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[9px]">
                                  <div className="flex items-center gap-1">
                                    <ArrowRight weight="bold" size={10} className="text-accent" />
                                    <span className="text-muted-foreground">{seg.from} → {seg.to}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-primary">{formatDistance(seg.distance)}</span>
                                    <Badge variant="outline" className="text-[8px] h-4 px-1">
                                      <Compass weight="bold" size={8} className="mr-0.5" />
                                      {seg.bearing.toFixed(0)}° {getBearingLabel(seg.bearing)}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveMeasurement}
                            className="flex-1 text-[10px] h-8"
                            disabled={measurementPoints.length < 2}
                          >
                            <Download weight="bold" size={12} className="mr-1" />
                            SAVE
                          </Button>
                          <Button
                            onClick={handleClearMeasurementPoints}
                            variant="outline"
                            className="flex-1 text-[10px] h-8"
                          >
                            <Trash weight="bold" size={12} className="mr-1" />
                            CLEAR
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {(waypoints.length > 0 || measurements.length > 0) && (
                    <Button
                      onClick={handleExportData}
                      variant="outline"
                      className="w-full text-[10px] h-8"
                    >
                      <Download weight="bold" size={12} className="mr-1" />
                      EXPORT ALL DATA
                    </Button>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="waypoints" className="flex-1 overflow-hidden mt-2">
              <ScrollArea className="h-[50vh]">
                <div className="space-y-2 pr-4">
                  {waypoints.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin weight="bold" size={32} className="mx-auto mb-2 opacity-30" />
                      <div className="text-xs">No waypoints created yet</div>
                      <div className="text-[10px] mt-1">Use the Tools tab to create waypoints</div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                        <span>{waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''}</span>
                      </div>
                      {waypoints.map(wp => (
                        <div key={wp.id} className="border border-primary/30 rounded p-3 bg-card space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin weight="fill" className="text-primary" size={14} />
                              <span className="text-xs font-bold">{wp.name}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteWaypoint(wp.id)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash weight="bold" size={12} />
                            </Button>
                          </div>
                          <div className="space-y-1 text-[10px] font-mono">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">LAT:</span>
                              <span className="text-primary">{formatLatitude(wp.latitude)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">LNG:</span>
                              <span className="text-primary">{formatLongitude(wp.longitude)}</span>
                            </div>
                            {wp.altitude !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">ALT:</span>
                                <span className="text-primary">{wp.altitude.toFixed(1)}m</span>
                              </div>
                            )}
                          </div>
                          {wp.description && (
                            <div className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                              {wp.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="measurements" className="flex-1 overflow-hidden mt-2">
              <ScrollArea className="h-[50vh]">
                <div className="space-y-2 pr-4">
                  {measurements.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Ruler weight="bold" size={32} className="mx-auto mb-2 opacity-30" />
                      <div className="text-xs">No measurements created yet</div>
                      <div className="text-[10px] mt-1">Use the Tools tab to create measurements</div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                        <span>{measurements.length} measurement{measurements.length !== 1 ? 's' : ''}</span>
                      </div>
                      {measurements.map(m => (
                        <div key={m.id} className="border border-accent/30 rounded p-3 bg-card space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Path weight="bold" className="text-accent" size={14} />
                              <span className="text-xs font-bold">{m.name}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteMeasurement(m.id)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash weight="bold" size={12} />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between border border-primary/30 rounded p-2 bg-primary/5">
                            <span className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Total Distance</span>
                            <span className="text-sm font-bold text-primary">{formatDistance(m.totalDistance)}</span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">
                              {m.points.length} Points, {m.segments.length} Segments
                            </div>
                            {m.segments.map((seg, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[9px] p-1.5 border border-border rounded bg-card/50">
                                <div className="flex items-center gap-1">
                                  <NavigationArrow 
                                    weight="bold" 
                                    size={10} 
                                    className="text-accent"
                                    style={{ transform: `rotate(${seg.bearing}deg)` }}
                                  />
                                  <span className="text-muted-foreground">Segment {idx + 1}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-primary">{formatDistance(seg.distance)}</span>
                                  <Badge variant="outline" className="text-[8px] h-4 px-1">
                                    {seg.bearing.toFixed(0)}° {getBearingLabel(seg.bearing)}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
