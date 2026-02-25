import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { mConsoleSync } from '@/lib/mConsoleSync'
import { toast } from 'sonner'
import { 
  CalendarPlus, 
  ClockClockwise,
  Trash,
  Pause,
  Play,
  PaperPlaneTilt,
  CheckCircle,
  ClockCountdown,
  Calendar,
  Repeat
} from '@phosphor-icons/react'

export interface ScheduledBroadcast {
  id: string
  name: string
  message: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  targetAgents: string[]
  requiresAck: boolean
  autoExpireMs?: number
  scheduleType: 'once' | 'interval'
  scheduledTime?: number
  intervalMs?: number
  lastSentAt?: number
  nextSendAt?: number
  isActive: boolean
  createdAt: number
  createdBy: string
  sentCount: number
}

interface BroadcastSchedulerProps {
  assets: Array<{
    id: string
    callsign: string
    agentId: string
  }>
  onBroadcastScheduled?: (broadcast: ScheduledBroadcast) => void
}

export function BroadcastScheduler({ assets, onBroadcastScheduled }: BroadcastSchedulerProps) {
  const [scheduledBroadcasts, setScheduledBroadcasts] = useKV<ScheduledBroadcast[]>('scheduled-broadcasts', [])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBroadcast, setEditingBroadcast] = useState<ScheduledBroadcast | null>(null)
  
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal')
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [requiresAck, setRequiresAck] = useState(true)
  const [expireMinutes, setExpireMinutes] = useState(5)
  const [scheduleType, setScheduleType] = useState<'once' | 'interval'>('once')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [intervalHours, setIntervalHours] = useState(1)
  const [intervalMinutes, setIntervalMinutes] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      checkAndSendScheduledBroadcasts()
    }, 10000)

    return () => clearInterval(interval)
  }, [scheduledBroadcasts])

  const checkAndSendScheduledBroadcasts = async () => {
    const now = Date.now()
    const updated: ScheduledBroadcast[] = []
    let hasChanges = false

    for (const broadcast of scheduledBroadcasts || []) {
      if (!broadcast.isActive) {
        updated.push(broadcast)
        continue
      }

      if (broadcast.scheduleType === 'once' && broadcast.scheduledTime && now >= broadcast.scheduledTime) {
        if (!broadcast.lastSentAt) {
          await sendScheduledBroadcast(broadcast)
          updated.push({
            ...broadcast,
            lastSentAt: now,
            isActive: false,
            sentCount: broadcast.sentCount + 1
          })
          hasChanges = true
        } else {
          updated.push(broadcast)
        }
      } else if (broadcast.scheduleType === 'interval' && broadcast.intervalMs) {
        const shouldSend = !broadcast.lastSentAt || (now - broadcast.lastSentAt >= broadcast.intervalMs)
        
        if (shouldSend) {
          await sendScheduledBroadcast(broadcast)
          updated.push({
            ...broadcast,
            lastSentAt: now,
            nextSendAt: now + broadcast.intervalMs,
            sentCount: broadcast.sentCount + 1
          })
          hasChanges = true
        } else {
          updated.push(broadcast)
        }
      } else {
        updated.push(broadcast)
      }
    }

    if (hasChanges) {
      setScheduledBroadcasts(updated)
    }
  }

  const sendScheduledBroadcast = async (broadcast: ScheduledBroadcast) => {
    try {
      await mConsoleSync.broadcastWithAck(
        'general',
        { scheduled: true, scheduleId: broadcast.id },
        broadcast.message,
        broadcast.priority,
        'M-CONSOLE',
        broadcast.targetAgents,
        broadcast.autoExpireMs
      )

      toast.success('Scheduled broadcast sent', {
        description: `"${broadcast.name}" sent to ${broadcast.targetAgents.length} agent(s)`
      })
    } catch (error) {
      console.error('Failed to send scheduled broadcast:', error)
      toast.error('Failed to send scheduled broadcast', {
        description: broadcast.name
      })
    }
  }

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    )
  }

  const selectAllAgents = () => {
    setSelectedAgents(assets.map(a => a.agentId))
  }

  const clearAgents = () => {
    setSelectedAgents([])
  }

  const resetForm = () => {
    setName('')
    setMessage('')
    setPriority('normal')
    setSelectedAgents([])
    setRequiresAck(true)
    setExpireMinutes(5)
    setScheduleType('once')
    setScheduledDate('')
    setScheduledTime('')
    setIntervalHours(1)
    setIntervalMinutes(0)
    setEditingBroadcast(null)
  }

  const createScheduledBroadcast = () => {
    if (!name.trim()) {
      toast.error('Name required', { description: 'Enter a name for this scheduled broadcast' })
      return
    }

    if (!message.trim()) {
      toast.error('Message required', { description: 'Enter a message to broadcast' })
      return
    }

    if (selectedAgents.length === 0) {
      toast.error('No agents selected', { description: 'Select at least one agent' })
      return
    }

    if (scheduleType === 'once' && (!scheduledDate || !scheduledTime)) {
      toast.error('Schedule time required', { description: 'Enter date and time for scheduled broadcast' })
      return
    }

    if (scheduleType === 'interval' && intervalHours === 0 && intervalMinutes === 0) {
      toast.error('Interval required', { description: 'Enter at least 1 minute for interval' })
      return
    }

    let scheduledTimestamp: number | undefined
    let intervalMs: number | undefined
    let nextSendAt: number | undefined

    if (scheduleType === 'once') {
      scheduledTimestamp = new Date(`${scheduledDate}T${scheduledTime}`).getTime()
      if (scheduledTimestamp <= Date.now()) {
        toast.error('Invalid time', { description: 'Scheduled time must be in the future' })
        return
      }
      nextSendAt = scheduledTimestamp
    } else {
      intervalMs = (intervalHours * 60 + intervalMinutes) * 60 * 1000
      nextSendAt = Date.now() + intervalMs
    }

    const newBroadcast: ScheduledBroadcast = {
      id: `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      message: message.trim(),
      priority,
      targetAgents: selectedAgents,
      requiresAck,
      autoExpireMs: requiresAck ? expireMinutes * 60 * 1000 : undefined,
      scheduleType,
      scheduledTime: scheduledTimestamp,
      intervalMs,
      nextSendAt,
      isActive: true,
      createdAt: Date.now(),
      createdBy: 'M-CONSOLE',
      sentCount: 0
    }

    setScheduledBroadcasts((current) => [...(current || []), newBroadcast])

    toast.success('Broadcast scheduled', {
      description: scheduleType === 'once' 
        ? `Will send at ${new Date(scheduledTimestamp!).toLocaleString()}`
        : `Will send every ${intervalHours}h ${intervalMinutes}m`
    })

    if (onBroadcastScheduled) {
      onBroadcastScheduled(newBroadcast)
    }

    resetForm()
    setIsCreateDialogOpen(false)
  }

  const updateScheduledBroadcast = () => {
    if (!editingBroadcast) return

    setScheduledBroadcasts((current) => 
      (current || []).map(b => 
        b.id === editingBroadcast.id 
          ? { ...editingBroadcast, targetAgents: selectedAgents }
          : b
      )
    )

    toast.success('Broadcast updated', { description: editingBroadcast.name })
    setIsEditDialogOpen(false)
    resetForm()
  }

  const toggleBroadcastActive = (id: string) => {
    setScheduledBroadcasts((current) => 
      (current || []).map(b => 
        b.id === id ? { ...b, isActive: !b.isActive } : b
      )
    )
  }

  const deleteBroadcast = (id: string) => {
    setScheduledBroadcasts((current) => 
      (current || []).filter(b => b.id !== id)
    )
    toast.success('Broadcast deleted')
  }

  const sendNow = async (broadcast: ScheduledBroadcast) => {
    await sendScheduledBroadcast(broadcast)
    setScheduledBroadcasts((current) => 
      (current || []).map(b => 
        b.id === broadcast.id 
          ? { ...b, lastSentAt: Date.now(), sentCount: b.sentCount + 1 }
          : b
      )
    )
  }

  const openEditDialog = (broadcast: ScheduledBroadcast) => {
    setEditingBroadcast(broadcast)
    setName(broadcast.name)
    setMessage(broadcast.message)
    setPriority(broadcast.priority)
    setSelectedAgents([...broadcast.targetAgents])
    setRequiresAck(broadcast.requiresAck)
    setExpireMinutes(broadcast.autoExpireMs ? broadcast.autoExpireMs / 60000 : 5)
    setScheduleType(broadcast.scheduleType)
    
    if (broadcast.scheduleType === 'once' && broadcast.scheduledTime) {
      const date = new Date(broadcast.scheduledTime)
      setScheduledDate(date.toISOString().split('T')[0])
      setScheduledTime(date.toTimeString().slice(0, 5))
    } else if (broadcast.scheduleType === 'interval' && broadcast.intervalMs) {
      const hours = Math.floor(broadcast.intervalMs / (60 * 60 * 1000))
      const minutes = Math.floor((broadcast.intervalMs % (60 * 60 * 1000)) / (60 * 1000))
      setIntervalHours(hours)
      setIntervalMinutes(minutes)
    }
    
    setIsEditDialogOpen(true)
  }

  const priorityColors = {
    low: 'bg-muted text-muted-foreground',
    normal: 'bg-secondary text-secondary-foreground',
    high: 'bg-accent text-accent-foreground',
    critical: 'bg-destructive text-destructive-foreground'
  }

  const formatNextSend = (broadcast: ScheduledBroadcast): string => {
    if (!broadcast.nextSendAt) return 'N/A'
    
    const now = Date.now()
    const diff = broadcast.nextSendAt - now
    
    if (diff <= 0) return 'Sending...'
    
    const hours = Math.floor(diff / (60 * 60 * 1000))
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
    
    if (hours > 24) {
      return new Date(broadcast.nextSendAt).toLocaleString()
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    
    return `${minutes}m`
  }

  return (
    <Card className="border-primary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarPlus weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Broadcast Scheduler</span>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="default" className="h-6 text-[9px]">
              <CalendarPlus weight="bold" size={12} className="mr-1" />
              Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm">Schedule Broadcast</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Create a broadcast to send at a specific time or on a recurring interval
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Hourly Status Check"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Message</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter broadcast message..."
                  className="text-xs min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Priority</Label>
                  <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" className="text-xs">Low</SelectItem>
                      <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                      <SelectItem value="high" className="text-xs">High</SelectItem>
                      <SelectItem value="critical" className="text-xs">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Schedule Type</Label>
                  <Select value={scheduleType} onValueChange={(v: any) => setScheduleType(v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once" className="text-xs">One-time</SelectItem>
                      <SelectItem value="interval" className="text-xs">Recurring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {scheduleType === 'once' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Time</Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Hours</Label>
                    <Input
                      type="number"
                      value={intervalHours}
                      onChange={(e) => setIntervalHours(parseInt(e.target.value) || 0)}
                      min={0}
                      max={24}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Minutes</Label>
                    <Input
                      type="number"
                      value={intervalMinutes}
                      onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 0)}
                      min={0}
                      max={59}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label className="text-xs">Requires Acknowledgment</Label>
                <Switch checked={requiresAck} onCheckedChange={setRequiresAck} />
              </div>

              {requiresAck && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Expire After (minutes)</Label>
                  <Input
                    type="number"
                    value={expireMinutes}
                    onChange={(e) => setExpireMinutes(parseInt(e.target.value) || 5)}
                    min={1}
                    max={60}
                    className="h-8 text-xs"
                  />
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Target Agents ({selectedAgents.length})</Label>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={selectAllAgents}
                      className="h-5 text-[9px] px-2"
                    >
                      Select All
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearAgents}
                      className="h-5 text-[9px] px-2"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[100px] border border-border rounded">
                  <div className="p-2 space-y-1">
                    {assets.map(asset => (
                      <button
                        key={asset.id}
                        onClick={() => toggleAgent(asset.agentId)}
                        className={`w-full text-left px-2 py-1 rounded text-[10px] transition-colors ${
                          selectedAgents.includes(asset.agentId)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary/50 text-foreground hover:bg-secondary'
                        }`}
                      >
                        {asset.callsign}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createScheduledBroadcast} size="sm" className="text-xs">
                <CalendarPlus weight="bold" size={12} className="mr-1" />
                Create Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="bg-border" />

      {(!scheduledBroadcasts || scheduledBroadcasts.length === 0) ? (
        <div className="text-center py-8 text-muted-foreground text-xs">
          <Calendar weight="bold" size={32} className="mx-auto mb-2 opacity-30" />
          <div>No scheduled broadcasts</div>
          <div className="text-[10px] mt-1">Create a schedule to automate broadcast delivery</div>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-3">
            {scheduledBroadcasts.map(broadcast => (
              <Card 
                key={broadcast.id} 
                className={`p-3 space-y-2 ${
                  broadcast.isActive 
                    ? 'border-primary/50 bg-card' 
                    : 'border-muted bg-muted/20 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {broadcast.scheduleType === 'once' ? (
                        <Calendar weight="bold" size={12} className="text-primary shrink-0" />
                      ) : (
                        <Repeat weight="bold" size={12} className="text-primary shrink-0" />
                      )}
                      <span className="text-xs font-medium truncate">{broadcast.name}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground line-clamp-2 mt-1">
                      {broadcast.message}
                    </div>
                  </div>
                  <Badge className={`${priorityColors[broadcast.priority]} text-[8px] px-1.5 py-0 shrink-0`}>
                    {broadcast.priority}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div>
                    <span className="text-muted-foreground">Next Send:</span>
                    <div className="font-medium flex items-center gap-1 mt-0.5">
                      <ClockCountdown weight="bold" size={10} />
                      {formatNextSend(broadcast)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sent:</span>
                    <div className="font-medium flex items-center gap-1 mt-0.5">
                      <CheckCircle weight="bold" size={10} />
                      {broadcast.sentCount} time{broadcast.sentCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {broadcast.scheduleType === 'interval' && broadcast.intervalMs && (
                  <div className="text-[9px] text-muted-foreground">
                    Repeats every {Math.floor(broadcast.intervalMs / (60 * 60 * 1000))}h{' '}
                    {Math.floor((broadcast.intervalMs % (60 * 60 * 1000)) / (60 * 1000))}m
                  </div>
                )}

                <div className="flex items-center gap-1 pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleBroadcastActive(broadcast.id)}
                    className="h-6 text-[9px] px-2"
                  >
                    {broadcast.isActive ? (
                      <>
                        <Pause weight="bold" size={10} className="mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play weight="bold" size={10} className="mr-1" />
                        Resume
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => sendNow(broadcast)}
                    className="h-6 text-[9px] px-2"
                  >
                    <PaperPlaneTilt weight="bold" size={10} className="mr-1" />
                    Send Now
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(broadcast)}
                    className="h-6 text-[9px] px-2"
                  >
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteBroadcast(broadcast.id)}
                    className="h-6 text-[9px] px-2 text-destructive hover:text-destructive"
                  >
                    <Trash weight="bold" size={10} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Edit Scheduled Broadcast</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="text-xs min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Target Agents ({selectedAgents.length})</Label>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={selectAllAgents}
                    className="h-5 text-[9px] px-2"
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearAgents}
                    className="h-5 text-[9px] px-2"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[100px] border border-border rounded">
                <div className="p-2 space-y-1">
                  {assets.map(asset => (
                    <button
                      key={asset.id}
                      onClick={() => toggleAgent(asset.agentId)}
                      className={`w-full text-left px-2 py-1 rounded text-[10px] transition-colors ${
                        selectedAgents.includes(asset.agentId)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/50 text-foreground hover:bg-secondary'
                      }`}
                    >
                      {asset.callsign}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={updateScheduledBroadcast} size="sm" className="text-xs">
              Update Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
