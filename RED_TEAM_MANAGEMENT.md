# Red Team Player Management System

## Overview

The Red Team Management Panel allows M Console operators to configure and track Red Team players who are participating in the field operations through the flapsandseals.com portal. This system integrates Red Team GPS data directly into all tactical map displays alongside Blue Team assets.

## Features

### Red Team Management Panel

Located in the M Console mode, the Red Team Management Panel provides:

1. **Player Registration**
   - Add new Red Team players by Player ID and Callsign
   - Automatically tracks player status (Active, Inactive, Pending)
   - Persistent storage of player roster

2. **Callsign Management**
   - Edit player callsigns with inline editing
   - Uppercase formatting for consistency
   - Real-time updates across all views

3. **GPS Tracking Control**
   - Toggle GPS tracking per player
   - When enabled, player location appears on all tactical maps
   - Red Team players appear with "alert" status on maps

4. **Telemetry Monitoring**
   - Toggle telemetry display per player
   - View real-time biometrics when enabled
   - Monitor heart rate, blood oxygen, stress level, and temperature

5. **Live Status Display**
   - Current location coordinates
   - Altitude and speed
   - Time since last update
   - Active/Inactive/Pending status indicators

## Data Flow

### Player Registration
```
M Console → Add Player → KV Storage (red-team-players)
```

### GPS Tracking
```
Red Team Watch → Telemetry Publish → Game State Sync → KV Storage
↓
M Console/Ops Watch → Subscribe → Real-time Updates → Map Display
```

### Configuration Storage
- **Key**: `red-team-players`
- **Type**: Array of RedTeamPlayer objects
- **Persistence**: Maintained across sessions

### Telemetry Storage
- **Key**: `game-state-sync:telemetry:{playerId}`
- **Type**: PlayerTelemetry object
- **Updates**: Real-time from Red Team Watch

## Integration with Maps

### Map Asset Merging

All tactical maps (Hybrid Tactical Map, Geographic Map, Global Asset Map) now display a merged view of:
- Blue Team assets (existing agents)
- Red Team players (when GPS enabled)

Red Team players appear:
- With their assigned callsigns
- In "alert" status (red/destructive coloring)
- With full GPS coordinates and telemetry

### Grid Positioning

Red Team player coordinates are converted to grid positions:
```typescript
gridX = floor((longitude + 74.0060) * 100) % 8
gridY = floor((latitude - 40.7128) * 100) % 8
```

Positions are clamped to 0-7 range for 8x8 grid.

## Component Hierarchy

```
App.tsx
├── RedTeamManagementPanel (M Console only)
│   ├── Player roster management
│   ├── GPS/Telemetry toggles
│   └── Real-time status display
├── RedTeamTelemetryPanel (M Console only)
│   └── Aggregated telemetry view
├── HybridTacticalMap (receives merged assets)
├── GeographicMap (receives merged assets)
└── GlobalAssetMap (receives merged assets)
```

## Usage Instructions

### For M Console Operators

1. **Adding a Red Team Player**
   - Switch to M Console mode
   - Locate "Red Team Management" panel
   - Enter Player ID (from flapsandseals.com login)
   - Enter desired Callsign
   - Click Add (+) button

2. **Configuring GPS Tracking**
   - Find player in roster
   - Toggle "GPS Tracking" switch
   - Player will appear on maps when online

3. **Monitoring Telemetry**
   - Toggle "Telemetry" switch to show biometrics
   - View current vitals in player card
   - Monitor status changes in real-time

4. **Editing Callsigns**
   - Click pencil icon next to callsign
   - Enter new callsign
   - Press Enter or click save icon

5. **Removing Players**
   - Click trash icon on player card
   - Player removed from roster immediately

### For Red Team Players

Red Team players use the standard watch interface at flapsandseals.com (not /ops or /m):
- GPS automatically published when logged in
- Telemetry streams in real-time
- Location appears on M Console maps when GPS enabled
- Responds to M Pings like Blue Team agents

## Status Indicators

### Player Status
- **ACTIVE**: Currently transmitting telemetry (< 30 seconds)
- **INACTIVE**: Was active but no recent updates (< 60 seconds)
- **PENDING**: Never transmitted or not logged in

### Map Display
- Red Team players shown in destructive/red coloring
- Blue Team assets shown in primary/green coloring
- All standard asset info available (coordinates, speed, heading)

## Technical Notes

### Performance
- Telemetry syncs every 1000ms via gameStateSync
- Player roster syncs every 5000ms
- Telemetry history maintained for 24 hours
- Stale detection at 30 seconds

### Data Types

```typescript
interface RedTeamPlayer {
  playerId: string
  callsign: string
  gpsEnabled: boolean
  telemetryEnabled: boolean
  addedAt: number
  lastSeen?: number
  status: 'active' | 'inactive' | 'pending'
}

interface PlayerTelemetry {
  playerId: string
  playerCallsign: string
  playerTeam: 'red' | 'blue'
  latitude: number
  longitude: number
  altitude: number
  speed: number
  heading: number
  heartRate: number
  bloodOxygen: number
  stressLevel: number
  temperature: number
  lastUpdate: number
}
```

### Integration Points

1. **gameStateSync.publishTelemetry()** - Red Team Watch publishes
2. **gameStateSync.onTelemetryUpdate()** - M Console subscribes
3. **gameStateSync.getAllTelemetry()** - Bulk telemetry load
4. **allAssets useMemo** - Merges Blue/Red team for maps

## Security Considerations

- Player IDs should match flapsandseals.com authentication
- GPS tracking can be disabled per player for privacy
- Telemetry can be disabled independently from GPS
- M Console access required to manage Red Team roster

## Future Enhancements

- Bulk import of Red Team players
- Player groups/teams within Red Team
- Historical telemetry playback
- Player performance metrics
- Custom status thresholds per player
- Export player movement history
