# Field Telemetry - Multi-Device Tactical Operations Platform

A sophisticated real-time coordination system for managing field operations across Desktop (M Console) and mobile Watch interfaces.

## 🎯 Overview

Field Telemetry is a multi-layered operational platform that enables desktop operators to coordinate with field agents in real-time. The system synchronizes mission data, telemetry, broadcasts, and tactical information across distributed teams.

### System Modes

- **Watch Mode** (Default): Field agent interface with biometrics, GPS, mission logs, and tactical maps
- **M Console Mode** (Desktop): Full operator interface with scenario deployment, event sequencing, ARG management, and advanced controls

Toggle between modes using the **M CONSOLE / WATCH** button in the header.

## 📚 Documentation

### 🚀 Getting Started

**New Desktop Operators Start Here:**
- **[DESKTOP_OPERATOR_QUICKSTART.md](DESKTOP_OPERATOR_QUICKSTART.md)** - Get productive in 10 minutes
  - Deploy your first scenario
  - Create automated sequences
  - Build conditional timelines
  - Set up ARG dead drops
  - Monitor Red Team

**Complete System Reference:**
- **[DESKTOP_SYNC_MASTER_GUIDE.md](DESKTOP_SYNC_MASTER_GUIDE.md)** - Comprehensive architecture documentation
  - All M Console capabilities
  - Real-time synchronization systems
  - Advanced features deep dive
  - Integration points
  - Troubleshooting guide

### 🎮 Core Systems

**Mission Control:**
- [M_CONSOLE_SYNC.md](M_CONSOLE_SYNC.md) - Broadcast architecture and scenario deployment
- [EVENT_SEQUENCER.md](EVENT_SEQUENCER.md) - Automated event scheduling engine
- [VISUAL_TIMELINE_EDITOR.md](VISUAL_TIMELINE_EDITOR.md) - Conditional branching timelines
- [GAME_STATE_SYNC.md](GAME_STATE_SYNC.md) - Game freeze/unfreeze and Red Team integration

**Tactical Operations:**
- [ANNOTATION_BROADCASTING.md](ANNOTATION_BROADCASTING.md) - Map annotation system with acknowledgments
- [PATROL_ROUTES_FEATURE.md](PATROL_ROUTES_FEATURE.md) - Automated patrol route templates
- [GEOFENCING_FEATURE.md](GEOFENCING_FEATURE.md) - Restricted zone alerts
- [EQUIPMENT_INVENTORY.md](EQUIPMENT_INVENTORY.md) - Full equipment lifecycle tracking

**ARG & Real-World Integration:**
- [ARCHITECTURE_ARG.md](ARCHITECTURE_ARG.md) - Live ARG system architecture
- [LIVE_ARG_SYSTEM.md](LIVE_ARG_SYSTEM.md) - Dead drops and agent inventories
- [REAL_WORLD_BUSINESS_TRACKING.md](REAL_WORLD_BUSINESS_TRACKING.md) - Business participation with photos
- [BUSINESS_PARTNER_MANAGEMENT.md](BUSINESS_PARTNER_MANAGEMENT.md) - Partnership tracking and media feed

**Team Management:**
- [RED_TEAM_MANAGEMENT.md](RED_TEAM_MANAGEMENT.md) - Red Team player configuration
- [RED_TEAM_INTEGRATION.md](RED_TEAM_INTEGRATION.md) - Telemetry monitoring and geofencing

### 📖 Quick Start Guides

- [QUICK_START.md](QUICK_START.md) - General application overview
- [QUICK_START_ARG.md](QUICK_START_ARG.md) - ARG system basics
- [QUICK_START_BUSINESS.md](QUICK_START_BUSINESS.md) - Business tracking basics
- [QUICK_START_SEQUENCER.md](QUICK_START_SEQUENCER.md) - Event sequencer basics

### 🏗️ Architecture & Implementation

- [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) - System architecture overview
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Feature implementation details
- [IMPLEMENTATION_BUSINESS_SYSTEM.md](IMPLEMENTATION_BUSINESS_SYSTEM.md) - Business system implementation
- [FEATURE_VERIFICATION.md](FEATURE_VERIFICATION.md) - Verification checklist

### 📋 Tactical References

- [README_TACTICAL.md](README_TACTICAL.md) - Tactical operations guide
- [README_BUSINESS_SYSTEM.md](README_BUSINESS_SYSTEM.md) - Business system overview
- [EQUIPMENT_EXAMPLES.md](EQUIPMENT_EXAMPLES.md) - Equipment usage examples
- [VISUAL_WORKFLOW_GUIDE.md](VISUAL_WORKFLOW_GUIDE.md) - Visual workflow documentation

## 🌟 Key Features

### M Console (Desktop Operator)

- **Game Control**: Freeze/unfreeze all operations, emergency panic button
- **Event Sequencer**: Automated multi-step broadcast sequences with precise timing
- **Visual Timeline Editor**: Conditional branching based on acknowledgments and game state
- **Scenario Creator**: Deploy complete missions with lanes, objectives, and asset positioning
- **ARG System**: Create events, place dead drops, manage agent inventories
- **Business Tracking**: Document real-world participation with photo uploads
- **Red Team Monitoring**: Live GPS telemetry and biometric tracking
- **Broadcast Management**: Templates, scheduling, and acknowledgment tracking
- **Equipment Oversight**: Full deployment lifecycle with map overlay
- **Geofencing**: Restricted zone alerts for Red Team incursions

### Watch Interface (Field Agent)

- **Real-Time Biometrics**: Heart rate, blood oxygen, stress level, temperature
- **GPS Tracking**: Precise coordinates, speed, elevation, distance
- **M-Ping System**: Direct messages from M Console with acknowledgment
- **Operations Feed**: Real-time activity stream across all agents
- **Tactical Maps**: Grid-based and GPS-based map views with lanes and annotations
- **Mission Planner**: Create waypoints and measure distances
- **Equipment Management**: Deploy and retrieve equipment with full history
- **Tactical Checklists**: Mission-critical task tracking
- **Communications Log**: Complete audit trail of all transmissions
- **Environmental Data**: Real-world weather and conditions

## 🔧 Technical Architecture

### Synchronization Layers

1. **M Console Sync** (`mConsoleSync.ts`) - Broadcasts, scenarios, lanes (3s polling)
2. **Game State Sync** (`gameStateSync.ts`) - Freeze state, telemetry, pings (1s polling)
3. **Event Sequencer** (`eventSequencer.ts`) - Automated sequence execution (1s check)
4. **Live ARG Sync** (`liveArgSync.ts`) - Events, drops, inventories (real-time)

### Data Persistence

All data persists in the Spark KV store with namespaced keys:
- `m-console-sync:*` - Broadcasts, scenarios, lanes, assets
- `game-state-sync:*` - Game state, telemetry, ping tracking
- `event-sequencer:*` - Sequences and execution state
- `arg-event:*` - ARG events and items
- `dead-drop:*` - Item drops at grid locations
- `agent-inventory:*` - Per-agent inventories
- `business-partners:*` - Real-world business tracking
- `debrief-entries:*` - Media feed entries

### Integration Points

- **Flaps and Seals Minigame**: Hook for loot table penalties based on ping compliance
- **Gone Rogue Data Registry**: Item definitions from static JSON, live events, and optional API
- **Red Team Telemetry**: GPS streaming from simplified Red Team watches
- **Business Map**: Drag-and-drop integration with dead drop creation

## 🚀 Getting Started

### For Desktop Operators

1. Open the application
2. Click **M CONSOLE** button in header
3. Follow **[DESKTOP_OPERATOR_QUICKSTART.md](DESKTOP_OPERATOR_QUICKSTART.md)** for essential workflows

### For Field Agents

1. Application starts in Watch mode by default
2. Monitor M-Pings and acknowledge
3. View Operations Feed for team activity
4. Use Tactical Map for situational awareness

### For Red Team Players

1. Login via flapsandseals.com (simplified interface)
2. Enable GPS transmission toggle
3. Acknowledge M-Pings when received
4. Monitor biometrics and location only

## 🛠️ Development

### Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4
- **UI Components**: shadcn v4, Phosphor Icons
- **State Management**: React hooks, Spark KV persistence
- **Build**: Vite 7
- **Styling**: JetBrains Mono font, custom tactical theme

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn components (pre-installed)
│   ├── *Management/    # M Console management panels
│   ├── *Viewer/        # Display components
│   └── ...
├── lib/                # Core libraries
│   ├── mConsoleSync.ts         # M Console broadcast system
│   ├── gameStateSync.ts        # Game state management
│   ├── eventSequencer.ts       # Automated sequences
│   ├── liveArgSync.ts          # ARG system
│   └── ...
├── hooks/              # React hooks
│   ├── use-kv.ts                  # Spark KV persistence
│   ├── use-flaps-and-seals.ts     # Minigame integration
│   └── ...
└── App.tsx             # Main application component
```

## 📄 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.

## 🤝 Contributing

This is a tactical operations platform. Modifications should maintain:
- Real-time synchronization across devices
- Data persistence and audit trails
- Clear operator vs field agent separation
- Performance (5+ active sequences, 100 GPS breadcrumbs, 1-3s polling)

## 🆘 Support

See [DESKTOP_SYNC_MASTER_GUIDE.md](DESKTOP_SYNC_MASTER_GUIDE.md) troubleshooting section for common issues and solutions.
