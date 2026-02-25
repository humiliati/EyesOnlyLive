import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  CaretDown, 
  CaretUp,
  Heart,
  BatteryFull,
  WifiHigh,
  CheckCircle,
  WarningCircle,
  XCircle
} from '@phosphor-icons/react'

export interface AssetStatus {
  id: string
  callsign: string
  status: 'operational' | 'degraded' | 'critical' | 'offline'
  heartRate: number
  stressLevel: number
  batteryLevel: number
  signalStrength: number
  lastUpdate: number
  missionReady: boolean
  equipmentStatus: 'green' | 'amber' | 'red'
}

interface AssetStatusBoardProps {
  assets: AssetStatus[]
  maxHeight?: string
  onSelectAsset?: (assetId: string) => void
}

export function AssetStatusBoard({ assets, maxHeight = "400px", onSelectAsset }: AssetStatusBoardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [sortBy, setSortBy] = useState<'status' | 'callsign' | 'readiness'>('status')

  const sortedAssets = [...assets].sort((a, b) => {
    if (sortBy === 'status') {
      const statusOrder = { critical: 0, degraded: 1, operational: 2, offline: 3 }
      return statusOrder[a.status] - statusOrder[b.status]
    } else if (sortBy === 'callsign') {
      return a.callsign.localeCompare(b.callsign)
    } else {
      return (b.missionReady ? 1 : 0) - (a.missionReady ? 1 : 0)
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-primary text-primary-foreground'
      case 'degraded': return 'bg-accent text-accent-foreground'
      case 'critical': return 'bg-destructive text-destructive-foreground'
      case 'offline': return 'bg-muted text-muted-foreground'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  const getEquipmentColor = (status: string) => {
    switch (status) {
      case 'green': return 'text-primary'
      case 'amber': return 'text-accent'
      case 'red': return 'text-destructive'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle weight="fill" size={12} className="text-primary" />
      case 'degraded': return <WarningCircle weight="fill" size={12} className="text-accent" />
      case 'critical': return <XCircle weight="fill" size={12} className="text-destructive" />
      default: return <XCircle weight="fill" size={12} className="text-muted-foreground" />
    }
  }

  const formatTimeSince = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const operationalCount = assets.filter(a => a.status === 'operational').length
  const degradedCount = assets.filter(a => a.status === 'degraded').length
  const criticalCount = assets.filter(a => a.status === 'critical').length
  const offlineCount = assets.filter(a => a.status === 'offline').length

  return (
    <Card className="border-primary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Asset Status</span>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
            {assets.length}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6 p-0"
        >
          {isExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
        </Button>
      </div>

      {isExpanded && (
        <>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center space-y-1">
              <div className="text-lg font-bold tabular-nums text-primary">{operationalCount}</div>
              <div className="text-[8px] text-muted-foreground uppercase">Operational</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-lg font-bold tabular-nums text-accent">{degradedCount}</div>
              <div className="text-[8px] text-muted-foreground uppercase">Degraded</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-lg font-bold tabular-nums text-destructive">{criticalCount}</div>
              <div className="text-[8px] text-muted-foreground uppercase">Critical</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-lg font-bold tabular-nums text-muted-foreground">{offlineCount}</div>
              <div className="text-[8px] text-muted-foreground uppercase">Offline</div>
            </div>
          </div>

          <div className="flex gap-2">
            {(['status', 'callsign', 'readiness'] as const).map((sort) => (
              <Button
                key={sort}
                size="sm"
                variant={sortBy === sort ? "default" : "outline"}
                onClick={() => setSortBy(sort)}
                className="h-6 px-2 text-[8px] uppercase flex-1"
              >
                {sort}
              </Button>
            ))}
          </div>

          <Separator className="bg-border" />

          <ScrollArea style={{ maxHeight }}>
            <div className="space-y-2 pr-3">
              {sortedAssets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No assets available
                </div>
              ) : (
                sortedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="border border-border rounded p-2 space-y-2 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => onSelectAsset?.(asset.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(asset.status)}
                        <span className="text-sm font-bold">{asset.callsign}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(asset.status)} text-[8px] px-1.5 py-0 uppercase`}>
                          {asset.status}
                        </Badge>
                        {asset.missionReady && (
                          <Badge variant="outline" className="text-[7px] px-1 py-0 border-primary text-primary">
                            READY
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Heart weight="bold" size={10} className={asset.heartRate > 120 ? 'text-destructive' : 'text-primary'} />
                          <span className="text-[9px] text-muted-foreground">HR</span>
                          <span className="text-[9px] font-bold tabular-nums ml-auto">{asset.heartRate}</span>
                        </div>
                        <Progress 
                          value={Math.min(100, (asset.heartRate / 180) * 100)} 
                          className="h-1" 
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <WarningCircle weight="bold" size={10} className={asset.stressLevel > 70 ? 'text-destructive' : 'text-primary'} />
                          <span className="text-[9px] text-muted-foreground">Stress</span>
                          <span className="text-[9px] font-bold tabular-nums ml-auto">{asset.stressLevel}%</span>
                        </div>
                        <Progress 
                          value={asset.stressLevel} 
                          className="h-1" 
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <BatteryFull weight="bold" size={10} className={asset.batteryLevel < 20 ? 'text-destructive' : 'text-primary'} />
                          <span className="text-[9px] text-muted-foreground">Battery</span>
                          <span className="text-[9px] font-bold tabular-nums ml-auto">{asset.batteryLevel}%</span>
                        </div>
                        <Progress 
                          value={asset.batteryLevel} 
                          className="h-1" 
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <WifiHigh weight="bold" size={10} className={asset.signalStrength < 30 ? 'text-destructive' : 'text-primary'} />
                          <span className="text-[9px] text-muted-foreground">Signal</span>
                          <span className="text-[9px] font-bold tabular-nums ml-auto">{asset.signalStrength}%</span>
                        </div>
                        <Progress 
                          value={asset.signalStrength} 
                          className="h-1" 
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[8px]">
                      <span className="text-muted-foreground">
                        Updated {formatTimeSince(asset.lastUpdate)}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">EQUIPMENT:</span>
                        <span className={`font-bold ${getEquipmentColor(asset.equipmentStatus)}`}>
                          {asset.equipmentStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </Card>
  )
}
