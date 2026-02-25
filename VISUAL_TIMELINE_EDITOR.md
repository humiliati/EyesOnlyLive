# Visual Timeline Editor with Conditional Branching

The Visual Timeline Editor is an advanced drag-and-drop interface for creating automated event sequences with conditional branching logic based on player acknowledgments and game state.

## Features

### 🎯 Core Functionality

1. **Drag-and-Drop Reordering**
   - Intuitive drag-and-drop interface for reordering sequence steps
   - Visual feedback during dragging
   - Automatic step numbering

2. **Step Management**
   - Add new steps with customizable delays
   - Edit step parameters inline
   - Duplicate steps (including their branches)
   - Delete steps

3. **Conditional Branching**
   - Create branches that execute based on conditions
   - Multiple branches per step
   - Nested step execution within branches
   - Expandable/collapsible branch views

### 🔀 Branch Condition Types

The timeline editor supports the following conditional branch types:

#### 1. **Acknowledgment Received**
- Executes when players acknowledge a broadcast
- Options:
  - Require all agents to acknowledge
  - Require any agent to acknowledge
- Use case: "If agents confirm readiness, proceed to next phase"

#### 2. **Acknowledgment Not Received (Timeout)**
- Executes when no acknowledgment is received within a timeout period
- Configurable timeout in seconds
- Use case: "If no response after 30 seconds, send reminder"

#### 3. **Game is Frozen**
- Executes when the game state is frozen
- Use case: "If game is paused, send standby message"

#### 4. **Game is Unfrozen**
- Executes when the game state is active/unfrozen
- Use case: "When game resumes, trigger next objective"

#### 5. **Time Elapsed**
- Executes after a specific amount of time has passed
- Configurable timeout in seconds
- Use case: "After 5 minutes, escalate threat level"

#### 6. **Always Execute**
- Unconditional branch that always executes
- Use case: "Send log entry regardless of acknowledgment"

## User Interface

### Timeline View

```
┌─────────────────────────────────────────┐
│ Visual Timeline Editor     [+ Add Step] │
├─────────────────────────────────────────┤
│ Sequence Name: [Operation Nightfall]    │
│ Description: [...]                       │
├─────────────────────────────────────────┤
│                                          │
│ ╔═══════════════════════════════════╗   │
│ ║ STEP 1                            ║   │
│ ║ [BROADCAST] Message to all agents ║   │
│ ║ ⏱ 0s delay  ✓ REQUIRES ACK        ║   │
│ ║                                    ║   │
│ ║ 🌿 2 branches                      ║   │
│ ║   ▶ If acknowledged                ║   │
│ ║   ▶ On timeout (30s)               ║   │
│ ╚═══════════════════════════════════╝   │
│              ↓                           │
│ ╔═══════════════════════════════════╗   │
│ ║ STEP 2                            ║   │
│ ║ [DISPATCH] Move to coordinates    ║   │
│ ║ ⏱ 5s delay                        ║   │
│ ╚═══════════════════════════════════╝   │
│                                          │
└─────────────────────────────────────────┘
```

### Step Actions

Each step has the following action buttons:
- **Edit** (⚙️): Open detailed configuration dialog
- **Branch** (🌿): Add conditional branch
- **Duplicate** (📋): Create a copy of the step
- **Delete** (🗑️): Remove the step

### Branch View (Expanded)

When a branch is expanded, it shows:
- Branch condition icon and label
- Number of steps in the branch
- List of branch steps with their types and messages
- Delete branch button

## Creating a Sequence with Branching

### Step-by-Step Example

Let's create a sequence that sends a warning message and handles different response scenarios:

1. **Create New Timeline**
   - Click "New Timeline" button in M Console mode
   - Enter sequence name: "Emergency Alert Protocol"
   - Enter description: "Handle emergency alerts with conditional responses"

2. **Add Initial Warning Step**
   - Click "Add Step"
   - Configure step:
     - Type: Broadcast
     - Message: "EMERGENCY: All agents report status immediately"
     - Delay: 0 seconds
     - Requires Acknowledgment: ✓ ON
     - Priority: Critical

3. **Add "Acknowledged" Branch**
   - Click Branch button (🌿) on the warning step
   - Configure branch:
     - Label: "If acknowledged"
     - Condition Type: Acknowledgment Received
     - Require All Agents: ✓ OFF (any agent)
   - Add branch step:
     - Type: Broadcast
     - Message: "Acknowledgment received. Standing by for orders."
     - Priority: Normal

4. **Add "No Response" Branch**
   - Click Branch button (🌿) again on the warning step
   - Configure branch:
     - Label: "No response timeout"
     - Condition Type: Acknowledgment Not Received (Timeout)
     - Timeout: 30 seconds
   - Add branch step:
     - Type: Broadcast
     - Message: "WARNING: No response from agents. Escalating alert."
     - Priority: High
   - Add second branch step:
     - Type: Ping
     - Message: "URGENT: Report status NOW"
     - Priority: Critical

5. **Add Follow-up Step**
   - Click "Add Step" to add a step after the branching step
   - Configure step:
     - Type: Ops Update
     - Message: "Alert protocol complete"
     - Delay: 10 seconds

6. **Save Sequence**
   - Click "Save" button
   - Sequence is now ready to be executed from Event Sequencer Panel

## Technical Implementation

### Data Structure

```typescript
interface ConditionalBranch {
  id: string
  condition: {
    type: 'ack-received' | 'ack-not-received' | 
          'game-frozen' | 'game-unfrozen' | 
          'time-elapsed' | 'always'
    targetAgents?: string[]
    timeoutMs?: number
    requireAllAgents?: boolean
  }
  steps: EventStep[]
  label: string
}

interface EventStep {
  id: string
  type: string
  delayMs: number
  payload: any
  branches?: ConditionalBranch[]
  isBranchStep?: boolean
  requiresAck?: boolean
}
```

### Execution Flow

1. **Step Execution**: When a step is executed, the system broadcasts it normally
2. **Branch Evaluation**: If the step has branches, each branch condition is evaluated
3. **Condition Checking**: 
   - For acknowledgment-based branches, the system checks the acknowledgment records in KV storage
   - For game state branches, it queries the current game state
   - For time-based branches, it compares elapsed time
4. **Branch Execution**: If a condition is met, all steps within that branch are executed sequentially
5. **Continue Main Sequence**: After all branches are processed, the main sequence continues to the next step

### Branch Condition Evaluation

```typescript
// Example: Checking if acknowledgment was received
const evaluateAckReceived = async (branch, parentStep) => {
  const broadcasts = await kv.get('m-console-sync:broadcasts')
  const matchingBroadcast = broadcasts.find(/* match by message */)
  const acknowledgments = await kv.get(`acks:${matchingBroadcast.id}`)
  
  if (branch.condition.requireAllAgents) {
    return acknowledgments.length >= parentStep.targetAgents.length
  }
  return acknowledgments.length > 0
}
```

## Use Cases

### 1. **Player Response Handling**
Create sequences that adapt based on whether players respond:
- Send initial message requiring acknowledgment
- If acknowledged → Send confirmation
- If not acknowledged → Send escalation/reminder

### 2. **Game State Responsive Sequences**
Adapt sequences based on game state:
- Monitor if game is frozen
- If frozen → Send "standby" messages
- If unfrozen → Resume mission briefings

### 3. **Timed Escalation**
Create multi-stage alerts that escalate over time:
- Initial warning (low priority)
- If no response after 30s → Moderate warning
- If no response after 60s → Critical alert

### 4. **Conditional Mission Phases**
Branch based on team readiness:
- Check if all agents acknowledged readiness
- All ready → Start mission immediately
- Some not ready → Send individual reminders and delay start

### 5. **Adaptive Storytelling**
Create narrative branches based on player choices:
- Present choice to players
- Branch A if players choose option 1
- Branch B if players choose option 2
- Branch C if no response (default path)

## Best Practices

1. **Clear Branch Labels**: Use descriptive labels that clearly indicate what condition triggers the branch

2. **Reasonable Timeouts**: Set acknowledgment timeouts based on realistic response times (typically 15-60 seconds)

3. **Test Sequences**: Use draft status to test sequences before deploying them in live scenarios

4. **Branch Complexity**: Keep branch depth manageable - avoid creating too many nested conditions

5. **Fallback Branches**: Always include a fallback branch (timeout or "always" condition) to handle unexpected scenarios

6. **Log Branch Execution**: Each branch execution is logged in the operations feed for debugging

## Integration with Existing Systems

The Visual Timeline Editor integrates seamlessly with:

- **Event Sequencer Panel**: Created sequences appear in the main sequencer panel for execution
- **M Console Sync**: Branch conditions check real-time acknowledgment data
- **Game State Sync**: Branches can respond to game freeze/unfreeze events
- **Broadcast System**: Branch steps are broadcast through the normal M Console broadcast system
- **Operations Feed**: All branch executions are logged to the ops feed

## Keyboard Shortcuts

- **Drag**: Click and hold to drag steps
- **Delete**: Click trash icon to remove steps or branches
- **Escape**: Close open dialogs

## Future Enhancements

Potential future additions to the timeline editor:
- Visual flowchart view of branches
- Branch execution history/analytics
- More condition types (location-based, inventory-based, etc.)
- Branch templates for common patterns
- A/B testing support for narrative branches
- Parallel branch execution (currently sequential)
