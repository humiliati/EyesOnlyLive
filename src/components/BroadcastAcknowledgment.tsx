import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  Clock, 
  XCircle,
  RadioButton,
  Eye,
  Warning
} from '@phosphor-icons/react'

export interface BroadcastAcknowledgment {
  broadcastId: string
  agentId: string
  agentCallsign: string
  acknowledgedAt: number
  response: 'acknowledged' | 'unable' | 'negative'
  responseMessage?: string
  receivedAt: number
}

export interface TrackedBroadcast {
  id: string
  type: 'scenario-deploy' | 'lane-update' | 'dispatch-command' | 'm-ping' | 'general'
  message: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  issuedBy: string
  issuedAt: number
  targetAgents: string[]
  acknowledgments: BroadcastAcknowledgment[]
  requiresAck: boolean
  autoExpireMs?: number
}

interface BroadcastAcknowledgmentProps {
  broadcasts: TrackedBroadcast[]
  onViewDetails?: (broadcastId: string) => void
  maxHeight?: string
}

export function BroadcastAcknowledgmentTracker({ 
  broadcasts, 
  onViewDetails,
  maxHeight = '400px' 
}: BroadcastAcknowledgmentProps) {
  const [expandedBroadcast, setExpandedBroadcast] = useState<string | null>(null)

  const getAcknowledgmentStats = (broadcast: TrackedBroadcast) => {
    const total = broadcast.targetAgents.length
    const acknowledged = broadcast.acknowledgments.filter(a => a.response === 'acknowledged').length
    const unable = broadcast.acknowledgments.filter(a => a.response === 'unable').length
    const negative = broadcast.acknowledgments.filter(a => a.response === 'negative').length
    const pending = total - broadcast.acknowledgments.length
    
    return { total, acknowledged, unable, negative, pending }
  }

  const getAcknowledgmentProgress = (broadcast: TrackedBroadcast) => {
    const stats = getAcknowledgmentStats(broadcast)
    if (stats.total === 0) return 100
    return (broadcast.acknowledgments.length / stats.total) * 100
  }

  const isExpired = (broadcast: TrackedBroadcast) => {
    if (!broadcast.autoExpireMs) return false
    return Date.now() > broadcast.issuedAt + broadcast.autoExpireMs
  }

  const getBroadcastStatus = (broadcast: TrackedBroadcast): 'complete' | 'partial' | 'pending' | 'expired' => {
    if (isExpired(broadcast)) return 'expired'
    const stats = getAcknowledgmentStats(broadcast)
    if (stats.pending === 0) return 'complete'
    if (stats.acknowledged > 0 || stats.unable > 0 || stats.negative > 0) return 'partial'
    return 'pending'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-primary'
      case 'partial': return 'text-accent'
      case 'pending': return 'text-muted-foreground'
      case 'expired': return 'text-destructive'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle weight="bold" size={16} />
      case 'partial': return <Clock weight="bold" size={16} />
      case 'pending': return <RadioButton weight="bold" size={16} />
      case 'expired': return <XCircle weight="bold" size={16} />
      default: return <RadioButton weight="bold" size={16} />
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive'
      case 'high': return 'default'
      case 'normal': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDuration = (startTime: number, endTime?: number) => {
    const duration = (endTime || Date.now()) - startTime
    const seconds = Math.floor(duration / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  const sortedBroadcasts = [...broadcasts].sort((a, b) => b.issuedAt - a.issuedAt)

  return (
    <Card className="border-primary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Broadcast Tracking</span>
        </div>
        <Badge variant="outline" className="text-[9px] px-2 py-0">
          {broadcasts.filter(b => getBroadcastStatus(b) === 'pending' || getBroadcastStatus(b) === 'partial').length} ACTIVE
        </Badge>
      </div>

      <Separator className="bg-border" />

      {sortedBroadcasts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-xs">
          No tracked broadcasts
        </div>
      ) : (
        <ScrollArea style={{ maxHeight }} className="pr-3">
          <div className="space-y-3">
            {sortedBroadcasts.map((broadcast) => {
              const status = getBroadcastStatus(broadcast)
              const stats = getAcknowledgmentStats(broadcast)
              const progress = getAcknowledgmentProgress(broadcast)
              const isExpanded = expandedBroadcast === broadcast.id

              return (
                <div key={broadcast.id} className="border border-border rounded p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <div className={getStatusColor(status)}>
                        {getStatusIcon(status)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="text-xs font-medium">{broadcast.message}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={getPriorityBadgeVariant(broadcast.priority)} className="text-[9px] px-1.5 py-0">
                            {broadcast.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            {broadcast.type.replace('-', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground">
                            {formatTimestamp(broadcast.issuedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedBroadcast(isExpanded ? null : broadcast.id)}
                      className="h-6 px-2 text-[9px]"
                    >
                      {isExpanded ? 'HIDE' : 'DETAILS'}
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-muted-foreground">ACKNOWLEDGMENT STATUS</span>
                      <span className="tabular-nums">
                        {broadcast.acknowledgments.length}/{stats.total} agents
                      </span>
                    </div>
                    <Progress value={progress} className="h-1" />
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                      <div className="flex gap-3">
                        {stats.acknowledged > 0 && (
                          <span className="text-primary">✓ {stats.acknowledged}</span>
                        )}
                        {stats.unable > 0 && (
                          <span className="text-accent">⊘ {stats.unable}</span>
                        )}
                        {stats.negative > 0 && (
                          <span className="text-destructive">✗ {stats.negative}</span>
                        )}
                        {stats.pending > 0 && (
                          <span className="text-muted-foreground">○ {stats.pending}</span>
                        )}
                      </div>
                      {status !== 'expired' && (
                        <span>{formatDuration(broadcast.issuedAt)}</span>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <>
                      <Separator className="bg-border" />
                      <div className="space-y-2">
                        <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">
                          Agent Responses
                        </div>
                        <div className="space-y-2">
                          {broadcast.targetAgents.map((agentId) => {
                            const ack = broadcast.acknowledgments.find(a => a.agentId === agentId)
                            const responseTime = ack ? ack.acknowledgedAt - broadcast.issuedAt : null

                            return (
                              <div 
                                key={agentId} 
                                className="flex items-center justify-between text-[10px] py-1 px-2 bg-card/50 rounded"
                              >
                                <div className="flex items-center gap-2">
                                  {ack ? (
                                    ack.response === 'acknowledged' ? (
                                      <CheckCircle weight="fill" className="text-primary" size={12} />
                                    ) : ack.response === 'unable' ? (
                                      <Warning weight="fill" className="text-accent" size={12} />
                                    ) : (
                                      <XCircle weight="fill" className="text-destructive" size={12} />
                                    )
                                  ) : (
                                    <Clock weight="bold" className="text-muted-foreground" size={12} />
                                  )}
                                  <span className="font-mono">
                                    {ack?.agentCallsign || agentId}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {ack && responseTime && (
                                    <span className="text-muted-foreground tabular-nums">
                                      +{formatDuration(broadcast.issuedAt, ack.acknowledgedAt)}
                                    </span>
                                  )}
                                  {ack && ack.responseMessage && (
                                    <span className="text-muted-foreground italic truncate max-w-[120px]">
                                      "{ack.responseMessage}"
                                    </span>
                                  )}
                                  {!ack && (
                                    <span className="text-muted-foreground">Pending...</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {isExpired(broadcast) && (
                    <div className="flex items-center gap-1 text-[9px] text-destructive">
                      <Warning weight="bold" size={10} />
                      <span>EXPIRED - No response received</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </Card>
  )
}

interface BroadcastAcknowledgmentButtonProps {
  broadcastId: string
  broadcastMessage: string
  onAcknowledge: (broadcastId: string, response: 'acknowledged' | 'unable' | 'negative', message?: string) => void
  isAcknowledged?: boolean
  compact?: boolean
}

export function BroadcastAcknowledgmentButton({
  broadcastId,
  broadcastMessage,
  onAcknowledge,
  isAcknowledged = false,
  compact = false
}: BroadcastAcknowledgmentButtonProps) {
  const [showOptions, setShowOptions] = useState(false)

  if (isAcknowledged) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-[9px]' : 'text-xs'}`}>
        <CheckCircle weight="fill" className="text-primary" size={compact ? 12 : 14} />
        <span className="text-primary font-medium">ACKNOWLEDGED</span>
      </div>
    )
  }

  if (!showOptions) {
    return (
      <Button
        size={compact ? "sm" : "default"}
        onClick={() => setShowOptions(true)}
        className="w-full font-bold tracking-wider"
      >
        ACKNOWLEDGE BROADCAST
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-[10px] text-muted-foreground">
        Select response:
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={() => {
            onAcknowledge(broadcastId, 'acknowledged')
            setShowOptions(false)
          }}
          className="text-[9px] h-8"
        >
          <CheckCircle weight="bold" size={12} className="mr-1" />
          ACK
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            onAcknowledge(broadcastId, 'unable', 'Unable to comply')
            setShowOptions(false)
          }}
          className="text-[9px] h-8 border-accent text-accent"
        >
          <Warning weight="bold" size={12} className="mr-1" />
          UNABLE
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            onAcknowledge(broadcastId, 'negative', 'Negative')
            setShowOptions(false)
          }}
          className="text-[9px] h-8 border-destructive text-destructive"
        >
          <XCircle weight="bold" size={12} className="mr-1" />
          NEGATIVE
        </Button>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowOptions(false)}
        className="w-full text-[9px] h-6"
      >
        Cancel
      </Button>
    </div>
  )
}
