import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { 
  ChartBar, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Clock,
  Warning,
  Users,
  Target,
  ArrowsClockwise
} from '@phosphor-icons/react'
import type { MapAnnotation } from '@/components/HybridTacticalMap'
import type { AssetLocation } from '@/components/GlobalAssetMap'

interface AnnotationAckDashboardProps {
  annotations: MapAnnotation[]
  assets: AssetLocation[]
  maxHeight?: string
  onRefresh?: () => void
}

interface AnnotationStats {
  annotation: MapAnnotation
  totalTargets: number
  acknowledged: number
  unable: number
  noted: number
  pending: number
  ackPercentage: number
  isOverdue: boolean
  ageMs: number
}

export function AnnotationAckDashboard({ 
  annotations, 
  assets,
  maxHeight = "500px",
  onRefresh
}: AnnotationAckDashboardProps) {
  const now = Date.now()
  
  const requiresAckAnnotations = annotations.filter(a => a.requiresAck)
  
  const stats: AnnotationStats[] = requiresAckAnnotations.map(annotation => {
    const targetAgents = annotation.targetAgents && annotation.targetAgents.length > 0
      ? annotation.targetAgents
      : assets.map(a => a.agentId)
    
    const acks = annotation.acknowledgments || []
    const acknowledged = acks.filter(a => a.response === 'acknowledged').length
    const unable = acks.filter(a => a.response === 'unable').length
    const noted = acks.filter(a => a.response === 'noted').length
    const pending = targetAgents.length - acks.length
    
    const ackPercentage = targetAgents.length > 0 
      ? (acks.length / targetAgents.length) * 100 
      : 0
    
    const ageMs = now - annotation.createdAt
    const isOverdue = annotation.autoExpireMs 
      ? ageMs > annotation.autoExpireMs 
      : ageMs > 300000
    
    return {
      annotation,
      totalTargets: targetAgents.length,
      acknowledged,
      unable,
      noted,
      pending,
      ackPercentage,
      isOverdue: isOverdue && pending > 0,
      ageMs
    }
  })
  
  const sortedStats = [...stats].sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1
    if (a.pending !== b.pending) return b.pending - a.pending
    return b.annotation.createdAt - a.annotation.createdAt
  })
  
  const totalAnnotations = requiresAckAnnotations.length
  const totalAcksReceived = stats.reduce((sum, s) => sum + (s.acknowledged + s.unable + s.noted), 0)
  const totalPending = stats.reduce((sum, s) => sum + s.pending, 0)
  const overdueCount = stats.filter(s => s.isOverdue).length
  const fullyAckedCount = stats.filter(s => s.pending === 0).length
  
  const overallAckRate = stats.reduce((sum, s) => sum + s.totalTargets, 0) > 0
    ? (totalAcksReceived / stats.reduce((sum, s) => sum + s.totalTargets, 0)) * 100
    : 0
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive text-destructive-foreground'
      case 'high': return 'bg-accent text-accent-foreground'
      case 'normal': return 'bg-primary text-primary-foreground'
      case 'low': return 'bg-muted text-muted-foreground'
      default: return 'bg-primary text-primary-foreground'
    }
  }
  
  const getAnnotationType = (type: string) => {
    switch (type) {
      case 'danger': return { icon: Warning, label: 'DANGER', color: 'text-destructive' }
      case 'objective': return { icon: Target, label: 'OBJECTIVE', color: 'text-accent' }
      case 'waypoint': return { icon: MapPin, label: 'WAYPOINT', color: 'text-primary' }
      case 'intel': return { icon: ChartBar, label: 'INTEL', color: 'text-primary' }
      case 'asset': return { icon: Users, label: 'ASSET', color: 'text-primary' }
      default: return { icon: MapPin, label: 'MARKER', color: 'text-primary' }
    }
  }
  
  const formatAge = (ageMs: number) => {
    const seconds = Math.floor(ageMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }
  
  if (requiresAckAnnotations.length === 0) {
    return (
      <Card className="border-primary/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ChartBar weight="bold" className="text-primary" size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Annotation ACK Dashboard</span>
          </div>
          {onRefresh && (
            <Button size="sm" variant="ghost" onClick={onRefresh} className="h-6 w-6 p-0">
              <ArrowsClockwise weight="bold" size={14} />
            </Button>
          )}
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <MapPin weight="bold" size={32} className="mx-auto mb-2 opacity-30" />
          <div className="text-xs">No annotations requiring acknowledgment</div>
        </div>
      </Card>
    )
  }
  
  return (
    <Card className="border-primary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartBar weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Annotation ACK Dashboard</span>
        </div>
        {onRefresh && (
          <Button size="sm" variant="ghost" onClick={onRefresh} className="h-6 w-6 p-0">
            <ArrowsClockwise weight="bold" size={14} />
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card/50 border-primary/20 p-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin weight="bold" className="text-primary" size={12} />
            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Total Annotations</div>
          </div>
          <div className="text-2xl font-bold tabular-nums">{totalAnnotations}</div>
          <div className="text-[9px] text-muted-foreground mt-1">
            {fullyAckedCount} fully acknowledged
          </div>
        </Card>
        
        <Card className="bg-card/50 border-primary/20 p-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle weight="bold" className="text-primary" size={12} />
            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">ACK Rate</div>
          </div>
          <div className="text-2xl font-bold tabular-nums">{overallAckRate.toFixed(0)}%</div>
          <div className="text-[9px] text-muted-foreground mt-1">
            {totalAcksReceived} of {stats.reduce((sum, s) => sum + s.totalTargets, 0)} responses
          </div>
        </Card>
        
        <Card className="bg-card/50 border-primary/20 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock weight="bold" className="text-muted-foreground" size={12} />
            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Pending</div>
          </div>
          <div className="text-2xl font-bold tabular-nums">{totalPending}</div>
          <div className="text-[9px] text-muted-foreground mt-1">
            awaiting response
          </div>
        </Card>
        
        <Card className="bg-card/50 border-primary/20 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Warning weight="bold" className={overdueCount > 0 ? "text-destructive" : "text-muted-foreground"} size={12} />
            <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Overdue</div>
          </div>
          <div className={`text-2xl font-bold tabular-nums ${overdueCount > 0 ? 'text-destructive' : ''}`}>
            {overdueCount}
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            {overdueCount > 0 ? 'requires attention' : 'all on time'}
          </div>
        </Card>
      </div>
      
      <Separator className="bg-border" />
      
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">
            Detailed Status
          </div>
          <div className="text-[9px] text-muted-foreground tabular-nums">
            {sortedStats.length} item{sortedStats.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
      
      <ScrollArea style={{ maxHeight }}>
        <div className="space-y-2 pr-4">
          {sortedStats.map((stat) => {
            const typeInfo = getAnnotationType(stat.annotation.type)
            const TypeIcon = typeInfo.icon
            
            return (
              <Card 
                key={stat.annotation.id} 
                className={`p-3 space-y-2 border ${
                  stat.isOverdue 
                    ? 'border-destructive/50 bg-destructive/5' 
                    : 'border-primary/20 bg-card/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <TypeIcon weight="bold" className={typeInfo.color} size={12} />
                      <div className="text-xs font-medium truncate">{stat.annotation.label}</div>
                    </div>
                    {stat.annotation.description && (
                      <div className="text-[10px] text-muted-foreground line-clamp-1 mb-2">
                        {stat.annotation.description}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge className={`${getPriorityColor(stat.annotation.priority || 'normal')} text-[8px] px-1.5 py-0`}>
                      {(stat.annotation.priority || 'normal').toUpperCase()}
                    </Badge>
                    {stat.isOverdue && (
                      <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-destructive text-destructive">
                        OVERDUE
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-0.5">
                    <div className="text-[8px] tracking-[0.08em] uppercase text-muted-foreground">Targets</div>
                    <div className="text-sm font-bold tabular-nums">{stat.totalTargets}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <CheckCircle weight="bold" className="text-primary" size={8} />
                      <div className="text-[8px] tracking-[0.08em] uppercase text-muted-foreground">ACK</div>
                    </div>
                    <div className="text-sm font-bold tabular-nums text-primary">{stat.acknowledged}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <XCircle weight="bold" className="text-muted-foreground" size={8} />
                      <div className="text-[8px] tracking-[0.08em] uppercase text-muted-foreground">Unable</div>
                    </div>
                    <div className="text-sm font-bold tabular-nums text-muted-foreground">{stat.unable}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Clock weight="bold" className={stat.pending > 0 ? "text-accent" : "text-muted-foreground"} size={8} />
                      <div className="text-[8px] tracking-[0.08em] uppercase text-muted-foreground">Pending</div>
                    </div>
                    <div className={`text-sm font-bold tabular-nums ${stat.pending > 0 ? 'text-accent' : 'text-muted-foreground'}`}>
                      {stat.pending}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-muted-foreground">Response Rate</span>
                    <span className="tabular-nums font-medium">{stat.ackPercentage.toFixed(0)}%</span>
                  </div>
                  <Progress 
                    value={stat.ackPercentage} 
                    className={`h-1.5 ${stat.isOverdue ? '[&>div]:bg-destructive' : ''}`}
                  />
                </div>
                
                <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock weight="bold" size={8} />
                    <span>Age: {formatAge(stat.ageMs)}</span>
                  </div>
                  <div>By: {stat.annotation.createdBy || 'M-CONSOLE'}</div>
                </div>
                
                {stat.annotation.acknowledgments && stat.annotation.acknowledgments.length > 0 && (
                  <div className="pt-1 space-y-1">
                    <div className="text-[8px] tracking-[0.08em] uppercase text-muted-foreground">Recent Responses:</div>
                    <div className="space-y-0.5">
                      {stat.annotation.acknowledgments.slice(-3).reverse().map((ack, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[9px]">
                          <span className="font-medium">{ack.agentCallsign}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-[7px] px-1 py-0 ${
                              ack.response === 'acknowledged' 
                                ? 'border-primary text-primary' 
                                : ack.response === 'unable'
                                ? 'border-muted-foreground text-muted-foreground'
                                : 'border-accent text-accent'
                            }`}
                          >
                            {ack.response.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
}
