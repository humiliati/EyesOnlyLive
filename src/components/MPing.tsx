import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, Warning, XCircle } from '@phosphor-icons/react'

export interface PingMessage {
  id: string
  timestamp: number
  message: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  acknowledged: boolean
  broadcastId?: string
}

interface MPingProps {
  ping: PingMessage | null
  onAcknowledge: (pingId: string, response?: 'acknowledged' | 'unable' | 'negative', message?: string) => void
}

export function MPing({ ping, onAcknowledge }: MPingProps) {
  const [showOptions, setShowOptions] = useState(false)

  if (!ping || ping.acknowledged) return null

  const getPriorityColor = () => {
    switch (ping.priority) {
      case 'critical':
        return 'border-destructive bg-destructive/10'
      case 'high':
        return 'border-accent bg-accent/10'
      case 'normal':
        return 'border-primary bg-primary/10'
      default:
        return 'border-muted bg-muted/10'
    }
  }

  const getPriorityBadge = () => {
    switch (ping.priority) {
      case 'critical':
        return 'bg-destructive text-destructive-foreground'
      case 'high':
        return 'bg-accent text-accent-foreground'
      case 'normal':
        return 'bg-primary text-primary-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toTimeString().slice(0, 8)
  }

  return (
    <Card className={`${getPriorityColor()} p-4 space-y-3 animate-pulse border-2`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          <Bell weight="fill" className={ping.priority === 'critical' || ping.priority === 'high' ? 'text-destructive' : 'text-primary'} size={18} />
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs tracking-[0.08em] uppercase font-bold">INCOMING FROM M</span>
              <Badge className={`${getPriorityBadge()} text-[9px] px-2 py-0`}>
                {ping.priority.toUpperCase()}
              </Badge>
            </div>
            <div className="text-sm leading-tight">{ping.message}</div>
            <div className="text-[9px] text-muted-foreground tabular-nums font-mono">
              {formatTime(ping.timestamp)}
            </div>
          </div>
        </div>
      </div>
      
      {!showOptions ? (
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => {
              onAcknowledge(ping.id, 'acknowledged')
              setShowOptions(false)
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wider"
            size="sm"
          >
            <Check weight="bold" size={16} className="mr-1" />
            ACKNOWLEDGE
          </Button>
          <Button
            onClick={() => setShowOptions(true)}
            variant="outline"
            className="font-bold tracking-wider"
            size="sm"
          >
            MORE OPTIONS
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Select response:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                onAcknowledge(ping.id, 'acknowledged')
                setShowOptions(false)
              }}
              className="text-[9px] h-8"
            >
              <Check weight="bold" size={12} className="mr-1" />
              ACK
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onAcknowledge(ping.id, 'unable', 'Unable to comply')
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
                onAcknowledge(ping.id, 'negative', 'Negative')
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
      )}
    </Card>
  )
}
