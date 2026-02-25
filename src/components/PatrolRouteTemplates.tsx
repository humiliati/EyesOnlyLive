import { useState, useCallback } from 'react'
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
  Path,
  MapPin,
  ArrowsClockwise,
  ArrowsCounterClockwise,
  Square,
  Circle,
  Triangle,
  Star,
  Lightning,
  Plus,
  Download,
  Copy,
  Trash,
  Play,
  CheckCircle
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Waypoint } from './MissionPlanner'

export interface PatrolRoute {
  id: string
  name: string
  description: string
  waypoints: Omit<Waypoint, 'id' | 'createdAt'>[]
  pattern: 'linear' | 'circular' | 'grid' | 'perimeter' | 'zigzag' | 'star'
  estimatedDistance?: number
  estimatedTime?: number
  createdAt: number
}

interface PatrolRouteTemplatesProps {
  onRouteDeployed?: (route: PatrolRoute) => void
  onWaypointsCreated?: (waypoints: Waypoint[]) => void
}

const PRESET_TEMPLATES: Omit<PatrolRoute, 'id' | 'createdAt'>[] = [
  {
    name: 'Perimeter Patrol Alpha',
    description: 'Standard perimeter security route with 4 corner checkpoints',
    pattern: 'perimeter',
    waypoints: [
      { name: 'NE Corner', latitude: 40.7140, longitude: -74.0050, altitude: 10, description: 'Northeast perimeter checkpoint' },
      { name: 'NW Corner', latitude: 40.7140, longitude: -74.0070, altitude: 10, description: 'Northwest perimeter checkpoint' },
      { name: 'SW Corner', latitude: 40.7120, longitude: -74.0070, altitude: 10, description: 'Southwest perimeter checkpoint' },
      { name: 'SE Corner', latitude: 40.7120, longitude: -74.0050, altitude: 10, description: 'Southeast perimeter checkpoint' }
    ],
    estimatedDistance: 2.4,
    estimatedTime: 30
  },
  {
    name: 'City Block Circuit',
    description: 'Urban patrol covering 8 key intersections in circular pattern',
    pattern: 'circular',
    waypoints: [
      { name: 'Starting Point', latitude: 40.7128, longitude: -74.0060, altitude: 5, description: 'Patrol origin' },
      { name: 'Intersection A', latitude: 40.7135, longitude: -74.0055, altitude: 5, description: 'North checkpoint' },
      { name: 'Intersection B', latitude: 40.7138, longitude: -74.0050, altitude: 5, description: 'Northeast checkpoint' },
      { name: 'Intersection C', latitude: 40.7135, longitude: -74.0045, altitude: 5, description: 'East checkpoint' },
      { name: 'Intersection D', latitude: 40.7128, longitude: -74.0042, altitude: 5, description: 'Southeast checkpoint' },
      { name: 'Intersection E', latitude: 40.7121, longitude: -74.0045, altitude: 5, description: 'South checkpoint' },
      { name: 'Intersection F', latitude: 40.7118, longitude: -74.0050, altitude: 5, description: 'Southwest checkpoint' },
      { name: 'Intersection G', latitude: 40.7121, longitude: -74.0055, altitude: 5, description: 'West checkpoint' }
    ],
    estimatedDistance: 1.8,
    estimatedTime: 25
  },
  {
    name: 'Grid Search Pattern',
    description: 'Systematic grid search covering 12 waypoints for thorough area coverage',
    pattern: 'grid',
    waypoints: [
      { name: 'Grid A1', latitude: 40.7140, longitude: -74.0070, altitude: 10 },
      { name: 'Grid A2', latitude: 40.7140, longitude: -74.0060, altitude: 10 },
      { name: 'Grid A3', latitude: 40.7140, longitude: -74.0050, altitude: 10 },
      { name: 'Grid B1', latitude: 40.7130, longitude: -74.0070, altitude: 10 },
      { name: 'Grid B2', latitude: 40.7130, longitude: -74.0060, altitude: 10 },
      { name: 'Grid B3', latitude: 40.7130, longitude: -74.0050, altitude: 10 },
      { name: 'Grid C1', latitude: 40.7120, longitude: -74.0070, altitude: 10 },
      { name: 'Grid C2', latitude: 40.7120, longitude: -74.0060, altitude: 10 },
      { name: 'Grid C3', latitude: 40.7120, longitude: -74.0050, altitude: 10 },
      { name: 'Grid D1', latitude: 40.7110, longitude: -74.0070, altitude: 10 },
      { name: 'Grid D2', latitude: 40.7110, longitude: -74.0060, altitude: 10 },
      { name: 'Grid D3', latitude: 40.7110, longitude: -74.0050, altitude: 10 }
    ],
    estimatedDistance: 3.2,
    estimatedTime: 45
  },
  {
    name: 'Rapid Response Route',
    description: 'Quick patrol of 4 critical points for rapid area assessment',
    pattern: 'linear',
    waypoints: [
      { name: 'Alpha Point', latitude: 40.7135, longitude: -74.0065, altitude: 10, description: 'Primary checkpoint' },
      { name: 'Bravo Point', latitude: 40.7130, longitude: -74.0055, altitude: 10, description: 'Secondary checkpoint' },
      { name: 'Charlie Point', latitude: 40.7125, longitude: -74.0065, altitude: 10, description: 'Tertiary checkpoint' },
      { name: 'Delta Point', latitude: 40.7120, longitude: -74.0055, altitude: 10, description: 'Final checkpoint' }
    ],
    estimatedDistance: 1.2,
    estimatedTime: 15
  },
  {
    name: 'Zigzag Sweep Pattern',
    description: 'Efficient zigzag pattern for wide area coverage with 6 waypoints',
    pattern: 'zigzag',
    waypoints: [
      { name: 'Start West', latitude: 40.7140, longitude: -74.0070, altitude: 10 },
      { name: 'Turn East', latitude: 40.7135, longitude: -74.0050, altitude: 10 },
      { name: 'Turn West', latitude: 40.7130, longitude: -74.0070, altitude: 10 },
      { name: 'Turn East', latitude: 40.7125, longitude: -74.0050, altitude: 10 },
      { name: 'Turn West', latitude: 40.7120, longitude: -74.0070, altitude: 10 },
      { name: 'End East', latitude: 40.7115, longitude: -74.0050, altitude: 10 }
    ],
    estimatedDistance: 2.8,
    estimatedTime: 35
  },
  {
    name: 'Star Pattern Recon',
    description: 'Radial star pattern from central point covering 6 sectors',
    pattern: 'star',
    waypoints: [
      { name: 'Center Hub', latitude: 40.7128, longitude: -74.0060, altitude: 10, description: 'Central observation point' },
      { name: 'North Sector', latitude: 40.7140, longitude: -74.0060, altitude: 10 },
      { name: 'Center Hub', latitude: 40.7128, longitude: -74.0060, altitude: 10, description: 'Return to center' },
      { name: 'NE Sector', latitude: 40.7136, longitude: -74.0048, altitude: 10 },
      { name: 'Center Hub', latitude: 40.7128, longitude: -74.0060, altitude: 10, description: 'Return to center' },
      { name: 'SE Sector', latitude: 40.7120, longitude: -74.0048, altitude: 10 },
      { name: 'Center Hub', latitude: 40.7128, longitude: -74.0060, altitude: 10, description: 'Return to center' },
      { name: 'South Sector', latitude: 40.7116, longitude: -74.0060, altitude: 10 },
      { name: 'Center Hub', latitude: 40.7128, longitude: -74.0060, altitude: 10, description: 'Return to center' },
      { name: 'SW Sector', latitude: 40.7120, longitude: -74.0072, altitude: 10 },
      { name: 'Center Hub', latitude: 40.7128, longitude: -74.0060, altitude: 10, description: 'Return to center' },
      { name: 'NW Sector', latitude: 40.7136, longitude: -74.0072, altitude: 10 }
    ],
    estimatedDistance: 3.6,
    estimatedTime: 40
  }
]

const PATTERN_ICONS = {
  linear: Lightning,
  circular: ArrowsClockwise,
  grid: Square,
  perimeter: Circle,
  zigzag: ArrowsCounterClockwise,
  star: Star
}

export function PatrolRouteTemplates({ onRouteDeployed, onWaypointsCreated }: PatrolRouteTemplatesProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [customRoutes, setCustomRoutes] = useState<PatrolRoute[]>([])
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets')
  const [selectedTemplate, setSelectedTemplate] = useState<PatrolRoute | null>(null)

  const [newRoute, setNewRoute] = useState({
    name: '',
    description: '',
    pattern: 'linear' as PatrolRoute['pattern']
  })

  const handleDeployTemplate = useCallback((template: Omit<PatrolRoute, 'id' | 'createdAt'>) => {
    const route: PatrolRoute = {
      ...template,
      id: `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    }

    const waypoints: Waypoint[] = template.waypoints.map((wp, index) => ({
      ...wp,
      id: `wp-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    }))

    onRouteDeployed?.(route)
    onWaypointsCreated?.(waypoints)

    toast.success(`Route "${route.name}" deployed with ${waypoints.length} waypoints`)
  }, [onRouteDeployed, onWaypointsCreated])

  const handleSaveCustomRoute = useCallback(() => {
    if (!newRoute.name.trim()) {
      toast.error('Route name is required')
      return
    }

    const route: PatrolRoute = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newRoute.name.trim(),
      description: newRoute.description.trim(),
      pattern: newRoute.pattern,
      waypoints: [],
      createdAt: Date.now()
    }

    setCustomRoutes(prev => [...prev, route])
    setNewRoute({ name: '', description: '', pattern: 'linear' })
    
    toast.success(`Custom route "${route.name}" saved`)
  }, [newRoute])

  const handleDeleteCustomRoute = useCallback((id: string) => {
    const route = customRoutes.find(r => r.id === id)
    setCustomRoutes(prev => prev.filter(r => r.id !== id))
    if (route) {
      toast.success(`Route "${route.name}" deleted`)
    }
  }, [customRoutes])

  const handleDuplicateRoute = useCallback((route: PatrolRoute) => {
    const duplicated: PatrolRoute = {
      ...route,
      id: `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${route.name} (Copy)`,
      createdAt: Date.now()
    }

    setCustomRoutes(prev => [...prev, duplicated])
    toast.success(`Route duplicated: "${duplicated.name}"`)
  }, [])

  const handleExportRoute = useCallback((route: PatrolRoute) => {
    const data = {
      route,
      exportedAt: Date.now()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `patrol-route-${route.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(`Route "${route.name}" exported`)
  }, [])

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  const getPatternIcon = (pattern: PatrolRoute['pattern']) => {
    const Icon = PATTERN_ICONS[pattern]
    return <Icon weight="bold" size={14} />
  }

  const getPatternLabel = (pattern: PatrolRoute['pattern']) => {
    return pattern.charAt(0).toUpperCase() + pattern.slice(1)
  }

  const getPatternColor = (pattern: PatrolRoute['pattern']) => {
    switch (pattern) {
      case 'linear': return 'text-accent'
      case 'circular': return 'text-primary'
      case 'grid': return 'text-blue-400'
      case 'perimeter': return 'text-purple-400'
      case 'zigzag': return 'text-yellow-400'
      case 'star': return 'text-pink-400'
      default: return 'text-primary'
    }
  }

  return (
    <>
      <Card className="border-primary/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Path weight="bold" className="text-primary" size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Patrol Routes</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDialog(true)}
            className="text-[9px] h-6 px-2"
          >
            <ArrowsClockwise weight="bold" size={12} className="mr-1" />
            TEMPLATES
          </Button>
        </div>

        <Separator className="bg-border" />

        <div className="grid grid-cols-2 gap-2">
          <div className="border border-border rounded p-2 bg-card/50 text-center">
            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Presets</div>
            <div className="text-lg font-bold tabular-nums text-primary">{PRESET_TEMPLATES.length}</div>
          </div>
          <div className="border border-border rounded p-2 bg-card/50 text-center">
            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Custom</div>
            <div className="text-lg font-bold tabular-nums text-accent">{customRoutes.length}</div>
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground">
          Deploy pre-defined patrol routes with waypoint sequences for efficient mission planning
        </div>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Path weight="bold" className="text-primary" size={18} />
              Patrol Route Templates
            </DialogTitle>
            <DialogDescription className="text-[10px]">
              Deploy pre-defined waypoint sequences for patrol missions
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="presets" className="text-[10px]">
                Preset Routes
                <Badge variant="secondary" className="ml-1 text-[8px] h-4 px-1">{PRESET_TEMPLATES.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-[10px]">
                Custom
                {customRoutes.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[8px] h-4 px-1">{customRoutes.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="flex-1 overflow-hidden mt-2">
              <ScrollArea className="h-[50vh]">
                <div className="space-y-2 pr-4">
                  {PRESET_TEMPLATES.map((template, index) => (
                    <div key={index} className="border border-primary/30 rounded p-3 bg-card space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={getPatternColor(template.pattern)}>
                              {getPatternIcon(template.pattern)}
                            </div>
                            <span className="text-xs font-bold">{template.name}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">{template.description}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-1.5 border border-border rounded bg-card/50">
                          <div className="text-[8px] tracking-[0.08em] uppercase text-muted-foreground">Points</div>
                          <div className="text-sm font-bold text-primary">{template.waypoints.length}</div>
                        </div>
                        {template.estimatedDistance && (
                          <div className="text-center p-1.5 border border-border rounded bg-card/50">
                            <div className="text-[8px] tracking-[0.08em] uppercase text-muted-foreground">Distance</div>
                            <div className="text-sm font-bold text-primary">{template.estimatedDistance}km</div>
                          </div>
                        )}
                        {template.estimatedTime && (
                          <div className="text-center p-1.5 border border-border rounded bg-card/50">
                            <div className="text-[8px] tracking-[0.08em] uppercase text-muted-foreground">Time</div>
                            <div className="text-sm font-bold text-primary">{formatTime(template.estimatedTime)}</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-muted-foreground tracking-[0.08em] uppercase">Pattern</span>
                          <Badge variant="outline" className="text-[8px] h-4 px-1.5">
                            {getPatternLabel(template.pattern)}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button
                          onClick={() => handleDeployTemplate(template)}
                          className="flex-1 text-[10px] h-7"
                        >
                          <Play weight="fill" size={12} className="mr-1" />
                          DEPLOY
                        </Button>
                        <Button
                          onClick={() => {
                            const route: PatrolRoute = {
                              ...template,
                              id: `temp-${index}`,
                              createdAt: Date.now()
                            }
                            setSelectedTemplate(route)
                          }}
                          variant="outline"
                          className="text-[10px] h-7 px-2"
                        >
                          <MapPin weight="bold" size={12} />
                        </Button>
                      </div>

                      {selectedTemplate?.name === template.name && (
                        <div className="border-t border-border pt-2 space-y-1">
                          <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Waypoints</div>
                          <ScrollArea className="max-h-32">
                            <div className="space-y-1 pr-2">
                              {template.waypoints.map((wp, wpIndex) => (
                                <div key={wpIndex} className="flex items-center gap-2 text-[9px] p-1 border border-border rounded bg-card/30">
                                  <span className="font-bold text-primary w-4">{wpIndex + 1}.</span>
                                  <MapPin weight="fill" size={8} className="text-primary" />
                                  <span className="flex-1 font-medium">{wp.name}</span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="custom" className="flex-1 overflow-hidden mt-2">
              <ScrollArea className="h-[50vh]">
                <div className="space-y-3 pr-4">
                  <div className="border border-accent/30 rounded p-3 bg-card/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <Plus weight="bold" className="text-accent" size={14} />
                      <span className="text-xs font-bold tracking-[0.08em] uppercase">Create Custom Route</span>
                    </div>
                    <Separator className="bg-border" />

                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] tracking-[0.08em] uppercase">Route Name</Label>
                        <Input
                          value={newRoute.name}
                          onChange={(e) => setNewRoute(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Custom Patrol Route 1"
                          className="text-xs h-8 mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px] tracking-[0.08em] uppercase">Description</Label>
                        <Input
                          value={newRoute.description}
                          onChange={(e) => setNewRoute(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Route description"
                          className="text-xs h-8 mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px] tracking-[0.08em] uppercase">Pattern Type</Label>
                        <div className="grid grid-cols-3 gap-1 mt-1">
                          {(['linear', 'circular', 'grid', 'perimeter', 'zigzag', 'star'] as const).map(pattern => (
                            <Button
                              key={pattern}
                              size="sm"
                              variant={newRoute.pattern === pattern ? 'default' : 'outline'}
                              onClick={() => setNewRoute(prev => ({ ...prev, pattern }))}
                              className="text-[9px] h-8 px-2"
                            >
                              <div className={newRoute.pattern === pattern ? '' : getPatternColor(pattern)}>
                                {getPatternIcon(pattern)}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={handleSaveCustomRoute}
                        className="w-full text-[10px] h-8"
                        disabled={!newRoute.name.trim()}
                      >
                        <CheckCircle weight="bold" size={12} className="mr-1" />
                        SAVE ROUTE
                      </Button>
                    </div>
                  </div>

                  {customRoutes.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Path weight="bold" size={32} className="mx-auto mb-2 opacity-30" />
                      <div className="text-xs">No custom routes yet</div>
                      <div className="text-[10px] mt-1">Create your first custom patrol route above</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customRoutes.map(route => (
                        <div key={route.id} className="border border-accent/30 rounded p-3 bg-card space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <div className={getPatternColor(route.pattern)}>
                                  {getPatternIcon(route.pattern)}
                                </div>
                                <span className="text-xs font-bold">{route.name}</span>
                              </div>
                              {route.description && (
                                <div className="text-[10px] text-muted-foreground">{route.description}</div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <Button
                              onClick={() => handleDuplicateRoute(route)}
                              variant="outline"
                              className="flex-1 text-[10px] h-7"
                            >
                              <Copy weight="bold" size={12} className="mr-1" />
                              COPY
                            </Button>
                            <Button
                              onClick={() => handleExportRoute(route)}
                              variant="outline"
                              className="flex-1 text-[10px] h-7"
                            >
                              <Download weight="bold" size={12} className="mr-1" />
                              EXPORT
                            </Button>
                            <Button
                              onClick={() => handleDeleteCustomRoute(route.id)}
                              variant="outline"
                              className="text-[10px] h-7 px-2 text-destructive hover:text-destructive"
                            >
                              <Trash weight="bold" size={12} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
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
