import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Broadcast,
  FilmStrip,
  Calendar,
  Target
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { type DebriefEntry, addDebriefEntryFromWindow } from '@/components/DebriefMediaFeed'

interface DebriefBroadcasterProps {
  onBroadcastSent?: (broadcast: DebriefEntry) => void
}

export function DebriefBroadcaster({ onBroadcastSent }: DebriefBroadcasterProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal')
  const [eventType, setEventType] = useState<'m-video' | 'scripted-event'>('m-video')
  const [mediaUrl, setMediaUrl] = useState('')
  const [isScheduling, setIsScheduling] = useState(false)
  const [scheduledTime, setScheduledTime] = useState('')

  const handleBroadcast = () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    const entry: Omit<DebriefEntry, 'id' | 'timestamp'> = {
      type: eventType,
      title: title.trim(),
      description: description.trim() || undefined,
      source: eventType === 'scripted-event' ? 'scripted' : 'm-console',
      priority,
      mediaUrls: mediaUrl.trim() ? [mediaUrl.trim()] : undefined
    }

    if (isScheduling && scheduledTime) {
      const scheduledDate = new Date(scheduledTime)
      const now = new Date()
      
      if (scheduledDate <= now) {
        toast.error('Scheduled time must be in the future')
        return
      }

      const delay = scheduledDate.getTime() - now.getTime()
      
      setTimeout(() => {
        addDebriefEntryFromWindow(entry)
        if (onBroadcastSent) {
          onBroadcastSent({ ...entry, id: '', timestamp: Date.now() })
        }
        toast.success(`Scheduled broadcast delivered: ${entry.title}`)
      }, delay)

      toast.success(`Broadcast scheduled for ${scheduledDate.toLocaleString()}`)
    } else {
      addDebriefEntryFromWindow(entry)
      if (onBroadcastSent) {
        onBroadcastSent({ ...entry, id: '', timestamp: Date.now() })
      }
      toast.success('Broadcast sent to debrief feed')
    }

    setTitle('')
    setDescription('')
    setMediaUrl('')
    setScheduledTime('')
    setIsScheduling(false)
  }

  const handleQuickTemplate = (template: 'mission-update' | 'intel-drop' | 'situation-change') => {
    switch (template) {
      case 'mission-update':
        setTitle('Mission Parameter Update')
        setDescription('New objective parameters have been transmitted')
        setPriority('high')
        setEventType('m-video')
        break
      case 'intel-drop':
        setTitle('Intelligence Package Delivered')
        setDescription('Critical intelligence data attached for review')
        setPriority('critical')
        setEventType('scripted-event')
        break
      case 'situation-change':
        setTitle('Situation Development')
        setDescription('Field conditions have changed - assess new parameters')
        setPriority('normal')
        setEventType('scripted-event')
        break
    }
  }

  return (
    <Card className="border-primary/30 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Broadcast weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Debrief Broadcaster</span>
        </div>
        <Badge variant="outline" className="text-[9px] px-2 py-0">
          M-Console
        </Badge>
      </div>

      <Separator className="mb-4" />

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] tracking-wider uppercase text-muted-foreground">
            Event Type
          </label>
          <Select value={eventType} onValueChange={(val) => setEventType(val as typeof eventType)}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="m-video">M-Console Video</SelectItem>
              <SelectItem value="scripted-event">Scripted Thematic Event</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] tracking-wider uppercase text-muted-foreground">
            Priority Level
          </label>
          <Select value={priority} onValueChange={(val) => setPriority(val as typeof priority)}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] tracking-wider uppercase text-muted-foreground">
            Title *
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Broadcast title"
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] tracking-wider uppercase text-muted-foreground">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Broadcast details"
            className="text-xs min-h-[60px] resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] tracking-wider uppercase text-muted-foreground">
            Media URL (Optional)
          </label>
          <Input
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://example.com/video.mp4"
            className="text-xs font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isScheduling ? "default" : "outline"}
            onClick={() => setIsScheduling(!isScheduling)}
            className="text-[9px] h-7 px-2"
          >
            <Calendar weight="bold" size={12} className="mr-1" />
            {isScheduling ? 'Scheduling' : 'Schedule'}
          </Button>
          {isScheduling && (
            <Input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="text-xs flex-1"
            />
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-[10px] tracking-wider uppercase text-muted-foreground">
            Quick Templates
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickTemplate('mission-update')}
              className="text-[9px] h-7 px-2"
            >
              <Target weight="bold" size={10} className="mr-1" />
              Mission Update
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickTemplate('intel-drop')}
              className="text-[9px] h-7 px-2"
            >
              <FilmStrip weight="bold" size={10} className="mr-1" />
              Intel Drop
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickTemplate('situation-change')}
              className="text-[9px] h-7 px-2"
            >
              <Broadcast weight="bold" size={10} className="mr-1" />
              Situation
            </Button>
          </div>
        </div>

        <Button
          onClick={handleBroadcast}
          className="w-full font-bold tracking-wider"
          disabled={!title.trim()}
        >
          <Broadcast weight="bold" className="mr-2" />
          {isScheduling && scheduledTime ? 'SCHEDULE BROADCAST' : 'SEND BROADCAST'}
        </Button>
      </div>

      <div className="mt-4 p-2 bg-muted/50 rounded border border-border">
        <div className="text-[9px] text-muted-foreground text-center">
          📡 Broadcasts appear in debrief feed for all agents
        </div>
      </div>
    </Card>
  )
}
