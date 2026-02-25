import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { mConsoleSync } from '@/lib/mConsoleSync'
import { toast } from 'sonner'
import { 
  Megaphone, 
  CheckCircle, 
  MapPin, 
  ShieldWarning, 
  ClockCountdown,
  Info,
  Target,
  RadioButton,
  PaperPlaneTilt,
  Plus
} from '@phosphor-icons/react'

export interface BroadcastTemplate {
  id: string
  name: string
  category: 'status-check' | 'tactical' | 'intel' | 'warning' | 'coordination' | 'custom'
  message: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  requiresAck: boolean
  autoExpireMs?: number
  icon: string
}

const defaultTemplates: BroadcastTemplate[] = [
  {
    id: 'status-check',
    name: 'Status Check',
    category: 'status-check',
    message: 'All units, report operational status',
    priority: 'normal',
    requiresAck: true,
    autoExpireMs: 300000,
    icon: 'check'
  },
  {
    id: 'immediate-check-in',
    name: 'Immediate Check-In',
    category: 'status-check',
    message: 'IMMEDIATE CHECK-IN REQUIRED - Confirm position and status',
    priority: 'high',
    requiresAck: true,
    autoExpireMs: 180000,
    icon: 'check'
  },
  {
    id: 'rally-point',
    name: 'Rally Point',
    category: 'tactical',
    message: 'All units converge on rally point alpha',
    priority: 'high',
    requiresAck: true,
    autoExpireMs: 600000,
    icon: 'map'
  },
  {
    id: 'hold-position',
    name: 'Hold Position',
    category: 'tactical',
    message: 'All units hold current position - Await further orders',
    priority: 'high',
    requiresAck: true,
    icon: 'target'
  },
  {
    id: 'regroup',
    name: 'Regroup',
    category: 'tactical',
    message: 'Break contact and regroup at extraction point',
    priority: 'high',
    requiresAck: true,
    icon: 'target'
  },
  {
    id: 'intel-update',
    name: 'Intel Update',
    category: 'intel',
    message: 'New intelligence received - Check secure channel for details',
    priority: 'high',
    requiresAck: true,
    autoExpireMs: 600000,
    icon: 'info'
  },
  {
    id: 'target-identified',
    name: 'Target Identified',
    category: 'intel',
    message: 'Primary target identified - Coordinates transmitted',
    priority: 'high',
    requiresAck: true,
    icon: 'target'
  },
  {
    id: 'threat-alert',
    name: 'Threat Alert',
    category: 'warning',
    message: 'THREAT DETECTED - Possible hostiles in operational area',
    priority: 'critical',
    requiresAck: true,
    autoExpireMs: 300000,
    icon: 'warning'
  },
  {
    id: 'compromise-warning',
    name: 'Compromise Warning',
    category: 'warning',
    message: 'OPERATIONAL SECURITY COMPROMISE - Switch to backup protocols',
    priority: 'critical',
    requiresAck: true,
    icon: 'warning'
  },
  {
    id: 'exfil-ready',
    name: 'Exfil Ready',
    category: 'coordination',
    message: 'Extraction window opening - Confirm ready status',
    priority: 'high',
    requiresAck: true,
    autoExpireMs: 300000,
    icon: 'clock'
  },
  {
    id: 'comms-test',
    name: 'Comms Test',
    category: 'coordination',
    message: 'Communications check - Acknowledge receipt',
    priority: 'normal',
    requiresAck: true,
    autoExpireMs: 180000,
    icon: 'radio'
  },
  {
    id: 'mission-update',
    name: 'Mission Update',
    category: 'coordination',
    message: 'Mission parameters updated - Review new objectives',
    priority: 'high',
    requiresAck: true,
    icon: 'info'
  }
]

interface BroadcastTemplatesProps {
  assets: Array<{
    id: string
    callsign: string
    agentId: string
  }>
  onBroadcastSent?: (templateId: string, targetAgents: string[]) => void
}

export function BroadcastTemplates({ assets, onBroadcastSent }: BroadcastTemplatesProps) {
  const [templates] = useState<BroadcastTemplate[]>(defaultTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState<BroadcastTemplate | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [customPriority, setCustomPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal')
  const [customRequiresAck, setCustomRequiresAck] = useState(true)
  const [customExpireMinutes, setCustomExpireMinutes] = useState<number>(5)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const categoryIcons: Record<string, React.ReactNode> = {
    'status-check': <CheckCircle weight="bold" size={14} />,
    'tactical': <Target weight="bold" size={14} />,
    'intel': <Info weight="bold" size={14} />,
    'warning': <ShieldWarning weight="bold" size={14} />,
    'coordination': <ClockCountdown weight="bold" size={14} />,
    'custom': <Megaphone weight="bold" size={14} />
  }

  const priorityColors = {
    low: 'bg-muted text-muted-foreground',
    normal: 'bg-secondary text-secondary-foreground',
    high: 'bg-accent text-accent-foreground',
    critical: 'bg-destructive text-destructive-foreground'
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

  const sendBroadcast = async (template: BroadcastTemplate, message?: string) => {
    if (selectedAgents.length === 0) {
      toast.error('No agents selected', {
        description: 'Select at least one agent to send broadcast'
      })
      return
    }

    setIsSending(true)

    try {
      const broadcastMessage = message || template.message
      
      const broadcastId = await mConsoleSync.broadcastWithAck(
        'general',
        { template: template.id },
        broadcastMessage,
        template.priority,
        'M-CONSOLE',
        selectedAgents,
        template.autoExpireMs
      )

      toast.success('Broadcast sent', {
        description: `${selectedAgents.length} agent(s) will receive: "${broadcastMessage.substring(0, 50)}${broadcastMessage.length > 50 ? '...' : ''}"`
      })

      if (onBroadcastSent) {
        onBroadcastSent(template.id, selectedAgents)
      }

      setSelectedTemplate(null)
      setCustomMessage('')
      setIsCustomDialogOpen(false)
    } catch (error) {
      toast.error('Failed to send broadcast', {
        description: 'Please try again'
      })
      console.error('Broadcast error:', error)
    } finally {
      setIsSending(false)
    }
  }

  const sendCustomBroadcast = async () => {
    if (!customMessage.trim()) {
      toast.error('Message required', {
        description: 'Enter a message to broadcast'
      })
      return
    }

    const customTemplate: BroadcastTemplate = {
      id: `custom-${Date.now()}`,
      name: 'Custom Broadcast',
      category: 'custom',
      message: customMessage,
      priority: customPriority,
      requiresAck: customRequiresAck,
      autoExpireMs: customRequiresAck ? customExpireMinutes * 60 * 1000 : undefined,
      icon: 'megaphone'
    }

    await sendBroadcast(customTemplate)
  }

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category].push(template)
    return acc
  }, {} as Record<string, BroadcastTemplate[]>)

  const categoryOrder: Array<BroadcastTemplate['category']> = [
    'status-check',
    'tactical',
    'intel',
    'warning',
    'coordination'
  ]

  return (
    <Card className="border-primary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Broadcast Templates</span>
        </div>
        <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-6 text-[9px]">
              <Plus weight="bold" size={12} className="mr-1" />
              Custom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">Custom Broadcast</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Message</Label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Enter broadcast message..."
                  className="text-xs min-h-[80px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Priority</Label>
                  <Select value={customPriority} onValueChange={(v: any) => setCustomPriority(v)}>
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
                  <Label className="text-xs">Requires ACK</Label>
                  <Select 
                    value={customRequiresAck ? 'yes' : 'no'} 
                    onValueChange={(v) => setCustomRequiresAck(v === 'yes')}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes" className="text-xs">Yes</SelectItem>
                      <SelectItem value="no" className="text-xs">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {customRequiresAck && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Expire After (minutes)</Label>
                  <Input
                    type="number"
                    value={customExpireMinutes}
                    onChange={(e) => setCustomExpireMinutes(parseInt(e.target.value) || 5)}
                    min={1}
                    max={60}
                    className="h-8 text-xs"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                onClick={sendCustomBroadcast} 
                disabled={isSending || !customMessage.trim()}
                size="sm"
                className="text-xs"
              >
                <PaperPlaneTilt weight="bold" size={12} className="mr-1" />
                Send Broadcast
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="bg-border" />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">
            Target Agents ({selectedAgents.length}/{assets.length})
          </span>
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

        <ScrollArea className="h-[80px] border border-border rounded">
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

      <Separator className="bg-border" />

      <ScrollArea className="h-[300px]">
        <div className="space-y-3 pr-3">
          {categoryOrder.map(category => {
            const categoryTemplates = groupedTemplates[category]
            if (!categoryTemplates) return null

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-1.5">
                  {categoryIcons[category]}
                  <span className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">
                    {category.replace('-', ' ')}
                  </span>
                </div>
                
                <div className="space-y-1.5">
                  {categoryTemplates.map(template => (
                    <Dialog 
                      key={template.id}
                      open={selectedTemplate?.id === template.id}
                      onOpenChange={(open) => setSelectedTemplate(open ? template : null)}
                    >
                      <DialogTrigger asChild>
                        <button
                          className="w-full text-left p-2 border border-border rounded hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-medium truncate">
                                {template.name}
                              </div>
                              <div className="text-[9px] text-muted-foreground line-clamp-2 mt-0.5">
                                {template.message}
                              </div>
                            </div>
                            <Badge 
                              className={`${priorityColors[template.priority]} text-[8px] px-1.5 py-0 shrink-0`}
                            >
                              {template.priority}
                            </Badge>
                          </div>
                          {template.requiresAck && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <CheckCircle weight="bold" size={10} className="text-primary" />
                              <span className="text-[8px] text-primary">Requires Acknowledgment</span>
                            </div>
                          )}
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-sm">{template.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Message</Label>
                            <div className="text-xs p-2 border border-border rounded bg-secondary/30">
                              {template.message}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Priority</Label>
                              <Badge className={`${priorityColors[template.priority]} text-xs`}>
                                {template.priority}
                              </Badge>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Acknowledgment</Label>
                              <div className="text-xs">
                                {template.requiresAck ? 'Required' : 'Not Required'}
                              </div>
                            </div>
                          </div>

                          {template.autoExpireMs && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Auto-Expire</Label>
                              <div className="text-xs">
                                {Math.floor(template.autoExpireMs / 60000)} minutes
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              Selected Agents ({selectedAgents.length})
                            </Label>
                            <div className="text-xs text-muted-foreground">
                              {selectedAgents.length === 0 
                                ? 'No agents selected' 
                                : `Broadcasting to ${selectedAgents.length} agent(s)`}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={() => sendBroadcast(template)} 
                            disabled={isSending || selectedAgents.length === 0}
                            size="sm"
                            className="text-xs"
                          >
                            <PaperPlaneTilt weight="bold" size={12} className="mr-1" />
                            Send Broadcast
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
}
