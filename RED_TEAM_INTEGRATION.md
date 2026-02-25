# Red Team Watch & Flaps and Seals Integration Guide

## Overview

This guide explains how to integrate the Red Team player watch and connect the tactical field operations system with the Flaps and Seals minigame.

## Three Watch Types

### 1. Blue Team / Ops Watch (Default - Main App.tsx)
**For**: Field operatives with full tactical capabilities
**Access**: Login at flapsandseals.com/ops
**Features**:
- Full mission planning
- Tactical map with annotations
- Asset dispatch
- Ops feed communication
- Historical log management
- M Ping acknowledgment
- M Console mode toggle

### 2. Red Team Watch (New - RedTeamWatch.tsx)
**For**: Red Team players (simpler field watch)
**Access**: Login at flapsandseals.com (main portal, not /ops)
**Features**:
- Read-only biometrics display
- Read-only location/GPS display
- M Ping acknowledgment (critical!)
- GPS transmission toggle (shares location to M Console)
- Game freeze notifications
- **NO** mission planning, ops feed, or tactical capabilities

### 3. M Console Watch (Main App.tsx with mode toggle)
**For**: Game masters and mission controllers
**Access**: Click "M CONSOLE" button in header
**Additional Features**:
- Game Control Panel (freeze/unfreeze game)
- Emergency panic button
- Red Team telemetry monitoring
- Scenario deployment
- Broadcast management
- Annotation broadcasting

## Integration with Flaps and Seals Minigame

### Setup in Flaps and Seals

1. **Install the integration hook** in your Flaps and Seals component:

```tsx
import { useFlapsAndSealsIntegration, getGameModeMessage } from './hooks/use-flaps-and-seals-integration'

function FlapsAndSealsGame() {
  const modifiers = useFlapsAndSealsIntegration()

  // Display game mode warning
  const statusMessage = getGameModeMessage(
    modifiers.gameMode, 
    modifiers.overduePingCount
  )

  return (
    <div>
      {modifiers.isFrozen && (
        <div className="game-frozen-banner">
          GAME FROZEN - Check your field watch for updates
        </div>
      )}
      
      {!modifiers.isFrozen && (
        <>
          <div className="status-bar">{statusMessage}</div>
          {/* Your game UI */}
        </>
      )}
    </div>
  )
}
```

2. **Apply loot table penalties**:

```tsx
import { applyLootTableModifiers } from './hooks/use-flaps-and-seals-integration'

const baseLootTable = [
  { item: 'rare_item', dropRate: 0.1, quantity: 1 },
  { item: 'common_item', dropRate: 0.5, quantity: 3 },
]

// Apply real-time penalty based on unacknowledged M pings
const adjustedLootTable = applyLootTableModifiers(
  baseLootTable, 
  modifiers.lootTableMultiplier
)
```

3. **Apply drop rate penalties**:

```tsx
import { applyDropRateModifiers } from './hooks/use-flaps-and-seals-integration'

function calculateDrop() {
  const baseRate = 0.25 // 25% base drop rate
  const actualRate = applyDropRateModifiers(baseRate, modifiers.dropRateMultiplier)
  
  return Math.random() < actualRate
}
```

## Red Team Player Workflow

### For Players:

1. Navigate to flapsandseals.com (NOT /ops)
2. Login with Red Team credentials
3. See simplified Red Team Watch interface
4. Toggle "TRANSMITTING GPS" to share location with command
5. When M Ping arrives, acknowledge within 30 seconds
6. **Critical**: Failing to acknowledge pings degrades Flaps and Seals loot

### Impact on Minigame:

| Overdue Pings | Effect | Loot Multiplier | Player Experience |
|---------------|--------|-----------------|-------------------|
| 0 | Normal operations | 1.0x | Full loot tables |
| 1-2 | Slight penalty | 0.85x | Minor reduction |
| 3-4 | Degraded | 0.6x | Noticeable impact |
| 5+ | Critical | 0.3x | Severely reduced rewards |

## M Console Game Control

### Freezing the Game

Use this when you need to pause ALL operations (technical issues, rules clarification, etc.):

1. Switch to M Console mode
2. Find "Game Control Panel"
3. Enter freeze reason
4. Click "FREEZE GAME"

**Effect**:
- All player watches show freeze banner
- Biometric/location updates pause
- Flaps and Seals game can detect freeze state
- No new M Pings can be issued

### Emergency Panic Stop

For immediate halt (player safety, critical issue):

1. Click "EMERGENCY PANIC" button
2. All systems halt instantly
3. Red banner appears on all watches

## Monitoring Red Team

### In M Console:

1. Enable M Console mode
2. View "Red Team Telemetry" panel
3. See all players transmitting GPS
4. Monitor vitals in real-time
5. See which players are online vs stale (>30s)

### GPS Breadcrumb Trail:

Red Team player locations are added to the same GPS trail system as Blue Team, so you can:
- See movement history
- Track patrol patterns
- Identify player positions on tactical maps

## Architecture Flow

```
┌─────────────────┐
│  Red Team Watch │
│  (Player)       │
└────────┬────────┘
         │ GPS Telemetry
         │ M Ping Acks
         ▼
┌─────────────────────────┐
│  Game State Sync (KV)   │
│  - Telemetry Storage    │
│  - Ping Tracking        │
│  - Freeze State         │
└────────┬────────────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌──────────────────┐
│  M Console      │  │  Flaps & Seals   │
│  - View Telemetry│  │  - Loot Penalties│
│  - Freeze Game  │  │  - Drop Rates    │
│  - Track Pings  │  │  - Game Mode     │
└─────────────────┘  └──────────────────┘
```

## KV Storage Schema

All data is stored in the KV store for real-time sync:

```
game-state-sync:game-state                     # Freeze/panic state
game-state-sync:telemetry:{playerId}           # Latest GPS + vitals
game-state-sync:ping:{pingId}                  # Unacknowledged pings
m-console-sync:broadcast:{timestamp}           # M ping broadcasts
```

## Deployment Checklist

- [ ] Deploy main watch app with game state sync enabled
- [ ] Create Red Team login portal at flapsandseals.com
- [ ] Integrate Flaps and Seals with `useFlapsAndSealsIntegration` hook
- [ ] Test M ping flow: issue → acknowledge → penalty removal
- [ ] Test game freeze propagation across all watches
- [ ] Test Red Team GPS transmission to M Console
- [ ] Verify loot table penalties in Flaps and Seals
- [ ] Test emergency panic button
- [ ] Document Red Team player instructions
- [ ] Train M Console operators on freeze controls

## Testing Scenarios

### Scenario 1: M Ping Compliance
1. Issue M Ping from M Console to Red Team player
2. Wait 30+ seconds without acknowledgment
3. Verify Flaps and Seals shows penalty
4. Acknowledge ping
5. Verify penalty removed

### Scenario 2: Game Freeze
1. Click "FREEZE GAME" in M Console
2. Verify Red Team watch shows freeze banner
3. Verify Flaps and Seals detects freeze
4. Verify biometrics stop updating
5. Click "RESUME GAME"
6. Verify all systems resume

### Scenario 3: Red Team GPS Tracking
1. Red Team player toggles "TRANSMITTING GPS"
2. Verify telemetry appears in M Console
3. Verify location updates every 3 seconds
4. Toggle GPS off
5. Verify telemetry stops (but last known position remains)

## Troubleshooting

### Red Team GPS not showing in M Console
- Verify player has toggled "TRANSMITTING GPS" to ON
- Check that player's watch is connected (not in offline mode)
- Verify KV sync is running (check browser console)

### Flaps and Seals penalties not applying
- Verify `useFlapsAndSealsIntegration` hook is installed
- Check that `applyLootTableModifiers` is called before generating loot
- Verify M pings are being recorded in KV storage

### Game freeze not propagating
- Check KV storage for `game-state-sync:game-state` key
- Verify sync interval is running (should poll every 1s)
- Check browser console for sync errors

## Support

For issues with:
- **Game State Sync**: Check GAME_STATE_SYNC.md
- **M Ping System**: Check M_CONSOLE_SYNC.md  
- **Map Annotations**: Check ANNOTATION_BROADCASTING.md
