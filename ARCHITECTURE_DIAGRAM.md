# System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLAPSANDSEALS.COM PORTAL                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                    Login Portal              Login Portal
                    (Main Site)                 (/ops)
                         │                         │
                         ▼                         ▼
            ┌─────────────────────┐   ┌─────────────────────┐
            │   RED TEAM WATCH    │   │   BLUE TEAM WATCH   │
            │   (Simplified)      │   │   (Full Tactical)   │
            │                     │   │                     │
            │ • Biometrics        │   │ • Biometrics        │
            │ • GPS Location      │   │ • GPS Location      │
            │ • M Ping Ack        │   │ • Mission Planning  │
            │ • GPS Toggle        │   │ • Tactical Maps     │
            │ • Freeze Alert      │   │ • Ops Feed          │
            │                     │   │ • Asset Dispatch    │
            │ RED COLOR SCHEME    │   │ • M Console Toggle  │
            └──────────┬──────────┘   └──────────┬──────────┘
                       │                         │
                       │  GPS Telemetry          │  All Operations
                       │  M Ping Acks            │  M Ping Acks
                       │                         │
                       ▼                         ▼
            ┌──────────────────────────────────────────────┐
            │         GAME STATE SYNC (KV STORAGE)         │
            │                                              │
            │  game-state-sync:game-state                 │
            │    { frozen, emergencyPanic, reason }       │
            │                                              │
            │  game-state-sync:telemetry:{playerId}       │
            │    { lat, lng, HR, stress, O2, temp }       │
            │                                              │
            │  game-state-sync:ping:{pingId}              │
            │    { targetAgent, issuedAt, acknowledged }  │
            │                                              │
            │  Poll Interval: 1-2 seconds                 │
            └──────────────────┬───────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
    ┌─────────────────┐ ┌─────────────┐ ┌────────────────┐
    │  M CONSOLE      │ │  OPS WATCH  │ │ FLAPS & SEALS  │
    │  (Admin View)   │ │  (Monitors) │ │   MINIGAME     │
    │                 │ │             │ │                │
    │ • Freeze Game   │ │ • View All  │ │ • Loot Tables  │
    │ • Panic Button  │ │   Telemetry │ │ • Drop Rates   │
    │ • Monitor Red   │ │ • Track Red │ │ • Game Mode    │
    │   Team GPS      │ │   Team      │ │ • Freeze Det.  │
    │ • View Overdue  │ │ • Mission   │ │                │
    │   Pings         │ │   Oversight │ │ PENALTY SYSTEM │
    │ • Deploy        │ │             │ │ 0 overdue: 1.0x│
    │   Scenarios     │ │             │ │ 1-2: 0.85x     │
    │ • Broadcast     │ │             │ │ 3-4: 0.6x      │
    │   Templates     │ │             │ │ 5+: 0.3x       │
    └─────────────────┘ └─────────────┘ └────────────────┘


                        DATA FLOW DIAGRAM

    ┌──────────────┐
    │ Red Team     │  1. Player toggles "TRANSMITTING GPS" ON
    │ Player Watch │
    └──────┬───────┘
           │
           │  2. GPS + Biometrics broadcast every 3s
           ▼
    ┌──────────────────────┐
    │ gameStateSync        │  3. Stores in KV:
    │ .publishTelemetry()  │     game-state-sync:telemetry:{playerId}
    └──────┬───────────────┘
           │
           │  4. M Console polls every 1-2s
           ▼
    ┌──────────────────────┐
    │ Red Team Telemetry   │  5. Displays all transmitting players
    │ Panel (M Console)    │     with GPS coordinates and vitals
    └──────────────────────┘


                        M PING FLOW

    ┌──────────────┐
    │ M Console    │  1. Issue M Ping to Red Team player
    └──────┬───────┘
           │
           │  2. Broadcast to m-console-sync:broadcast:*
           ▼
    ┌──────────────────────┐
    │ mConsoleSync         │  3. Red Team watch polls and receives
    └──────┬───────────────┘
           │
           │  4. Display M Ping with sound alert
           ▼
    ┌──────────────┐
    │ Red Team     │
    │ Player Watch │
    └──────┬───────┘
           │
           │  5. Player has 30 seconds to acknowledge
           │
    ┌──────┴────────────┐
    │                   │
    ▼                   ▼
  Acknowledged      Not Acknowledged
    │                   │
    │                   │  6. After 30s timeout
    │                   ▼
    │            ┌──────────────────┐
    │            │ gameStateSync    │  7. Mark as overdue
    │            │ .recordPing()    │
    │            └──────┬───────────┘
    │                   │
    │                   │  8. Overdue count increments
    │                   ▼
    │            ┌──────────────────────────┐
    │            │ Flaps & Seals Minigame   │  9. Apply penalty
    │            │ useFlapsAndSeals         │     (loot * 0.85x)
    │            │ Integration()            │
    │            └──────────────────────────┘
    │
    │  10. Acknowledge removes from overdue
    └───────────────────┐
                        │  11. Penalty reduced/removed
                        ▼
                 ┌──────────────────────────┐
                 │ gameStateSync            │
                 │ .acknowledgePing()       │
                 └──────────────────────────┘


                        FREEZE FLOW

    ┌──────────────┐
    │ M Console    │  1. Click "FREEZE GAME" with reason
    └──────┬───────┘
           │
           │  2. Write to KV:
           │     { frozen: true, reason: "..." }
           ▼
    ┌──────────────────────┐
    │ gameStateSync        │  3. All watches poll every 1s
    │ .freezeGame()        │
    └──────┬───────────────┘
           │
           │  4. Within 1-2 seconds:
           │
    ┌──────┴────────────────────────────┐
    │                                   │
    ▼                                   ▼
┌─────────────────┐           ┌─────────────────┐
│ Blue Team Watch │           │ Red Team Watch  │
│ • Shows banner  │           │ • Shows banner  │
│ • Pauses bio    │           │ • Pauses bio    │
│ • Pauses GPS    │           │ • Pauses GPS    │
└─────────────────┘           └─────────────────┘
                                   │
                                   │  5. Also propagates to:
                                   ▼
                           ┌────────────────┐
                           │ Flaps & Seals  │
                           │ • Detects via  │
                           │   hook         │
                           │ • Pauses game  │
                           │ • Shows banner │
                           └────────────────┘


                    KV STORAGE SCHEMA

    game-state-sync:
      ├── game-state                     (Single record)
      │   └── { frozen, emergencyPanic, reason, timestamp, initiatedBy }
      │
      ├── telemetry:{playerId}           (One per player)
      │   └── { playerId, callsign, team, lat, lng, alt, speed,
      │         heartRate, bloodOxygen, stress, temp, lastUpdate }
      │
      ├── telemetry-timeline:            (Historical log)
      │   └── {timestamp}-{playerId}
      │       └── { ...same as telemetry }
      │
      └── ping:{pingId}                  (One per unacknowledged ping)
          └── { pingId, targetAgentId, targetCallsign,
                issuedAt, timeoutMs, acknowledged }

    m-console-sync:                      (Existing M Console system)
      ├── broadcast:{timestamp}          (M Ping broadcasts)
      ├── tracked:{broadcastId}          (Tracked for acknowledgment)
      └── ack:{broadcastId}:{agentId}    (Individual acknowledgments)
```
