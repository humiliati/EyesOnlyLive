import { useState, useEffect, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { gameStateSync, type PlayerTelemetry } from '@/lib/gameStateSync'
import { toast } from 'sonner'
import { 
  Users, 
  MapPin, 
  Heart,
  CaretDown,
  CaretRight,
  PencilSimple,
  FloppyDisk,
  X,
  Eye,
  EyeSlash,
  Plus,
  Trash,
  CheckCircle,
  WarningCircle
} from '@phosphor-icons/react'

export interface RedTeamPlayer {
  playerId: string
  callsign: string
  gpsEnabled: boolean
  telemetryEnabled: boolean
  addedAt: number
  lastSeen?: number
  status: 'active' | 'inactive' | 'pending'
}

interface RedTeamManagementPanelProps {
  maxHeight?: string
}

export function RedTeamManagementPanel({ maxHeight = '500px' }: RedTeamManagementPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [players, setPlayers] = useKV<RedTeamPlayer[]>('red-team-players', [])
  const [telemetry, setTelemetry] = useState<PlayerTelemetry[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCallsign, setEditCallsign] = useState('')
  const [newPlayerId, setNewPlayerId] = useState('')
  const [newCallsign, setNewCallsign] = useState('')

  useEffect(() => {
    const loadTelemetry = async () => {
      const allTelemetry = await gameStateSync.getAllTelemetry()
      const redTeamOnly = allTelemetry.filter(t => t.playerTeam === 'red')
      setTelemetry(redTeamOnly)

      setPlayers((currentPlayers) => {
        return (currentPlayers || []).map(player => {
          const telemetryData = redTeamOnly.find(t => t.playerId === player.playerId)
          if (telemetryData) {
            return {
              ...player,
              lastSeen: telemetryData.lastUpdate,
              status: 'active' as const
            }
          }
          return {
            ...player,
            status: player.lastSeen && (Date.now() - player.lastSeen < 60000) ? 'inactive' as const : 'pending' as const
          }
        })
      })
    }

    loadTelemetry()

    const unsubscribe = gameStateSync.onTelemetryUpdate((update) => {
      if (update.playerTeam === 'red') {
        setTelemetry((current) => {
          const filtered = current.filter(t => t.playerId !== update.playerId)
          return [update, ...filtered]
        })

        setPlayers((currentPlayers) => {
          return (currentPlayers || []).map(player => {
            if (player.playerId === update.playerId) {
              return {
                ...player,
                lastSeen: update.lastUpdate,
                status: 'active' as const
              }
            }
            return player
          })
        })
      }
    })

    const refreshInterval = setInterval(loadTelemetry, 5000)

    return () => {
      unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [setPlayers])

  const handleAddPlayer = useCallback(() => {
    if (!newPlayerId.trim() || !newCallsign.trim()) {
      toast.error('Player ID and Callsign are required')
      return
    }

    const exists = (players || []).find(p => p.playerId === newPlayerId.trim())
    if (exists) {
      toast.error('Player ID already exists')
      return
    }

    const newPlayer: RedTeamPlayer = {
      playerId: newPlayerId.trim(),
      callsign: newCallsign.trim().toUpperCase(),
      gpsEnabled: true,
      telemetryEnabled: true,
      addedAt: Date.now(),
      status: 'pending'
    }

    setPlayers((current) => [...(current || []), newPlayer])
    setNewPlayerId('')
    setNewCallsign('')
    toast.success(`Red Team player ${newPlayer.callsign} added`)
  }, [newPlayerId, newCallsign, players, setPlayers])

  const handleRemovePlayer = useCallback((playerId: string) => {
    const player = (players || []).find(p => p.playerId === playerId)
    setPlayers((current) => (current || []).filter(p => p.playerId !== playerId))
    if (player) {
      toast.success(`${player.callsign} removed from Red Team roster`)
    }
  }, [players, setPlayers])

  const handleStartEdit = useCallback((playerId: string, currentCallsign: string) => {
    setEditingId(playerId)
    setEditCallsign(currentCallsign)
  }, [])

  const handleSaveEdit = useCallback((playerId: string) => {
    if (!editCallsign.trim()) {
      toast.error('Callsign cannot be empty')
      return
    }

    setPlayers((current) => {
      return (current || []).map(p => 
        p.playerId === playerId ? { ...p, callsign: editCallsign.trim().toUpperCase() } : p
      )
    })

    toast.success('Callsign updated')
    setEditingId(null)
    setEditCallsign('')
  }, [editCallsign, setPlayers])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditCallsign('')
  }, [])

  const handleToggleGPS = useCallback((playerId: string) => {
    setPlayers((current) => {
      return (current || []).map(p => {
        if (p.playerId === playerId) {
          const newGpsState = !p.gpsEnabled
          toast.success(`GPS ${newGpsState ? 'enabled' : 'disabled'} for ${p.callsign}`)
          return { ...p, gpsEnabled: newGpsState }
        }
        return p
      })
    })
  }, [setPlayers])

  const handleToggleTelemetry = useCallback((playerId: string) => {
    setPlayers((current) => {
      return (current || []).map(p => {
        if (p.playerId === playerId) {
          const newTelemetryState = !p.telemetryEnabled
          toast.success(`Telemetry ${newTelemetryState ? 'enabled' : 'disabled'} for ${p.callsign}`)
          return { ...p, telemetryEnabled: newTelemetryState }
        }
        return p
      })
    })
  }, [setPlayers])

  const getPlayerTelemetry = (playerId: string): PlayerTelemetry | undefined => {
    return telemetry.find(t => t.playerId === playerId)
  }

  const getStatusBadge = (status: RedTeamPlayer['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="text-[9px] px-2 py-0 bg-primary text-primary-foreground">ACTIVE</Badge>
      case 'inactive':
        return <Badge variant="outline" className="text-[9px] px-2 py-0 border-muted-foreground text-muted-foreground">INACTIVE</Badge>
      case 'pending':
        return <Badge variant="outline" className="text-[9px] px-2 py-0 border-accent text-accent">PENDING</Badge>
    }
  }

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

  const activeCount = (players || []).filter(p => p.status === 'active').length
  const totalCount = (players || []).length

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
          <span className="text-xs tracking-[0.08em] uppercase font-bold">Red Team Management</span>
        </div>
        <Badge variant="outline" className="text-[9px] px-2 py-0 border-destructive text-destructive">
          {activeCount} / {totalCount} ACTIVE
        </Badge>
      </div>

      {!isCollapsed && (
        <>
          <Separator className="bg-border" />
          
          <div className="p-4 space-y-4 bg-muted/20">
            <div className="space-y-2">
              <Label className="text-xs tracking-wider uppercase text-muted-foreground">Add New Red Team Player</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Player ID"
                  value={newPlayerId}
                  onChange={(e) => setNewPlayerId(e.target.value)}
                  className="text-xs h-8"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPlayerId.trim() && newCallsign.trim()) {
                      handleAddPlayer()
                    }
                  }}
                />
                <Input
                  placeholder="Callsign"
                  value={newCallsign}
                  onChange={(e) => setNewCallsign(e.target.value)}
                  className="text-xs h-8"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPlayerId.trim() && newCallsign.trim()) {
                      handleAddPlayer()
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleAddPlayer}
                  disabled={!newPlayerId.trim() || !newCallsign.trim()}
                  className="h-8 px-3"
                >
                  <Plus weight="bold" size={14} />
                </Button>
              </div>
            </div>

            <Alert className="border-destructive/30 bg-destructive/5">
              <WarningCircle weight="bold" className="text-destructive" size={16} />
              <AlertDescription className="text-[10px]">
                Red Team players must log in at flapsandseals.com to begin transmitting telemetry. GPS tracking will appear on all tactical maps when enabled.
              </AlertDescription>
            </Alert>
          </div>

          <Separator className="bg-border" />

          <ScrollArea style={{ maxHeight }} className="p-4">
            {(players || []).length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No Red Team players configured
              </div>
            ) : (
              <div className="space-y-3">
                {(players || []).map((player) => {
                  const playerTelemetry = getPlayerTelemetry(player.playerId)
                  const isEditing = editingId === player.playerId

                  return (
                    <Card 
                      key={player.playerId} 
                      className={`p-3 space-y-2 ${
                        player.status === 'active' ? 'border-destructive/30' : 'border-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editCallsign}
                                onChange={(e) => setEditCallsign(e.target.value)}
                                className="text-sm h-7 font-bold"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveEdit(player.playerId)
                                  } else if (e.key === 'Escape') {
                                    handleCancelEdit()
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveEdit(player.playerId)}
                                className="h-7 w-7 p-0"
                              >
                                <FloppyDisk weight="bold" size={14} className="text-primary" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                className="h-7 w-7 p-0"
                              >
                                <X weight="bold" size={14} className="text-muted-foreground" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="font-bold text-sm text-destructive">{player.callsign}</div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEdit(player.playerId, player.callsign)}
                                className="h-6 w-6 p-0"
                              >
                                <PencilSimple weight="bold" size={12} className="text-muted-foreground" />
                              </Button>
                            </div>
                          )}
                          <div className="text-[10px] text-muted-foreground font-mono">{player.playerId}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(player.status)}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemovePlayer(player.playerId)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash weight="bold" size={12} className="text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`gps-${player.playerId}`} className="text-[10px] flex items-center gap-1">
                            <MapPin weight="bold" size={12} className="text-primary" />
                            GPS Tracking
                          </Label>
                          <Switch
                            id={`gps-${player.playerId}`}
                            checked={player.gpsEnabled}
                            onCheckedChange={() => handleToggleGPS(player.playerId)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor={`telemetry-${player.playerId}`} className="text-[10px] flex items-center gap-1">
                            <Heart weight="bold" size={12} className="text-primary" />
                            Telemetry
                          </Label>
                          <Switch
                            id={`telemetry-${player.playerId}`}
                            checked={player.telemetryEnabled}
                            onCheckedChange={() => handleToggleTelemetry(player.playerId)}
                          />
                        </div>
                      </div>

                      {playerTelemetry && player.gpsEnabled && (
                        <>
                          <Separator />
                          <div className="space-y-2 bg-muted/20 p-2 rounded">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] tracking-wider uppercase text-muted-foreground">Current Location</span>
                              <span className="text-[9px] text-muted-foreground">{getTimeSinceUpdate(playerTelemetry.lastUpdate)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-[10px] font-mono tabular-nums">
                                  {formatCoordinate(playerTelemetry.latitude, 4)}°N
                                </div>
                                <div className="text-[10px] font-mono tabular-nums">
                                  {formatCoordinate(Math.abs(playerTelemetry.longitude), 4)}°W
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[9px]">
                                <div>
                                  <div className="text-muted-foreground">Alt</div>
                                  <div className="font-bold">{Math.round(playerTelemetry.altitude)}m</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Spd</div>
                                  <div className="font-bold">{playerTelemetry.speed.toFixed(1)}m/s</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {playerTelemetry && player.telemetryEnabled && (
                        <>
                          <div className="grid grid-cols-4 gap-2 text-[9px] bg-muted/20 p-2 rounded">
                            <div>
                              <div className="text-muted-foreground">HR</div>
                              <div className="font-bold">{Math.round(playerTelemetry.heartRate)} BPM</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">O₂</div>
                              <div className="font-bold">{Math.round(playerTelemetry.bloodOxygen)}%</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Stress</div>
                              <div className="font-bold">{Math.round(playerTelemetry.stressLevel)}%</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Temp</div>
                              <div className="font-bold">{playerTelemetry.temperature.toFixed(1)}°C</div>
                            </div>
                          </div>
                        </>
                      )}

                      {player.lastSeen && (
                        <div className="text-[9px] text-muted-foreground text-right">
                          Added {new Date(player.addedAt).toLocaleString()}
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </>
      )}
    </Card>
  )
}
