import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Check } from '@phosphor-icons/react'

export interface PingMessage {
  id: string
  timestamp: number
  message: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  acknowledged: boolean
}

interface MPingProps {
  ping: PingMessage | null
  onAcknowledge: (pingId: string) => void
}

export function MPing({ ping, onAcknowledge }: MPingProps) {
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
      
      <Button
        onClick={() => onAcknowledge(ping.id)}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wider"
        size="sm"
      >
        <Check weight="bold" size={16} className="mr-1" />
        ACKNOWLEDGE
      </Button>
    </Card>
  )
}
