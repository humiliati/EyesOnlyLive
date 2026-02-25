# M Console Sync Architecture

## Overview

The M Console Sync system provides real-time bidirectional communication between the M Console desktop interface (scenario creator) and field agent watch apps. This enables M console operators to deploy scenarios, update lanes, dispatch assets, and send commands that automatically propagate to all relevant agents in the field.

## Architecture Components

### 1. M Console Sync Service (`src/lib/mConsoleSync.ts`)

The core synchronization service that manages all broadcast communications.

**Key Features:**
- Polling-based sync (checks KV store every 3 seconds by default)
- Event-driven architecture with subscribe/unsubscribe pattern
- Broadcast filtering by target agent IDs
- Automatic cleanup of old broadcasts (24 hour retention)
- Type-safe broadcast payloads

**Broadcast Types:**
- `scenario-deploy`: Full scenario deployment with lanes, objectives, positions
- `lane-update`: Create, update, delete, or modify lane status
- `dispatch-command`: Order individual assets to specific grid positions
- `m-ping`: Direct messages from M console to agents
- `ops-update`: General operational feed updates

### 2. Scenario Creator Component (`src/components/ScenarioCreator.tsx`)

Desktop-only interface for M console operators to create and deploy scenarios.

**Capabilities:**
- Create named scenarios with descriptions and briefings
- Set threat levels (LOW, MODERATE, HIGH, CRITICAL)
- Define mission objectives (multiple)
- Configure patrol lanes with start/end grids and assigned assets
- Set starting positions for all assets
- View deployment history
- End active scenarios

**Deployment Flow:**
1. Operator fills in scenario details (name, description, threat level)
2. Adds objectives to the objective list
3. Creates lanes by specifying:
   - Lane name
   - Start grid coordinate (A1-H8)
   - End grid coordinate (A1-H8)
   - Assigned assets (checkboxes)
   - Priority level
4. Optionally repositions assets from current positions
5. Clicks "DEPLOY SCENARIO"
6. Scenario broadcasts to all agents
7. Active scenario displays in header

### 3. Watch App Integration (`src/App.tsx`)

Field agent interface that receives and responds to M console broadcasts.

**Sync Integration:**
- Starts sync polling on mount (3 second interval)
- Subscribes to broadcast events via callback
- Filters broadcasts by agent ID
- Updates local state when relevant broadcasts received
- Logs all M console actions to mission log
- Plays audio alerts for critical broadcasts

**Broadcast Handlers:**
- `scenario-deploy`: Updates mission data, lanes, and asset positions
- `lane-update`: Adds/removes lanes from tactical grid
- `dispatch-command`: Repositions assets and changes status to "enroute"
- `m-ping`: Displays MPing component with message
- `ops-update`: Adds entry to operations feed

## Data Flow

### Scenario Deployment

```
M Console                          KV Store                          Watch Apps
---------                          --------                          ----------
1. Operator creates scenario
2. Clicks "DEPLOY SCENARIO"
3. Writes broadcast to KV      →  m-console-sync:broadcast:{timestamp}
4. Writes active scenario      →  m-console-sync:active-scenario
5. Writes shared lanes         →  m-console-sync:shared-lanes
6. Writes shared assets        →  m-console-sync:shared-assets
                                                                     7. Poll detects new broadcast
                                                                     8. Filter by agent ID
                                                                     9. Update mission data
                                                                     10. Update lanes
                                                                     11. Update asset positions
                                                                     12. Log to mission log
                                                                     13. Add ops feed entry
                                                                     14. Play sound alert
```

### Lane Update

```
M Console                          KV Store                          Watch Apps
---------                          --------                          ----------
1. Operator creates lane
2. Broadcast lane-update       →  m-console-sync:broadcast:{timestamp}
                                                                     3. Poll detects broadcast
                                                                     4. Add lane to active lanes
                                                                     5. Render on tactical grid
                                                                     6. Log lane creation
```

### Dispatch Command

```
M Console                          KV Store                          Watch Apps
---------                          --------                          ----------
1. Operator dispatches asset
2. Broadcast dispatch-command  →  m-console-sync:broadcast:{timestamp}
   (with target agent ID)
                                                                     3. Poll detects broadcast
                                                                     4. Filter by target agent
                                                                     5. Update asset position
                                                                     6. Set status to "enroute"
                                                                     7. Log dispatch order
                                                                     8. Add ops feed entry
```

## Key-Value Storage Schema

### Broadcast Keys
```
m-console-sync:broadcast:{timestamp}-{random}
```
**Value:** `MConsoleBroadcast` object with type, payload, timestamp, broadcastBy, targetAgents

### Active Scenario
```
m-console-sync:active-scenario
```
**Value:** `ScenarioDeployment` object (only one active at a time)

### Shared Lanes
```
m-console-sync:shared-lanes
```
**Value:** `ActiveLane[]` array synced across all agents

### Shared Assets
```
m-console-sync:shared-assets
```
**Value:** `AssetLocation[]` array with current positions

## TypeScript Interfaces

### ScenarioDeployment
```typescript
interface ScenarioDeployment {
  id: string
  name: string
  description: string
  deployedAt: number
  deployedBy: string
  lanes: Omit<ActiveLane, 'id' | 'createdAt'>[]
  assetPositions: Array<{
    agentId: string
    gridX: number
    gridY: number
  }>
  briefing?: string
  objectiveList?: string[]
  threatLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
}
```

### MConsoleBroadcast
```typescript
interface MConsoleBroadcast {
  type: 'scenario-deploy' | 'lane-update' | 'dispatch-command' | 'm-ping' | 'ops-update'
  payload: any
  timestamp: number
  broadcastBy: string
  targetAgents?: string[]
}
```

## Usage Examples

### Deploying a Scenario (M Console)

```typescript
import { mConsoleSync } from '@/lib/mConsoleSync'

const scenario: ScenarioDeployment = {
  id: 'scenario-123',
  name: 'OPERATION NIGHTFALL',
  description: 'Secure the perimeter and extract HVT',
  deployedAt: Date.now(),
  deployedBy: 'M-CONSOLE-ALPHA',
  lanes: [
    {
      name: 'SECTOR ALPHA PATROL',
      startGrid: { x: 1, y: 1 },
      endGrid: { x: 3, y: 3 },
      assignedAssets: ['phantom-3-bravo', 'viper-5-charlie'],
      status: 'active',
      priority: 'high'
    }
  ],
  assetPositions: [
    { agentId: 'phantom-3-bravo', gridX: 1, gridY: 1 },
    { agentId: 'viper-5-charlie', gridX: 2, gridY: 2 }
  ],
  threatLevel: 'HIGH',
  objectiveList: ['Secure perimeter', 'Extract HVT', 'Exfiltrate safely']
}

await mConsoleSync.deployScenario(scenario, 'M-CONSOLE-ALPHA')
await mConsoleSync.setActiveScenario(scenario)
```

### Receiving Broadcasts (Watch App)

```typescript
import { mConsoleSync } from '@/lib/mConsoleSync'

useEffect(() => {
  mConsoleSync.startSync(3000)
  
  const unsubscribe = mConsoleSync.onBroadcast((broadcast) => {
    if (broadcast.type === 'scenario-deploy') {
      const scenario = broadcast.payload
      console.log('Scenario deployed:', scenario.name)
      // Update local state
    }
  })

  return () => {
    mConsoleSync.stopSync()
    unsubscribe()
  }
}, [])
```

### Dispatching an Asset (M Console)

```typescript
const command: DispatchCommand = {
  assetId: 'phantom-3-bravo',
  targetGrid: { x: 5, y: 5 },
  directive: 'Move to sector E5 and observe',
  priority: 'high',
  issuedBy: 'M-CONSOLE-ALPHA',
  timestamp: Date.now()
}

await mConsoleSync.dispatchAsset(command, 'M-CONSOLE-ALPHA')
```

### Sending an M Ping (M Console)

```typescript
await mConsoleSync.broadcastMPing(
  'Status check: Confirm operational status',
  'normal',
  ['phantom-3-bravo', 'viper-5-charlie'], // Target specific agents
  'M-CONSOLE-ALPHA'
)
```

## Testing the Plumbing

### Verification Steps

1. **Enable M Console Mode**
   - Open watch app
   - Click "M CONSOLE" toggle in header
   - Scenario Creator should appear

2. **Deploy a Test Scenario**
   - Fill in scenario name: "TEST SCENARIO"
   - Add description
   - Set threat level to "HIGH"
   - Create a lane with 2 assets
   - Click "DEPLOY SCENARIO"
   - Check success toast

3. **Verify Broadcast Reception**
   - Open browser console
   - Check for broadcast in KV store
   - Verify active scenario displays in header
   - Verify lanes appear on tactical grid
   - Check mission log for deployment entry
   - Check ops feed for M console entry

4. **Test Lane Updates**
   - Create additional lanes in M Console
   - Verify lanes appear on all connected agents
   - Check dispatch log for lane creation

5. **Test Asset Dispatch**
   - Double-click grid cell in GlobalAssetMap
   - Select asset and enter directive
   - Click "CONFIRM DISPATCH"
   - Verify asset moves to enroute status
   - Verify position updates on map

6. **Test Deployment History**
   - Switch to "Deployment History" tab
   - Verify deployed scenarios appear
   - Check metadata (deployer, timestamp, lanes, objectives)

7. **Test Active Scenario End**
   - Click "END SCENARIO" in active scenario banner
   - Verify scenario clears from header
   - Verify active scenario removed from KV

## Performance Considerations

- **Polling Interval**: Default 3 seconds balances responsiveness and performance
- **Broadcast Retention**: Auto-cleanup after 24 hours prevents KV bloat
- **Filtered Broadcasts**: Only process broadcasts relevant to agent ID
- **Debounced Updates**: State updates batched to avoid excessive re-renders
- **Max GPS Trail Points**: 100 per asset to limit storage growth

## Future Enhancements

- **WebSocket Support**: Replace polling with real-time WebSocket connections
- **Broadcast Acknowledgment**: Track which agents received broadcasts
- **Scenario Templates**: Pre-configured scenario templates for common operations
- **Multi-M Console**: Support multiple M console operators simultaneously
- **Replay Mode**: Playback past scenarios for training
- **Analytics Dashboard**: Visual analytics of scenario execution and agent performance
- **Map Visualization**: 2D tactical map with real-time asset movements
- **Voice Commands**: Voice-activated scenario deployment and agent commands
