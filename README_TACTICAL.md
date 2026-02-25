# EYES ONLY - Field Telemetry System

A real-time tactical field operations watch system for Live ARG missions, featuring Blue Team (Ops), Red Team, and M Console interfaces with synchronized game state management and Flaps & Seals minigame integration.

## 🎯 What This Is

A sophisticated multi-user field operations system that provides:
- **Blue Team/Ops Watch**: Full tactical capabilities with mission planning, asset dispatch, and M Console mode
- **Red Team Watch**: Simplified field watch with telemetry display and GPS transmission
- **M Console**: Game master controls with freeze/panic buttons and Red Team monitoring
- **Flaps & Seals Integration**: Dynamic loot penalties based on M Ping acknowledgment compliance

## 🚀 Quick Start

### For Red Team Players
1. Navigate to flapsandseals.com (main portal)
2. Login with Red Team credentials
3. See your simplified watch with red color scheme
4. Toggle "TRANSMITTING GPS" to share location
5. Acknowledge M Pings within 30 seconds

### For Blue Team/Ops
1. Navigate to flapsandseals.com/ops
2. Login with Blue Team credentials
3. Access full tactical interface
4. Toggle "M CONSOLE" for game master controls

### For Flaps & Seals Integration
```tsx
import { useFlapsAndSealsIntegration } from './hooks/use-flaps-and-seals-integration'

function YourGame() {
  const modifiers = useFlapsAndSealsIntegration()
  // modifiers.lootTableMultiplier
  // modifiers.dropRateMultiplier
  // modifiers.isFrozen
}
```

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get started in 5 minutes
- **[RED_TEAM_INTEGRATION.md](RED_TEAM_INTEGRATION.md)** - Complete integration guide
- **[GAME_STATE_SYNC.md](GAME_STATE_SYNC.md)** - Technical architecture
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What was built
- **[ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)** - Visual system overview
- **[PRD.md](PRD.md)** - Product requirements and features
- **[M_CONSOLE_SYNC.md](M_CONSOLE_SYNC.md)** - M Console broadcast system
- **[ANNOTATION_BROADCASTING.md](ANNOTATION_BROADCASTING.md)** - Map annotation sync

## ✨ Key Features

### Real-Time Synchronization
- Game freeze/unfreeze propagates to all watches within 1-2 seconds
- Red Team GPS telemetry streams every 3 seconds
- M Ping timeout tracking with 30-second window
- Flaps & Seals penalty calculations update in real-time

### Three Watch Types
1. **Blue Team/Ops**: Full tactical suite with mission planning
2. **Red Team**: Simplified watch with GPS transmission toggle
3. **M Console**: Game master controls and monitoring

### Flaps & Seals Integration
- Automatic loot penalties based on overdue M Pings
- Progressive tiers: 1.0x → 0.85x → 0.6x → 0.3x
- Game mode indicators: normal/degraded/critical
- Automatic freeze detection

### M Console Controls
- Freeze entire game with reason logging
- Emergency panic button for immediate halt
- Monitor all Red Team player GPS positions
- Track overdue ping counts

## 🎮 Penalty System

| Overdue Pings | Loot Multiplier | Effect |
|---------------|-----------------|--------|
| 0 | 1.0x | Full rewards |
| 1-2 | 0.85x | Minor penalty |
| 3-4 | 0.6x | Degraded mode |
| 5+ | 0.3x | Critical mode |

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **Tailwind CSS v4** with custom tactical theme
- **shadcn/ui v4** component library
- **@phosphor-icons/react** for iconography
- **Spark KV Storage** for real-time sync
- **Framer Motion** for animations
- **Sonner** for toast notifications

## 📦 Project Structure

```
src/
├── components/
│   ├── RedTeamWatch.tsx              # Red Team player interface
│   ├── GameControlPanel.tsx          # M Console freeze controls
│   ├── RedTeamTelemetryPanel.tsx    # Red Team monitoring
│   ├── MPing.tsx                      # M Ping display/ack
│   ├── MissionPlanner.tsx             # Waypoint and distance tools
│   ├── HybridTacticalMap.tsx          # 8x8 grid with annotations
│   └── ...30+ other components
├── hooks/
│   └── use-flaps-and-seals-integration.ts
├── lib/
│   ├── gameStateSync.ts               # Game state sync system
│   ├── mConsoleSync.ts                # M Console broadcast system
│   └── sounds.ts                      # Audio alert generator
└── integrations.ts                    # Export file for external use
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## 🎨 Design System

- **Primary Color**: Tactical Green (oklch(0.75 0.18 145)) - Active telemetry
- **Accent Color**: Amber Alert (oklch(0.75 0.16 75)) - Warnings
- **Destructive**: Red Alert (oklch(0.65 0.25 25)) - Critical/Red Team
- **Background**: Deep Slate (oklch(0.15 0.01 240)) - Terminal aesthetic
- **Font**: JetBrains Mono - Military/technical monospace

## 🚨 Testing Checklist

- [ ] M Console freeze propagates to all watches
- [ ] Red Team GPS transmission works
- [ ] M Ping acknowledgment within 30s
- [ ] Overdue pings increment correctly
- [ ] Flaps & Seals penalties apply
- [ ] Emergency panic button works
- [ ] All state persists in KV storage

## 🤝 Contributing

This is a tactical operations system for Live ARG events. Features should:
- Maintain the classified/military aesthetic
- Support real-time synchronization
- Work on mobile devices (primary platform)
- Follow the established design system

## 📄 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.

## 🎯 Next Steps

1. Deploy Red Team watch at flapsandseals.com
2. Integrate Flaps & Seals with penalty system
3. Test M Console freeze controls in live exercise
4. Train operators on game state management
5. Brief Red Team players on M Ping importance

---

**EYES ONLY - CLASSIFIED - FOR AUTHORIZED PERSONNEL ONLY**
