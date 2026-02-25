# Equipment Inventory Management System

## Overview
The Equipment Inventory Management System provides comprehensive tracking and deployment capabilities for operational equipment, including dead drops, geocaches, weapons, communications gear, surveillance equipment, and other field assets. The system integrates seamlessly with the hybrid tactical map for spatial awareness and coordination.

## Core Components

### 1. Equipment Inventory (`EquipmentInventory.tsx`)
The main equipment management interface providing:
- **Full CRUD Operations**: Create, view, update, and delete equipment items
- **Multi-Category Support**: Weapon, Communication, Surveillance, Medical, Explosive, Tool, Document, Currency, and Other
- **Status Tracking**: Available, Deployed, Compromised, Retrieved, Destroyed
- **Advanced Filtering**: Search by name, serial number, or description; filter by status and category
- **Complete History**: Detailed audit trail of all actions performed on each item

#### Key Features
- **Serial Number Tracking**: Unique identifiers for each equipment item
- **Priority Levels**: Low, Normal, High, Critical
- **Encryption Status**: Track which items require secure handling
- **Acknowledgment Requirements**: Flag items that need confirmation upon deployment/retrieval
- **Access Codes**: Store secure access codes for encrypted equipment
- **Operational Notes**: Add detailed notes and observations

### 2. Equipment Deployment Dialog (`EquipmentDeploymentDialog.tsx`)
Specialized deployment interface for field operations:

#### Deployment Types
1. **Dead Drop**: Covert equipment caches for agent pickup
2. **Geocache**: Concealed storage locations with GPS coordinates
3. **Fixed Location**: Permanent or semi-permanent equipment positions
4. **Agent Assignment**: Direct equipment assignment to field operatives

#### Deployment Parameters
- **Location Data**:
  - Tactical grid coordinates (A-H, 1-8)
  - GPS coordinates (latitude/longitude)
  - Automatic asset location inheritance when assigning to agents
- **Expiration Management**:
  - Set time-limited deployments
  - Automatic expiration warnings
  - Visual alerts for expired items
- **Deployment Notes**: Document operational context and instructions

### 3. Equipment Map Overlay (`EquipmentMapOverlay.tsx`)
Visual representation of deployed equipment on the tactical map:
- **Real-time Location Tracking**: Shows all deployed equipment with grid/GPS coordinates
- **Status-Based Color Coding**: Different visual indicators for deployment types
- **Expiration Alerts**: Prominent warnings for expired deployments
- **Quick Access Details**: Click any item for full deployment information
- **Category Icons**: Visual identification of equipment types

## Equipment Categories

### Category Breakdown
- 🔫 **Weapon**: Firearms, tactical equipment
- 📡 **Communication**: Radios, encrypted devices, signal equipment
- 📷 **Surveillance**: Cameras, recording devices, monitoring equipment
- 💉 **Medical**: First aid, trauma kits, medical supplies
- 💣 **Explosive**: Breaching charges, demolitions (track carefully!)
- 🔧 **Tool**: Technical equipment, lock picks, specialized tools
- 📄 **Document**: Intelligence materials, forged papers, credentials
- 💰 **Currency**: Cash, payment instruments, negotiables
- 📦 **Other**: Miscellaneous operational equipment

## Equipment Lifecycle

### 1. Creation
```
Available → Equipment created with serial number and metadata
```

### 2. Deployment
```
Available → Deployed
- Assign to agent, location, dead-drop, or geocache
- Set grid/GPS coordinates
- Add expiration time (optional)
- Record deployment notes
```

### 3. Field Operations
```
Deployed → Retrieved (successful pickup)
Deployed → Compromised (discovered/compromised)
Deployed → Destroyed (intentionally destroyed)
```

### 4. History Tracking
Every action creates an audit entry:
- Timestamp
- Action type (created, deployed, retrieved, transferred, compromised, destroyed, updated)
- Performed by (agent callsign)
- Details and notes
- Location data (grid + GPS)

## Integration Points

### Tactical Map Integration
- Equipment locations shown as overlay on HybridTacticalMap
- Click grid squares to deploy equipment at specific coordinates
- Visual indicators match map's color scheme and style

### Communications Log Integration
- High-priority deployments automatically logged
- Acknowledgment-required items generate comms entries
- Retrieval confirmations posted to operations feed

### Mission Log Integration
- All equipment actions logged as mission events
- Critical/high priority items trigger mission alerts
- Compromised equipment generates critical warnings

## Security Features

### Encryption Support
- Mark items as encrypted
- Store access codes securely
- Visual indicators (🔒) throughout UI

### Access Control
- Track who deployed each item
- Record retrieval/compromise by agent
- Complete chain of custody in history

### Expiration Management
- Time-limited deployments for operational security
- Automatic warnings when items expire
- Visual alerts (pulsing badges) for overdue items

## Professional Use Cases

### Dead Drop Operations
1. Create equipment item (e.g., intelligence documents)
2. Deploy as "dead-drop" at specific grid coordinates
3. Set expiration time (e.g., 24 hours)
4. Assign access code if encrypted
5. Agent retrieves item from specified location
6. System logs entire transaction chain

### Geocache Networks
1. Deploy multiple equipment items as geocaches
2. Distribute across tactical grid
3. Track which agents have access
4. Monitor expiration times
5. Retrieve or rotate equipment as needed

### Agent Equipment Assignment
1. Assign weapon/communication gear directly to field agents
2. Equipment location updates with agent position
3. Track equipment status through mission
4. Record retrieval/return upon mission completion

### Emergency Equipment Caching
1. Pre-position critical equipment at safe locations
2. Mark as "compromised" if location burned
3. Deploy replacement caches as needed
4. Maintain operational continuity

## Data Persistence
All equipment data persists using the `useKV` hook:
- Survives page refreshes
- Synchronized across sessions
- Complete history preserved
- No data loss during operations

## UI/UX Design

### Visual Language
- Monospace fonts for serial numbers and coordinates
- Military-style categorization
- Status-based color coding matching tactical theme
- Grid-based layout for information density
- Minimal animations (operational efficiency)

### Color Coding
- **Available**: Primary green (ready for deployment)
- **Deployed**: Accent yellow (in field)
- **Compromised**: Destructive red (security breach)
- **Retrieved**: Secondary gray (returned)
- **Destroyed**: Muted gray (no longer operational)

### Deployment Type Colors
- **Dead Drop**: Accent (covert operation)
- **Geocache**: Primary (active cache)
- **Agent**: Secondary (assigned)
- **Location**: Muted (fixed position)

## Best Practices

### Equipment Management
1. Always use unique, traceable serial numbers
2. Document deployment context in notes
3. Set realistic expiration times for time-sensitive items
4. Mark compromised items immediately
5. Maintain accurate location data

### Dead Drop Protocol
1. Use descriptive location names
2. Set appropriate expiration times (don't leave equipment exposed)
3. Use access codes for sensitive materials
4. Mark as retrieved promptly after pickup
5. Document any anomalies in notes

### Geocache Operations
1. Establish geocache networks before operations
2. Rotate equipment regularly
3. Verify coordinates before deployment
4. Use encryption for high-value items
5. Monitor expiration status actively

### Operational Security
1. Never deploy without coordinates
2. Use encrypted status for sensitive equipment
3. Require acknowledgments for critical items
4. Review history before redeploying compromised items
5. Clean up expired deployments promptly

## Real-World Parallels

This system mirrors professional intelligence and military equipment management systems:
- **COMSEC Material Control**: Similar to classified material tracking
- **Arms Room Management**: Weapon serialization and accountability
- **Logistics Support Elements**: Field equipment distribution
- **Special Operations Caches**: Pre-positioned equipment networks
- **Intelligence Dead Drops**: Covert material exchange protocols

The interface deliberately uses terminology and workflows familiar to intelligence professionals, military logistics personnel, and field operatives to create an authentic training environment for ARG participants.
