import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { eventSequencer, type EventSequence, type EventStep, type SequenceExecution } from '@/lib/eventSequencer'
import { 
  Play, 
  Pause, 
  Stop, 
  Plus, 
  Trash, 
  Copy, 
  CalendarBlank,
  ClockCountdown,
  CheckCircle,
  WarningCircle,
  Repeat,
  Broadcast
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface EventSequencerPanelProps {
  maxHeight?: string
  currentUser?: string
  onSequenceStarted?: (sequence: EventSequence) => void
  onSequencePaused?: (sequence: EventSequence) => void
  onSequenceCompleted?: (sequence: EventSequence) => void
}

export function EventSequencerPanel({
  maxHeight = '600px',
  currentUser = 'M-CONSOLE',
  onSequenceStarted,
  onSequencePaused,
  onSequenceCompleted
}: EventSequencerPanelProps) {
  const [sequences, setSequences] = useState<EventSequence[]>([])
  const [executions, setExecutions] = useState<Map<string, SequenceExecution>>(new Map())
  const [selectedSequence, setSelectedSequence] = useState<EventSequence | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const loadSequences = async () => {
    const loaded = await eventSequencer.getSequences()
    setSequences(loaded)

    const execMap = new Map<string, SequenceExecution>()
    for (const seq of loaded) {
      if (seq.status === 'active' || seq.status === 'paused') {
        const exec = await eventSequencer.getExecution(seq.id)
        if (exec) {
          execMap.set(seq.id, exec)
        }
      }
    }
    setExecutions(execMap)
  }

  useEffect(() => {
    loadSequences()
    const interval = setInterval(loadSequences, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleCreateSequence = async (newSequence: Omit<EventSequence, 'id' | 'createdAt' | 'currentStepIndex'>) => {
    const sequence: EventSequence = {
      ...newSequence,
      id: `seq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      currentStepIndex: 0,
      createdBy: currentUser
    }

    await eventSequencer.saveSequence(sequence)
    await loadSequences()
    toast.success(`Sequence "${sequence.name}" created`)
  }

  const handleStartSequence = async (sequenceId: string) => {
    try {
      await eventSequencer.startSequence(sequenceId)
      await loadSequences()
      
      const sequence = sequences.find(s => s.id === sequenceId)
      if (sequence && onSequenceStarted) {
        onSequenceStarted(sequence)
      }
      
      toast.success('Sequence started')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start sequence')
    }
  }

  const handlePauseSequence = async (sequenceId: string) => {
    await eventSequencer.pauseSequence(sequenceId)
    await loadSequences()
    
    const sequence = sequences.find(s => s.id === sequenceId)
    if (sequence && onSequencePaused) {
      onSequencePaused(sequence)
    }
    
    toast.info('Sequence paused')
  }

  const handleResumeSequence = async (sequenceId: string) => {
    await eventSequencer.resumeSequence(sequenceId)
    await loadSequences()
    toast.success('Sequence resumed')
  }

  const handleCancelSequence = async (sequenceId: string) => {
    await eventSequencer.cancelSequence(sequenceId)
    await loadSequences()
    toast.info('Sequence cancelled')
  }

  const handleDeleteSequence = async (sequenceId: string) => {
    await eventSequencer.deleteSequence(sequenceId)
    await loadSequences()
    toast.success('Sequence deleted')
  }

  const handleDuplicateSequence = async (sequenceId: string) => {
    const sequence = sequences.find(s => s.id === sequenceId)
    if (!sequence) return

    const duplicate = await eventSequencer.duplicateSequence(sequenceId, `${sequence.name} (Copy)`)
    await loadSequences()
    toast.success(`Sequence duplicated as "${duplicate.name}"`)
  }

  const getStatusColor = (status: EventSequence['status']) => {
    switch (status) {
      case 'active': return 'bg-primary text-primary-foreground'
      case 'paused': return 'bg-accent text-accent-foreground'
      case 'completed': return 'bg-muted text-muted-foreground'
      case 'cancelled': return 'bg-destructive/20 text-destructive'
      case 'scheduled': return 'bg-accent/50 text-accent-foreground'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  const getStatusIcon = (status: EventSequence['status']) => {
    switch (status) {
      case 'active': return <Play weight="fill" size={12} />
      case 'paused': return <Pause weight="fill" size={12} />
      case 'completed': return <CheckCircle weight="fill" size={12} />
      case 'cancelled': return <WarningCircle weight="fill" size={12} />
      case 'scheduled': return <ClockCountdown weight="fill" size={12} />
      default: return <Stop weight="fill" size={12} />
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const getNextStepTime = (sequence: EventSequence) => {
    const execution = executions.get(sequence.id)
    if (!execution || !execution.nextStepAt) return null

    const msUntil = execution.nextStepAt - Date.now()
    if (msUntil <= 0) return 'Executing now...'

    return `Next in ${formatDuration(msUntil)}`
  }

  return (
    <Card className="border-primary/30 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Broadcast weight="bold" className="text-primary" size={20} />
          <div>
            <div className="text-sm font-bold tracking-wider">EVENT SEQUENCER</div>
            <div className="text-[10px] text-muted-foreground">Automated Broadcast Scheduling</div>
          </div>
        </div>
        <CreateSequenceDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreateSequence={handleCreateSequence}
        />
      </div>

      <Separator className="mb-4" />

      <ScrollArea style={{ maxHeight }}>
        <div className="space-y-3">
          {sequences.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              No event sequences configured
              <div className="text-[10px] mt-1">Create a sequence to automate broadcasts</div>
            </div>
          )}

          {sequences.map(sequence => {
            const execution = executions.get(sequence.id)
            const nextStepTime = getNextStepTime(sequence)
            
            return (
              <Card key={sequence.id} className="p-3 border-border/50 bg-card/50">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-sm font-bold truncate">{sequence.name}</div>
                        <Badge className={`${getStatusColor(sequence.status)} text-[9px] px-1.5 py-0`}>
                          <span className="mr-1">{getStatusIcon(sequence.status)}</span>
                          {sequence.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">
                        {sequence.description}
                      </div>
                    </div>

                    <div className="flex gap-1">
                      {sequence.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={() => handleStartSequence(sequence.id)}
                        >
                          <Play weight="fill" size={12} />
                        </Button>
                      )}

                      {sequence.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={() => handlePauseSequence(sequence.id)}
                        >
                          <Pause weight="fill" size={12} />
                        </Button>
                      )}

                      {sequence.status === 'paused' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() => handleResumeSequence(sequence.id)}
                          >
                            <Play weight="fill" size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() => handleCancelSequence(sequence.id)}
                          >
                            <Stop weight="fill" size={12} />
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={() => handleDuplicateSequence(sequence.id)}
                      >
                        <Copy weight="bold" size={12} />
                      </Button>

                      {(sequence.status === 'draft' || sequence.status === 'completed' || sequence.status === 'cancelled') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteSequence(sequence.id)}
                        >
                          <Trash weight="bold" size={12} />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <div className="text-muted-foreground">Steps</div>
                      <div className="font-bold tabular-nums">
                        {execution ? `${execution.completedSteps.length}/${sequence.steps.length}` : sequence.steps.length}
                      </div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Duration</div>
                      <div className="font-bold">
                        {formatDuration(sequence.steps.reduce((sum, step) => sum + step.delayMs, 0))}
                      </div>
                    </div>

                    {sequence.repeatConfig?.enabled && (
                      <div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Repeat size={10} />
                          Repeat
                        </div>
                        <div className="font-bold tabular-nums">
                          {sequence.repeatConfig.maxRepeats 
                            ? `${sequence.repeatConfig.currentRepeat}/${sequence.repeatConfig.maxRepeats}`
                            : '∞'}
                        </div>
                      </div>
                    )}
                  </div>

                  {nextStepTime && (
                    <div className="text-[10px] text-primary animate-pulse">
                      {nextStepTime}
                    </div>
                  )}

                  {execution && execution.status === 'failed' && (
                    <div className="text-[10px] text-destructive">
                      Error: {execution.error}
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full h-6 text-[10px]"
                    onClick={() => {
                      setSelectedSequence(sequence)
                      setEditDialogOpen(true)
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </ScrollArea>

      {selectedSequence && (
        <SequenceDetailsDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          sequence={selectedSequence}
          execution={executions.get(selectedSequence.id)}
        />
      )}
    </Card>
  )
}

interface CreateSequenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateSequence: (sequence: Omit<EventSequence, 'id' | 'createdAt' | 'currentStepIndex'>) => void
}

function CreateSequenceDialog({ open, onOpenChange, onCreateSequence }: CreateSequenceDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<Omit<EventStep, 'id'>[]>([])

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Sequence name is required')
      return
    }

    if (steps.length === 0) {
      toast.error('At least one step is required')
      return
    }

    const stepsWithIds: EventStep[] = steps.map((step, index) => ({
      ...step,
      id: `step-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
    }))

    onCreateSequence({
      name: name.trim(),
      description: description.trim(),
      status: 'draft',
      createdBy: 'M-CONSOLE',
      steps: stepsWithIds
    })

    setName('')
    setDescription('')
    setSteps([])
    onOpenChange(false)
  }

  const handleAddStep = () => {
    setSteps([...steps, {
      type: 'ping',
      delayMs: 5000,
      payload: { message: 'New broadcast', priority: 'normal' }
    }])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus weight="bold" size={14} className="mr-1" />
          New Sequence
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Event Sequence</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold mb-1 block">Sequence Name</label>
            <Input
              placeholder="Mission Briefing Sequence"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold mb-1 block">Description</label>
            <Textarea
              placeholder="Automated sequence that sends briefing materials..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm min-h-[60px]"
            />
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold">Event Steps</label>
              <Button size="sm" variant="outline" onClick={handleAddStep} className="h-6 text-xs">
                <Plus weight="bold" size={12} className="mr-1" />
                Add Step
              </Button>
            </div>

            {steps.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-xs">
                No steps added yet
              </div>
            )}

            <div className="space-y-2">
              {steps.map((step, index) => (
                <Card key={index} className="p-3 bg-muted/30">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold">Step {index + 1}</div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 text-destructive"
                        onClick={() => setSteps(steps.filter((_, i) => i !== index))}
                      >
                        <Trash weight="bold" size={12} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Type</label>
                        <Select
                          value={step.type}
                          onValueChange={(value) => {
                            const newSteps = [...steps]
                            newSteps[index].type = value as EventStep['type']
                            setSteps(newSteps)
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ping">M-Ping</SelectItem>
                            <SelectItem value="ops-update">Ops Update</SelectItem>
                            <SelectItem value="annotation">Annotation</SelectItem>
                            <SelectItem value="dispatch">Dispatch</SelectItem>
                            <SelectItem value="broadcast">General Broadcast</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Delay (seconds)</label>
                        <Input
                          type="number"
                          value={step.delayMs / 1000}
                          onChange={(e) => {
                            const newSteps = [...steps]
                            newSteps[index].delayMs = Number(e.target.value) * 1000
                            setSteps(newSteps)
                          }}
                          className="h-7 text-xs"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>
            Create Sequence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface SequenceDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sequence: EventSequence
  execution?: SequenceExecution
}

function SequenceDetailsDialog({ open, onOpenChange, sequence, execution }: SequenceDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sequence.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="text-xs font-bold text-muted-foreground mb-1">Description</div>
            <div className="text-sm">{sequence.description || 'No description'}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-muted-foreground mb-1">Status</div>
              <Badge className="text-xs">{sequence.status.toUpperCase()}</Badge>
            </div>

            <div>
              <div className="text-muted-foreground mb-1">Created By</div>
              <div className="font-mono">{sequence.createdBy}</div>
            </div>

            <div>
              <div className="text-muted-foreground mb-1">Total Steps</div>
              <div className="font-bold tabular-nums">{sequence.steps.length}</div>
            </div>

            {execution && (
              <div>
                <div className="text-muted-foreground mb-1">Completed</div>
                <div className="font-bold tabular-nums">
                  {execution.completedSteps.length} / {sequence.steps.length}
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <div className="text-xs font-bold mb-2">Event Steps</div>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {sequence.steps.map((step, index) => {
                  const isCompleted = execution?.completedSteps.includes(step.id)
                  const isCurrent = execution?.currentStepId === step.id

                  return (
                    <Card
                      key={step.id}
                      className={`p-2 ${
                        isCurrent ? 'border-primary bg-primary/10' : 
                        isCompleted ? 'border-muted bg-muted/30' : 
                        'border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-xs font-bold">Step {index + 1}</div>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              {step.type.toUpperCase()}
                            </Badge>
                            {isCompleted && (
                              <CheckCircle weight="fill" className="text-primary" size={14} />
                            )}
                            {isCurrent && (
                              <ClockCountdown weight="fill" className="text-primary animate-pulse" size={14} />
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Delay: {step.delayMs / 1000}s
                            {step.requiresAck && ' • Requires Acknowledgment'}
                          </div>
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
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
