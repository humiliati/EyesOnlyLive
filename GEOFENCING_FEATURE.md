# Geofencing Alerts System

## Overview
The Geofencing Alerts system provides real-time monitoring of Red Team player movements against restricted zones marked on tactical maps. When a Red Team player enters a "danger" zone, the system automatically detects the breach, logs the violation, and alerts M Console operators with critical notifications.

## Architecture

### Component: GeofencingAlerts
**Location**: `src/components/GeofencingAlerts.tsx`

**Key Features**:
- Automatic zone breach detection every 5 seconds
- Real-time GPS distance calculations using Haversine formula
- Active and acknowledged violation tracking
- Collapsible/expandable interface
- Integration with mission log and ops feed

### Integration Points

1. **App.tsx Integration**:
   - Component added to M Console mode section
   - Receives filtered Red Team assets (status='alert')
   - Connected to `handleGeofenceViolation` callback
   - Triggers sound alerts, mission log entries, and ops feed notifications

2. **Data Flow**:
```
Red Team Player GPS → allAssets → redTeamAssets (filtered) 
                                        ↓
                            GeofencingAlerts Component
                                        ↓
                            Distance Calculation (every 5s)
                                        ↓
                            Violation Detection → Alert Display
                                        ↓
                    Mission Log + Ops Feed + Sound Alert
```

## How It Works

### Restricted Zone Detection
- Monitors map annotations with `type: 'danger'`
- Uses first point in annotation's `points[]` array as zone center
- Effective radius: `annotation.radius` (km) or default 0.1km (100m)

### Distance Calculation
Uses Haversine formula for spherical Earth distance:
```typescript
function calculateDistance(lat1, lon1, lat2, lon2): number {
  // Returns distance in kilometers
}
```

### Violation Detection Logic
1. Every 5 seconds, check all Red Team assets
2. For each Red Team player, calculate distance to all danger zones
3. If `distance <= zone.radius`:
   - Check for existing unacknowledged violation for same player/zone
   - If none exists, create new violation record
   - Trigger all notification callbacks

### Violation Data Structure
```typescript
interface GeofenceViolation {
  id: string                    // Unique violation ID
  redTeamPlayerId: string        // Player agent ID
  redTeamCallsign: string        // Player callsign
  annotationId: string           // Zone annotation ID
  annotationLabel: string        // Zone label (e.g., "Restricted Area Alpha")
  zoneType: string              // Zone type ('danger')
  detectedAt: number            // Detection timestamp
  acknowledged: boolean         // Acknowledgment status
  acknowledgedBy?: string       // Who acknowledged
  acknowledgedAt?: number       // Acknowledgment timestamp
  currentLat: number           // Player latitude at detection
  currentLng: number           // Player longitude at detection
  zoneLat: number             // Zone center latitude
  zoneLng: number             // Zone center longitude
  distance: number            // Distance to zone center (km)
}
```

## UI Components

### Active Violations Section
- **Styling**: Red pulsing border, destructive color scheme
- **Content**: 
  - Player callsign badge
  - Zone label badge
  - Detection time (relative: "5s ago")
  - Distance in meters
  - Player GPS coordinates (formatted: XX.XXXX°N, XX.XXXX°W)
- **Actions**:
  - "Acknowledge" button (moves to acknowledged section)
  - "Dismiss" button (removes from display)

### Acknowledged Violations Section
- **Styling**: Muted gray theme
- **Content**:
  - Player callsign → Zone label
  - Detection and acknowledgment times
- **Actions**:
  - Individual dismiss button
  - "Clear All" button (removes all acknowledged)

### Statistics Bar
- Monitored Red Team count
- Restricted zones count
- Last check timestamp

## M Console Integration

### Callback: handleGeofenceViolation
When a violation is detected, the following actions occur:

1. **Mission Log Entry** (Critical):
   ```
   Type: 'critical'
   Title: 'GEOFENCE BREACH'
   Details: '<callsign> entered restricted zone: <zone label>'
   ```

2. **Ops Feed Entry** (Critical Priority):
   ```
   Callsign: 'M-CONSOLE'
   Type: 'alert'
   Message: '⚠️ GEOFENCE ALERT: <callsign> breached <zone>'
   Priority: 'critical'
   ```

3. **Sound Alert**:
   ```typescript
   soundGenerator.playActivityAlert('alert', 'critical')
   ```

## Configuration

### Constants (Configurable)
```typescript
const RESTRICTED_ZONE_TYPES = ['danger']  // Annotation types to monitor
const GEOFENCE_RADIUS_KM = 0.1           // Default radius (100m)
const CHECK_INTERVAL_MS = 5000           // Check frequency (5s)
```

### Zone Setup
To create a monitored restricted zone:

1. **Using HybridTacticalMap**:
   - Draw annotation with type: 'danger'
   - Set custom radius if needed (defaults to 0.1km)
   - Add descriptive label (e.g., "Danger Zone Alpha")

2. **Via M Console Scenario**:
   - Include annotations in scenario deployment
   - Specify coordinates and radius
   - Broadcasts to all watches

## Usage Scenarios

### Scenario 1: Perimeter Security
**Setup**: Place danger zones around facility perimeter
**Detection**: Red Team player approaches within 100m
**Response**: Immediate alert to M Console, logged violation

### Scenario 2: Off-Limits Areas
**Setup**: Mark off-limits zones (e.g., civilian areas)
**Detection**: Player enters marked zone
**Response**: Alert + mission log + ops feed notification

### Scenario 3: Post-Mission Analysis
**Use Case**: Review acknowledged violations log
**Data**: Complete history with timestamps, positions, acknowledgments
**Export**: Via mission log historical viewer

## Performance Considerations

- **Polling Frequency**: 5-second intervals balance responsiveness with performance
- **Distance Calculation**: Haversine formula optimized for repeated use
- **Duplicate Prevention**: Checks existing violations before creating new ones
- **Memory Management**: Dismissed violations removed from state

## Troubleshooting

### No Violations Detected
- **Check**: Red Team players have GPS transmission enabled
- **Check**: Annotations exist with type='danger'
- **Check**: Annotations have valid `points[]` array with lat/lng
- **Check**: Players are within zone radius

### Multiple Duplicate Alerts
- **Issue**: Violation detection not preventing duplicates
- **Solution**: Verify acknowledged flag check logic

### Inaccurate Distance
- **Issue**: Wrong coordinate reference
- **Solution**: Ensure using first point in annotation's points array

## Future Enhancements

### Potential Features
- [ ] Multiple zone type support (restricted, exclusion, etc.)
- [ ] Polygon zone shapes (currently circular)
- [ ] Time-based zone activation
- [ ] Zone entry/exit history trail
- [ ] Configurable alert thresholds per zone
- [ ] Auto-dismiss after player exits zone
- [ ] Violation heatmap visualization
- [ ] CSV export of violations
- [ ] Player notification on breach (optional)
- [ ] M Console broadcast trigger on violation

## Testing

### Manual Test Cases

1. **Basic Detection**:
   - Create danger zone at coordinates
   - Move Red Team player to within 100m
   - Verify violation appears within 5 seconds

2. **Acknowledgment Flow**:
   - Detect violation
   - Click "Acknowledge"
   - Verify moves to acknowledged section
   - Verify timestamps recorded

3. **Multiple Players**:
   - Multiple Red Team in different zones
   - Verify independent violation tracking
   - Verify correct player-zone associations

4. **Edge Cases**:
   - Player exactly at radius boundary
   - Multiple zones overlapping
   - Player GPS transmission disabled mid-breach
   - Annotation deleted while player in zone

## API Reference

### GeofencingAlerts Props
```typescript
interface GeofencingAlertsProps {
  annotations: MapAnnotation[]     // All map annotations
  redTeamAssets: AssetLocation[]   // Filtered Red Team players
  maxHeight?: string              // Scrollable max height
  onViolationDetected?: (violation: GeofenceViolation) => void
}
```

### Key Functions
- `calculateDistance()`: Haversine distance between two GPS points
- `checkGeofenceViolations()`: Main detection loop
- `handleAcknowledge()`: Acknowledge a violation
- `handleDismiss()`: Remove violation from display
- `formatTime()`: Human-readable relative timestamps
- `getZoneTypeColor()`: Badge color for zone type

## Compliance & Security

- **Privacy**: GPS coordinates logged with player consent (GPS transmission must be enabled)
- **Data Retention**: Violations persist in component state, cleared on unmount
- **Access Control**: Only visible in M Console mode
- **Audit Trail**: All violations logged to mission log with timestamps
