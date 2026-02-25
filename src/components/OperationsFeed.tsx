import { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar } from '@/components/ui/avatar'
import { 
  Users,
  Target,
  MapPin,
  CheckCircle,
  WarningCircle,
  RadioButton,
  Eye,
  ShieldCheck,
  Crosshair
} from '@phosphor-icons/react'

export interface OpsFeedEntry {
  id: string
  timestamp: number
  agentCallsign: string
  agentId: string
  type: 'status' | 'location' | 'mission' | 'alert' | 'transmission' | 'check-in'
  message: string
  priority?: 'low' | 'normal' | 'high' | 'critical'
}

interface OperationsFeedProps {
  entries: OpsFeedEntry[]
  currentAgentId: string
  maxHeight?: string
}

export function OperationsFeed({ entries, currentAgentId, maxHeight = '400px' }: OperationsFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevEntriesLength = useRef(entries.length)

  useEffect(() => {
    if (entries.length > prevEntriesLength.current && scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
    prevEntriesLength.current = entries.length
  }, [entries])

  const getIcon = (type: OpsFeedEntry['type']) => {
    const iconProps = { size: 14, weight: 'bold' as const }
    
    switch (type) {
      case 'status':
        return <CheckCircle {...iconProps} className="text-primary" />
      case 'alert':
        return <WarningCircle {...iconProps} className="text-destructive" />
      case 'mission':
        return <Target {...iconProps} className="text-primary" />
      case 'location':
        return <MapPin {...iconProps} className="text-primary" />
      case 'transmission':
        return <RadioButton {...iconProps} className="text-primary" />
      case 'check-in':
        return <ShieldCheck {...iconProps} className="text-primary" />
      default:
        return <Eye {...iconProps} className="text-muted-foreground" />
    }
  }

  const getTypeColor = (entry: OpsFeedEntry) => {
    if (entry.priority === 'critical') return 'border-destructive/50'
    if (entry.priority === 'high') return 'border-accent/50'
    if (entry.agentId === currentAgentId) return 'border-primary/70'
    return 'border-border/30'
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toTimeString().slice(0, 8)
  }

  const formatRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h`
  }

  const getAgentColor = (agentId: string) => {
    const colors = [
      'oklch(0.75 0.18 145)',
      'oklch(0.75 0.16 75)',
      'oklch(0.70 0.20 200)',
      'oklch(0.75 0.15 300)',
      'oklch(0.70 0.18 50)',
    ]
    const hash = agentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <Card className="border-primary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Blue Team Ops</span>
        </div>
        <Badge variant="outline" className="text-[9px] px-2 py-0 border-primary text-primary">
          {entries.length} EVENTS
        </Badge>
      </div>

      <ScrollArea ref={scrollRef} style={{ height: maxHeight }} className="pr-3">
        <div className="space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-[10px] tracking-wider">
              NO TEAM ACTIVITY
            </div>
          ) : (
            entries.map((entry, index) => {
              const isCurrentAgent = entry.agentId === currentAgentId
              
              return (
                <div
                  key={entry.id}
                  className={`border-l-2 ${getTypeColor(entry)} pl-3 pb-2 ${
                    index === entries.length - 1 ? '' : 'border-b border-border/30 mb-2'
                  } ${isCurrentAgent ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border"
                        style={{ 
                          backgroundColor: `${getAgentColor(entry.agentId)}20`,
                          borderColor: getAgentColor(entry.agentId),
                          color: getAgentColor(entry.agentId)
                        }}
                      >
                        {entry.agentCallsign.split('-')[1] || entry.agentCallsign.charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {getIcon(entry.type)}
                          <div className="text-[10px] font-bold tracking-wider truncate">
                            {entry.agentCallsign}
                            {isCurrentAgent && (
                              <span className="ml-1 text-primary">(YOU)</span>
                            )}
                          </div>
                        </div>
                        <div className="text-[9px] text-muted-foreground tabular-nums shrink-0">
                          {formatRelativeTime(entry.timestamp)}
                        </div>
                      </div>
                      <div className="text-[11px] leading-tight break-words">
                        {entry.message}
                      </div>
                      <div className="text-[9px] text-muted-foreground/70 tabular-nums font-mono">
                        {formatTime(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
