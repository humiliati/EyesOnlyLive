import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Desktop,
  RocketLaunch,
  Target,
  Path,
  Users,
  WarningDiamond,
  CheckCircle,
  MapPin,
  ListBullets,
  Clock,
  CaretDown,
  CaretUp
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { ActiveLane, AssetLocation } from '@/components/GlobalAssetMap'
import { mConsoleSync, type ScenarioDeployment } from '@/lib/mConsoleSync'

const GRID_SIZE = 8
const GRID_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

interface ScenarioCreatorProps {
  assets: AssetLocation[]
  onScenarioDeployed?: (scenario: ScenarioDeployment) => void
}

export function ScenarioCreator({ assets, onScenarioDeployed }: ScenarioCreatorProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [scenarioName, setScenarioName] = useState('')
  const [scenarioDescription, setScenarioDescription] = useState('')
  const [briefing, setBriefing] = useState('')
  const [objectives, setObjectives] = useState<string[]>([''])
  const [threatLevel, setThreatLevel] = useState<'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'>('LOW')
  const [lanes, setLanes] = useState<Omit<ActiveLane, 'id' | 'createdAt'>[]>([])
  const [assetPositions, setAssetPositions] = useState<Array<{ agentId: string; gridX: number; gridY: number }>>([])
  const [activeScenario, setActiveScenario] = useState<ScenarioDeployment | null>(null)
  const [deploymentHistory, setDeploymentHistory] = useState<ScenarioDeployment[]>([])
  const [showLaneDialog, setShowLaneDialog] = useState(false)
  const [showDeploymentHistory, setShowDeploymentHistory] = useState(false)

  const [newLaneName, setNewLaneName] = useState('')
  const [newLaneStartGrid, setNewLaneStartGrid] = useState<{ x: number; y: number } | null>(null)
  const [newLaneEndGrid, setNewLaneEndGrid] = useState<{ x: number; y: number } | null>(null)
  const [newLaneAssignedAssets, setNewLaneAssignedAssets] = useState<string[]>([])
  const [newLanePriority, setNewLanePriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal')

  const [mConsoleOperator, setMConsoleOperator] = useState<string>('M-CONSOLE-ALPHA')

  useEffect(() => {
    loadActiveScenario()
    loadDeploymentHistory()
  }, [])

  const loadActiveScenario = async () => {
    const scenario = await mConsoleSync.getActiveScenario()
    if (scenario) {
      setActiveScenario(scenario)
    }
  }

  const loadDeploymentHistory = async () => {
    const broadcasts = await mConsoleSync.getRecentBroadcasts(20)
    const scenarios = broadcasts
      .filter(b => b.type === 'scenario-deploy')
      .map(b => b.payload as ScenarioDeployment)
    setDeploymentHistory(scenarios)
  }

  const handleAddLane = () => {
    setShowLaneDialog(true)
  }

  const handleSaveLane = () => {
    if (!newLaneName || !newLaneStartGrid || !newLaneEndGrid || newLaneAssignedAssets.length === 0) {
      toast.error('Please fill all lane fields')
      return
    }

    const newLane: Omit<ActiveLane, 'id' | 'createdAt'> = {
      name: newLaneName,
      startGrid: newLaneStartGrid,
      endGrid: newLaneEndGrid,
      assignedAssets: newLaneAssignedAssets,
      status: 'active',
      priority: newLanePriority
    }

    setLanes(prev => [...prev, newLane])
    toast.success(`Lane "${newLaneName}" added to scenario`)

    setNewLaneName('')
    setNewLaneStartGrid(null)
    setNewLaneEndGrid(null)
    setNewLaneAssignedAssets([])
    setNewLanePriority('normal')
    setShowLaneDialog(false)
  }

  const handleRemoveLane = (index: number) => {
    setLanes(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddObjective = () => {
    setObjectives(prev => [...prev, ''])
  }

  const handleUpdateObjective = (index: number, value: string) => {
    setObjectives(prev => prev.map((obj, i) => i === index ? value : obj))
  }

  const handleRemoveObjective = (index: number) => {
    setObjectives(prev => prev.filter((_, i) => i !== index))
  }

  const handleSetAssetPosition = (agentId: string, gridX: number, gridY: number) => {
    setAssetPositions(prev => {
      const existing = prev.find(p => p.agentId === agentId)
      if (existing) {
        return prev.map(p => p.agentId === agentId ? { agentId, gridX, gridY } : p)
      }
      return [...prev, { agentId, gridX, gridY }]
    })
  }

  const handleDeployScenario = async () => {
    if (!scenarioName || !scenarioDescription) {
      toast.error('Please provide scenario name and description')
      return
    }

    const scenario: ScenarioDeployment = {
      id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: scenarioName,
      description: scenarioDescription,
      deployedAt: Date.now(),
      deployedBy: mConsoleOperator,
      lanes,
      assetPositions,
      briefing: briefing || undefined,
      objectiveList: objectives.filter(o => o.trim() !== ''),
      threatLevel
    }

    try {
      await mConsoleSync.deployScenario(scenario, mConsoleOperator)
      await mConsoleSync.setActiveScenario(scenario)
      
      if (lanes.length > 0) {
        const lanesWithIds: ActiveLane[] = lanes.map(lane => ({
          ...lane,
          id: `lane-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now()
        }))
        await mConsoleSync.setSharedLanes(lanesWithIds)
      }

      if (assetPositions.length > 0) {
        const updatedAssets = assets.map(asset => {
          const position = assetPositions.find(p => p.agentId === asset.agentId)
          if (position) {
            return { ...asset, gridX: position.gridX, gridY: position.gridY, lastUpdate: Date.now() }
          }
          return asset
        })
        await mConsoleSync.setSharedAssetPositions(updatedAssets)
      }

      setActiveScenario(scenario)
      toast.success(`Scenario "${scenarioName}" deployed to all agents`)
      onScenarioDeployed?.(scenario)
      
      loadDeploymentHistory()
    } catch (error) {
      toast.error('Failed to deploy scenario')
      console.error('Deployment error:', error)
    }
  }

  const handleClearScenario = () => {
    setScenarioName('')
    setScenarioDescription('')
    setBriefing('')
    setObjectives([''])
    setThreatLevel('LOW')
    setLanes([])
    setAssetPositions([])
  }

  const handleEndActiveScenario = async () => {
    if (!activeScenario) return

    try {
      await mConsoleSync.setActiveScenario(null)
      setActiveScenario(null)
      toast.success('Active scenario ended')
    } catch (error) {
      toast.error('Failed to end scenario')
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-destructive text-destructive-foreground'
      case 'HIGH': return 'bg-accent text-accent-foreground'
      case 'MODERATE': return 'bg-amber-700 text-foreground'
      default: return 'bg-primary text-primary-foreground'
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            {isExpanded ? (
              <CaretDown weight="bold" className="text-primary" size={16} />
            ) : (
              <CaretUp weight="bold" className="text-primary" size={16} />
            )}
            <Desktop weight="bold" className="text-primary" size={20} />
            <span className="text-sm tracking-[0.08em] uppercase">M Console - Scenario Creator</span>
          </button>
          <Badge variant="outline" className="text-[9px] px-2 py-0 border-primary text-primary">
            DESKTOP ONLY
          </Badge>
        </div>

        {isExpanded && activeScenario && (
          <div className="bg-primary/10 border border-primary/30 p-3 rounded space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RocketLaunch weight="bold" className="text-primary" size={16} />
                <span className="text-xs font-bold">ACTIVE SCENARIO</span>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleEndActiveScenario}
                className="text-[9px] h-6 px-2"
              >
                END SCENARIO
              </Button>
            </div>
            <div className="text-xs font-bold">{activeScenario.name}</div>
            <div className="text-[10px] text-muted-foreground">{activeScenario.description}</div>
            <div className="flex items-center gap-2">
              <Badge className={`${getThreatColor(activeScenario.threatLevel || 'LOW')} text-[8px] px-1.5 py-0`}>
                {activeScenario.threatLevel}
              </Badge>
              <span className="text-[9px] text-muted-foreground">
                Deployed: {formatTime(activeScenario.deployedAt)}
              </span>
            </div>
          </div>
        )}
      </Card>

      {isExpanded && (
      <Tabs defaultValue="creator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="creator">Scenario Creator</TabsTrigger>
          <TabsTrigger value="history">Deployment History</TabsTrigger>
        </TabsList>

        <TabsContent value="creator" className="space-y-4">
          <Card className="border-primary/30 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Target weight="bold" className="text-primary" size={16} />
              <span className="text-xs tracking-[0.08em] uppercase">Scenario Details</span>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs tracking-[0.08em] uppercase">Scenario Name</Label>
                <Input
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="OPERATION NIGHTFALL"
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs tracking-[0.08em] uppercase">Description</Label>
                <Textarea
                  value={scenarioDescription}
                  onChange={(e) => setScenarioDescription(e.target.value)}
                  placeholder="Brief description of the scenario..."
                  className="text-xs min-h-[60px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs tracking-[0.08em] uppercase">Threat Level</Label>
                <Select value={threatLevel} onValueChange={(val) => setThreatLevel(val as any)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW" className="text-xs">Low</SelectItem>
                    <SelectItem value="MODERATE" className="text-xs">Moderate</SelectItem>
                    <SelectItem value="HIGH" className="text-xs">High</SelectItem>
                    <SelectItem value="CRITICAL" className="text-xs">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs tracking-[0.08em] uppercase">Mission Briefing (Optional)</Label>
                <Textarea
                  value={briefing}
                  onChange={(e) => setBriefing(e.target.value)}
                  placeholder="Detailed mission briefing for agents..."
                  className="text-xs min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs tracking-[0.08em] uppercase">Objectives</Label>
                <div className="space-y-2">
                  {objectives.map((obj, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={obj}
                        onChange={(e) => handleUpdateObjective(index, e.target.value)}
                        placeholder={`Objective ${index + 1}`}
                        className="text-xs flex-1"
                      />
                      {objectives.length > 1 && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveObjective(index)}
                          className="text-[9px] px-2"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    size="sm"
                    onClick={handleAddObjective}
                    className="text-[9px] w-full"
                  >
                    + Add Objective
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-primary/30 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Path weight="bold" className="text-primary" size={16} />
                <span className="text-xs tracking-[0.08em] uppercase">Lanes Configuration</span>
              </div>
              <Button
                size="sm"
                onClick={handleAddLane}
                className="text-[9px] h-6 px-2 bg-primary text-primary-foreground"
              >
                + ADD LANE
              </Button>
            </div>

            {lanes.length === 0 ? (
              <div className="text-[10px] text-muted-foreground text-center py-4 border border-dashed border-border rounded">
                No lanes configured. Click "ADD LANE" to create patrol routes.
              </div>
            ) : (
              <div className="space-y-2">
                {lanes.map((lane, index) => {
                  const startLabel = `${GRID_LABELS[lane.startGrid.y]}${lane.startGrid.x + 1}`
                  const endLabel = `${GRID_LABELS[lane.endGrid.y]}${lane.endGrid.x + 1}`
                  
                  return (
                    <div key={index} className="bg-card border border-border p-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{lane.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[8px] px-1.5 py-0`}>
                            {lane.priority.toUpperCase()}
                          </Badge>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveLane(index)}
                            className="text-[8px] h-5 px-1.5"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {startLabel} → {endLabel} ({lane.assignedAssets.length} assets)
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card className="border-primary/30 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Users weight="bold" className="text-primary" size={16} />
              <span className="text-xs tracking-[0.08em] uppercase">Asset Starting Positions</span>
            </div>

            <div className="space-y-2">
              {assets.map(asset => {
                const position = assetPositions.find(p => p.agentId === asset.agentId)
                const gridLabel = position 
                  ? `${GRID_LABELS[position.gridY]}${position.gridX + 1}`
                  : `${GRID_LABELS[asset.gridY]}${asset.gridX + 1}`

                return (
                  <div key={asset.id} className="flex items-center justify-between bg-card border border-border p-2">
                    <span className="text-xs font-bold">{asset.callsign}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        {gridLabel}
                      </Badge>
                      <Select
                        value={position ? `${position.gridX}-${position.gridY}` : `${asset.gridX}-${asset.gridY}`}
                        onValueChange={(val) => {
                          const [x, y] = val.split('-').map(Number)
                          handleSetAssetPosition(asset.agentId, x, y)
                        }}
                      >
                        <SelectTrigger className="text-[9px] h-6 w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: GRID_SIZE }, (_, y) =>
                            Array.from({ length: GRID_SIZE }, (_, x) => (
                              <SelectItem key={`${x}-${y}`} value={`${x}-${y}`} className="text-[9px]">
                                {GRID_LABELS[y]}{x + 1}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <div className="flex gap-2">
            <Button
              onClick={handleDeployScenario}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!scenarioName || !scenarioDescription}
            >
              <RocketLaunch weight="bold" size={16} className="mr-2" />
              DEPLOY SCENARIO
            </Button>
            <Button
              variant="outline"
              onClick={handleClearScenario}
              className="flex-1"
            >
              CLEAR
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="border-primary/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock weight="bold" className="text-primary" size={16} />
              <span className="text-xs tracking-[0.08em] uppercase">Deployment History</span>
            </div>

            <ScrollArea className="h-[500px]">
              <div className="space-y-2 pr-3">
                {deploymentHistory.length === 0 ? (
                  <div className="text-[10px] text-muted-foreground text-center py-8">
                    No scenarios deployed yet
                  </div>
                ) : (
                  deploymentHistory.map((scenario, index) => (
                    <div key={scenario.id} className="bg-card border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{scenario.name}</span>
                        <Badge className={`${getThreatColor(scenario.threatLevel || 'LOW')} text-[8px] px-1.5 py-0`}>
                          {scenario.threatLevel}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground">{scenario.description}</div>
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div>
                          <div className="text-[8px] text-muted-foreground uppercase">Lanes</div>
                          <div className="text-xs font-bold">{scenario.lanes.length}</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-muted-foreground uppercase">Objectives</div>
                          <div className="text-xs font-bold">{scenario.objectiveList?.length || 0}</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-muted-foreground uppercase">Assets</div>
                          <div className="text-xs font-bold">{scenario.assetPositions.length}</div>
                        </div>
                      </div>
                      <Separator className="bg-border" />
                      <div className="text-[9px] text-muted-foreground">
                        Deployed by {scenario.deployedBy} at {formatTime(scenario.deployedAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
      )}

      <Dialog open={showLaneDialog} onOpenChange={setShowLaneDialog}>
        <DialogContent className="bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-sm tracking-[0.08em] uppercase flex items-center gap-2">
              <Path weight="bold" className="text-primary" size={16} />
              Create Lane
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs tracking-[0.08em] uppercase">Lane Name</Label>
              <Input
                value={newLaneName}
                onChange={(e) => setNewLaneName(e.target.value)}
                placeholder="SECTOR ALPHA PATROL"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs tracking-[0.08em] uppercase">Start Grid</Label>
                <Select
                  value={newLaneStartGrid ? `${newLaneStartGrid.x}-${newLaneStartGrid.y}` : ''}
                  onValueChange={(val) => {
                    const [x, y] = val.split('-').map(Number)
                    setNewLaneStartGrid({ x, y })
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
                  value={newLaneEndGrid ? `${newLaneEndGrid.x}-${newLaneEndGrid.y}` : ''}
                  onValueChange={(val) => {
                    const [x, y] = val.split('-').map(Number)
                    setNewLaneEndGrid({ x, y })
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
              <Label className="text-xs tracking-[0.08em] uppercase">Priority</Label>
              <Select value={newLanePriority} onValueChange={(val) => setNewLanePriority(val as any)}>
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
              <ScrollArea className="h-32 border border-border rounded p-2">
                <div className="space-y-1">
                  {assets.map(asset => (
                    <label key={asset.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-secondary/50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={newLaneAssignedAssets.includes(asset.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewLaneAssignedAssets(prev => [...prev, asset.id])
                          } else {
                            setNewLaneAssignedAssets(prev => prev.filter(id => id !== asset.id))
                          }
                        }}
                        className="w-3 h-3"
                      />
                      <span>{asset.callsign}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveLane}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!newLaneName || !newLaneStartGrid || !newLaneEndGrid || newLaneAssignedAssets.length === 0}
              >
                <CheckCircle weight="bold" size={14} className="mr-1" />
                ADD LANE
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
    </div>
  )
}
