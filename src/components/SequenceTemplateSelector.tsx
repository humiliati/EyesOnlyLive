import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { eventSequencer, type EventSequence, type EventStep } from '@/lib/eventSequencer'
import { 
  Sparkle, 
  Copy,
  ClockCountdown,
  Broadcast
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface SequenceTemplate {
  id: string
  name: string
  description: string
  category: 'mission' | 'narrative' | 'patrol' | 'training' | 'emergency'
  estimatedDuration: number
  steps: Omit<EventStep, 'id'>[]
  repeatEnabled?: boolean
}

const SEQUENCE_TEMPLATES: SequenceTemplate[] = [
  {
    id: 'mission-kickoff',
    name: 'Mission Kickoff',
    description: 'Standard mission initiation with countdown, go signal, and objective marker',
    category: 'mission',
    estimatedDuration: 70000,
    steps: [
      {
        type: 'ping',
        delayMs: 0,
        payload: {
          message: 'Mission commencing in 60 seconds. Prepare for deployment.',
          priority: 'high'
        },
        requiresAck: true
      },
      {
        type: 'ops-update',
        delayMs: 60000,
        payload: {
          type: 'mission',
          message: 'Mission is now ACTIVE. All units proceed.',
          priority: 'high'
        }
      },
      {
        type: 'annotation',
        delayMs: 10000,
        payload: {
          action: 'create',
          annotation: {
            label: 'Primary Objective',
            gridX: 4,
            gridY: 4,
            annotationType: 'objective',
            priority: 'high',
            requiresAck: true
          }
        }
      }
    ]
  },
  {
    id: 'intel-discovery',
    name: 'Intel Discovery Arc',
    description: 'Progressive intelligence decryption with dramatic timing',
    category: 'narrative',
    estimatedDuration: 365000,
    steps: [
      {
        type: 'ops-update',
        delayMs: 0,
        payload: {
          type: 'intel',
          message: '🔒 Encrypted transmission intercepted. Beginning decryption.',
          priority: 'normal'
        }
      },
      {
        type: 'ping',
        delayMs: 120000,
        payload: {
          message: 'Decryption progress: 30%. Analyzing patterns...',
          priority: 'low'
        }
      },
      {
        type: 'ping',
        delayMs: 180000,
        payload: {
          message: 'Decryption progress: 75%. Nearly complete.',
          priority: 'normal'
        }
      },
      {
        type: 'ping',
        delayMs: 60000,
        requiresAck: true,
        payload: {
          message: '🔓 INTEL DECRYPTED: Target location identified. Acknowledge receipt.',
          priority: 'critical'
        }
      },
      {
        type: 'annotation',
        delayMs: 5000,
        payload: {
          action: 'create',
          annotation: {
            label: 'INTEL: Target Location',
            gridX: 5,
            gridY: 6,
            annotationType: 'intel',
            priority: 'critical',
            requiresAck: true
          }
        }
      }
    ]
  },
  {
    id: 'hourly-patrol',
    name: 'Hourly Patrol Reminder',
    description: 'Automated checkpoint system with status reports',
    category: 'patrol',
    estimatedDuration: 300000,
    repeatEnabled: true,
    steps: [
      {
        type: 'ping',
        delayMs: 0,
        payload: {
          message: 'Patrol checkpoint approaching. Proceed to designated grid.',
          priority: 'normal'
        }
      },
      {
        type: 'ping',
        delayMs: 300000,
        requiresAck: true,
        payload: {
          message: 'Checkpoint status report required. Confirm position and status.',
          priority: 'normal'
        }
      }
    ]
  },
  {
    id: 'threat-escalation',
    name: 'Threat Level Escalation',
    description: 'Progressive threat alerts with defensive positioning',
    category: 'emergency',
    estimatedDuration: 185000,
    steps: [
      {
        type: 'ops-update',
        delayMs: 0,
        payload: {
          type: 'alert',
          message: 'Threat level elevated to MODERATE. Increase vigilance.',
          priority: 'high'
        }
      },
      {
        type: 'ping',
        delayMs: 120000,
        payload: {
          message: 'Threat level now HIGH. Possible hostile contact imminent.',
          priority: 'high'
        }
      },
      {
        type: 'ping',
        delayMs: 60000,
        requiresAck: true,
        payload: {
          message: '⚠️ THREAT LEVEL CRITICAL. Take defensive positions immediately.',
          priority: 'critical'
        }
      },
      {
        type: 'annotation',
        delayMs: 5000,
        payload: {
          action: 'create',
          annotation: {
            label: 'Safe Zone',
            gridX: 1,
            gridY: 1,
            annotationType: 'safe-zone',
            priority: 'critical',
            requiresAck: true
          }
        }
      }
    ]
  },
  {
    id: 'training-drill',
    name: 'Communications Training Drill',
    description: 'Test acknowledgment systems and response times',
    category: 'training',
    estimatedDuration: 150000,
    steps: [
      {
        type: 'ping',
        delayMs: 0,
        payload: {
          message: 'DRILL: Communications check. Acknowledge within 30 seconds.',
          priority: 'normal'
        },
        requiresAck: true,
        autoExpireMs: 30000
      },
      {
        type: 'ping',
        delayMs: 60000,
        payload: {
          message: 'DRILL: Priority message test. Acknowledge immediately.',
          priority: 'high'
        },
        requiresAck: true,
        autoExpireMs: 20000
      },
      {
        type: 'ping',
        delayMs: 60000,
        payload: {
          message: 'DRILL: Critical alert simulation. Emergency response protocol.',
          priority: 'critical'
        },
        requiresAck: true,
        autoExpireMs: 15000
      },
      {
        type: 'ops-update',
        delayMs: 30000,
        payload: {
          type: 'success',
          message: 'Training drill complete. Response times recorded.',
          priority: 'normal'
        }
      }
    ]
  },
  {
    id: 'extraction-countdown',
    name: 'Extraction Countdown',
    description: 'Final mission phase with timed extraction warnings',
    category: 'mission',
    estimatedDuration: 305000,
    steps: [
      {
        type: 'ping',
        delayMs: 0,
        payload: {
          message: 'Extraction window opens in 5 minutes. Proceed to extraction point.',
          priority: 'high'
        }
      },
      {
        type: 'annotation',
        delayMs: 5000,
        payload: {
          action: 'create',
          annotation: {
            label: 'Extraction Point',
            gridX: 7,
            gridY: 7,
            annotationType: 'extraction',
            priority: 'critical',
            requiresAck: true
          }
        }
      },
      {
        type: 'ping',
        delayMs: 175000,
        payload: {
          message: '⏱️ 2 minutes to extraction. Confirm en route status.',
          priority: 'high'
        },
        requiresAck: true
      },
      {
        type: 'ping',
        delayMs: 60000,
        payload: {
          message: '⏱️ 60 SECONDS TO EXTRACTION. Double-time to extraction point.',
          priority: 'critical'
        }
      },
      {
        type: 'ping',
        delayMs: 30000,
        payload: {
          message: '⏱️ 30 SECONDS. Extraction imminent.',
          priority: 'critical'
        }
      },
      {
        type: 'ops-update',
        delayMs: 30000,
        payload: {
          type: 'mission',
          message: '✅ Extraction complete. Mission concluded.',
          priority: 'high'
        }
      }
    ]
  },
  {
    id: 'briefing-cascade',
    name: 'Multi-Stage Briefing',
    description: 'Comprehensive briefing with intel, objectives, and cautions',
    category: 'mission',
    estimatedDuration: 125000,
    steps: [
      {
        type: 'ping',
        delayMs: 0,
        payload: {
          message: '📋 Mission briefing commencing. Standby for intelligence update.',
          priority: 'normal'
        }
      },
      {
        type: 'ops-update',
        delayMs: 15000,
        payload: {
          type: 'intel',
          message: 'INTEL: Target zone shows moderate activity. Exercise caution.',
          priority: 'normal'
        }
      },
      {
        type: 'ping',
        delayMs: 30000,
        requiresAck: true,
        payload: {
          message: '🎯 PRIMARY OBJECTIVE: Secure designated asset. Acknowledge briefing.',
          priority: 'high'
        }
      },
      {
        type: 'ops-update',
        delayMs: 30000,
        payload: {
          type: 'warning',
          message: '⚠️ CAUTION: Possible hostile surveillance in sector. Maintain OPSEC.',
          priority: 'high'
        }
      },
      {
        type: 'ping',
        delayMs: 50000,
        payload: {
          message: 'Briefing complete. Mission window opens in T-minus 60 seconds.',
          priority: 'normal'
        }
      }
    ]
  }
]

interface SequenceTemplateSelectorProps {
  maxHeight?: string
  currentUser?: string
  onTemplateSelected?: (template: SequenceTemplate) => void
}

export function SequenceTemplateSelector({
  maxHeight = '500px',
  currentUser = 'M-CONSOLE',
  onTemplateSelected
}: SequenceTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<SequenceTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleUseTemplate = async (template: SequenceTemplate) => {
    const stepsWithIds: EventStep[] = template.steps.map((step, index) => ({
      ...step,
      id: `step-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
    }))

    const sequence: EventSequence = {
      id: `seq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      description: template.description,
      status: 'draft',
      createdAt: Date.now(),
      createdBy: currentUser,
      currentStepIndex: 0,
      steps: stepsWithIds,
      repeatConfig: template.repeatEnabled ? {
        enabled: true,
        intervalMs: template.estimatedDuration + 300000,
        currentRepeat: 0
      } : undefined
    }

    await eventSequencer.saveSequence(sequence)
    
    if (onTemplateSelected) {
      onTemplateSelected(template)
    }

    toast.success(`Sequence "${template.name}" created from template`)
    setPreviewOpen(false)
  }

  const getCategoryColor = (category: SequenceTemplate['category']) => {
    switch (category) {
      case 'mission': return 'bg-primary text-primary-foreground'
      case 'narrative': return 'bg-accent text-accent-foreground'
      case 'patrol': return 'bg-secondary text-secondary-foreground'
      case 'training': return 'bg-muted text-muted-foreground'
      case 'emergency': return 'bg-destructive text-destructive-foreground'
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)

    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  return (
    <Card className="border-primary/30 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkle weight="bold" className="text-primary" size={20} />
          <div>
            <div className="text-sm font-bold tracking-wider">SEQUENCE TEMPLATES</div>
            <div className="text-[10px] text-muted-foreground">Pre-built Event Sequences</div>
          </div>
        </div>
      </div>

      <Separator className="mb-4" />

      <ScrollArea style={{ maxHeight }}>
        <div className="space-y-2">
          {SEQUENCE_TEMPLATES.map(template => (
            <Card key={template.id} className="p-3 border-border/50 bg-card/50 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedTemplate(template)
                setPreviewOpen(true)
              }}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-bold truncate">{template.name}</div>
                      <Badge className={`${getCategoryColor(template.category)} text-[9px] px-1.5 py-0`}>
                        {template.category.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground line-clamp-2">
                      {template.description}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUseTemplate(template)
                    }}
                  >
                    <Copy weight="bold" size={12} />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <div className="text-muted-foreground">Steps</div>
                    <div className="font-bold tabular-nums">{template.steps.length}</div>
                  </div>

                  <div>
                    <div className="text-muted-foreground">Duration</div>
                    <div className="font-bold">{formatDuration(template.estimatedDuration)}</div>
                  </div>

                  {template.repeatEnabled && (
                    <div>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Broadcast size={10} />
                        Repeats
                      </div>
                      <div className="font-bold">Yes</div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {selectedTemplate && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold text-muted-foreground mb-1">Description</div>
                <div className="text-sm">{selectedTemplate.description}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-muted-foreground mb-1">Category</div>
                  <Badge className={getCategoryColor(selectedTemplate.category)}>
                    {selectedTemplate.category.toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <div className="text-muted-foreground mb-1">Total Steps</div>
                  <div className="font-bold tabular-nums">{selectedTemplate.steps.length}</div>
                </div>

                <div>
                  <div className="text-muted-foreground mb-1">Duration</div>
                  <div className="font-bold">{formatDuration(selectedTemplate.estimatedDuration)}</div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-xs font-bold mb-2 flex items-center gap-2">
                  <ClockCountdown size={16} />
                  Event Timeline
                </div>
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-2">
                    {selectedTemplate.steps.map((step, index) => {
                      const cumulativeDelay = selectedTemplate.steps
                        .slice(0, index + 1)
                        .reduce((sum, s) => sum + s.delayMs, 0)

                      return (
                        <Card key={index} className="p-2 border-border">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-xs font-bold">Step {index + 1}</div>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                  {step.type.toUpperCase()}
                                </Badge>
                                {step.requiresAck && (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-accent text-accent">
                                    ACK
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                After {formatDuration(step.delayMs)} • Total: {formatDuration(cumulativeDelay)}
                              </div>
                              {step.payload?.message && (
                                <div className="text-[10px] mt-1 text-foreground/80 italic">
                                  "{step.payload.message.slice(0, 60)}{step.payload.message.length > 60 ? '...' : ''}"
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleUseTemplate(selectedTemplate)}>
                <Copy weight="bold" size={14} className="mr-1" />
                Use This Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}
