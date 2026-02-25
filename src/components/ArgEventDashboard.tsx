import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Lightning, Sparkle, Play, Pause, Trash, Package } from '@phosphor-icons/react'
import { liveArgSync, type ArgEvent } from '@/lib/liveArgSync'
import { toast } from 'sonner'

interface ArgEventDashboardProps {
  maxHeight?: string
  onEventActivated?: (event: ArgEvent) => void
}

const RARITY_COLORS = {
  common: 'bg-muted text-muted-foreground',
  uncommon: 'bg-primary/20 text-primary',
  rare: 'bg-blue-500/20 text-blue-400',
  epic: 'bg-purple-500/20 text-purple-400',
  legendary: 'bg-accent text-accent-foreground',
  unique: 'bg-destructive/20 text-destructive'
}

export function ArgEventDashboard({ 
  maxHeight = '600px',
  onEventActivated 
}: ArgEventDashboardProps) {
  const [events, setEvents] = useState<ArgEvent[]>([])

  useEffect(() => {
    loadEvents()
    
    const unsubscribe = liveArgSync.onArgEventUpdate((updatedEvent) => {
      loadEvents()
    })

    return () => unsubscribe()
  }, [])

  const loadEvents = async () => {
    const allEvents = await liveArgSync.getArgEvents()
    setEvents(allEvents)
  }

  const handleActivate = async (eventId: string) => {
    try {
      await liveArgSync.activateArgEvent(eventId)
      const event = events.find(e => e.id === eventId)
      
      toast.success(`ARG Event "${event?.name}" activated`)
      
      if (event && onEventActivated) {
        onEventActivated(event)
      }
      
      loadEvents()
    } catch (error) {
      toast.error('Failed to activate event')
      console.error(error)
    }
  }

  const handleDeactivate = async (eventId: string) => {
    try {
      await liveArgSync.deactivateArgEvent(eventId)
      const event = events.find(e => e.id === eventId)
      
      toast.success(`ARG Event "${event?.name}" deactivated`)
      loadEvents()
    } catch (error) {
      toast.error('Failed to deactivate event')
      console.error(error)
    }
  }

  const activeEvents = events.filter(e => e.active)
  const inactiveEvents = events.filter(e => !e.active)

  return (
    <Card className="border-primary/30">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightning weight="bold" className="text-primary" size={20} />
            <span className="text-sm font-bold tracking-wider">ARG EVENT DASHBOARD</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] text-primary">
              {activeEvents.length} ACTIVE
            </Badge>
            <Badge variant="outline" className="text-[10px] tabular-nums">
              {events.length} TOTAL
            </Badge>
          </div>
        </div>
      </div>

      <ScrollArea style={{ maxHeight }}>
        <div className="p-4 space-y-4">
          {activeEvents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-primary">
                <Play weight="bold" size={14} />
                ACTIVE EVENTS
              </div>
              {activeEvents.map((event) => (
                <Card key={event.id} className="p-3 border-primary/40 bg-primary/5">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Sparkle weight="fill" className="text-primary mt-0.5" size={20} />
                        <div className="flex-1">
                          <div className="font-bold text-sm">{event.name}</div>
                          {event.description && (
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {event.description}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary">
                              <Play weight="bold" size={8} className="mr-1" />
                              LIVE
                            </Badge>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              <Package weight="bold" size={8} className="mr-1" />
                              {event.items.length} ITEM{event.items.length !== 1 ? 'S' : ''}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeactivate(event.id)}
                        className="h-8 px-2 text-[10px]"
                      >
                        <Pause weight="bold" size={14} className="mr-1" />
                        Deactivate
                      </Button>
                    </div>

                    {event.items.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          {event.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 text-xs">
                              <div className="text-lg">{item.emoji}</div>
                              <div className="flex-1 font-medium">{item.name}</div>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-[8px] px-1 py-0">
                                  {item.type}
                                </Badge>
                                {item.rarity && (
                                  <Badge className={`text-[8px] px-1 py-0 ${RARITY_COLORS[item.rarity]}`}>
                                    {item.rarity}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="text-[9px] text-muted-foreground">
                      Created {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {inactiveEvents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground">
                <Pause weight="bold" size={14} />
                INACTIVE EVENTS
              </div>
              {inactiveEvents.map((event) => (
                <Card key={event.id} className="p-3 border-border/50 opacity-60">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Sparkle weight="regular" className="text-muted-foreground mt-0.5" size={20} />
                        <div className="flex-1">
                          <div className="font-bold text-sm">{event.name}</div>
                          {event.description && (
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {event.description}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              <Package weight="bold" size={8} className="mr-1" />
                              {event.items.length} ITEM{event.items.length !== 1 ? 'S' : ''}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleActivate(event.id)}
                        className="h-8 px-2 text-[10px]"
                      >
                        <Play weight="bold" size={14} className="mr-1" />
                        Activate
                      </Button>
                    </div>

                    <div className="text-[9px] text-muted-foreground">
                      Created {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {events.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Lightning weight="bold" className="mx-auto mb-2 opacity-50" size={32} />
              <div>No ARG events created yet</div>
              <div className="text-xs mt-1">Create an event to spawn collectible items</div>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
