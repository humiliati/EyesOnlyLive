# Desktop Sync Master Guide: Complete System Architecture

**Last Updated:** 2024  
**Purpose:** Comprehensive documentation for desktop operators to understand the full sophistication of the Field Telemetry system

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Core Architecture](#core-architecture)
3. [M Console Capabilities](#m-console-capabilities)
4. [Real-Time Synchronization](#real-time-synchronization)
5. [Advanced Features](#advanced-features)
6. [Data Management](#data-management)
7. [Integration Points](#integration-points)
8. [Quick Reference](#quick-reference)

---

## System Overview

The Field Telemetry system is a sophisticated multi-device, real-time operational platform that coordinates between:

- **M Console** (Desktop/Operator Interface)
- **Blue Team Watch** (Field Agents - Operations)
- **Red Team Watch** (Simplified Player Interface)

### Watch Modes

The application operates in two primary modes, toggled via the **M CONSOLE / WATCH** button in the header:

#### Watch Mode (Default)
- Field agent perspective
- Real-time biometrics and location tracking
- M-Ping acknowledgment
- Operations feed monitoring
- Tactical map viewing
- Mission log
- Equipment and checklist management
- **NEW: Drag-to-reorder data field cards**

#### M Console Mode (Desktop Operator)
- All Watch Mode features PLUS:
- **Scenario creation and deployment**
- **Event sequencing with conditional branching**
- **Visual timeline editor**
- **Red Team telemetry monitoring**
- **Game state control (freeze/unfreeze)**
- **ARG event management**
- **Dead drop creation**
- **Business partnership tracking**
- **Real-world item crafting**
- **Broadcast templates and scheduling**
- **Agent inventory management**
- **Equipment deployment oversight**

---

## Core Architecture

### Multi-Layer Sync System

```
┌──────────────────────────────────────────────────────────────┐
│                    DESKTOP M CONSOLE                          │
│  (Operator Interface - Full Control Authority)               │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   │ Real-time Broadcast
                   ▼
┌──────────────────────────────────────────────────────────────┐
│               SPARK KV PERSISTENCE LAYER                      │
│  • m-console-sync:* (broadcasts, scenarios, lanes)           │
│  • game-state-sync:* (freeze state, telemetry, pings)        │
│  • event-sequencer:* (automated sequences)                   │
│  • arg-event:* (ARG items and events)                        │
│  • dead-drop:* (item drops at grid locations)                │
│  • agent-inventory:* (per-agent item inventories)            │
│  • business-partners:* (real-world business tracking)        │
│  • debrief-entries:* (media feed with photos/videos)         │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   │ Polling (1-3s intervals)
                   ▼
┌──────────────────────────────────────────────────────────────┐
│              FIELD AGENT WATCHES (Blue/Red Team)              │
│  • Receive broadcasts                                         │
│  • Update local state                                         │
│  • Publish telemetry                                          │
│  • Respond to commands                                        │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

#### 1. Command & Control Flow
```
Desktop Operator → M Console UI → Broadcast → KV Store → Field Watches
```

#### 2. Telemetry Flow
```
Field Watch → Publish → KV Store → Desktop Polling → M Console Display
```

#### 3. Acknowledgment Flow
```
Field Watch → Acknowledge → KV Store → Desktop Sync → Update Tracking
```

---

## M Console Capabilities

### 1. Game Control Panel

**Location:** Top of M Console mode  
**Authority Level:** Master control

#### Features:
- **Freeze Game**: Halt all operations across all watches
  - Enter custom freeze reason
  - Broadcasts immediately to all players
  - Pauses biometrics, location updates, and gameplay
  - Clear "GAME FROZEN" banner on all watches
  
- **Emergency Panic Button**: Critical halt
  - Immediate freeze with highest priority
  - Logs critical event
  - Use for technical issues or safety concerns

- **Resume Game**: Unfreeze all operations
  - Returns normal gameplay flow
  - Resumes all telemetry streams

**Use Cases:**
- Technical difficulties
- Safety pauses
- Coordination between phases
- Debriefing moments
- Emergency situations

---

### 2. Event Sequencer

**Location:** M Console mode, upper section  
**Sophistication Level:** ★★★★★ (Highest)

#### Overview
The Event Sequencer is an automated broadcast scheduling engine that executes complex, multi-step event chains on precise schedules.

#### Key Capabilities:

**Sequence Creation:**
- Name and describe sequences
- Add multiple event steps (broadcasts, dispatches, annotations)
- Configure precise timing (milliseconds)
- Set repeat configurations (loop sequences)
- Schedule for future start times

**Event Step Types:**
- **M-Ping**: Direct messages requiring acknowledgment
- **Ops Update**: Operational feed broadcasts
- **Annotation**: Tactical map markers
- **Dispatch**: Asset movement commands
- **Scenario Deploy**: Full scenario activation
- **Lane Update**: Tactical lane creation/modification
- **Patrol Route**: Automated patrol sequences

**Execution Control:**
- **Start**: Begin sequence execution
- **Pause**: Suspend (preserves progress)
- **Resume**: Continue from pause point
- **Cancel**: Terminate immediately

**Real-Time Monitoring:**
- Current step display
- Progress counter (X/Y steps)
- Next step countdown timer
- Total runtime
- Repeat iteration counter

**Advanced Features:**
- **Repeating Sequences**: Loop with configurable interval
- **Scheduled Start**: Begin at specific timestamp
- **Target Filtering**: Send to specific agents
- **Acknowledgment Requirements**: Track responses
- **Auto-Expire**: Time-limited messages

#### Example Use Cases:

**Mission Briefing Cascade:**
```
Step 1 (0s): Send "Mission briefing in 60 seconds"
Step 2 (60s): Send "OPERATION NIGHTFALL is now ACTIVE"
Step 3 (70s): Create map annotation "Primary Objective"
Step 4 (80s): Dispatch assets to starting positions
```

**Timed Narrative Reveal:**
```
Step 1 (0s): "Encrypted transmission intercepted"
Step 2 (120s): "Decryption progress: 30%"
Step 3 (180s): "Decryption progress: 75%"
Step 4 (60s): "INTEL DECRYPTED: Target location identified"
Step 5 (5s): Create critical map annotation at target
```

**Automated Patrol Reminder (Repeating):**
```
Repeat every 1 hour for 8 hours:
  Step 1 (0s): Dispatch asset to checkpoint
  Step 2 (300s): Request status report (requires ACK)
```

---

### 3. Visual Timeline Editor

**Location:** M Console mode, activated via "Timeline Editor" card  
**Sophistication Level:** ★★★★★ (Highest)

#### Overview
Advanced drag-and-drop interface for creating event sequences with **conditional branching** based on player responses and game state.

#### Revolutionary Feature: Conditional Branching

Unlike linear sequences, the Timeline Editor creates **dynamic narrative flows** that respond to player actions.

#### Branch Condition Types:

1. **Acknowledgment Received**
   - Trigger: Player acknowledges broadcast
   - Options: Require all agents OR any agent
   - Example: "If agents confirm readiness → proceed to phase 2"

2. **Acknowledgment Not Received (Timeout)**
   - Trigger: No response within timeout period
   - Configurable timeout
   - Example: "If no response after 30s → send reminder"

3. **Game is Frozen**
   - Trigger: Game state changes to frozen
   - Example: "If game paused → broadcast 'standby' message"

4. **Game is Unfrozen**
   - Trigger: Game state changes to active
   - Example: "When resumed → trigger next objective"

5. **Time Elapsed**
   - Trigger: Specific duration passes
   - Example: "After 5 minutes → escalate threat level"

6. **Always Execute**
   - Trigger: Unconditional (always runs)
   - Example: "Log event regardless of player response"

#### Interface Features:

- **Drag-and-Drop Reordering**: Intuitive step arrangement
- **Branch Visualization**: Expandable tree structure
- **Nested Execution**: Branches can contain multiple steps
- **Duplicate Steps**: Clone with all branches intact
- **Real-Time Preview**: See execution flow before deployment

#### Example Timeline with Branching:

```
┌─────────────────────────────────────────────────────┐
│ STEP 1: Broadcast "Objective briefing"             │
│ ✓ REQUIRES ACK (30s timeout)                       │
│                                                     │
│ 🌿 BRANCH 1: If Acknowledged                       │
│    ├─ Send "Proceed to target zone"                │
│    └─ Create map annotation at objective           │
│                                                     │
│ 🌿 BRANCH 2: On Timeout (No ACK)                   │
│    ├─ Send "URGENT: Acknowledge briefing"          │
│    ├─ Wait 15s                                     │
│    └─ Escalate to M Console operator alert         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ STEP 2: Monitor game state                         │
│                                                     │
│ 🌿 BRANCH 1: If Game Frozen                        │
│    └─ Send "Operations suspended - standby"        │
│                                                     │
│ 🌿 BRANCH 2: If Game Active                        │
│    └─ Dispatch assets to positions                 │
└─────────────────────────────────────────────────────┘
```

**Why This Matters:**
- Creates **adaptive narratives** that respond to player behavior
- Eliminates need for manual operator intervention
- Enables **branching storylines** based on choices
- Handles non-responsive players automatically
- Scales complex operations without increasing operator workload

---

### 4. Scenario Creator

**Location:** M Console mode  
**Purpose:** Deploy complete mission scenarios

#### Features:

- **Scenario Metadata:**
  - Name (e.g., "OPERATION NIGHTFALL")
  - Description
  - Threat level (LOW, MODERATE, HIGH, CRITICAL)
  - Mission objectives (multiple)
  - Briefing text

- **Lane Configuration:**
  - Name lanes
  - Define start/end grid coordinates (A1-H8)
  - Assign assets to lanes
  - Set priority levels
  - Visual color coding

- **Asset Positioning:**
  - Set starting positions for all agents
  - Update existing asset locations
  - Synchronized across all watches

- **Deployment:**
  - One-click broadcast to all agents
  - Updates mission data
  - Creates tactical lanes
  - Repositions assets
  - Logs deployment in all systems

- **Deployment History:**
  - View past scenarios
  - Track who deployed what
  - Review configuration details
  - End active scenarios

---

### 5. Red Team Management & Telemetry

#### Red Team Management Panel

**Purpose:** Configure Red Team player watches

**Features:**
- Add Red Team players with callsigns
- Generate unique player IDs
- Enable/disable GPS transmission per player
- Configure watch access levels
- View player roster

#### Red Team Telemetry Panel

**Purpose:** Monitor Red Team player locations and vitals

**Real-Time Data Display:**
- GPS coordinates (lat/lng)
- Grid position (A1-H8)
- Altitude
- Speed and heading
- Heart rate
- Blood oxygen
- Stress level
- Body temperature
- Last update timestamp
- Stale data indicators (>30s)

**Auto-Refresh:** Every 5 seconds

**Use Cases:**
- Track Red Team movements on tactical map
- Monitor player safety via biometrics
- Detect geofence violations
- Coordinate Red vs Blue interactions

#### Geofencing Alerts

**Location:** M Console mode  
**Purpose:** Detect when Red Team enters restricted zones

**Features:**
- Monitors all map annotations with geofence flag
- Checks Red Team telemetry against fence boundaries
- Triggers critical alerts on breach
- Logs violation details (player, zone, time)
- Plays audio alerts
- Broadcasts to operations feed

---

### 6. ARG (Alternate Reality Game) System

**Sophistication Level:** ★★★★★

#### ARG Event Creator

**Location:** M Console mode  
**Purpose:** Create collectible item events for field discovery

**Features:**

- **Event Configuration:**
  - Event name and description
  - Scenario association
  - Active/inactive toggle
  - Creation timestamp

- **Item Creation:**
  - Item ID (ITM-XXX format)
  - Name and emoji 📻
  - Type (tool, intel, consumable, key, etc.)
  - Rarity (common, uncommon, rare, epic, legendary)
  - Nature attributes (signal, heat, weight, noise)
  - Weight (kg) and value
  - Description
  - One-time-only flag

- **Registry Integration:**
  - Items added to Gone Rogue data registry
  - Available for dead drops
  - Visible in agent inventories
  - Tracked throughout lifecycle

#### ARG Event Dashboard

**Purpose:** Manage and monitor ARG events

**Features:**
- View all created events
- Activate/deactivate events
- See item counts per event
- Filter by status
- Quick event statistics

#### Dead Drop Manager

**Location:** M Console mode  
**Purpose:** Place items at physical grid locations for field discovery

**Features:**

- **Drop Creation:**
  - Drop name and description
  - Grid location (X, Y coordinates)
  - Access code (for discovery)
  - Item selection from active ARG events
  - Multiple items per drop
  - Security level configuration

- **Status Tracking:**
  - Created: Drop placed
  - Discovered: Code entered by agent
  - Retrieved: Items collected
  - Expired: Time limit reached

- **Auto-Fill from Business Map:**
  - Drag real-world items onto business map
  - Auto-populate dead drop with business location
  - Link to business partnership data

- **Drop Management:**
  - Edit drops before discovery
  - Broadcast drop creation to ops feed
  - Log retrieval events
  - Track which agents have which items

#### Agent Inventory Viewer

**Location:** M Console mode  
**Purpose:** Monitor and manage agent item inventories

**Features:**
- **Per-Agent View:**
  - See all items in each agent's inventory
  - Visual item cards with emoji, name, type, rarity
  - Weight and value totals
  - Item nature attributes

- **Drag-and-Drop Transfer:**
  - Move items between agents
  - Visual drag feedback
  - Instant synchronization
  - Logs all transfers

- **Item Details:**
  - Full item metadata display
  - Rarity color coding
  - Nature attribute badges
  - Weight/value summary

---

### 7. Business Partnership System

**Sophistication Level:** ★★★★★

#### Real-World Item Crafter

**Location:** M Console mode  
**Purpose:** Track physical business owner participation and craft real-world ARG items

**Features:**

- **Business Owner Details:**
  - Business name
  - Owner name
  - Contact info (email, phone)
  - Physical address
  - Grid location (X, Y)
  - GPS coordinates
  - Participation date
  - Notes

- **Item Crafting:**
  - Link items to specific businesses
  - Attach multiple photos (REQUIRED)
  - Item metadata (name, emoji, type, rarity)
  - Description and flags
  - Generate unique IDs for item and business

- **Item Lifecycle:**
  - Crafted: Item created with business participation
  - Deployed: Item placed in dead drop
  - Retrieved: Item collected by agent

- **Photo Documentation:**
  - Upload multiple photos per item
  - Photo URLs stored persistently
  - Displayed in debrief feed
  - Auto-detection of image vs video

- **Cannot Delete Deployed Items:**
  - Protects data integrity
  - Maintains audit trail
  - Prevents accidental loss

#### Business Partnership Directory

**Location:** M Console mode  
**Purpose:** Browse and manage all business partnerships

**Features:**
- Searchable/filterable directory
- Business cards with key details
- Grid location display
- Contact information
- Participation statistics
- Navigate to grid location (focuses tactical map)
- Highlight on business map overlay

#### Business Map Overlay

**Location:** M Console mode  
**Purpose:** Visual map of all business partnerships on tactical grid

**Features:**
- Display all businesses on 8×8 grid
- Color coding and labels
- Click to view business details
- Navigate tactical map to business location
- Drag real-world items onto grid to create dead drops
- Auto-link items to businesses at that location

#### Debrief Media Feed

**Location:** M Console mode  
**Purpose:** Comprehensive debrief feed with adaptive media player

**Features:**

- **Entry Types:**
  - `item-crafted`: Real-world item creation
  - `item-deployed`: Item placed in field
  - `item-retrieved`: Agent collects item
  - `business-participation`: Business engagement events
  - `photo-added`: New media uploaded

- **Adaptive Media Player:**
  - 4:3 aspect ratio (classic game style)
  - Super Mario 64-inspired stretch mode
  - Pixelation effects option
  - Video controls (play/pause)
  - Auto-detection of image vs video
  - Support for multiple media formats

- **Rich Metadata Display:**
  - Business name and owner
  - Grid location
  - Item details (emoji, name, type)
  - Timestamps
  - Description text

- **Incinerator Feature:**
  - Delete individual entries (🔥 button)
  - Bulk "Incinerate All" with confirmation
  - Permanent deletion
  - Borrowed from garbage collection concept

- **Sorting and Filtering:**
  - Sort by timestamp
  - Filter by entry type
  - Search by business name

#### Debrief Broadcaster

**Location:** M Console mode  
**Purpose:** Send debrief entries to all watches via operations feed

**Features:**
- Select debrief entry to broadcast
- Set priority (normal, high, critical)
- Customize broadcast message
- Send to all agents or specific targets
- Logs broadcast in mission log
- Appears in all watch ops feeds

---

### 8. Broadcast Management

#### Broadcast Templates

**Location:** M Console mode  
**Purpose:** Pre-configured message templates for rapid deployment

**Features:**
- Create reusable broadcast templates
- Categories: mission, status, alert, intel, order
- Priority levels
- Target agent selection
- One-click deployment
- Edit and manage templates
- Deployment history

#### Broadcast Scheduler

**Location:** M Console mode  
**Purpose:** Schedule broadcasts for future delivery

**Features:**
- **One-Time Broadcasts:**
  - Set specific date/time
  - Choose broadcast type
  - Configure message and priority
  - Target agent selection

- **Recurring Broadcasts:**
  - Interval configuration (minutes, hours)
  - Max occurrences
  - Pause/resume scheduled broadcasts
  - View next scheduled time

- **Scheduled Broadcast Management:**
  - View all scheduled broadcasts
  - Edit before execution
  - Delete scheduled items
  - See execution history

#### Broadcast Acknowledgment Tracker

**Location:** M Console and Watch modes  
**Purpose:** Track which agents have acknowledged broadcasts

**Features:**
- List all broadcasts requiring acknowledgment
- Per-agent acknowledgment status
- Response type (acknowledged, unable, negative)
- Response messages
- Time received and acknowledged
- Overdue indicators
- Auto-expire timers

#### Annotation Acknowledgment Tracker

**Location:** M Console and Watch modes  
**Purpose:** Track acknowledgments for tactical map annotations

**Similar to Broadcast Tracker:**
- Annotation-specific acknowledgment
- Per-agent status
- Response tracking
- Overdue alerts

#### Overdue Annotation Alerts

**Location:** Watch mode  
**Purpose:** Alert field agents to unacknowledged map annotations

**Features:**
- Prominent alert banner
- Count of overdue annotations
- Quick acknowledge action
- Priority-based sorting
- Auto-dismiss after acknowledgment

#### Annotation Acknowledgment Dashboard

**Location:** M Console mode  
**Purpose:** Statistical overview of annotation acknowledgments

**Features:**
- Total annotations requiring ACK
- Acknowledgment rate percentage
- Per-annotation breakdown
- Per-agent compliance statistics
- Overdue tracking
- Visual charts and badges

---

### 9. Equipment & Asset Management

#### Equipment Inventory

**Location:** M Console and Watch modes  
**Purpose:** Full lifecycle tracking of deployed equipment

**Features:**

- **Equipment Metadata:**
  - Name and serial number
  - Equipment type
  - Status (available, deployed, retrieved, maintenance)
  - Priority level
  - Encryption flag
  - Acknowledgment requirement

- **Deployment Details:**
  - Assigned to type (dead drop, observation post, cache, etc.)
  - Assigned to name
  - Grid location (X, Y)
  - GPS coordinates
  - Deployed timestamp
  - Deployed by (user)

- **Lifecycle Tracking:**
  - Creation
  - Deployment
  - Retrieval
  - Maintenance
  - Full history log per item

- **Deployment Dialog:**
  - Select equipment from inventory
  - Choose assignment type
  - Set grid/GPS location
  - Configure priority and security
  - One-click deploy

#### Equipment Map Overlay

**Location:** M Console mode  
**Purpose:** Visual display of all deployed equipment on tactical grid

**Features:**
- Show all deployed equipment
- Color coding by type
- Click to view equipment details
- Filter by status
- Navigate to equipment location

#### Asset Status Board

**Location:** M Console mode  
**Purpose:** Monitor health and readiness of all field agents

**Features:**

- **Per-Agent Vitals:**
  - Operational status (operational, degraded, critical, offline)
  - Heart rate
  - Stress level
  - Battery level
  - Signal strength
  - Last update timestamp
  - Mission readiness flag
  - Equipment status (green, amber, red)

- **Visual Indicators:**
  - Color-coded status badges
  - Stale data warnings
  - Critical alerts
  - Ready/not ready markers

---

### 10. User Interface Enhancements

#### Drag-to-Reorder Data Field Cards

**Location:** Watch mode and M Console mode  
**Purpose:** Customizable data field layout with Command & Conquer aesthetic polish  
**Documentation:** See [DRAG_TO_REORDER.md](./DRAG_TO_REORDER.md)

**Features:**

- **Desktop Drag-and-Drop:**
  - Click and hold six-dot handle (⋮⋮)
  - Drag card to new position
  - Drop to reorder
  - HTML5 drag-and-drop API

- **Touch Gestures:**
  - Full mobile support
  - Touch and drag on handle
  - Responsive touch targets (44x44px)
  - Smooth gesture detection

- **Visual Feedback (C&C Aesthetic):**
  - Dragging: Semi-transparent with scale reduction
  - Drop Target: Pulsing accent border with glow
  - Hover: Subtle green glow and scale increase
  - Active Indicator: Pulsing dot on drag handle
  - Tactical Grid Overlay: Animated background pattern
  - Corner Accents: Animated corner borders

- **Collapsible Cards:**
  - Click caret (▼) to collapse/expand
  - All cards except Agent ID collapsible
  - Smooth animation transitions
  - State preserved per card
  - Can reorder while collapsed or expanded

- **Persistent State:**
  - Order saved to KV storage (`data-card-order`)
  - Survives page refreshes
  - Per-agent customization
  - Default order configurable

- **Audio Feedback:**
  - Subtle sound on drag start
  - Confirmation sound on successful reorder
  - Toast notification with success message

**Available Cards:**
1. Agent ID / Mission (non-collapsible)
2. Biometrics (heart rate, O₂, stress, temperature)
3. Location (GPS, speed, elevation)
4. Transmission (signal, power, encryption)

**Use Cases:**
- Medical officers prioritize Biometrics
- Navigators prefer Location at top
- Comms specialists want Transmission prominent
- Customize based on mission phase

---

### 11. Tactical Map Systems

#### Hybrid Tactical Map

**Location:** M Console and Watch modes  
**Purpose:** Primary tactical interface with grid and GPS layers

**Features:**

- **8×8 Grid System (A1-H8):**
  - Lettered columns (A-H)
  - Numbered rows (1-8)
  - Visual grid overlay
  - Grid coordinate display

- **Asset Display:**
  - Blue Team agents (primary color)
  - Red Team players (destructive color)
  - Real-time position updates
  - Status indicators (active, enroute, alert, inactive)
  - Callsign labels

- **Lane System:**
  - Visual lane paths
  - Start/end markers
  - Assigned asset indicators
  - Priority color coding
  - Lane labels

- **Map Annotations:**
  - Create annotations (objective, intel, hazard, waypoint, safe zone, restricted zone)
  - Set priority
  - Require acknowledgment
  - Add notes
  - Delete annotations
  - Geofencing support

- **Asset Dispatch:**
  - Double-click grid to dispatch
  - Select asset
  - Enter directive
  - Set priority
  - Broadcasts command to field

- **Lane Creation:**
  - Click-and-drag to create lanes
  - Assign assets via checkbox
  - Set priority
  - Name lanes
  - Color visualization

#### Geographic Map

**Location:** Watch mode  
**Purpose:** GPS-based map view of assets and lanes

**Features:**
- Latitude/longitude display
- Precise GPS positioning
- Lane paths on GPS coordinates
- Asset clustering
- Zoom and pan controls

#### Global Asset Map

**Location:** Watch mode  
**Purpose:** Simplified asset overview

**Features:**
- Grid-based asset display
- Dispatch capability
- Lane creation
- Quick asset status

#### GPS Breadcrumb Trail

**Location:** Watch mode  
**Purpose:** Historical movement tracking

**Features:**

- **Per-Asset Trails:**
  - Store last 100 GPS coordinates
  - Timestamp each coordinate
  - Auto-collect every 5 seconds
  - Color coding by status

- **Trail Management:**
  - Clear trail per asset
  - Export trail data
  - View historical paths
  - Trail visualization

---

### 11. Mission Planning & Patrol

#### Mission Planner

**Location:** Watch mode  
**Purpose:** Create waypoints and measure distances

**Features:**

- **Waypoint Creation:**
  - Set grid/GPS coordinates
  - Name waypoints
  - Add descriptions
  - Priority levels
  - Waypoint markers on map

- **Distance Measurement:**
  - Multi-point distance calculations
  - Total distance display
  - Waypoint-to-waypoint segments
  - Save measurements

#### Patrol Route Templates

**Location:** Watch mode  
**Purpose:** Pre-configured patrol patterns

**Features:**
- Template library (perimeter, sweep, checkpoint, etc.)
- Waypoint sequences
- Deploy to field
- Create waypoints on map
- Assign to agents

---

### 12. Communications

#### Communications Log

**Location:** Watch mode  
**Purpose:** Comprehensive communication audit trail

**Features:**

- **Log Entries:**
  - Direction (incoming/outgoing)
  - From/to (callsigns)
  - Message content
  - Channel (tactical, secure, emergency)
  - Priority
  - Encryption status
  - Acknowledged flag
  - Timestamp

- **Export Capability:**
  - Download log as file
  - Audit trail preservation

#### Operations Feed

**Location:** M Console and Watch modes  
**Purpose:** Real-time activity stream across all agents

**Features:**
- **Entry Types:**
  - Check-in
  - Status update
  - Transmission
  - Location update
  - Mission activity
  - Alert

- **Priority Levels:**
  - Normal
  - High
  - Critical

- **Per-Agent Attribution:**
  - Callsign display
  - Agent ID tracking
  - Color coding by type

- **Read Status:**
  - Unread indicators
  - Mark as read
  - Unread count badges

- **Audio Alerts:**
  - Sound on new high/critical entries
  - Different tones by priority
  - Mute option

---

### 13. Checklists & Environmental Data

#### Tactical Checklist

**Location:** Watch mode  
**Purpose:** Mission-critical task tracking

**Features:**

- **Checklist Categories:**
  - Pre-mission
  - In-mission
  - Post-mission
  - Safety
  - Equipment
  - Custom

- **Checklist Items:**
  - Text description
  - Priority (normal, high, critical)
  - Completion status
  - Completed by (user)
  - Completed at (timestamp)

- **Checklist Management:**
  - Create checklists
  - Add items
  - Toggle item completion
  - Delete checklists
  - Progress tracking (X/Y complete)

#### Environmental Data

**Location:** Watch mode  
**Purpose:** Real-world environmental conditions

**Features:**
- Current temperature
- Weather conditions
- Humidity
- Wind speed and direction
- Visibility
- Sunrise/sunset times
- Based on GPS coordinates

---

### 14. After Action Report

**Location:** Watch mode  
**Purpose:** Mission debrief and statistics

**Features:**

- **Mission Summary:**
  - Mission name and objective
  - Start and end times
  - Total duration
  - Completion status

- **Log Analysis:**
  - Total log entries
  - Entries by type
  - Critical events count
  - Timeline visualization

- **Operations Summary:**
  - Total ops feed entries
  - Agent participation statistics
  - Communication metrics

- **Asset Performance:**
  - Asset count
  - Individual agent activity
  - Status transitions

- **Export Report:**
  - Generate comprehensive PDF
  - Include all data points
  - Share with team

---

## Real-Time Synchronization

### Sync Managers

The system uses multiple specialized sync managers for different data domains:

#### 1. M Console Sync (`src/lib/mConsoleSync.ts`)

**Polling Interval:** 3 seconds

**Broadcasts:**
- `scenario-deploy`: Full scenario activation
- `lane-update`: Tactical lane changes
- `dispatch-command`: Asset movement orders
- `m-ping`: Direct messages
- `ops-update`: Operations feed entries
- `patrol-route-deploy`: Patrol route assignments
- `annotation-update`: Map annotation changes

**Methods:**
- `deployScenario(scenario, by)`
- `dispatchAsset(command, by)`
- `broadcastMPing(message, priority, targets, by)`
- `broadcastAnnotation(action, annotation, annotationId, by)`
- `recordAcknowledgment(ack)`
- `recordAnnotationAcknowledgment(ack)`

#### 2. Game State Sync (`src/lib/gameStateSync.ts`)

**Polling Interval:** 1 second

**State Management:**
- Game freeze/unfreeze
- Emergency panic state
- Player telemetry
- Ping timeout tracking
- Flaps & Seals integration penalties

**Methods:**
- `freezeGame(reason, initiatedBy)`
- `unfreezeGame()`
- `triggerEmergencyPanic(initiatedBy)`
- `publishTelemetry(telemetry)`
- `recordPing(ping)`
- `acknowledgePing(pingId)`
- `getGameStateForFlapsAndSeals()`

#### 3. Event Sequencer (`src/lib/eventSequencer.ts`)

**Check Interval:** 1 second

**Execution Logic:**
- Monitors active sequences
- Checks if steps are ready (nextStepAt <= now)
- Executes ready steps
- Updates sequence progress
- Schedules next steps
- Handles repeating sequences

**Methods:**
- `startSequence(sequenceId)`
- `pauseSequence(sequenceId)`
- `resumeSequence(sequenceId)`
- `cancelSequence(sequenceId)`
- `getSequences()`
- `saveSequence(sequence)`
- `duplicateSequence(sequenceId, newName)`

#### 4. Live ARG Sync (`src/lib/liveArgSync.ts`)

**Real-time Operations:**
- ARG event creation
- Dead drop management
- Agent inventory updates
- Item lifecycle tracking

**Methods:**
- `createArgEvent(event)`
- `activateArgEvent(eventId)`
- `deactivateArgEvent(eventId)`
- `createDeadDrop(drop)`
- `discoverDeadDrop(dropId, discoveredBy)`
- `retrieveDeadDrop(dropId, retrievedBy)`
- `addItemToInventory(agentId, itemId)`
- `removeItemFromInventory(agentId, itemId)`
- `transferItem(fromAgent, toAgent, itemId)`

### KV Storage Schema

All persistent data is stored in the Spark KV store with namespaced keys:

```
m-console-sync:broadcast:{timestamp}          → MConsoleBroadcast
m-console-sync:active-scenario                → ScenarioDeployment
m-console-sync:shared-lanes                   → ActiveLane[]
m-console-sync:shared-assets                  → AssetLocation[]

game-state-sync:game-state                    → GameState
game-state-sync:telemetry:{playerId}          → PlayerTelemetry
game-state-sync:ping:{pingId}                 → TrackedPing

event-sequencer:sequences                     → EventSequence[]
event-sequencer:execution:{sequenceId}        → SequenceExecution

arg-event:{eventId}                           → ArgEvent
dead-drop:{dropId}                            → DeadDrop
agent-inventory:{agentId}                     → string[] (item IDs)

business-partners                             → BusinessPartner[]
real-world-items                              → RealWorldItem[]
debrief-entries                               → DebriefEntry[]

tracked-broadcasts                            → TrackedBroadcast[]
map-annotations                               → MapAnnotation[]
mission-waypoints                             → Waypoint[]
deployed-routes                               → PatrolRoute[]
equipment-inventory                           → EquipmentItem[]
tactical-checklists                           → Checklist[]
communications-log                            → CommLog[]
mission-log                                   → EnhancedLogEntry[]
ops-feed                                      → OpsFeedEntry[]
read-ops-feed-entries                         → string[] (entry IDs)
```

---

## Advanced Features

### Flaps & Seals Integration

**Purpose:** Connect field watch compliance to minigame loot tables

**Hook:** `use-flaps-and-seals-integration.ts`

**Penalty System:**

| Overdue M-Pings | Game Mode | Loot Multiplier | Drop Rate |
|-----------------|-----------|-----------------|-----------|
| 0               | Normal    | 1.0×            | 1.0×      |
| 1-2             | Normal    | 0.85×           | 0.8×      |
| 3-4             | Degraded  | 0.6×            | 0.5×      |
| 5+              | Critical  | 0.3×            | 0.2×      |

**Usage in Minigame:**
```typescript
import { useFlapsAndSealsIntegration } from '@/hooks/use-flaps-and-seals-integration'

const modifiers = useFlapsAndSealsIntegration()

if (modifiers.isFrozen) {
  // Pause game
}

const actualLoot = baseLoot * modifiers.lootTableMultiplier
const actualDrop = baseDrop * modifiers.dropRateMultiplier
```

**M-Ping Timeout:** 30 seconds default

---

### Sequence Template Library

**Location:** M Console mode  
**Purpose:** Rapidly deploy pre-configured sequences

**Templates:**
- Mission Briefing Cascade
- Timed Narrative Reveals
- Periodic Status Checks
- Patrol Reminders
- Escalation Sequences
- Emergency Protocols

**Features:**
- One-click deployment
- Customizable before deployment
- Template editing
- Import/export templates
- Template categories

---

### Red Team Watch

**Purpose:** Simplified interface for Red Team players

**Access:** Players login via flapsandseals.com

**Features:**
- Display-only biometrics
- Display-only location
- M-Ping acknowledgment
- GPS transmission toggle
- Game freeze notifications

**Restrictions:**
- No mission planning
- No operations feed
- No tactical map access
- No equipment management
- No checklist management

**Why Restricted:**
- Reduces complexity for players
- Focuses on core gameplay
- Prevents information overload
- Maintains Blue Team information advantage

---

## Data Management

### Persistence Strategy

All data persists in the Spark KV store, which provides:
- **Key-Value Storage:** Simple, fast reads/writes
- **JSON Serialization:** Complex objects stored as JSON
- **Per-User Isolation:** Data scoped to application
- **Instant Updates:** No database connection overhead
- **Synchronous Access:** Immediate read/write operations

### Data Cleanup

**Automatic Cleanup:**
- Old broadcasts (24 hour retention)
- Expired M-Pings
- Completed sequences
- Stale telemetry (>1 hour old)

**Manual Cleanup:**
- Debrief incinerator
- Equipment retrieval
- Checklist deletion
- Annotation removal

### Backup & Export

**Exportable Data:**
- After Action Reports
- Communications Log
- GPS Breadcrumb Trails
- Mission Logs
- Equipment History

**Export Formats:**
- JSON (structured data)
- CSV (tabular data)
- PDF (reports)

---

## Integration Points

### External Systems

#### Flaps and Seals Minigame
- Hook: `use-flaps-and-seals-integration.ts`
- Data: Overdue ping count, loot modifiers
- Direction: Watch → Minigame

#### Gone Rogue Data Registry
- Library: `goneRogueDataRegistry.ts`
- Data: Item definitions, stats, metadata
- Sources: Static JSON, live ARG events, optional API
- Direction: Registry → All systems

### Internal Systems

```
┌────────────────────────────────────────────────────────────┐
│                    SYSTEM INTEGRATIONS                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Event Sequencer ←→ M Console Sync                         │
│    (Sequences trigger broadcasts)                          │
│                                                             │
│  ARG System ←→ Dead Drop Manager                           │
│    (ARG items placed in drops)                             │
│                                                             │
│  Dead Drop Manager ←→ Agent Inventory                      │
│    (Retrieved items add to inventory)                      │
│                                                             │
│  Real-World Items ←→ Business Map                          │
│    (Items linked to business locations)                    │
│                                                             │
│  Business Map ←→ Dead Drop Manager                         │
│    (Drag items to create drops)                            │
│                                                             │
│  Equipment Inventory ←→ Equipment Map                      │
│    (Deployed equipment shows on map)                       │
│                                                             │
│  Red Team Telemetry ←→ Geofencing                         │
│    (Check positions against fences)                        │
│                                                             │
│  Annotation System ←→ Broadcast System                     │
│    (Annotations require acknowledgments)                   │
│                                                             │
│  Game State ←→ All Systems                                 │
│    (Freeze affects everything)                             │
│                                                             │
│  Mission Log ←→ All Actions                                │
│    (Everything logged)                                     │
│                                                             │
│  Ops Feed ←→ All Systems                                   │
│    (All activity broadcasted)                              │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### Common Desktop Workflows

#### 1. Deploy a Mission Scenario
```
1. Switch to M Console mode
2. Open Scenario Creator
3. Fill in name, description, threat level
4. Add objectives
5. Create lanes (start/end grids, assign assets)
6. Set asset starting positions
7. Click "DEPLOY SCENARIO"
8. Verify in deployment history
```

#### 2. Create Automated Event Sequence
```
1. Open Event Sequencer
2. Click "New Sequence"
3. Name and describe
4. Add steps (click "Add Step")
   - Choose type (M-Ping, Ops Update, etc.)
   - Set delay in seconds
   - Configure payload
5. Save sequence
6. Click Play button to start
7. Monitor progress in real-time
```

#### 3. Build Conditional Timeline
```
1. Click "New Timeline" in Timeline Editor card
2. Add Step 1 (e.g., broadcast with ACK required)
3. Click "Branch" button on Step 1
4. Choose condition (e.g., "Acknowledgment Received")
5. Add steps inside branch
6. Add alternate branch (e.g., "On Timeout")
7. Add steps inside alternate branch
8. Continue building sequence
9. Save timeline
10. Deploy when ready
```

#### 4. Create ARG Event with Dead Drop
```
1. Open ARG Event Creator
2. Enter event name
3. Add items:
   - Item ID, name, emoji
   - Type, rarity
   - Attributes
4. Save event
5. Click "Activate" in ARG Event Dashboard
6. Open Dead Drop Manager
7. Create new drop:
   - Name, grid location
   - Access code
   - Select items from event
8. Deploy drop
9. Agents can now discover/retrieve
```

#### 5. Track Real-World Business Participation
```
1. Open Real-World Item Crafter
2. Fill in business details
3. Add item information
4. Upload photos (required)
5. Click "Craft Item"
6. Item appears in debrief feed with photos
7. View in Business Partnership Directory
8. See on Business Map Overlay
9. Optionally drag to grid to create dead drop
```

#### 6. Monitor and Manage Red Team
```
1. Add players in Red Team Management Panel
2. Enable GPS for players you want to track
3. Red Team Telemetry Panel shows live positions
4. Set up geofences via map annotations
5. Geofencing Alerts panel shows breaches
6. Monitor safety via biometric vitals
```

#### 7. Freeze Game for Technical Issue
```
1. Open Game Control Panel (top of M Console)
2. Enter freeze reason: "Technical difficulty"
3. Click "FREEZE GAME"
4. All watches show "GAME FROZEN" banner
5. All telemetry pauses
6. Resolve issue
7. Click "RESUME GAME"
8. Normal operations continue
```

### Keyboard Shortcuts

(Currently not implemented, but recommended for future enhancement)

---

## Support & Troubleshooting

### Common Issues

#### Broadcasts Not Received
- **Check:** M Console sync is running (auto-starts)
- **Check:** Watch is polling (should be every 3s)
- **Check:** Target agent IDs match
- **Fix:** Refresh browser on watch
- **Fix:** Toggle M Console mode off/on

#### Sequences Not Executing
- **Check:** Sequence status is "active" (not paused)
- **Check:** Browser tab is active (not throttled)
- **Check:** Step delays are correct (milliseconds internally)
- **Fix:** Check browser console for errors
- **Fix:** Pause and resume sequence

#### Telemetry Not Updating
- **Check:** Game is not frozen
- **Check:** GPS transmission enabled (Red Team)
- **Check:** Watch is transmitting (biometric updates)
- **Fix:** Check last update timestamp
- **Fix:** Restart telemetry sync

#### Items Not Appearing in Inventory
- **Check:** ARG event is activated
- **Check:** Dead drop was retrieved (not just discovered)
- **Check:** Agent ID matches
- **Fix:** Check liveArgSync operations
- **Fix:** Verify item IDs match

### Performance Optimization

**Recommendations:**
- Maximum 5 active sequences simultaneously
- Keep sequences under 20 steps
- Use repeating sequences instead of very long linear ones
- Clean up completed sequences regularly
- Limit GPS breadcrumb trail to 100 points (automatic)
- Archive old mission logs
- Prune old broadcasts (automatic 24h retention)

### Browser Requirements

- **Modern Browser:** Chrome, Firefox, Safari, Edge (latest versions)
- **JavaScript:** Must be enabled
- **Cookies:** Required for Spark KV persistence
- **Local Storage:** Required for some caching
- **Screen Resolution:** 768px minimum width for optimal M Console experience

---

## Glossary

**Agent:** Field operative using Watch interface  
**Asset:** Any tracked entity on tactical map (agents, equipment)  
**Broadcast:** Message sent from M Console to watches  
**Branch:** Conditional execution path in timeline  
**Dead Drop:** Physical item cache at grid location  
**Geofence:** Restricted zone on map that triggers alerts  
**Grid:** 8×8 tactical coordinate system (A1-H8)  
**Lane:** Tactical patrol route with assigned assets  
**M Console:** Desktop operator interface (full control)  
**M Ping:** Direct message from M Console requiring acknowledgment  
**Ops Feed:** Real-time activity stream across all agents  
**Red Team:** Players using simplified watch (via flapsandseals.com)  
**Blue Team:** Field agents with full watch capabilities  
**Scenario:** Complete mission configuration with lanes and objectives  
**Sequence:** Automated series of events on schedule  
**Telemetry:** Real-time biometric and location data from watches  
**Timeline:** Event sequence with conditional branching logic  
**Watch:** Field agent interface (mobile or desktop)

---

## Conclusion

The Field Telemetry system is a sophisticated, multi-layered platform for coordinating real-time operations across distributed teams. The M Console provides desktop operators with unprecedented control over:

- **Narrative Flow** (Event Sequencer, Visual Timeline Editor)
- **Tactical Operations** (Scenario Creator, Asset Dispatch, Lane Management)
- **Alternate Reality Gaming** (ARG Events, Dead Drops, Inventories)
- **Real-World Integration** (Business Partnerships, Item Crafting, Photo Documentation)
- **Team Coordination** (Red/Blue Team Management, Telemetry, Geofencing)
- **Communication** (Broadcasts, Templates, Scheduling, Acknowledgments)

All systems synchronize in real-time via the Spark KV store, creating a seamless experience across desktop and mobile interfaces.

**For additional documentation, see:**
- `M_CONSOLE_SYNC.md` - Detailed broadcast architecture
- `EVENT_SEQUENCER.md` - Automated scheduling deep dive
- `VISUAL_TIMELINE_EDITOR.md` - Conditional branching guide
- `ARCHITECTURE_ARG.md` - ARG system architecture
- `GAME_STATE_SYNC.md` - Red Team integration and freeze controls
- `REAL_WORLD_BUSINESS_TRACKING.md` - Business partnership system
- `ANNOTATION_BROADCASTING.md` - Map annotation acknowledgment system

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** Field Telemetry Development Team
