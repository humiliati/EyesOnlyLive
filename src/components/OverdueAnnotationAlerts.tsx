import { useEffect, useState, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Warning, 
  Clock, 
  MapPin,
  Bell,
  BellSlash,
  CheckCircle,
  XCircle,
  Eye
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { soundGenerator } from '@/lib/sounds'
import type { MapAnnotation } from '@/components/HybridTacticalMap'
import type { AssetLocation } from '@/components/GlobalAssetMap'

interface OverdueAnnotationAlertsProps {
  annotations: MapAnnotation[]
  assets: AssetLocation[]
  currentAgentId: string
  currentAgentCallsign: string
  onAcknowledge?: (annotationId: string, response: 'acknowledged' | 'unable' | 'noted', message?: string) => void
  maxHeight?: string
}

interface OverdueAnnotation {
  annotation: MapAnnotation
  overdueMs: number
  totalTargets: number
  pendingAgents: string[]
  isCurrentAgentPending: boolean
  severity: 'warning' | 'critical'
}

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000

export function OverdueAnnotationAlerts({
  annotations,
  assets,
  currentAgentId,
  currentAgentCallsign,
  onAcknowledge,
  maxHeight = "300px"
}: OverdueAnnotationAlertsProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const alertedIdsRef = useRef<Set<string>>(new Set())
  const lastAlertTimeRef = useRef<number>(0)

  const now = Date.now()

  const overdueAnnotations: OverdueAnnotation[] = annotations
    .filter(a => a.requiresAck && !dismissedIds.has(a.id))
    .map(annotation => {
      const timeoutMs = annotation.autoExpireMs || DEFAULT_TIMEOUT_MS
      const elapsedMs = now - annotation.createdAt
      const overdueMs = elapsedMs - timeoutMs
      
      const targetAgentIds = annotation.targetAgents && annotation.targetAgents.length > 0
        ? annotation.targetAgents
        : assets.map(asset => asset.agentId)
      
      const acknowledgedAgentIds = new Set(
        (annotation.acknowledgments || []).map(ack => ack.agentId)
      )
      
      const pendingAgents = targetAgentIds.filter(
        agentId => !acknowledgedAgentIds.has(agentId)
      )
      
      const isCurrentAgentPending = pendingAgents.includes(currentAgentId)
      
      const severity: 'warning' | 'critical' = overdueMs > 5 * 60 * 1000 ? 'critical' : 'warning'
      
      return {
        annotation,
        overdueMs,
        totalTargets: targetAgentIds.length,
        pendingAgents,
        isCurrentAgentPending,
        severity
      }
    })
    .filter(item => item.overdueMs > 0)
    .sort((a, b) => {
      if (a.isCurrentAgentPending !== b.isCurrentAgentPending) {
        return a.isCurrentAgentPending ? -1 : 1
      }
      if (a.severity !== b.severity) {
        return a.severity === 'critical' ? -1 : 1
      }
      return b.overdueMs - a.overdueMs
    })

  const criticalOverdueCount = overdueAnnotations.filter(a => a.severity === 'critical').length
  const warningOverdueCount = overdueAnnotations.filter(a => a.severity === 'warning').length
  const currentAgentOverdueCount = overdueAnnotations.filter(a => a.isCurrentAgentPending).length

  const playOverdueAlert = useCallback((severity: 'warning' | 'critical') => {
    if (isMuted) return
    
    soundGenerator.playOverdueAlert(severity)
  }, [isMuted])

  useEffect(() => {
    const criticalOverdue = overdueAnnotations.filter(a => a.severity === 'critical')
    
    criticalOverdue.forEach(item => {
      const alertId = `${item.annotation.id}-critical`
      
      if (!alertedIdsRef.current.has(alertId)) {
        const timeSinceLastAlert = now - lastAlertTimeRef.current
        
        if (timeSinceLastAlert > 10000) {
          playOverdueAlert('critical')
          lastAlertTimeRef.current = now
          
          const agentStatus = item.isCurrentAgentPending 
            ? 'YOUR ACKNOWLEDGMENT REQUIRED' 
            : `${item.pendingAgents.length} agent(s) pending`
          
          toast.error(`OVERDUE ANNOTATION: ${item.annotation.label}`, {
            description: agentStatus,
            duration: 8000
          })
        }
        
        alertedIdsRef.current.add(alertId)
      }
    })
    
    const newWarnings = overdueAnnotations.filter(
      a => a.severity === 'warning' && a.isCurrentAgentPending
    )
    
    newWarnings.forEach(item => {
      const alertId = `${item.annotation.id}-warning`
      
      if (!alertedIdsRef.current.has(alertId)) {
        const timeSinceLastAlert = now - lastAlertTimeRef.current
        
        if (timeSinceLastAlert > 15000) {
          playOverdueAlert('warning')
          lastAlertTimeRef.current = now
          
          toast.warning(`Overdue Annotation: ${item.annotation.label}`, {
            description: 'Acknowledgment required',
            duration: 6000
          })
        }
        
        alertedIdsRef.current.add(alertId)
      }
    })
  }, [overdueAnnotations.length, now, playOverdueAlert])

  useEffect(() => {
    const interval = setInterval(() => {
      const criticalPending = overdueAnnotations.filter(
        a => a.severity === 'critical' && a.isCurrentAgentPending
      )
      
      if (criticalPending.length > 0 && !isMuted) {
        const timeSinceLastAlert = Date.now() - lastAlertTimeRef.current
        if (timeSinceLastAlert > 30000) {
          playOverdueAlert('critical')
          lastAlertTimeRef.current = Date.now()
        }
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [overdueAnnotations, isMuted, playOverdueAlert])

  const handleDismiss = (annotationId: string) => {
    setDismissedIds(prev => new Set(prev).add(annotationId))
    toast.success('Alert dismissed', {
      description: 'Annotation moved to background monitoring',
      duration: 3000
    })
  }

  const handleQuickAcknowledge = (annotationId: string) => {
    if (onAcknowledge) {
      onAcknowledge(annotationId, 'acknowledged')
    }
  }

  const formatOverdueTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60
      return `${hours}h ${remainingMinutes}m overdue`
    } else {
      return `${minutes}m overdue`
    }
  }

  const getProgressValue = (overdueMs: number, severity: 'warning' | 'critical'): number => {
    if (severity === 'critical') {
      const maxOverdue = 15 * 60 * 1000
      return Math.min(100, (overdueMs / maxOverdue) * 100)
    } else {
      const maxOverdue = 5 * 60 * 1000
      return Math.min(100, (overdueMs / maxOverdue) * 100)
    }
  }

  if (overdueAnnotations.length === 0) {
    return null
  }

  return (
    <Card className="border-accent bg-accent/5 p-4 space-y-3 animate-pulse-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Warning weight="bold" className="text-accent animate-pulse" size={18} />
          <span className="text-sm font-bold tracking-wider uppercase">Overdue Acknowledgments</span>
        </div>
        <div className="flex items-center gap-2">
          {criticalOverdueCount > 0 && (
            <Badge variant="destructive" className="text-[10px] px-2 py-0.5">
              {criticalOverdueCount} CRITICAL
            </Badge>
          )}
          {warningOverdueCount > 0 && (
            <Badge className="bg-accent text-accent-foreground text-[10px] px-2 py-0.5">
              {warningOverdueCount} WARNING
            </Badge>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMuted(!isMuted)}
            className="h-7 w-7 p-0"
          >
            {isMuted ? (
              <BellSlash weight="bold" size={14} />
            ) : (
              <Bell weight="bold" size={14} />
            )}
          </Button>
        </div>
      </div>

      {currentAgentOverdueCount > 0 && (
        <div className="flex items-center gap-2 p-2 rounded bg-destructive/20 border border-destructive/30">
          <Warning weight="bold" className="text-destructive" size={16} />
          <span className="text-xs font-medium text-destructive">
            You have {currentAgentOverdueCount} pending acknowledgment{currentAgentOverdueCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <ScrollArea style={{ height: maxHeight }} className="pr-3">
        <div className="space-y-2">
          {overdueAnnotations.map((item) => {
            const getPriorityColor = () => {
              if (item.annotation.priority === 'critical') return 'text-destructive'
              if (item.annotation.priority === 'high') return 'text-accent'
              return 'text-primary'
            }

            const getTypeIcon = () => {
              switch (item.annotation.type) {
                case 'danger':
                  return <Warning weight="bold" className={getPriorityColor()} size={14} />
                case 'objective':
                  return <CheckCircle weight="bold" className={getPriorityColor()} size={14} />
                case 'waypoint':
                  return <MapPin weight="bold" className={getPriorityColor()} size={14} />
                case 'intel':
                  return <Eye weight="bold" className={getPriorityColor()} size={14} />
                case 'asset':
                  return <CheckCircle weight="bold" className={getPriorityColor()} size={14} />
                default:
                  return <MapPin weight="bold" className={getPriorityColor()} size={14} />
              }
            }

            return (
              <Card 
                key={item.annotation.id}
                className={`p-3 space-y-2 ${
                  item.isCurrentAgentPending 
                    ? 'border-destructive bg-destructive/5' 
                    : item.severity === 'critical'
                    ? 'border-accent bg-accent/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    {getTypeIcon()}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{item.annotation.label}</span>
                        {item.isCurrentAgentPending && (
                          <Badge variant="destructive" className="text-[8px] px-1.5 py-0">
                            YOU
                          </Badge>
                        )}
                      </div>
                      {item.annotation.description && (
                        <div className="text-[10px] text-muted-foreground">
                          {item.annotation.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge 
                    className={`text-[9px] px-2 py-0.5 ${
                      item.severity === 'critical' 
                        ? 'bg-destructive text-destructive-foreground' 
                        : 'bg-accent text-accent-foreground'
                    }`}
                  >
                    {item.severity.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock weight="bold" size={10} />
                      <span>{formatOverdueTime(item.overdueMs)}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {item.pendingAgents.length} / {item.totalTargets} pending
                    </span>
                  </div>
                  <Progress 
                    value={getProgressValue(item.overdueMs, item.severity)} 
                    className={`h-1 ${
                      item.severity === 'critical' 
                        ? '[&>div]:bg-destructive' 
                        : '[&>div]:bg-accent'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {item.isCurrentAgentPending ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleQuickAcknowledge(item.annotation.id)}
                        className="flex-1 h-7 text-[10px]"
                      >
                        <CheckCircle weight="bold" size={12} className="mr-1" />
                        ACKNOWLEDGE NOW
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDismiss(item.annotation.id)}
                        className="h-7 px-2"
                      >
                        <XCircle weight="bold" size={12} />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(item.annotation.id)}
                      className="w-full h-7 text-[10px]"
                    >
                      Dismiss Alert
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
}
