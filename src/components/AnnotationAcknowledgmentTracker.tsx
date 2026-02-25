import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  MapTrifold,
  CheckCircle,
  WarningCircle,
  Clock,
  User,
  Circle,
  Square,
  Polygon,
  MapPin,
  Target,
  Check,
  X,
  ChatCircleDots
} from '@phosphor-icons/react'
import type { MapAnnotation, AnnotationAcknowledgment } from '@/components/HybridTacticalMap'

interface AnnotationAcknowledgmentTrackerProps {
  annotations: MapAnnotation[]
  currentAgentId: string
  currentAgentCallsign: string
  onAcknowledge?: (annotationId: string, response: 'acknowledged' | 'unable' | 'noted', message?: string) => void
  maxHeight?: string
}

export function AnnotationAcknowledgmentTracker({
  annotations,
  currentAgentId,
  currentAgentCallsign,
  onAcknowledge,
  maxHeight = '400px'
}: AnnotationAcknowledgmentTrackerProps) {
  const [selectedAnnotation, setSelectedAnnotation] = useState<MapAnnotation | null>(null)
  const [showAckDialog, setShowAckDialog] = useState(false)
  const [ackResponse, setAckResponse] = useState<'acknowledged' | 'unable' | 'noted'>('acknowledged')
  const [ackMessage, setAckMessage] = useState('')

  const criticalAnnotations = useMemo(() => {
    return annotations.filter(a => a.requiresAck)
  }, [annotations])

  const pendingAnnotations = useMemo(() => {
    return criticalAnnotations.filter(a => {
      const myAck = a.acknowledgments?.find(ack => ack.agentId === currentAgentId)
      return !myAck
    })
  }, [criticalAnnotations, currentAgentId])

  const acknowledgedAnnotations = useMemo(() => {
    return criticalAnnotations.filter(a => {
      const myAck = a.acknowledgments?.find(ack => ack.agentId === currentAgentId)
      return !!myAck
    })
  }, [criticalAnnotations, currentAgentId])

  const getAnnotationIcon = (type: MapAnnotation['type']) => {
    switch (type) {
      case 'circle':
        return <Circle weight="bold" size={14} />
      case 'rectangle':
        return <Square weight="bold" size={14} />
      case 'polygon':
        return <Polygon weight="bold" size={14} />
      case 'marker':
        return <MapPin weight="bold" size={14} />
      default:
        return <Target weight="bold" size={14} />
    }
  }

  const getPriorityColor = (priority?: 'low' | 'normal' | 'high' | 'critical') => {
    switch (priority) {
      case 'critical':
        return 'text-destructive'
      case 'high':
        return 'text-accent'
      case 'normal':
        return 'text-primary'
      default:
        return 'text-muted-foreground'
    }
  }

  const getPriorityBadge = (priority?: 'low' | 'normal' | 'high' | 'critical') => {
    switch (priority) {
      case 'critical':
        return 'bg-destructive text-destructive-foreground'
      case 'high':
        return 'bg-accent text-accent-foreground'
      case 'normal':
        return 'bg-primary text-primary-foreground'
      default:
        return 'bg-secondary text-secondary-foreground'
    }
  }

  const handleAcknowledge = (annotation: MapAnnotation) => {
    setSelectedAnnotation(annotation)
    setAckResponse('acknowledged')
    setAckMessage('')
    setShowAckDialog(true)
  }

  const handleConfirmAcknowledge = () => {
    if (selectedAnnotation && onAcknowledge) {
      onAcknowledge(selectedAnnotation.id, ackResponse, ackMessage || undefined)
    }
    setShowAckDialog(false)
    setSelectedAnnotation(null)
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - timestamp
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getAckStats = (annotation: MapAnnotation) => {
    const total = annotation.acknowledgments?.length || 0
    const acknowledged = annotation.acknowledgments?.filter(a => a.response === 'acknowledged').length || 0
    const unable = annotation.acknowledgments?.filter(a => a.response === 'unable').length || 0
    const noted = annotation.acknowledgments?.filter(a => a.response === 'noted').length || 0
    
    return { total, acknowledged, unable, noted }
  }

  if (criticalAnnotations.length === 0) {
    return null
  }

  return (
    <>
      <Card className="border-primary/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapTrifold weight="bold" className="text-primary" size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Map Acknowledgments</span>
          </div>
          <Badge variant="outline" className="text-[9px] px-2 py-0">
            {pendingAnnotations.length} PENDING
          </Badge>
        </div>

        <Separator className="bg-border" />

        <ScrollArea style={{ maxHeight }}>
          <div className="space-y-3 pr-3">
            {pendingAnnotations.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">
                  Awaiting Your Acknowledgment
                </div>
                {pendingAnnotations.map(annotation => {
                  const stats = getAckStats(annotation)
                  return (
                    <div
                      key={annotation.id}
                      className="border border-border bg-card p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div className={getPriorityColor(annotation.priority)}>
                            {getAnnotationIcon(annotation.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{annotation.label}</div>
                            <div className="text-[10px] text-muted-foreground">
                              By {annotation.createdBy} • {formatTimestamp(annotation.createdAt)}
                            </div>
                          </div>
                        </div>
                        <Badge className={`${getPriorityBadge(annotation.priority)} text-[8px] px-1.5 py-0`}>
                          {annotation.priority?.toUpperCase() || 'NORMAL'}
                        </Badge>
                      </div>

                      {annotation.notes && (
                        <div className="text-[10px] text-muted-foreground pl-6">
                          {annotation.notes}
                        </div>
                      )}

                      {stats.total > 0 && (
                        <div className="text-[9px] text-muted-foreground pl-6">
                          {stats.total} agent{stats.total !== 1 ? 's' : ''} responded
                        </div>
                      )}

                      <div className="flex gap-2 pl-6">
                        <Button
                          size="sm"
                          className="h-7 text-[10px] flex-1"
                          onClick={() => handleAcknowledge(annotation)}
                        >
                          <Check weight="bold" size={12} className="mr-1" />
                          ACKNOWLEDGE
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {acknowledgedAnnotations.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">
                  Acknowledged
                </div>
                {acknowledgedAnnotations.map(annotation => {
                  const myAck = annotation.acknowledgments?.find(ack => ack.agentId === currentAgentId)
                  const stats = getAckStats(annotation)
                  
                  return (
                    <div
                      key={annotation.id}
                      className="border border-border/50 bg-card/50 p-3 space-y-2 opacity-75"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <CheckCircle weight="bold" size={14} className="text-primary" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{annotation.label}</div>
                            <div className="text-[10px] text-muted-foreground">
                              You: {myAck?.response.toUpperCase()} • {myAck && formatTimestamp(myAck.acknowledgedAt)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {myAck?.responseMessage && (
                        <div className="text-[10px] text-muted-foreground pl-6">
                          "{myAck.responseMessage}"
                        </div>
                      )}

                      {stats.total > 1 && (
                        <div className="text-[9px] text-muted-foreground pl-6">
                          {stats.acknowledged} acked • {stats.unable} unable • {stats.noted} noted
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      <Dialog open={showAckDialog} onOpenChange={setShowAckDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Acknowledge Map Annotation</DialogTitle>
          </DialogHeader>

          {selectedAnnotation && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={getPriorityColor(selectedAnnotation.priority)}>
                    {getAnnotationIcon(selectedAnnotation.type)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{selectedAnnotation.label}</div>
                    <div className="text-[10px] text-muted-foreground">
                      By {selectedAnnotation.createdBy}
                    </div>
                  </div>
                </div>

                {selectedAnnotation.notes && (
                  <div className="text-xs text-muted-foreground pl-6">
                    {selectedAnnotation.notes}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-[10px] tracking-[0.08em] uppercase">Response</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      variant={ackResponse === 'acknowledged' ? 'default' : 'outline'}
                      className="h-8 text-[10px]"
                      onClick={() => setAckResponse('acknowledged')}
                    >
                      <Check weight="bold" size={12} className="mr-1" />
                      ACK
                    </Button>
                    <Button
                      size="sm"
                      variant={ackResponse === 'noted' ? 'default' : 'outline'}
                      className="h-8 text-[10px]"
                      onClick={() => setAckResponse('noted')}
                    >
                      <ChatCircleDots weight="bold" size={12} className="mr-1" />
                      NOTED
                    </Button>
                    <Button
                      size="sm"
                      variant={ackResponse === 'unable' ? 'default' : 'outline'}
                      className="h-8 text-[10px]"
                      onClick={() => setAckResponse('unable')}
                    >
                      <X weight="bold" size={12} className="mr-1" />
                      UNABLE
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ack-message" className="text-[10px] tracking-[0.08em] uppercase">
                    Message (Optional)
                  </Label>
                  <Textarea
                    id="ack-message"
                    value={ackMessage}
                    onChange={(e) => setAckMessage(e.target.value)}
                    placeholder="Additional notes or status update..."
                    className="text-xs h-20 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAckDialog(false)}
              className="text-[10px]"
            >
              CANCEL
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmAcknowledge}
              className="text-[10px]"
            >
              CONFIRM
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
