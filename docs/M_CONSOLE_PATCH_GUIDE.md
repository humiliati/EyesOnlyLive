# M Console Desktop Integration Patch Guide

## Quick Start Checklist

This guide provides step-by-step instructions for integrating the synchronization system into the M Console desktop application.

---

## Prerequisites

- Access to M Console desktop codebase
- Spark KV storage configured
- Same `mConsoleSync.ts` library installed
- React application with TypeScript support

---

## Step 1: Install Sync Library

Copy the synchronization library to your M Console project:

```bash
# Copy from watch app to M Console
cp src/lib/mConsoleSync.ts [M_CONSOLE_PROJECT]/src/lib/mConsoleSync.ts
```

---

## Step 2: Initialize Sync in M Console

In your main M Console component (e.g., `MConsole.tsx` or `App.tsx`):

```typescript
import { useEffect, useState } from 'react'
import { mConsoleSync, type MConsoleBroadcast } from '@/lib/mConsoleSync'

export function MConsole() {
  const [connectedAgents, setConnectedAgents] = useState<string[]>([])
  const [recentBroadcasts, setRecentBroadcasts] = useState<MConsoleBroadcast[]>([])

  useEffect(() => {
    // Start sync with faster polling for M Console
    mConsoleSync.startSync(2000)

    // Subscribe to broadcasts (optional - mainly for debugging)
    const unsubscribe = mConsoleSync.onBroadcast((broadcast) => {
      console.log('[M Console] Broadcast sent:', broadcast)
    })

    return () => {
      mConsoleSync.stopSync()
      unsubscribe()
    }
  }, [])

  // ... rest of component
}
```

---

## Step 3: Add Scenario Deployment UI

Create a scenario deployment interface:

```typescript
import { ScenarioDeployment } from '@/lib/mConsoleSync'

const deployScenario = async () => {
  const scenario: ScenarioDeployment = {
    id: `scenario-${Date.now()}`,
    name: scenarioName,
    description: scenarioDescription,
    deployedAt: Date.now(),
    deployedBy: 'M-CONSOLE',
    lanes: selectedLanes.map(lane => ({
      name: lane.name,
      startGrid: lane.startGrid,
      endGrid: lane.endGrid,
      assignedAssets: lane.assignedAssets,
      status: 'active' as const,
      priority: lane.priority
    })),
    assetPositions: assets.map(asset => ({
      agentId: asset.agentId,
      gridX: asset.gridX,
      gridY: asset.gridY
    })),
    threatLevel: scenarioThreatLevel,
    briefing: scenarioBriefing,
    objectiveList: scenarioObjectives
  }

  await mConsoleSync.deployScenario(scenario, 'M-CONSOLE')
  
  toast.success(`Scenario "${scenarioName}" deployed to ${scenario.assetPositions.length} agents`)
}

// UI Component
<Button onClick={deployScenario}>
  Deploy Scenario to Field Agents
</Button>
```

---

## Step 4: Add Asset Dispatch Interface

Create dispatch controls on your map interface:

```typescript
const handleAssetDispatch = async (
  assetId: string, 
  targetGrid: { x: number; y: number },
  directive: string
) => {
  const command = {
    assetId,
    targetGrid,
    directive,
    priority: 'high' as const,
    issuedBy: 'M-CONSOLE',
    timestamp: Date.now()
  }

  await mConsoleSync.dispatchAsset(command, 'M-CONSOLE')
  
  // Update local state
  updateAssetPosition(assetId, targetGrid)
  
  // Log the action
  addActivityLog({
    type: 'dispatch',
    message: `Dispatched ${getAssetCallsign(assetId)} to grid ${getGridLabel(targetGrid)}`,
    timestamp: Date.now()
  })
}

// In your map component
<TacticalMap
  assets={assets}
  onGridClick={(gridX, gridY) => {
    openDispatchDialog(gridX, gridY)
  }}
/>
```

---

## Step 5: Add Lane Management

Create lane creation and update controls:

```typescript
import { ActiveLane } from '@/lib/mConsoleSync'

const createLane = async (laneData: Omit<ActiveLane, 'id' | 'createdAt'>) => {
  const lane: ActiveLane = {
    ...laneData,
    id: `lane-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now()
  }

  // Update local lanes
  setLanes(prev => [...prev, lane])

  // Broadcast to agents
  await mConsoleSync.updateLane({
    action: 'create',
    laneId: lane.id,
    lane,
    timestamp: Date.now(),
    updatedBy: 'M-CONSOLE'
  }, 'M-CONSOLE')
  
  toast.success(`Lane "${lane.name}" created and synced to agents`)
}

const deleteLane = async (laneId: string) => {
  // Remove local lane
  setLanes(prev => prev.filter(l => l.id !== laneId))

  // Broadcast deletion to agents
  await mConsoleSync.updateLane({
    action: 'delete',
    laneId,
    timestamp: Date.now(),
    updatedBy: 'M-CONSOLE'
  }, 'M-CONSOLE')
}
```

---

## Step 6: Add Acknowledgment Tracking Dashboard

Create a UI to monitor agent acknowledgments:

```typescript
import { useEffect, useState } from 'react'
import { type BroadcastAcknowledgment } from '@/lib/mConsoleSync'

export function AcknowledgmentTracker() {
  const [trackedBroadcasts, setTrackedBroadcasts] = useState<any[]>([])

  useEffect(() => {
    const loadTracked = async () => {
      const broadcasts = await mConsoleSync.getTrackedBroadcasts()
      setTrackedBroadcasts(broadcasts)
    }

    loadTracked()
    
    // Refresh every 5 seconds
    const interval = setInterval(loadTracked, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Acknowledgments</CardTitle>
      </CardHeader>
      <CardContent>
        {trackedBroadcasts.map(broadcast => {
          const ackCount = broadcast.acknowledgments?.length || 0
          const targetCount = broadcast.targetAgents?.length || 0
          const percentage = targetCount > 0 ? (ackCount / targetCount) * 100 : 0

          return (
            <div key={broadcast.id} className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{broadcast.message}</span>
                <Badge variant={percentage === 100 ? 'success' : 'warning'}>
                  {ackCount}/{targetCount}
                </Badge>
              </div>
              
              <Progress value={percentage} className="mb-2" />
              
              <div className="text-sm text-muted-foreground">
                {broadcast.acknowledgments?.map((ack: BroadcastAcknowledgment) => (
                  <div key={ack.agentId} className="flex justify-between">
                    <span>{ack.agentCallsign}</span>
                    <span className={
                      ack.response === 'acknowledged' ? 'text-green-500' :
                      ack.response === 'unable' ? 'text-yellow-500' :
                      'text-red-500'
                    }>
                      {ack.response.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
```

---

## Step 7: Add Broadcast with Acknowledgment

Send broadcasts that require agent responses:

```typescript
const sendBroadcastToAgents = async (
  message: string,
  priority: 'low' | 'normal' | 'high' | 'critical',
  targetAgents: string[],
  requireAck: boolean = true
) => {
  const broadcastId = await mConsoleSync.broadcastWithAck(
    'general',
    { directive: message },
    message,
    priority,
    'M-CONSOLE',
    targetAgents,
    300000 // Auto-expire after 5 minutes
  )

  toast.success(`Broadcast sent to ${targetAgents.length} agent(s)`)
  
  if (requireAck) {
    toast.info('Tracking acknowledgments...')
  }

  return broadcastId
}

// UI Component
<Button onClick={() => sendBroadcastToAgents(
  'All agents report status',
  'high',
  ['shadow-7-alpha', 'phantom-3-bravo', 'viper-5-charlie']
)}>
  Broadcast to Selected Agents
</Button>
```

---

## Step 8: Add M Ping Interface

Create a quick-ping interface for urgent communications:

```typescript
const sendMPing = async (
  message: string,
  priority: 'low' | 'normal' | 'high' | 'critical',
  targetAgents: string[]
) => {
  await mConsoleSync.broadcastMPing(message, priority, targetAgents, 'M-CONSOLE')
  
  addActivityLog({
    type: 'ping',
    message: `M Ping sent: "${message}" to ${targetAgents.length} agent(s)`,
    priority,
    timestamp: Date.now()
  })
}

// UI Component
<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">
      Send M Ping
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Send M Ping to Field Agents</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <Textarea
        placeholder="Enter urgent message..."
        value={pingMessage}
        onChange={(e) => setPingMessage(e.target.value)}
      />
      <Select value={pingPriority} onValueChange={setPingPriority}>
        <SelectTrigger>
          <SelectValue placeholder="Select priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="normal">Normal</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={() => sendMPing(pingMessage, pingPriority, selectedAgents)}>
        Send Ping
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

---

## Step 9: Add Real-Time Agent Status Monitor

Display live agent positions and status:

```typescript
import { useEffect, useState } from 'react'
import { type AssetLocation } from '@/lib/mConsoleSync'

export function AgentStatusMonitor() {
  const [agents, setAgents] = useState<AssetLocation[]>([])

  useEffect(() => {
    const loadAgents = async () => {
      const sharedAssets = await mConsoleSync.getSharedAssetPositions()
      setAgents(sharedAssets)
    }

    loadAgents()
    
    // Refresh every 3 seconds
    const interval = setInterval(loadAgents, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid grid-cols-2 gap-4">
      {agents.map(agent => (
        <Card key={agent.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{agent.callsign}</span>
              <Badge variant={
                agent.status === 'active' ? 'success' :
                agent.status === 'alert' ? 'destructive' :
                agent.status === 'enroute' ? 'warning' :
                'secondary'
              }>
                {agent.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="space-y-1">
              <div>Grid: {getGridLabel(agent.gridX, agent.gridY)}</div>
              <div>GPS: {agent.latitude.toFixed(6)}°, {agent.longitude.toFixed(6)}°</div>
              <div className="text-muted-foreground">
                Last update: {formatTimeSince(agent.lastUpdate)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

---

## Step 10: Add Patrol Route Deployment

Deploy pre-defined patrol routes to agents:

```typescript
import { type PatrolRoute } from '@/components/PatrolRouteTemplates'

const deployPatrolRoute = async (
  route: PatrolRoute,
  assignedAgents: string[],
  priority: 'low' | 'normal' | 'high' | 'critical'
) => {
  const deployment = {
    route,
    assignedAgents,
    deployedBy: 'M-CONSOLE',
    startTime: Date.now(),
    priority
  }

  await mConsoleSync.publishBroadcast(
    'patrol-route-deploy',
    deployment,
    'M-CONSOLE',
    assignedAgents,
    true
  )

  toast.success(`Patrol route "${route.name}" deployed to ${assignedAgents.length} agent(s)`)
}
```

---

## Step 11: Hybrid Map Integration

Copy the HybridTacticalMap component to M Console:

```bash
cp src/components/HybridTacticalMap.tsx [M_CONSOLE_PROJECT]/src/components/HybridTacticalMap.tsx
```

Then use it in your M Console:

```typescript
import { HybridTacticalMap } from '@/components/HybridTacticalMap'

<HybridTacticalMap
  assets={assets}
  lanes={lanes}
  onAssetClick={(asset) => {
    setSelectedAsset(asset)
    openAssetDetailsPanel()
  }}
  onDispatchAsset={handleAssetDispatch}
  onCreateLane={handleLaneCreation}
/>
```

---

## Testing Your Integration

### Test Checklist

- [ ] M Console can deploy scenario and watch app receives it
- [ ] M Console can dispatch asset and watch app updates position
- [ ] M Console can create/delete lanes and watch app syncs
- [ ] Watch app can acknowledge broadcasts and M Console sees them
- [ ] M Ping from console appears on watch app
- [ ] Agent status updates in real-time on M Console
- [ ] Grid overlay correctly maps to GPS coordinates
- [ ] Multiple agents receive targeted broadcasts

### End-to-End Test Script

```typescript
// 1. Deploy scenario
await deployScenario()
await sleep(5000)

// 2. Verify watch app received scenario
// Check mission data, lanes, and asset positions

// 3. Dispatch asset from M Console
await handleAssetDispatch('shadow-7-alpha', { x: 3, y: 4 }, 'Proceed to checkpoint')
await sleep(3000)

// 4. Verify watch app updated asset position
// Check gridX=3, gridY=4 for shadow-7-alpha

// 5. Watch app acknowledges
// (On watch app) Click acknowledge button

// 6. Verify M Console sees acknowledgment
const acks = await mConsoleSync.getAcknowledgments(broadcastId)
console.assert(acks.length > 0, 'Acknowledgment should be recorded')

// 7. Send M Ping
await sendMPing('Status check', 'high', ['shadow-7-alpha'])
await sleep(2000)

// 8. Verify watch app shows M Ping notification
```

---

## Common Gotchas

### 1. Agent ID Mismatch
**Problem:** Broadcasts not reaching agents
**Solution:** Ensure `agentId` is consistent across M Console and watch app
```typescript
// M Console
const agentId = 'shadow-7-alpha' // Must match exactly

// Watch App
const agentId = 'shadow-7-alpha' // Same value
```

### 2. Polling Too Slow
**Problem:** Delays in sync
**Solution:** Use faster polling for M Console (2-3 seconds)
```typescript
// M Console - faster polling
mConsoleSync.startSync(2000)

// Watch App - slower is fine
mConsoleSync.startSync(3000)
```

### 3. KV Storage Overflow
**Problem:** Too many old broadcasts
**Solution:** Clean up regularly
```typescript
// Run cleanup daily
setInterval(async () => {
  await mConsoleSync.clearOldBroadcasts(24 * 60 * 60 * 1000)
}, 24 * 60 * 60 * 1000)
```

### 4. Grid Coordinate Confusion
**Problem:** Grid positions don't match GPS
**Solution:** Always update both when asset moves
```typescript
// Update both representations
updateAsset({
  gridX: 3,
  gridY: 4,
  latitude: actualLatitude,
  longitude: actualLongitude
})
```

---

## Performance Optimization

### Batch Updates
Instead of sending individual updates, batch them:

```typescript
const batchDeployUpdates = async (updates: any[]) => {
  // Update local state first
  updates.forEach(update => applyUpdate(update))
  
  // Then send single broadcast
  await mConsoleSync.publishBroadcast(
    'batch-update',
    { updates },
    'M-CONSOLE'
  )
}
```

### Debounce Frequent Updates
Prevent flooding with rapid changes:

```typescript
import { debounce } from 'lodash'

const debouncedSync = debounce(async (data) => {
  await mConsoleSync.publishBroadcast('update', data, 'M-CONSOLE')
}, 1000)
```

---

## Security Considerations

1. **Validate broadcast sources** - Ensure only M Console can send critical broadcasts
2. **Sanitize user input** - Clean all text fields before broadcasting
3. **Rate limit broadcasts** - Prevent spam/flooding
4. **Expire old acknowledgments** - Don't let stale data accumulate
5. **Log all operations** - Maintain audit trail for post-operation review

---

## Support

For implementation help:
- See full documentation: `docs/M_CONSOLE_SYNC.md`
- Review example implementation in watch app: `src/App.tsx`
- Check sync library source: `src/lib/mConsoleSync.ts`

---

**Last Updated:** 2025-01-15
