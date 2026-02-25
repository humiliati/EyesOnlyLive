import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { eventSequencer, type EventSequence, type EventStep } from '@/lib/eventSequencer'
import { 
  Plus,
  Trash,
  Copy,
  ArrowDown,
  ArrowsDownUp,
  GitBranch,
  Clock,
  CheckCircle,
  MapPin,
  User,
  Broadcast,
  Warning,
  FloppyDisk,
  X,
  CaretRight,
  CaretDown,
  Lightning
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ConditionalBranch {
  id: string
  condition: {
    type: 'ack-received' | 'ack-not-received' | 'game-frozen' | 'game-unfrozen' | 'time-elapsed' | 'always'
    targetAgents?: string[]
    timeoutMs?: number
    agentCount?: number
    requireAllAgents?: boolean
  }
  steps: EventStep[]
  label: string
}

interface BranchingEventStep extends EventStep {
  branches?: ConditionalBranch[]
  isBranchStep?: boolean
}

interface VisualTimelineEditorProps {
  sequenceId?: string
  onSave?: (sequence: EventSequence) => void
  onCancel?: () => void
  maxHeight?: string
}

export function VisualTimelineEditor({
  sequenceId,
  onSave,
  onCancel,
  maxHeight = '700px'
}: VisualTimelineEditorProps) {
  const [sequence, setSequence] = useState<EventSequence | null>(null)
  const [steps, setSteps] = useState<BranchingEventStep[]>([])
  const [draggedStep, setDraggedStep] = useState<{ step: BranchingEventStep; index: number } | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [editingStep, setEditingStep] = useState<BranchingEventStep | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [branchDialogOpen, setBranchDialogOpen] = useState(false)
  const [selectedStepForBranch, setSelectedStepForBranch] = useState<number | null>(null)
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set())
  const [sequenceName, setSequenceName] = useState('')
  const [sequenceDescription, setSequenceDescription] = useState('')

  useEffect(() => {
    if (sequenceId) {
      loadSequence()
    } else {
      setSequence({
        id: `seq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: 'New Sequence',
        description: '',
        status: 'draft',
        createdAt: Date.now(),
        createdBy: 'M-CONSOLE',
        steps: [],
        currentStepIndex: 0
      })
      setSequenceName('New Sequence')
      setSequenceDescription('')
      setSteps([])
    }
  }, [sequenceId])

  const loadSequence = async () => {
    if (!sequenceId) return
    const loaded = await eventSequencer.getSequence(sequenceId)
    if (loaded) {
      setSequence(loaded)
      setSequenceName(loaded.name)
      setSequenceDescription(loaded.description)
      setSteps(loaded.steps as BranchingEventStep[])
    }
  }

  const handleDragStart = (step: BranchingEventStep, index: number) => {
    setDraggedStep({ step, index })
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    if (draggedStep !== null && dragOverIndex !== null && draggedStep.index !== dragOverIndex) {
      const newSteps = [...steps]
      const [removed] = newSteps.splice(draggedStep.index, 1)
      newSteps.splice(dragOverIndex, 0, removed)
      setSteps(newSteps)
      toast.success('Step reordered')
    }
    setDraggedStep(null)
    setDragOverIndex(null)
  }

  const handleAddStep = () => {
    const newStep: BranchingEventStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'broadcast',
      delayMs: 0,
      payload: {
        message: 'New broadcast message',
        priority: 'normal'
      },
      requiresAck: false
    }
    setSteps([...steps, newStep])
    toast.success('Step added')
  }

  const handleDeleteStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
    setSteps(newSteps)
    toast.success('Step deleted')
  }

  const handleDuplicateStep = (index: number) => {
    const stepToDuplicate = steps[index]
    const duplicatedStep: BranchingEventStep = {
      ...stepToDuplicate,
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      branches: stepToDuplicate.branches?.map(branch => ({
        ...branch,
        id: `branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        steps: branch.steps.map(s => ({
          ...s,
          id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }))
      }))
    }
    const newSteps = [...steps]
    newSteps.splice(index + 1, 0, duplicatedStep)
    setSteps(newSteps)
    toast.success('Step duplicated')
  }

  const handleEditStep = (step: BranchingEventStep) => {
    setEditingStep({ ...step })
    setEditDialogOpen(true)
  }

  const handleSaveStep = () => {
    if (!editingStep) return
    
    const index = steps.findIndex(s => s.id === editingStep.id)
    if (index >= 0) {
      const newSteps = [...steps]
      newSteps[index] = editingStep
      setSteps(newSteps)
      toast.success('Step updated')
    }
    
    setEditDialogOpen(false)
    setEditingStep(null)
  }

  const handleAddBranch = (stepIndex: number) => {
    setSelectedStepForBranch(stepIndex)
    setBranchDialogOpen(true)
  }

  const handleSaveBranch = (branch: ConditionalBranch) => {
    if (selectedStepForBranch === null) return

    const newSteps = [...steps]
    const step = newSteps[selectedStepForBranch]
    
    if (!step.branches) {
      step.branches = []
    }
    
    step.branches.push(branch)
    step.isBranchStep = true
    
    setSteps(newSteps)
    setBranchDialogOpen(false)
    setSelectedStepForBranch(null)
    toast.success('Branch added')
  }

  const handleDeleteBranch = (stepIndex: number, branchId: string) => {
    const newSteps = [...steps]
    const step = newSteps[stepIndex]
    
    if (step.branches) {
      step.branches = step.branches.filter(b => b.id !== branchId)
      if (step.branches.length === 0) {
        step.isBranchStep = false
        delete step.branches
      }
    }
    
    setSteps(newSteps)
    toast.success('Branch deleted')
  }

  const toggleBranchExpansion = (branchId: string) => {
    const newExpanded = new Set(expandedBranches)
    if (newExpanded.has(branchId)) {
      newExpanded.delete(branchId)
    } else {
      newExpanded.add(branchId)
    }
    setExpandedBranches(newExpanded)
  }

  const handleSaveSequence = async () => {
    if (!sequence) return

    const updatedSequence: EventSequence = {
      ...sequence,
      name: sequenceName,
      description: sequenceDescription,
      steps: steps as EventStep[]
    }

    await eventSequencer.saveSequence(updatedSequence)
    toast.success('Sequence saved')
    
    if (onSave) {
      onSave(updatedSequence)
    }
  }

  const getStepTypeIcon = (type: EventStep['type']) => {
    switch (type) {
      case 'broadcast': return <Broadcast weight="bold" size={16} />
      case 'annotation': return <MapPin weight="bold" size={16} />
      case 'dispatch': return <User weight="bold" size={16} />
      case 'ping': return <Lightning weight="bold" size={16} />
      default: return <Broadcast weight="bold" size={16} />
    }
  }

  const getStepTypeColor = (type: EventStep['type']) => {
    switch (type) {
      case 'broadcast': return 'bg-primary/20 text-primary border-primary'
      case 'annotation': return 'bg-accent/20 text-accent border-accent'
      case 'dispatch': return 'bg-blue-500/20 text-blue-400 border-blue-500'
      case 'ping': return 'bg-amber-500/20 text-amber-400 border-amber-500'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getConditionIcon = (type: ConditionalBranch['condition']['type']) => {
    switch (type) {
      case 'ack-received': return <CheckCircle weight="bold" size={14} />
      case 'ack-not-received': return <Warning weight="bold" size={14} />
      case 'time-elapsed': return <Clock weight="bold" size={14} />
      default: return <GitBranch weight="bold" size={14} />
    }
  }

  return (
    <Card className="border-primary/30">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ArrowsDownUp weight="bold" className="text-primary" size={20} />
            <span className="text-sm font-bold tracking-wide uppercase">Visual Timeline Editor</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleAddStep}>
              <Plus weight="bold" size={14} className="mr-1" />
              Add Step
            </Button>
            <Button size="sm" onClick={handleSaveSequence}>
              <FloppyDisk weight="bold" size={14} className="mr-1" />
              Save
            </Button>
            {onCancel && (
              <Button size="sm" variant="ghost" onClick={onCancel}>
                <X weight="bold" size={14} />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Input
            placeholder="Sequence Name"
            value={sequenceName}
            onChange={(e) => setSequenceName(e.target.value)}
            className="font-bold"
          />
          <Textarea
            placeholder="Sequence Description"
            value={sequenceDescription}
            onChange={(e) => setSequenceDescription(e.target.value)}
            rows={2}
            className="text-xs"
          />
        </div>
      </div>

      <ScrollArea style={{ maxHeight }}>
        <div className="p-4 space-y-2">
          {steps.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-xs">
              <ArrowsDownUp weight="bold" size={32} className="mx-auto mb-2 opacity-30" />
              <div>No steps yet. Click "Add Step" to begin.</div>
            </div>
          )}

          {steps.map((step, index) => (
            <div key={step.id}>
              <div
                draggable
                onDragStart={() => handleDragStart(step, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  relative border rounded-md p-3 cursor-move transition-all
                  ${dragOverIndex === index ? 'border-primary bg-primary/5' : 'border-border'}
                  ${draggedStep?.index === index ? 'opacity-50' : 'opacity-100'}
                  hover:border-primary/50
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="text-[10px] text-muted-foreground font-bold mb-1">
                      STEP {index + 1}
                    </div>
                    <Badge variant="outline" className={`${getStepTypeColor(step.type)} text-[9px] px-1.5 py-0.5`}>
                      {getStepTypeIcon(step.type)}
                      <span className="ml-1">{step.type.toUpperCase()}</span>
                    </Badge>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium mb-1">
                      {step.type === 'broadcast' && step.payload?.message}
                      {step.type === 'annotation' && step.payload?.annotation?.label}
                      {step.type === 'dispatch' && step.payload?.directive}
                      {step.type === 'ping' && step.payload?.message}
                      {!step.payload?.message && !step.payload?.annotation && !step.payload?.directive && 'Unconfigured step'}
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock weight="bold" size={10} />
                        <span>{step.delayMs / 1000}s delay</span>
                      </div>
                      
                      {step.requiresAck && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 border-accent text-accent">
                          REQUIRES ACK
                        </Badge>
                      )}
                      
                      {step.targetAgents && step.targetAgents.length > 0 && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0">
                          {step.targetAgents.length} agents
                        </Badge>
                      )}
                      
                      {step.isBranchStep && step.branches && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary text-primary">
                          <GitBranch weight="bold" size={10} className="mr-0.5" />
                          {step.branches.length} branch{step.branches.length !== 1 ? 'es' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditStep(step)}
                      className="h-7 w-7 p-0"
                    >
                      <ArrowsDownUp weight="bold" size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddBranch(index)}
                      className="h-7 w-7 p-0"
                    >
                      <GitBranch weight="bold" size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDuplicateStep(index)}
                      className="h-7 w-7 p-0"
                    >
                      <Copy weight="bold" size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteStep(index)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash weight="bold" size={14} />
                    </Button>
                  </div>
                </div>

                {step.isBranchStep && step.branches && step.branches.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    {step.branches.map((branch) => (
                      <div key={branch.id} className="ml-4 border-l-2 border-primary/30 pl-3">
                        <div 
                          className="flex items-center justify-between cursor-pointer hover:bg-muted/30 p-2 rounded -ml-3"
                          onClick={() => toggleBranchExpansion(branch.id)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedBranches.has(branch.id) ? (
                              <CaretDown weight="bold" size={12} className="text-primary" />
                            ) : (
                              <CaretRight weight="bold" size={12} className="text-primary" />
                            )}
                            {getConditionIcon(branch.condition.type)}
                            <span className="text-[10px] font-medium">{branch.label}</span>
                            <Badge variant="outline" className="text-[8px] px-1 py-0">
                              {branch.steps.length} step{branch.steps.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteBranch(index, branch.id)
                            }}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash weight="bold" size={12} />
                          </Button>
                        </div>

                        {expandedBranches.has(branch.id) && (
                          <div className="mt-2 space-y-1 ml-4">
                            {branch.steps.map((branchStep, branchStepIndex) => (
                              <div key={branchStep.id} className="text-[10px] p-2 bg-muted/30 rounded border border-border/50">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={`${getStepTypeColor(branchStep.type)} text-[8px] px-1 py-0`}>
                                    {getStepTypeIcon(branchStep.type)}
                                  </Badge>
                                  <span className="font-medium">Branch Step {branchStepIndex + 1}</span>
                                </div>
                                <div className="text-muted-foreground mt-1">
                                  {branchStep.payload?.message || 'No message'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {index < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown weight="bold" size={16} className="text-muted-foreground/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <StepEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        step={editingStep}
        onStepChange={setEditingStep}
        onSave={handleSaveStep}
      />

      <BranchDialog
        open={branchDialogOpen}
        onOpenChange={setBranchDialogOpen}
        onSave={handleSaveBranch}
      />
    </Card>
  )
}

interface StepEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  step: BranchingEventStep | null
  onStepChange: (step: BranchingEventStep) => void
  onSave: () => void
}

function StepEditDialog({ open, onOpenChange, step, onStepChange, onSave }: StepEditDialogProps) {
  if (!step) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Step</DialogTitle>
          <DialogDescription>Configure step parameters and conditions</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          <div className="space-y-2">
            <Label>Step Type</Label>
            <Select
              value={step.type}
              onValueChange={(value) => onStepChange({ ...step, type: value as EventStep['type'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="broadcast">Broadcast</SelectItem>
                <SelectItem value="annotation">Annotation</SelectItem>
                <SelectItem value="dispatch">Dispatch</SelectItem>
                <SelectItem value="ping">M Ping</SelectItem>
                <SelectItem value="ops-update">Ops Update</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Delay (seconds)</Label>
            <Input
              type="number"
              value={step.delayMs / 1000}
              onChange={(e) => onStepChange({ ...step, delayMs: parseInt(e.target.value) * 1000 })}
              min={0}
            />
          </div>

          {step.type === 'broadcast' && (
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={step.payload?.message || ''}
                onChange={(e) => onStepChange({
                  ...step,
                  payload: { ...step.payload, message: e.target.value }
                })}
                rows={3}
              />
            </div>
          )}

          {step.type === 'ping' && (
            <div className="space-y-2">
              <Label>Ping Message</Label>
              <Textarea
                value={step.payload?.message || ''}
                onChange={(e) => onStepChange({
                  ...step,
                  payload: { ...step.payload, message: e.target.value }
                })}
                rows={3}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={step.payload?.priority || 'normal'}
              onValueChange={(value) => onStepChange({
                ...step,
                payload: { ...step.payload, priority: value }
              })}
            >
              <SelectTrigger>
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

          <div className="flex items-center justify-between">
            <Label>Requires Acknowledgment</Label>
            <Switch
              checked={step.requiresAck || false}
              onCheckedChange={(checked) => onStepChange({ ...step, requiresAck: checked })}
            />
          </div>

          {step.requiresAck && (
            <div className="space-y-2">
              <Label>Auto-Expire (seconds, 0 = never)</Label>
              <Input
                type="number"
                value={(step.autoExpireMs || 0) / 1000}
                onChange={(e) => onStepChange({
                  ...step,
                  autoExpireMs: parseInt(e.target.value) * 1000
                })}
                min={0}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave}>Save Step</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface BranchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (branch: ConditionalBranch) => void
}

function BranchDialog({ open, onOpenChange, onSave }: BranchDialogProps) {
  const [conditionType, setConditionType] = useState<ConditionalBranch['condition']['type']>('ack-received')
  const [label, setLabel] = useState('')
  const [timeoutMs, setTimeoutMs] = useState(30000)
  const [requireAllAgents, setRequireAllAgents] = useState(false)
  const [branchSteps, setBranchSteps] = useState<EventStep[]>([])

  const handleAddBranchStep = () => {
    const newStep: EventStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'broadcast',
      delayMs: 0,
      payload: {
        message: 'Branch action',
        priority: 'normal'
      }
    }
    setBranchSteps([...branchSteps, newStep])
  }

  const handleSave = () => {
    const branch: ConditionalBranch = {
      id: `branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      condition: {
        type: conditionType,
        timeoutMs: conditionType === 'time-elapsed' || conditionType === 'ack-not-received' ? timeoutMs : undefined,
        requireAllAgents: conditionType === 'ack-received' ? requireAllAgents : undefined
      },
      steps: branchSteps,
      label: label || `${conditionType} branch`
    }
    
    onSave(branch)
    
    setConditionType('ack-received')
    setLabel('')
    setTimeoutMs(30000)
    setRequireAllAgents(false)
    setBranchSteps([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Conditional Branch</DialogTitle>
          <DialogDescription>
            Create a branch that executes based on player acknowledgments or game state
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          <div className="space-y-2">
            <Label>Branch Label</Label>
            <Input
              placeholder="e.g., 'If acknowledged' or 'On timeout'"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Condition Type</Label>
            <Select value={conditionType} onValueChange={(value) => setConditionType(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ack-received">Acknowledgment Received</SelectItem>
                <SelectItem value="ack-not-received">Acknowledgment Not Received (Timeout)</SelectItem>
                <SelectItem value="game-frozen">Game is Frozen</SelectItem>
                <SelectItem value="game-unfrozen">Game is Unfrozen</SelectItem>
                <SelectItem value="time-elapsed">Time Elapsed</SelectItem>
                <SelectItem value="always">Always Execute</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(conditionType === 'time-elapsed' || conditionType === 'ack-not-received') && (
            <div className="space-y-2">
              <Label>Timeout (seconds)</Label>
              <Input
                type="number"
                value={timeoutMs / 1000}
                onChange={(e) => setTimeoutMs(parseInt(e.target.value) * 1000)}
                min={1}
              />
            </div>
          )}

          {conditionType === 'ack-received' && (
            <div className="flex items-center justify-between">
              <Label>Require All Agents to Acknowledge</Label>
              <Switch
                checked={requireAllAgents}
                onCheckedChange={setRequireAllAgents}
              />
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Branch Steps ({branchSteps.length})</Label>
              <Button size="sm" variant="outline" onClick={handleAddBranchStep}>
                <Plus weight="bold" size={14} className="mr-1" />
                Add Step
              </Button>
            </div>

            {branchSteps.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-xs">
                No steps in this branch yet
              </div>
            )}

            {branchSteps.map((step, index) => (
              <div key={step.id} className="border border-border rounded p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Step {index + 1}: {step.type}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setBranchSteps(branchSteps.filter((_, i) => i !== index))}
                    className="h-6 w-6 p-0"
                  >
                    <Trash weight="bold" size={12} />
                  </Button>
                </div>
                <div className="text-muted-foreground mt-1">
                  {step.payload?.message || 'No message'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={branchSteps.length === 0}>
            Add Branch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
