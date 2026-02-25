# Live ARG System - Quick Start Guide

## For M Console Operators

### Creating an ARG Event

1. Switch to M Console mode (Desktop icon in header)
2. Click **"CREATE ARG EVENT"** button
3. Enter event name (e.g., "MIDNIGHT DROP ALPHA")
4. Add description (optional but recommended)
5. Add items one at a time:
   - Item name (e.g., "FIELD RADIO")
   - Emoji thumbnail (📻)
   - Type (tool/intel/weapon/etc.)
   - Rarity (common to legendary)
   - Optional: Description, weight, value, nature stats
   - Toggle one-time only (recommended for ARG events)
6. Click **"Add Item"** to add each item
7. Click **"Create Event"** when done
8. Event appears in ARG Event Dashboard

### Activating ARG Events

1. Scroll to **ARG Event Dashboard**
2. Find your event in "INACTIVE EVENTS" section
3. Click **"Activate"** button
4. Items now available for dead drop deployment

### Creating Dead Drops

1. Scroll to **Dead Drop Manager**
2. Click **"CREATE DEAD DROP"**
3. Enter drop name (e.g., "CACHE ALPHA")
4. Select grid coordinates (A-H, 1-8)
5. Optionally adjust GPS lat/lng
6. Select items from available pool (click to toggle selection)
7. Optional: Enable "Requires Access Code" and enter code
8. Click **"Create Drop"**
9. Drop appears on map and in dead drop list

### Monitoring Agent Inventories

1. Scroll to **Agent Inventory Viewer**
2. Click agent callsign buttons to switch between agents
3. View all items in selected agent's inventory
4. Drag items to other agent buttons to transfer
5. Or click transfer icon and select target agent

## For Field Agents (Future Feature)

### Discovering Dead Drops

1. Navigate to dead drop grid location
2. Enter access code if required
3. Retrieve items into inventory
4. View items in inventory panel

### Transferring Items

1. Open inventory viewer
2. Drag item to another agent's card
3. Or click transfer icon and select recipient
4. Confirm transfer

## Item Properties

### Emoji Thumbnails

Items use emoji as visual identifiers:
- 📻 Radios
- 🔑 Keys
- 💊 Medical
- 📋 Intel
- 📍 Trackers
- 🥽 Equipment
- 💾 Data
- 💨 Tactical gear

### Rarity Tiers

- **Common**: Standard field equipment (gray)
- **Uncommon**: Specialized tools (green)
- **Rare**: Advanced tech (blue)
- **Epic**: High-value assets (purple)
- **Legendary**: Mission-critical items (gold)
- **Unique**: One-of-a-kind collectibles (red)

### Nature Stats (0-10 scale)

- **Heat**: Detection risk / threat level
- **Signal**: Communication capability
- **Stealth**: Concealment value
- **Intel**: Intelligence gathering power
- **Tactical**: Mission utility

## Integration Points

### Equipment System

ARG items are separate from equipment inventory:
- Equipment = Full lifecycle tracking with deployment history
- ARG Items = Collectibles with simple pickup/transfer

Both can coexist on the same map.

### Gone Rogue Minigame

Items can integrate with loot tables:
- Canonical items in `/public/data/gone-rogue/items.json`
- Live ARG items loaded dynamically from KV
- Registry merges both sources automatically

### Hybrid Tactical Map

Dead drops integrate with existing map:
- ARG drops use same grid system (A-H, 1-8)
- Equipment deployments separate
- Map annotations can mark drop zones

## Common Workflows

### Live Event Setup

1. Create ARG event with themed items
2. Activate event before mission starts
3. Create multiple dead drops across map
4. Monitor discovery and retrieval in real-time

### Item Distribution

1. Create event with starter items
2. Give all agents initial inventory
3. Place rare items in distant drops
4. Watch agents coordinate retrieval

### Item Trading

1. Agents discover different items
2. Transfer items between agents via drag-drop
3. Build specialized loadouts per role
4. Track transfers in mission log

## Tips & Tricks

### Organizing Items

- Use consistent emoji patterns (📻 for radios, 🔑 for keys)
- Name items with mission context (e.g., "NIGHTFALL RADIO")
- Set appropriate rarity based on scarcity
- Mark one-time items to prevent duplication

### Securing Drops

- Use access codes for high-value drops
- Set expiration times for time-sensitive items
- Place drops at strategic grid locations
- Monitor discovery status in real-time

### Balancing Nature Stats

- High heat items create risk
- High signal items enable coordination
- High intel items advance objectives
- Balance stats based on item role

## Troubleshooting

### Items Not Showing

1. Check event is activated
2. Verify items added to registry
3. Reload page to refresh

### Drops Not Appearing

1. Confirm drop created successfully
2. Check grid coordinates are valid (0-7)
3. Verify items were selected

### Transfers Failing

1. Ensure source agent has item
2. Check target agent exists in asset list
3. Verify drag completed on target card

## Data Persistence

All data stored in Spark KV:
- `arg-event:{id}` - Event definitions
- `dead-drop:{id}` - Drop locations  
- `agent-inventory:{agentId}` - Item lists

Data persists between sessions and survives page reloads.

## API Reference

See `LIVE_ARG_SYSTEM.md` for complete API documentation.

Key modules:
- `src/lib/goneRogueDataRegistry.ts` - Item registry
- `src/lib/liveArgSync.ts` - Sync manager
- `src/components/ArgEventCreator.tsx` - Event UI
- `src/components/DeadDropManager.tsx` - Drop UI
- `src/components/AgentInventoryViewer.tsx` - Inventory UI
