# Game State Synchronization & Red Team Integration

## Overview

This feature adds real-time game state synchronization across all watch types (Blue Team/Ops, Red Team, M Console) and integrates with the Flaps and Seals minigame to create dynamic loot table penalties based on M ping acknowledgment compliance.

## Architecture

### Game State Sync (`src/lib/gameStateSync.ts`)

Central synchronization system that manages:
- **Game Freeze State**: M Console can freeze/unfreeze all operations across all watches
- **Emergency Panic Button**: Immediate halt of all game activities  
- **Player Telemetry**: Red Team player GPS and biometric data streaming
- **Ping Tracking**: Monitors unacknowledged M pings with timeout tracking
- **Flaps & Seals Integration**: Calculates loot table/drop rate modifiers based on overdue pings

### Key Components

#### 1. Red Team Player Watch (`src/components/RedTeamWatch.tsx`)
- **Purpose**: Simplified watch for Red Team players who login via flapsandseals.com
- **Features**:
  - Display-only biometrics (heart rate, blood oxygen, stress, temperature)
  - Display-only location data (GPS coordinates, speed, elevation)
  - M Ping acknowledgment capability
  - GPS transmission toggle (sends telemetry to Ops/M Console)
  - Real-time game freeze notifications
  - No mission planning, ops feed, or tactical map access

#### 2. Game Control Panel (`src/components/GameControlPanel.tsx`)
- **Purpose**: M Console master controls for game state
- **Features**:
  - Freeze/Unfreeze game with reason logging
  - Emergency panic button for immediate halt
  - Real-time sync to all connected watches
  - Collapsible interface with status badges

#### 3. Red Team Telemetry Panel (`src/components/RedTeamTelemetryPanel.tsx`)
- **Purpose**: M Console/Ops monitoring of Red Team player locations
- **Features**:
  - Real-time GPS position display for all transmitting Red Team players
  - Biometric vitals monitoring per player
  - Stale data indicators (>30s old)
  - Auto-refresh every 5 seconds
  - Collapsible interface

#### 4. Flaps & Seals Integration Hook (`src/hooks/use-flaps-and-seals-integration.ts`)
- **Purpose**: Connect field watch compliance to minigame mechanics
- **Features**:
  - Tracks overdue M ping count
  - Calculates loot table multipliers (1.0 = normal, 0.2 = critical)
  - Calculates drop rate multipliers
  - Determines game mode (normal/degraded/critical)
  - Responds to game freeze state

## Integration Points

### Main App (Blue Team/Ops Watch)
- Added `gameStateSync` initialization
- Integrated `GameControlPanel` and `RedTeamTelemetryPanel` in M Console mode
- Added game freeze alert banner
- Pause biometrics/location updates when frozen

### Flaps and Seals Minigame Integration

To integrate with the Flaps and Seals minigame at flapsandseals.com, add this code:

```typescript
import { useFlapsAndSealsIntegration, applyLootTableModifiers, applyDropRateModifiers, getGameModeMessage } from '@/hooks/use-flaps-and-seals-integration'

function YourGameComponent() {
  const gameModifiers = useFlapsAndSealsIntegration()

  // Apply modifiers to your loot tables
  const modifiedLootTable = applyLootTableModifiers(baseLootTable, gameModifiers.lootTableMultiplier)

  // Apply modifiers to drop rates
  const actualDropRate = applyDropRateModifiers(baseDropRate, gameModifiers.dropRateMultiplier)

  // Show game mode warning
  const warningMessage = getGameModeMessage(gameModifiers.gameMode, gameModifiers.overduePingCount)

  // Check if game is frozen
  if (gameModifiers.isFrozen) {
    // Pause game, show freeze message
    return <div>Game Frozen: Check your watch for updates</div>
  }

  // Normal game render
}
```

### Penalty Thresholds

| Overdue Pings | Game Mode | Loot Multiplier | Drop Rate Multiplier |
|---------------|-----------|-----------------|----------------------|
| 0             | Normal    | 1.0x            | 1.0x                 |
| 1-2           | Normal    | 0.85x           | 0.8x                 |
| 3-4           | Degraded  | 0.6x            | 0.5x                 |
| 5+            | Critical  | 0.3x            | 0.2x                 |

### M Ping Timeout

- Default timeout: 30 seconds (30000ms)
- After timeout, ping is marked as "overdue"
- Overdue pings immediately affect Flaps & Seals loot tables
- Pings are tracked in KV storage: `game-state-sync:ping:{pingId}`

## KV Storage Keys

```
game-state-sync:game-state                          # Current game freeze/panic state
game-state-sync:telemetry:{playerId}                # Latest telemetry per player
game-state-sync:telemetry-timeline:{timestamp}      # Historical telemetry log
game-state-sync:ping:{pingId}                       # Unacknowledged ping tracking
```

## Real-Time Synchronization

All watches poll for updates every 1-2 seconds:
- **Game State Changes**: Freeze/unfreeze propagates within 1s
- **Telemetry Updates**: Red Team GPS broadcasts every 3s when transmitting
- **Ping Status**: Checked every 1s for timeout violations
- **Flaps & Seals Sync**: Updates every 2s automatically

## Usage Examples

### Freezing the Game (M Console)

1. Navigate to M Console mode (click "M CONSOLE" button in header)
2. Find "Game Control Panel" at the top
3. Enter a freeze reason (e.g., "Technical difficulty")
4. Click "FREEZE GAME"
5. All watches will show freeze banner within 1 second
6. All telemetry updates pause
7. Click "RESUME GAME" to continue

### Red Team Player Usage

Red Team players who login via flapsandseals.com see:
- Their own biometrics and location only
- M Ping notifications requiring acknowledgment
- GPS transmission toggle
- Game freeze notifications
- No access to mission planning or ops feed

### Monitoring Red Team (M Console/Ops)

1. Switch to M Console mode
2. View "Red Team Telemetry" panel
3. See all transmitting Red Team players
4. Monitor GPS positions and vitals
5. Data refreshes automatically every 5s

## API Reference

### gameStateSync.freezeGame(reason, initiatedBy)
Freezes all game operations

### gameStateSync.unfreezeGame()
Resumes all game operations

### gameStateSync.triggerEmergencyPanic(initiatedBy)
Emergency halt - highest priority freeze

### gameStateSync.publishTelemetry(telemetry)
Publish player GPS and biometric data

### gameStateSync.recordPing(ping)
Track an unacknowledged M ping

### gameStateSync.acknowledgePing(pingId)
Mark a ping as acknowledged

### gameStateSync.getGameStateForFlapsAndSeals()
Get current penalties for minigame integration

## Future Enhancements

- [ ] Automatic ping escalation after repeated failures
- [ ] Red Team vs Blue Team scoring based on acknowledgment rates
- [ ] Historical telemetry replay
- [ ] Geofencing alerts
- [ ] Automatic game freeze on critical player vitals
