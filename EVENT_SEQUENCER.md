# Event Sequencer - Automated Broadcast Scheduling

## Overview

The Event Sequencer is a powerful M-Console tool that automates the delivery of multiple broadcasts on a precise schedule. It allows game masters to pre-configure complex sequences of events that will trigger automatically, creating dynamic narrative experiences without manual intervention.

## Core Features

### 1. Sequence Management
- **Create Sequences**: Build multi-step event chains with customizable timing
- **Edit & Duplicate**: Clone existing sequences for rapid iteration
- **Status Tracking**: Monitor active, paused, scheduled, and completed sequences
- **Execution Control**: Start, pause, resume, or cancel sequences at any time

### 2. Event Steps
Each sequence consists of multiple event steps that execute in order:

- **M-Ping**: Send priority messages requiring acknowledgment
- **Ops Update**: Broadcast operational status updates
- **Annotation**: Create tactical map markers
- **Dispatch**: Move assets to specific grid locations
- **General Broadcast**: Custom messages to agents

### 3. Timing Controls
- **Delay Configuration**: Set precise delays between steps (in seconds/milliseconds)
- **Conditional Triggers**: Execute based on time elapsed, acknowledgments, or location
- **Repeat Options**: Configure sequences to loop infinitely or a specific number of times

### 4. Real-time Execution
- **Background Processing**: Sequences run automatically once started
- **Progress Tracking**: View current step, completed steps, and time until next action
- **Error Handling**: Graceful failure with detailed error messages

## Usage Guide

### Creating a New Sequence

1. **Click "New Sequence"** in the Event Sequencer panel
2. **Name Your Sequence**: e.g., "Mission Briefing Cascade"
3. **Add Description**: Explain the sequence purpose
4. **Add Steps**:
   - Click "Add Step" to create a new event
   - Choose event type (M-Ping, Ops Update, etc.)
   - Set delay in seconds
   - Configure payload (message, priority, target agents)
5. **Save**: Sequence is created in "draft" status

### Starting a Sequence

1. Locate your sequence in the list
2. Click the **Play button** (▶️)
3. Sequence status changes to "active"
4. First step executes after configured delay
5. Each subsequent step follows according to its timing

### Managing Active Sequences

**Pause**: Click **Pause button** (⏸️) to suspend execution
- Current step completes
- Next step waits until resumed

**Resume**: Click **Play button** (▶️) on paused sequence
- Execution continues from next step

**Cancel**: Click **Stop button** (⏹️) on paused sequence
- Sequence terminates immediately
- Progress is lost

### Monitoring Execution

The sequence card displays:
- **Status Badge**: Current state (ACTIVE, PAUSED, COMPLETED)
- **Progress**: Steps completed / Total steps
- **Duration**: Total sequence runtime
- **Next Step Timer**: Countdown to next event (when active)
- **Repeat Counter**: Current iteration / Max iterations (if repeating)

## Advanced Features

### Repeating Sequences

Configure sequences to loop automatically:

```typescript
repeatConfig: {
  enabled: true,
  intervalMs: 60000,        // 1 minute between cycles
  maxRepeats: 5,            // Optional: limit iterations
  currentRepeat: 0          // Tracks current iteration
}
```

**Use Cases**:
- Periodic status updates
- Regular checkpoint broadcasts
- Timed narrative beats

### Scheduled Start Times

Schedule sequences to begin at specific times:

```typescript
scheduledStart: 1704067200000  // Unix timestamp
```

The system automatically starts scheduled sequences when the time arrives.

### Target Agents

Specify which agents receive each event:

```typescript
targetAgents: ['shadow-7-alpha', 'phantom-3-bravo']
```

Leave empty to broadcast to all agents.

### Acknowledgment Requirements

Mark critical steps as requiring confirmation:

```typescript
requiresAck: true
autoExpireMs: 300000  // 5 minutes
```

## Technical Architecture

### Data Persistence

Sequences and execution state persist in the Spark KV store:

```
event-sequencer:sequences       → Array<EventSequence>
event-sequencer:execution:{id}  → SequenceExecution
```

### Broadcast Integration

Event steps translate directly to M-Console broadcasts:

```typescript
const broadcast: MConsoleBroadcast = {
  id: 'bcast-...',
  type: 'scenario-deploy',
  payload: step.payload,
  timestamp: Date.now(),
  broadcastBy: sequence.createdBy,
  targetAgents: step.targetAgents,
  requiresAck: step.requiresAck,
  autoExpireMs: step.autoExpireMs
}
```

All active Watch apps receive broadcasts and respond accordingly.

### Execution Loop

The sequencer runs a background check every 1 second:

1. Load all active sequences
2. Check if any steps are ready (nextStepAt <= now)
3. Execute ready steps
4. Update sequence progress
5. Schedule next step or complete sequence

### State Machine

Sequences flow through defined states:

```
draft → scheduled → active → completed
                   ↓ pause
                 paused → active
                   ↓ cancel
                cancelled
```

## Example Sequences

### Mission Kickoff

```typescript
{
  name: "Operation Nightfall - Launch",
  description: "Initial briefing and asset deployment",
  steps: [
    {
      type: "ping",
      delayMs: 0,
      payload: {
        message: "OPERATION NIGHTFALL commencing in 60 seconds",
        priority: "high"
      }
    },
    {
      type: "ops-update",
      delayMs: 60000,
      payload: {
        type: "mission",
        message: "All units: Mission is now ACTIVE"
      }
    },
    {
      type: "annotation",
      delayMs: 10000,
      payload: {
        action: "create",
        annotation: {
          label: "Primary Objective",
          gridX: 4,
          gridY: 4,
          annotationType: "objective",
          priority: "high"
        }
      }
    }
  ]
}
```

### Patrol Route Sequence

```typescript
{
  name: "Automated Patrol - Alpha Route",
  description: "Hourly patrol reminders",
  repeatConfig: {
    enabled: true,
    intervalMs: 3600000,  // 1 hour
    maxRepeats: 8         // 8-hour patrol
  },
  steps: [
    {
      type: "dispatch",
      delayMs: 0,
      payload: {
        assetId: "phantom-3-bravo",
        targetGrid: { x: 2, y: 3 },
        directive: "Proceed to checkpoint Alpha",
        priority: "normal"
      }
    },
    {
      type: "ping",
      delayMs: 300000,  // 5 minutes
      requiresAck: true,
      payload: {
        message: "Checkpoint status report required",
        priority: "normal"
      }
    }
  ]
}
```

### Dynamic Story Beats

```typescript
{
  name: "Intel Discovery Arc",
  description: "Timed narrative revelations",
  steps: [
    {
      type: "ops-update",
      delayMs: 0,
      payload: {
        type: "intel",
        message: "Encrypted transmission intercepted"
      }
    },
    {
      type: "ping",
      delayMs: 120000,  // 2 minutes
      payload: {
        message: "Decryption progress: 30%",
        priority: "low"
      }
    },
    {
      type: "ping",
      delayMs: 180000,  // 3 minutes
      payload: {
        message: "Decryption progress: 75%",
        priority: "normal"
      }
    },
    {
      type: "ping",
      delayMs: 60000,   // 1 minute
      requiresAck: true,
      payload: {
        message: "INTEL DECRYPTED: Target location identified. Acknowledge receipt.",
        priority: "critical"
      }
    },
    {
      type: "annotation",
      delayMs: 5000,
      payload: {
        action: "create",
        annotation: {
          label: "INTEL: Target Location",
          gridX: 5,
          gridY: 6,
          annotationType: "intel",
          priority: "critical"
        }
      }
    }
  ]
}
```

## Best Practices

### Sequence Design

1. **Start Simple**: Begin with 2-3 steps, test thoroughly
2. **Clear Names**: Use descriptive sequence names for easy identification
3. **Document Purpose**: Write detailed descriptions for future reference
4. **Reasonable Timing**: Don't overwhelm players with rapid-fire broadcasts
5. **Test Delays**: Verify timing feels natural in gameplay context

### Operational Guidelines

1. **Monitor Active Sequences**: Check the panel regularly during play
2. **Pause Before Editing**: Never modify a running sequence
3. **Duplicate for Variants**: Clone successful sequences rather than creating from scratch
4. **Schedule Ahead**: Use scheduled starts for known story beats
5. **Error Recovery**: Keep pause/cancel available for unexpected situations

### Performance

- Maximum 5 active sequences recommended
- Keep individual sequences under 20 steps
- Use repeating sequences instead of very long linear sequences
- Clean up completed sequences regularly

## Integration with Other Systems

### Broadcast Templates
Event sequences can trigger template broadcasts, creating compound effects.

### Scenario Creator
Deploy scenarios that include pre-configured sequences.

### Annotation System
Sequences can create, update, or delete map annotations dynamically.

### Asset Management
Dispatch commands in sequences move assets automatically.

## Troubleshooting

### Sequence Not Starting
- Check status is "draft" (not "scheduled" without time set)
- Verify at least one step exists
- Ensure M-Console sync is active

### Steps Not Executing
- Verify sequence status is "active" (not paused)
- Check browser console for execution errors
- Confirm broadcast sync is functioning

### Timing Issues
- Delays are milliseconds internally, but UI shows seconds
- Network latency can affect exact timing
- Background tab throttling may delay execution

### Lost Progress
- Pausing preserves completed steps
- Cancelling discards all progress
- Browser refresh reloads from KV store (active sequences resume)

## Future Enhancements

Potential additions to the Event Sequencer:

- **Visual Timeline**: Drag-and-drop timeline editor for steps
- **Conditional Branching**: Different paths based on acknowledgments or game state
- **Variable Substitution**: Dynamic payload values from game state
- **Step Templates**: Reusable step configurations
- **Sequence Library**: Pre-built sequences for common scenarios
- **Analytics**: Completion rates, timing analysis, player response data

## API Reference

### EventSequencer Class

```typescript
class EventSequencer {
  // Sequence CRUD
  async getSequences(): Promise<EventSequence[]>
  async getSequence(sequenceId: string): Promise<EventSequence | undefined>
  async saveSequence(sequence: EventSequence): Promise<void>
  async deleteSequence(sequenceId: string): Promise<void>
  async duplicateSequence(sequenceId: string, newName: string): Promise<EventSequence>
  
  // Execution Control
  async startSequence(sequenceId: string): Promise<void>
  async pauseSequence(sequenceId: string): Promise<void>
  async resumeSequence(sequenceId: string): Promise<void>
  async cancelSequence(sequenceId: string): Promise<void>
  
  // Scheduling
  async scheduleSequence(sequenceId: string, startTime: number): Promise<void>
  async getScheduledSequences(): Promise<EventSequence[]>
  startScheduleChecker(): void
  
  // Status
  async getActiveSequencesCount(): Promise<number>
  async getExecution(sequenceId: string): Promise<SequenceExecution | undefined>
}
```

### Data Types

```typescript
interface EventSequence {
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

interface EventStep {
  id: string
  type: 'broadcast' | 'annotation' | 'dispatch' | 'lane-update' | 'scenario-deploy' | 'patrol-route' | 'ping' | 'ops-update'
  delayMs: number
  payload: any
  targetAgents?: string[]
  requiresAck?: boolean
  autoExpireMs?: number
}

interface SequenceExecution {
  sequenceId: string
  executionId: string
  startedAt: number
  status: 'running' | 'paused' | 'completed' | 'failed'
  completedSteps: string[]
  currentStepId?: string
  nextStepAt?: number
  error?: string
}
```

## Conclusion

The Event Sequencer transforms manual broadcast management into an automated storytelling engine. By pre-configuring event chains, game masters can focus on player interaction while the system handles narrative timing and delivery.

Perfect for:
- ✅ Complex mission briefings
- ✅ Timed narrative reveals
- ✅ Automated patrol sequences
- ✅ Dynamic tension building
- ✅ Multi-stage operations
- ✅ Background world events

Start simple, test thoroughly, and build increasingly sophisticated sequences as you master the system.
