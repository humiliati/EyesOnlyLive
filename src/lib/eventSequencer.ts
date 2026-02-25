import type { MConsoleBroadcast } from './mConsoleSync'

export interface ConditionalBranch {
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

export interface EventStep {
  id: string
  type: 'broadcast' | 'annotation' | 'dispatch' | 'lane-update' | 'scenario-deploy' | 'patrol-route' | 'ping' | 'ops-update'
  delayMs: number
  payload: any
  targetAgents?: string[]
  requiresAck?: boolean
  autoExpireMs?: number
  branches?: ConditionalBranch[]
  isBranchStep?: boolean
  condition?: {
    type: 'time-elapsed' | 'ack-received' | 'location-reached' | 'manual-trigger'
    value?: any
  }
}

export interface EventSequence {
  id: string
  name: string
  description: string
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled'
  createdAt: number
  createdBy: string
  scheduledStart?: number
  actualStart?: number
  completedAt?: number
  steps: EventStep[]
  currentStepIndex: number
  repeatConfig?: {
    enabled: boolean
    intervalMs: number
    maxRepeats?: number
    currentRepeat: number
  }
  tags?: string[]
  scenarioId?: string
}

export interface SequenceExecution {
  sequenceId: string
  executionId: string
  startedAt: number
  status: 'running' | 'paused' | 'completed' | 'failed'
  completedSteps: string[]
  currentStepId?: string
  nextStepAt?: number
  error?: string
}

class EventSequencer {
  private kvPrefix = 'event-sequencer'
  private executionInterval: number | null = null
  private executionCheckIntervalMs = 1000

  async getSequences(): Promise<EventSequence[]> {
    const sequences = await window.spark.kv.get<EventSequence[]>(`${this.kvPrefix}:sequences`)
    return sequences || []
  }

  async getSequence(sequenceId: string): Promise<EventSequence | undefined> {
    const sequences = await this.getSequences()
    return sequences.find(s => s.id === sequenceId)
  }

  async saveSequence(sequence: EventSequence): Promise<void> {
    const sequences = await this.getSequences()
    const index = sequences.findIndex(s => s.id === sequence.id)
    
    if (index >= 0) {
      sequences[index] = sequence
    } else {
      sequences.push(sequence)
    }
    
    await window.spark.kv.set(`${this.kvPrefix}:sequences`, sequences)
  }

  async deleteSequence(sequenceId: string): Promise<void> {
    const sequences = await this.getSequences()
    const filtered = sequences.filter(s => s.id !== sequenceId)
    await window.spark.kv.set(`${this.kvPrefix}:sequences`, filtered)
    
    await window.spark.kv.delete(`${this.kvPrefix}:execution:${sequenceId}`)
  }

  async getExecution(sequenceId: string): Promise<SequenceExecution | undefined> {
    return await window.spark.kv.get<SequenceExecution>(`${this.kvPrefix}:execution:${sequenceId}`)
  }

  async saveExecution(execution: SequenceExecution): Promise<void> {
    await window.spark.kv.set(`${this.kvPrefix}:execution:${execution.sequenceId}`, execution)
  }

  async startSequence(sequenceId: string): Promise<void> {
    const sequence = await this.getSequence(sequenceId)
    if (!sequence) {
      throw new Error(`Sequence ${sequenceId} not found`)
    }

    const execution: SequenceExecution = {
      sequenceId,
      executionId: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startedAt: Date.now(),
      status: 'running',
      completedSteps: [],
      currentStepId: sequence.steps.length > 0 ? sequence.steps[0].id : undefined,
      nextStepAt: sequence.steps.length > 0 ? Date.now() + sequence.steps[0].delayMs : undefined
    }

    sequence.status = 'active'
    sequence.actualStart = Date.now()
    sequence.currentStepIndex = 0

    await this.saveSequence(sequence)
    await this.saveExecution(execution)

    this.startExecutionLoop()
  }

  async pauseSequence(sequenceId: string): Promise<void> {
    const sequence = await this.getSequence(sequenceId)
    if (!sequence) return

    const execution = await this.getExecution(sequenceId)
    if (!execution) return

    sequence.status = 'paused'
    execution.status = 'paused'

    await this.saveSequence(sequence)
    await this.saveExecution(execution)
  }

  async resumeSequence(sequenceId: string): Promise<void> {
    const sequence = await this.getSequence(sequenceId)
    if (!sequence) return

    const execution = await this.getExecution(sequenceId)
    if (!execution) return

    sequence.status = 'active'
    execution.status = 'running'

    await this.saveSequence(sequence)
    await this.saveExecution(execution)

    this.startExecutionLoop()
  }

  async cancelSequence(sequenceId: string): Promise<void> {
    const sequence = await this.getSequence(sequenceId)
    if (!sequence) return

    sequence.status = 'cancelled'
    await this.saveSequence(sequence)
    await window.spark.kv.delete(`${this.kvPrefix}:execution:${sequenceId}`)
  }

  async duplicateSequence(sequenceId: string, newName: string): Promise<EventSequence> {
    const sequence = await this.getSequence(sequenceId)
    if (!sequence) {
      throw new Error(`Sequence ${sequenceId} not found`)
    }

    const duplicate: EventSequence = {
      ...sequence,
      id: `seq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newName,
      status: 'draft',
      createdAt: Date.now(),
      actualStart: undefined,
      completedAt: undefined,
      currentStepIndex: 0
    }

    await this.saveSequence(duplicate)
    return duplicate
  }

  private startExecutionLoop(): void {
    if (this.executionInterval) {
      return
    }

    this.executionInterval = window.setInterval(async () => {
      await this.checkAndExecuteSteps()
    }, this.executionCheckIntervalMs)

    this.checkAndExecuteSteps()
  }

  private stopExecutionLoop(): void {
    if (this.executionInterval) {
      clearInterval(this.executionInterval)
      this.executionInterval = null
    }
  }

  private async checkAndExecuteSteps(): Promise<void> {
    const sequences = await this.getSequences()
    const activeSequences = sequences.filter(s => s.status === 'active')

    if (activeSequences.length === 0) {
      this.stopExecutionLoop()
      return
    }

    for (const sequence of activeSequences) {
      const execution = await this.getExecution(sequence.id)
      if (!execution || execution.status !== 'running') continue

      if (execution.nextStepAt && Date.now() >= execution.nextStepAt) {
        await this.executeNextStep(sequence, execution)
      }
    }
  }

  private async executeNextStep(sequence: EventSequence, execution: SequenceExecution): Promise<void> {
    const step = sequence.steps[sequence.currentStepIndex]
    if (!step) {
      await this.completeSequence(sequence, execution)
      return
    }

    try {
      await this.broadcastStep(step, sequence)

      if (step.isBranchStep && step.branches && step.branches.length > 0) {
        await this.evaluateAndExecuteBranches(step, sequence, execution)
      }

      execution.completedSteps.push(step.id)
      sequence.currentStepIndex++

      if (sequence.currentStepIndex < sequence.steps.length) {
        const nextStep = sequence.steps[sequence.currentStepIndex]
        execution.currentStepId = nextStep.id
        execution.nextStepAt = Date.now() + nextStep.delayMs
      } else {
        if (sequence.repeatConfig?.enabled && 
            (!sequence.repeatConfig.maxRepeats || 
             sequence.repeatConfig.currentRepeat < sequence.repeatConfig.maxRepeats)) {
          
          sequence.repeatConfig.currentRepeat++
          sequence.currentStepIndex = 0
          
          const firstStep = sequence.steps[0]
          execution.currentStepId = firstStep.id
          execution.nextStepAt = Date.now() + sequence.repeatConfig.intervalMs
          execution.completedSteps = []
        } else {
          await this.completeSequence(sequence, execution)
          return
        }
      }

      await this.saveSequence(sequence)
      await this.saveExecution(execution)
    } catch (error) {
      execution.status = 'failed'
      execution.error = error instanceof Error ? error.message : 'Unknown error'
      sequence.status = 'cancelled'
      
      await this.saveSequence(sequence)
      await this.saveExecution(execution)
    }
  }

  private async evaluateAndExecuteBranches(step: EventStep, sequence: EventSequence, execution: SequenceExecution): Promise<void> {
    if (!step.branches) return

    for (const branch of step.branches) {
      const shouldExecute = await this.evaluateBranchCondition(branch, step, sequence)
      
      if (shouldExecute) {
        for (const branchStep of branch.steps) {
          await this.broadcastStep(branchStep, sequence)
          
          if (branchStep.delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, branchStep.delayMs))
          }
        }
      }
    }
  }

  private async evaluateBranchCondition(branch: ConditionalBranch, parentStep: EventStep, sequence: EventSequence): Promise<boolean> {
    const { condition } = branch

    switch (condition.type) {
      case 'always':
        return true

      case 'ack-received': {
        if (!parentStep.requiresAck) return false
        
        const broadcasts = await window.spark.kv.get<any[]>('m-console-sync:broadcasts') || []
        const parentBroadcast = broadcasts.find(b => 
          b.payload?.message === parentStep.payload?.message &&
          b.timestamp >= (sequence.actualStart || 0)
        )
        
        if (!parentBroadcast) return false

        const ackKey = `m-console-sync:acknowledgments:${parentBroadcast.id}`
        const acknowledgments = await window.spark.kv.get<any[]>(ackKey) || []
        
        if (condition.requireAllAgents && parentStep.targetAgents) {
          return acknowledgments.length >= parentStep.targetAgents.length
        }
        
        return acknowledgments.length > 0
      }

      case 'ack-not-received': {
        if (!parentStep.requiresAck || !condition.timeoutMs) return false
        
        const broadcasts = await window.spark.kv.get<any[]>('m-console-sync:broadcasts') || []
        const parentBroadcast = broadcasts.find(b => 
          b.payload?.message === parentStep.payload?.message &&
          b.timestamp >= (sequence.actualStart || 0)
        )
        
        if (!parentBroadcast) return true
        
        const elapsedMs = Date.now() - parentBroadcast.timestamp
        if (elapsedMs < condition.timeoutMs) return false

        const ackKey = `m-console-sync:acknowledgments:${parentBroadcast.id}`
        const acknowledgments = await window.spark.kv.get<any[]>(ackKey) || []
        
        return acknowledgments.length === 0
      }

      case 'game-frozen': {
        const gameState = await window.spark.kv.get<any>('game-state-sync:state')
        return gameState?.frozen === true
      }

      case 'game-unfrozen': {
        const gameState = await window.spark.kv.get<any>('game-state-sync:state')
        return gameState?.frozen === false
      }

      case 'time-elapsed': {
        if (!condition.timeoutMs) return false
        const elapsedMs = Date.now() - (sequence.actualStart || Date.now())
        return elapsedMs >= condition.timeoutMs
      }

      default:
        return false
    }
  }

  private async broadcastStep(step: EventStep, sequence: EventSequence): Promise<void> {
    const broadcast: MConsoleBroadcast = {
      id: `bcast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: this.mapStepTypeToBroadcastType(step.type),
      payload: step.payload,
      timestamp: Date.now(),
      broadcastBy: sequence.createdBy,
      targetAgents: step.targetAgents,
      requiresAck: step.requiresAck,
      autoExpireMs: step.autoExpireMs
    }

    const broadcasts = await window.spark.kv.get<MConsoleBroadcast[]>('m-console-sync:broadcasts') || []
    broadcasts.push(broadcast)
    await window.spark.kv.set('m-console-sync:broadcasts', broadcasts)
  }

  private mapStepTypeToBroadcastType(stepType: EventStep['type']): MConsoleBroadcast['type'] {
    const mapping: Record<EventStep['type'], MConsoleBroadcast['type']> = {
      'broadcast': 'general',
      'annotation': 'annotation-update',
      'dispatch': 'dispatch-command',
      'lane-update': 'lane-update',
      'scenario-deploy': 'scenario-deploy',
      'patrol-route': 'patrol-route-deploy',
      'ping': 'm-ping',
      'ops-update': 'ops-update'
    }
    return mapping[stepType] || 'general'
  }

  private async completeSequence(sequence: EventSequence, execution: SequenceExecution): Promise<void> {
    sequence.status = 'completed'
    sequence.completedAt = Date.now()
    execution.status = 'completed'
    execution.currentStepId = undefined
    execution.nextStepAt = undefined

    await this.saveSequence(sequence)
    await this.saveExecution(execution)
  }

  async getActiveSequencesCount(): Promise<number> {
    const sequences = await this.getSequences()
    return sequences.filter(s => s.status === 'active').length
  }

  async getScheduledSequences(): Promise<EventSequence[]> {
    const sequences = await this.getSequences()
    return sequences.filter(s => s.status === 'scheduled')
  }

  async scheduleSequence(sequenceId: string, startTime: number): Promise<void> {
    const sequence = await this.getSequence(sequenceId)
    if (!sequence) return

    sequence.status = 'scheduled'
    sequence.scheduledStart = startTime
    await this.saveSequence(sequence)
  }

  startScheduleChecker(): void {
    setInterval(async () => {
      const scheduled = await this.getScheduledSequences()
      const now = Date.now()

      for (const sequence of scheduled) {
        if (sequence.scheduledStart && now >= sequence.scheduledStart) {
          await this.startSequence(sequence.id)
        }
      }
    }, 5000)
  }
}

export const eventSequencer = new EventSequencer()
