# M Console Synchronization Documentation

## Overview
The M Console Synchronization System enables real-time bidirectional communication between the desktop M Console (control center) and field agent watch applications. This system allows M to deploy scenarios, update tactical lanes, dispatch assets, and track agent responses seamlessly across all connected devices.

---

## Architecture

### Core Components

#### 1. **MConsoleSync Library** (`src/lib/mConsoleSync.ts`)
Central synchronization manager that handles all real-time updates between M Console and field agents.

**Key Features:**
- Broadcast publishing and subscription
- Persistent key-value storage via Spark KV
- Acknowledgment tracking
- Scenario deployment
- Lane management
- Asset dispatch coordination

#### 2. **Hybrid Tactical Map** (`src/components/HybridTacticalMap.tsx`)
Unified map interface that overlays abstract grid coordinates on geographic GPS visualization.

**Features:**
- Toggle between GPS and grid views
- Click grid cells to dispatch assets
- Create tactical lanes with drag-and-drop
- Real-time asset position tracking
- Lane visualization with priority indicators
- Zoom and pan controls

#### 3. **Geographic Map** (`src/components/GeographicMap.tsx`)
Pure GPS coordinate visualization showing actual latitude/longitude positions.

#### 4. **Global Asset Map** (`src/components/GlobalAssetMap.tsx`)
Abstract 8x8 grid tactical overlay for command and control operations.

---

## Synchronization Flow

### Watch App (Field Agent) → M Console

```
Agent Watch App
    ↓
  Action (e.g., Acknowledge Broadcast)
    ↓
  mConsoleSync.recordAcknowledgment()
    ↓
  Spark KV Storage
    ↓
  M Console Polling
    ↓
  M Console UI Update
```

### M Console → Watch App (Field Agents)

```
M Console
    ↓
  Action (e.g., Deploy Scenario)
    ↓
  mConsoleSync.publishBroadcast()
    ↓
  Spark KV Storage
    ↓
  Watch App Polling
    ↓
  Watch App Event Handler
    ↓
  Watch App UI Update
```

---

## Key Data Structures

### Broadcast Message
```typescript
interface MConsoleBroadcast {
  id: string
  type: 'scenario-deploy' | 'lane-update' | 'dispatch-command' | 
        'm-ping' | 'ops-update' | 'general' | 'patrol-route-deploy'
  payload: any
  timestamp: number
  broadcastBy: string
  targetAgents?: string[]
  requiresAck?: boolean
  autoExpireMs?: number
}
```

### Asset Location
```typescript
interface AssetLocation {
  id: string
  callsign: string
  agentId: string
  gridX: number          // Abstract grid position (0-7)
  gridY: number          // Abstract grid position (0-7)
  latitude: number       // Actual GPS coordinate
  longitude: number      // Actual GPS coordinate
  altitude?: number
  speed?: number
  heading?: number
  status: 'active' | 'inactive' | 'alert' | 'enroute'
  lastUpdate: number
}
```

### Active Lane
```typescript
interface ActiveLane {
  id: string
  name: string
  startGrid: { x: number; y: number }
  endGrid: { x: number; y: number }
  assignedAssets: string[]
  status: 'active' | 'completed' | 'compromised'
  priority: 'low' | 'normal' | 'high' | 'critical'
  createdAt: number
}
```

---

## M Console Desktop Integration

### Setup Instructions

#### 1. Initialize Sync on M Console
```typescript
import { mConsoleSync } from '@/lib/mConsoleSync'

// Start polling for updates (desktop)
mConsoleSync.startSync(3000) // Poll every 3 seconds

// Subscribe to broadcasts (watch app)
const unsubscribe = mConsoleSync.onBroadcast((broadcast) => {
  handleBroadcastReceived(broadcast)
})

// Cleanup
useEffect(() => {
  return () => {
    mConsoleSync.stopSync()
    unsubscribe()
  }
}, [])
```

#### 2. Deploy Scenario from M Console
```typescript
import { mConsoleSync, ScenarioDeployment } from '@/lib/mConsoleSync'

const deployScenario = async () => {
  const scenario: ScenarioDeployment = {
    id: `scenario-${Date.now()}`,
    name: 'OPERATION NIGHTFALL',
    description: 'Secure perimeter and maintain watch',
    deployedAt: Date.now(),
    deployedBy: 'M-CONSOLE',
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
      {
        agentId: 'phantom-3-bravo',
        gridX: 2,
        gridY: 1
      }
    ],
    threatLevel: 'MODERATE'
  }

  await mConsoleSync.deployScenario(scenario, 'M-CONSOLE')
}
```

#### 3. Dispatch Asset to Grid Position
```typescript
const dispatchAsset = async (assetId: string, targetGrid: { x: number, y: number }) => {
  const command: DispatchCommand = {
    assetId,
    targetGrid,
    directive: 'Proceed to checkpoint and secure perimeter',
    priority: 'high',
    issuedBy: 'M-CONSOLE',
    timestamp: Date.now()
  }

  await mConsoleSync.dispatchAsset(command, 'M-CONSOLE')
}
```

#### 4. Create/Update Tactical Lane
```typescript
const updateLane = async (lane: ActiveLane, action: 'create' | 'update' | 'delete') => {
  const update: LaneUpdate = {
    action,
    laneId: lane.id,
    lane,
    timestamp: Date.now(),
    updatedBy: 'M-CONSOLE'
  }

  await mConsoleSync.updateLane(update, 'M-CONSOLE')
}
```

#### 5. Broadcast with Acknowledgment Tracking
```typescript
const sendBroadcastWithTracking = async () => {
  const broadcastId = await mConsoleSync.broadcastWithAck(
    'general',
    { directive: 'All agents report status' },
    'Status check: Confirm operational status',
    'high',
    'M-CONSOLE',
    ['shadow-7-alpha', 'phantom-3-bravo', 'viper-5-charlie', 'raven-2-delta'],
    300000 // Auto-expire after 5 minutes
  )

  // Check acknowledgments later
  const acks = await mConsoleSync.getAcknowledgments(broadcastId)
  console.log(`Received ${acks.length} acknowledgments`)
}
```

#### 6. Retrieve Tracked Broadcasts
```typescript
const getTrackedBroadcasts = async () => {
  const broadcasts = await mConsoleSync.getTrackedBroadcasts()
  
  broadcasts.forEach(broadcast => {
    const ackCount = broadcast.acknowledgments?.length || 0
    const targetCount = broadcast.targetAgents?.length || 0
    console.log(`${broadcast.message}: ${ackCount}/${targetCount} responses`)
  })
}
```

---

## Watch App Integration

### Setup Instructions

#### 1. Subscribe to M Console Broadcasts
```typescript
useEffect(() => {
  mConsoleSync.startSync(3000)
  
  const unsubscribe = mConsoleSync.onBroadcast((broadcast) => {
    if (!mConsoleSync.isRelevantBroadcast(broadcast, agentId)) {
      return // Ignore broadcasts not targeting this agent
    }

    handleBroadcastReceived(broadcast)
  })

  return () => {
    mConsoleSync.stopSync()
    unsubscribe()
  }
}, [])
```

#### 2. Handle Incoming Broadcasts
```typescript
const handleBroadcastReceived = (broadcast: MConsoleBroadcast) => {
  switch (broadcast.type) {
    case 'scenario-deploy':
      // Update mission data, lanes, and asset positions
      const scenario = broadcast.payload as ScenarioDeployment
      updateMissionData(scenario)
      break

    case 'lane-update':
      // Update or remove lanes
      const update = broadcast.payload as LaneUpdate
      updateLanes(update)
      break

    case 'dispatch-command':
      // Move asset to new grid position
      const command = broadcast.payload as DispatchCommand
      updateAssetPosition(command)
      break

    case 'm-ping':
      // Display M ping notification
      const ping = broadcast.payload
      displayMPing(ping)
      break

    case 'patrol-route-deploy':
      // Deploy patrol route with waypoints
      const deployment = broadcast.payload as PatrolRouteDeployment
      deployRoute(deployment)
      break
  }

  // Track for acknowledgment if required
  if (broadcast.requiresAck) {
    trackBroadcastForAck(broadcast)
  }
}
```

#### 3. Send Acknowledgment
```typescript
const acknowledgeBroadcast = async (
  broadcastId: string,
  response: 'acknowledged' | 'unable' | 'negative',
  message?: string
) => {
  const ack: BroadcastAcknowledgment = {
    broadcastId,
    agentId: currentAgentId,
    agentCallsign: currentCallsign,
    acknowledgedAt: Date.now(),
    response,
    responseMessage: message,
    receivedAt: Date.now()
  }

  await mConsoleSync.recordAcknowledgment(ack)
}
```

---

## Grid System Mapping

### Grid-to-GPS Coordinate Translation

The hybrid system maintains both abstract grid positions (8x8 grid, A1-H8) and actual GPS coordinates (latitude/longitude).

**Grid Layout:**
```
     1    2    3    4    5    6    7    8
  ┌────┬────┬────┬────┬────┬────┬────┬────┐
A │ A1 │ A2 │ A3 │ A4 │ A5 │ A6 │ A7 │ A8 │
  ├────┼────┼────┼────┼────┼────┼────┼────┤
B │ B1 │ B2 │ B3 │ B4 │ B5 │ B6 │ B7 │ B8 │
  ├────┼────┼────┼────┼────┼────┼────┼────┤
C │ C1 │ C2 │ C3 │ C4 │ C5 │ C6 │ C7 │ C8 │
  ├────┼────┼────┼────┼────┼────┼────┼────┤
D │ D1 │ D2 │ D3 │ D4 │ D5 │ D6 │ D7 │ D8 │
  ├────┼────┼────┼────┼────┼────┼────┼────┤
E │ E1 │ E2 │ E3 │ E4 │ E5 │ E6 │ E7 │ E8 │
  ├────┼────┼────┼────┼────┼────┼────┼────┤
F │ F1 │ F2 │ F3 │ F4 │ F5 │ F6 │ F7 │ F8 │
  ├────┼────┼────┼────┼────┼────┼────┼────┤
G │ G1 │ G2 │ G3 │ G4 │ G5 │ G6 │ G7 │ G8 │
  ├────┼────┼────┼────┼────┼────┼────┼────┤
H │ H1 │ H2 │ H3 │ H4 │ H5 │ H6 │ H7 │ H8 │
  └────┴────┴────┴────┴────┴────┴────┴────┘
```

### Asset Positioning
Each asset maintains both representations:
- **Grid Position**: `gridX` (0-7), `gridY` (0-7) for tactical display
- **GPS Position**: `latitude`, `longitude` for actual geographic location

When M Console dispatches an asset to a grid cell, the agent watch updates the asset's `gridX` and `gridY` values, and the GPS coordinates update automatically based on real-world movement.

---

## Testing the Integration

### End-to-End Test Scenario

1. **M Console deploys scenario:**
   ```typescript
   await mConsoleSync.deployScenario(scenario, 'M-CONSOLE')
   ```

2. **Watch app receives broadcast:**
   - Updates mission objective
   - Displays new lanes on map
   - Repositions assets to initial grid positions

3. **M Console dispatches asset:**
   ```typescript
   await mConsoleSync.dispatchAsset({
     assetId: 'shadow-7-alpha',
     targetGrid: { x: 3, y: 4 },
     directive: 'Proceed to checkpoint',
     priority: 'high',
     issuedBy: 'M-CONSOLE',
     timestamp: Date.now()
   }, 'M-CONSOLE')
   ```

4. **Watch app receives dispatch:**
   - Updates asset grid position
   - Shows dispatch directive in ops feed
   - Logs mission event

5. **Watch app acknowledges:**
   ```typescript
   await mConsoleSync.recordAcknowledgment({
     broadcastId: dispatch.id,
     agentId: 'shadow-7-alpha',
     agentCallsign: 'SHADOW-7',
     acknowledgedAt: Date.now(),
     response: 'acknowledged',
     responseMessage: 'En route to checkpoint',
     receivedAt: Date.now()
   })
   ```

6. **M Console sees acknowledgment:**
   ```typescript
   const acks = await mConsoleSync.getAcknowledgments(broadcastId)
   // Shows SHADOW-7 acknowledged at [timestamp]
   ```

---

## Persistence Layer (Spark KV)

All synchronization data is stored in the Spark key-value store with the following key patterns:

| Key Pattern | Purpose |
|------------|---------|
| `m-console-sync:broadcast:[timestamp]-[random]` | Individual broadcast messages |
| `m-console-sync:tracked:[broadcastId]` | Broadcasts requiring acknowledgment tracking |
| `m-console-sync:ack:[broadcastId]:[agentId]` | Individual agent acknowledgments |
| `m-console-sync:active-scenario` | Currently deployed scenario |
| `m-console-sync:shared-lanes` | Shared tactical lanes |
| `m-console-sync:shared-assets` | Shared asset positions |

### Data Retention
- Broadcasts older than 24 hours can be cleaned up using:
  ```typescript
  await mConsoleSync.clearOldBroadcasts(24 * 60 * 60 * 1000)
  ```

---

## Component Integration Guide

### Hybrid Tactical Map Usage

```typescript
import { HybridTacticalMap } from '@/components/HybridTacticalMap'

<HybridTacticalMap 
  assets={assetLocations}
  lanes={activeLanes}
  onAssetClick={(asset) => {
    console.log('Asset selected:', asset)
  }}
  onDispatchAsset={(assetId, targetGrid, message) => {
    // Dispatch asset to grid position
    handleDispatch(assetId, targetGrid, message)
  }}
  onCreateLane={(lane) => {
    // Create new tactical lane
    handleLaneCreation(lane)
  }}
/>
```

**Features:**
- Toggle grid overlay on/off
- Click grid cells to select
- Double-click to open dispatch dialog
- Zoom and pan with mouse
- Real-time asset position updates
- Lane visualization with priority colors
- Integrated dispatch and lane creation dialogs

---

## Troubleshooting

### Common Issues

**1. Broadcasts not appearing on watch app**
- Check that `mConsoleSync.startSync()` is called
- Verify polling interval is appropriate (3000ms recommended)
- Ensure `targetAgents` includes the agent's ID or is empty for broadcast to all

**2. Acknowledgments not showing in M Console**
- Verify KV keys are being written: `m-console-sync:ack:[broadcastId]:[agentId]`
- Check that broadcast ID matches between broadcast and acknowledgment
- Ensure M Console is polling for tracked broadcasts

**3. Asset positions not updating**
- Confirm both `gridX`/`gridY` and `latitude`/`longitude` are being updated
- Check that `lastUpdate` timestamp is current
- Verify asset ID matches across systems

**4. Lane overlay not visible**
- Ensure grid overlay is toggled on
- Check that lane `startGrid` and `endGrid` coordinates are valid (0-7 range)
- Verify lane has `assignedAssets` array populated

---

## Best Practices

1. **Always include meaningful messages** in dispatch commands and broadcasts for audit trail
2. **Set appropriate priorities** (low/normal/high/critical) to help agents triage actions
3. **Use auto-expire for time-sensitive broadcasts** to prevent stale acknowledgment requests
4. **Clean up old broadcasts periodically** to prevent KV storage bloat
5. **Target specific agents** when possible to reduce noise on other agent watches
6. **Log all M Console actions** for post-operation review and analysis
7. **Test scenario deployments** in a controlled environment before live operations
8. **Maintain consistent agent IDs** across all systems (watch app, M Console, broadcasts)

---

## API Reference Summary

### MConsoleSync Methods

| Method | Purpose |
|--------|---------|
| `startSync(pollIntervalMs)` | Begin polling for broadcasts |
| `stopSync()` | Stop polling |
| `onBroadcast(handler)` | Subscribe to broadcast events |
| `publishBroadcast(type, payload, ...)` | Send broadcast to agents |
| `deployScenario(scenario, deployedBy)` | Deploy full scenario |
| `updateLane(update, updatedBy)` | Update tactical lane |
| `dispatchAsset(command, issuedBy)` | Dispatch asset to grid |
| `broadcastMPing(message, priority, targets, by)` | Send M ping |
| `recordAcknowledgment(ack)` | Record agent acknowledgment |
| `getAcknowledgments(broadcastId)` | Get all acks for broadcast |
| `getTrackedBroadcasts()` | Get all tracked broadcasts |
| `clearOldBroadcasts(olderThanMs)` | Clean up old broadcasts |
| `isRelevantBroadcast(broadcast, agentId)` | Check if broadcast targets agent |

---

## Version History

- **v1.0** - Initial synchronization system with scenario deployment, lane management, and dispatch
- **v1.1** - Added hybrid tactical map with grid overlay on GPS coordinates
- **v1.2** - Added acknowledgment tracking and broadcast templates

---

## Support & Contact

For questions or issues with the synchronization system:
- Review this documentation
- Check the implementation in `src/lib/mConsoleSync.ts`
- Test with the example scenarios in `src/components/ScenarioCreator.tsx`

---

**Last Updated:** 2025-01-15
**Maintained By:** Field Operations Development Team
