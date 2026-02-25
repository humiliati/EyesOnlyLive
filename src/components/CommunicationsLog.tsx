import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { 
  ChatCircleDots, 
  CaretDown, 
  CaretUp, 
  MagnifyingGlass,
  Download,
  RadioButton,
  ArrowRight,
  ArrowLeft
} from '@phosphor-icons/react'

export interface CommLog {
  id: string
  timestamp: number
  direction: 'incoming' | 'outgoing'
  from: string
  to: string
  message: string
  channel: 'secure' | 'tactical' | 'emergency' | 'broadcast'
  priority: 'low' | 'normal' | 'high' | 'critical'
  encrypted: boolean
  acknowledged: boolean
}

interface CommunicationsLogProps {
  logs: CommLog[]
  maxHeight?: string
  onExport?: () => void
}

export function CommunicationsLog({ logs, maxHeight = "400px", onExport }: CommunicationsLogProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterChannel, setFilterChannel] = useState<string>('all')

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.to.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesChannel = filterChannel === 'all' || log.channel === filterChannel
    return matchesSearch && matchesChannel
  })

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toTimeString().slice(0, 8)
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'secure': return 'bg-primary text-primary-foreground'
      case 'tactical': return 'bg-accent text-accent-foreground'
      case 'emergency': return 'bg-destructive text-destructive-foreground'
      case 'broadcast': return 'bg-secondary text-secondary-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-destructive'
      case 'high': return 'text-accent'
      case 'normal': return 'text-foreground'
      case 'low': return 'text-muted-foreground'
      default: return 'text-foreground'
    }
  }

  return (
    <Card className="border-primary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChatCircleDots weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Comms Log</span>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
            {filteredLogs.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {onExport && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onExport}
              className="h-6 px-2 text-[9px]"
            >
              <Download weight="bold" size={12} className="mr-1" />
              EXPORT
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="space-y-2">
            <div className="relative">
              <MagnifyingGlass
                weight="bold"
                size={12}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-7 pl-7 text-xs bg-secondary/50 border-border"
              />
            </div>

            <div className="flex gap-2">
              {['all', 'secure', 'tactical', 'emergency', 'broadcast'].map((channel) => (
                <Button
                  key={channel}
                  size="sm"
                  variant={filterChannel === channel ? "default" : "outline"}
                  onClick={() => setFilterChannel(channel)}
                  className="h-6 px-2 text-[8px] uppercase"
                >
                  {channel}
                </Button>
              ))}
            </div>
          </div>

          <Separator className="bg-border" />

          <ScrollArea style={{ maxHeight }}>
            <div className="space-y-2 pr-3">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No communications logged
                </div>
              ) : (
                filteredLogs.map((log, index) => {
                  const showDateDivider = index === 0 || 
                    formatDate(log.timestamp) !== formatDate(filteredLogs[index - 1].timestamp)

                  return (
                    <div key={log.id}>
                      {showDateDivider && (
                        <div className="text-[9px] text-muted-foreground tracking-wider uppercase py-2">
                          {formatDate(log.timestamp)}
                        </div>
                      )}
                      
                      <div className={`border rounded p-2 space-y-1.5 ${
                        log.direction === 'incoming' 
                          ? 'border-primary/30 bg-primary/5' 
                          : 'border-secondary/50 bg-secondary/5'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono tabular-nums ${getPriorityColor(log.priority)}`}>
                              {formatTime(log.timestamp)}
                            </span>
                            <Badge className={`${getChannelColor(log.channel)} text-[8px] px-1.5 py-0`}>
                              {log.channel}
                            </Badge>
                            {log.encrypted && (
                              <Badge variant="outline" className="text-[7px] px-1 py-0 border-primary/50 text-primary">
                                ENCRYPTED
                              </Badge>
                            )}
                          </div>
                          {log.direction === 'incoming' ? (
                            <ArrowLeft weight="bold" size={12} className="text-primary" />
                          ) : (
                            <ArrowRight weight="bold" size={12} className="text-accent" />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[9px]">
                          <span className="text-muted-foreground uppercase tracking-wide">FROM:</span>
                          <span className="font-bold">{log.from}</span>
                          <RadioButton weight="fill" size={8} className="text-muted-foreground mx-0.5" />
                          <span className="text-muted-foreground uppercase tracking-wide">TO:</span>
                          <span className="font-bold">{log.to}</span>
                        </div>

                        <div className="text-xs text-foreground pl-2 border-l-2 border-primary/30">
                          {log.message}
                        </div>

                        {log.acknowledged && (
                          <div className="flex items-center gap-1 text-[8px] text-primary">
                            <RadioButton weight="fill" size={10} />
                            <span>ACKNOWLEDGED</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>

          <div className="grid grid-cols-2 gap-2 pt-2 text-[9px]">
            <div className="flex items-center gap-1">
              <ArrowLeft weight="bold" size={10} className="text-primary" />
              <span className="text-muted-foreground">
                {logs.filter(l => l.direction === 'incoming').length} Incoming
              </span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowRight weight="bold" size={10} className="text-accent" />
              <span className="text-muted-foreground">
                {logs.filter(l => l.direction === 'outgoing').length} Outgoing
              </span>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
