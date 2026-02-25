# Live ARG Collectible Items System

## Overview

The Live ARG (Alternate Reality Game) system enables dynamic creation and distribution of one-time collectible items during live gameplay events. Items are spawned through ARG events, placed in dead drops on the tactical map, and can be discovered and transferred between agents.

## Architecture

### Gone Rogue Data Registry

**Location**: `src/lib/goneRogueDataRegistry.ts`

The registry loads items from two sources:
1. **Canonical Base**: `/public/data/gone-rogue/items.json` - Permanent item definitions
2. **Live Additions**: Dynamic items created during ARG events (stored in KV)

#### Configuration

Set global configuration before loading the registry:

```typescript
// Configure registry base path (optional, defaults to '/data/gone-rogue/')
(window as any).__ROGUE_REGISTRY_BASE__ = '/data/gone-rogue/'

// Configure extra items URL (optional, for external API integration)
(window as any).__ROGUE_REGISTRY_EXTRA_ITEMS_URL__ = '/api/m/rogue-items?scenarioId=1'
```

#### Usage

```typescript
import { rogueItemRegistry } from '@/lib/goneRogueDataRegistry'

// Load the registry
await rogueItemRegistry.load()

// Get a specific item
const item = rogueItemRegistry.getItem('ITM-001')

// Get all items
const allItems = rogueItemRegistry.getAllItems()

// Filter by type
const tools = rogueItemRegistry.getItemsByType('tool')

// Filter by rarity
const rareItems = rogueItemRegistry.getItemsByRarity('rare')

// Get ARG event items
const eventItems = rogueItemRegistry.getItemsByArgEvent('ARG-123')

// Add new items dynamically
rogueItemRegistry.addItem({
  id: 'ITM-900',
  name: 'FIELD RADIO',
  emoji: '📻',
  type: 'tool',
  rarity: 'uncommon',
  oneTimeOnly: true
})

// Reload registry (fetches both canonical and live items)
await rogueItemRegistry.reload()
```

### Live ARG Sync Manager

**Location**: `src/lib/liveArgSync.ts`

Manages ARG events, dead drops, and agent inventories using the Spark KV persistence system.

#### ARG Events

```typescript
import { liveArgSync } from '@/lib/liveArgSync'

// Create an ARG event
const event = await liveArgSync.createArgEvent({
  name: 'MIDNIGHT DROP ALPHA',
  description: 'First wave of classified intel',
  scenarioId: 'scenario-1',
  active: true,
  items: [
    {
      id: 'ITM-900',
      name: 'FIELD RADIO',
      emoji: '📻',
      type: 'tool',
      rarity: 'uncommon',
      oneTimeOnly: true,
      nature: { signal: 5, heat: 2 }
    }
  ]
})

// Get all events
const events = await liveArgSync.getArgEvents()

// Get active events
const activeEvents = await liveArgSync.getActiveArgEvents()

// Activate/deactivate events
await liveArgSync.activateArgEvent('ARG-123')
await liveArgSync.deactivateArgEvent('ARG-123')

// Listen for event updates
const unsubscribe = liveArgSync.onArgEventUpdate((event) => {
  console.log('Event updated:', event)
})
```

#### Dead Drops

```typescript
// Create a dead drop
const drop = await liveArgSync.createDeadDrop({
  name: 'CACHE ALPHA',
  gridX: 3,
  gridY: 5,
  latitude: 40.7128,
  longitude: -74.0060,
  items: ['ITM-900', 'ITM-901'],
  requiresCode: true,
  code: 'NIGHTFALL',
  createdBy: 'M-CONSOLE'
})

// Get all drops
const drops = await liveArgSync.getDeadDrops()

// Get active drops (not expired or retrieved)
const activeDrops = await liveArgSync.getActiveDeadDrops()

// Discover a drop (requires code if secured)
const success = await liveArgSync.discoverDeadDrop(
  'DROP-123',
  'shadow-7-alpha',
  'NIGHTFALL'
)

// Retrieve items from discovered drop
const items = await liveArgSync.retrieveDeadDrop(
  'DROP-123',
  'shadow-7-alpha'
)

// Delete a drop
await liveArgSync.deleteDeadDrop('DROP-123')

// Listen for drop updates
const unsubscribe = liveArgSync.onDeadDropsUpdate((drops) => {
  console.log('Drops updated:', drops)
})
```

#### Agent Inventory

```typescript
// Get agent's inventory
const itemIds = await liveArgSync.getAgentInventory('shadow-7-alpha')

// Add item to inventory
await liveArgSync.addItemToInventory('shadow-7-alpha', 'ITM-900')

// Remove item from inventory
await liveArgSync.removeItemFromInventory('shadow-7-alpha', 'ITM-900')
```

## UI Components

### ARG Event Creator

**Location**: `src/components/ArgEventCreator.tsx`

Dialog for creating new ARG events with multiple items.

```tsx
import { ArgEventCreator } from '@/components/ArgEventCreator'

<ArgEventCreator
  scenarioId="scenario-1"
  onEventCreated={(event) => {
    console.log('Event created:', event)
  }}
/>
```

**Features**:
- Add multiple items with full configuration
- Set item properties: name, emoji, type, rarity, nature stats
- Toggle one-time only, stackable, usable flags
- Preview all items before creating event

### ARG Event Dashboard

**Location**: `src/components/ArgEventDashboard.tsx`

View and manage all ARG events. Activate/deactivate events to control item availability.

```tsx
import { ArgEventDashboard } from '@/components/ArgEventDashboard'

<ArgEventDashboard
  maxHeight="600px"
  onEventActivated={(event) => {
    console.log('Event activated:', event)
  }}
/>
```

**Features**:
- View active and inactive events
- Activate/deactivate events
- See item counts and details
- Real-time updates via sync manager

### Dead Drop Manager

**Location**: `src/components/DeadDropManager.tsx`

Create and manage dead drops on the tactical grid.

```tsx
import { DeadDropManager } from '@/components/DeadDropManager'

<DeadDropManager
  assets={allAssets}
  currentUser="M-CONSOLE"
  maxHeight="600px"
  onDropCreated={(drop) => {
    console.log('Drop created:', drop)
  }}
  onDropRetrieved={(drop, items) => {
    console.log('Retrieved items:', items)
  }}
/>
```

**Features**:
- Create drops at grid coordinates with GPS lat/lng
- Select items from available pool
- Optional access code protection
- Track discovery and retrieval status
- View discovered agents

### Agent Inventory Viewer

**Location**: `src/components/AgentInventoryViewer.tsx`

View agent inventories with drag-and-drop item transfer between agents.

```tsx
import { AgentInventoryViewer } from '@/components/AgentInventoryViewer'

<AgentInventoryViewer
  assets={allAssets}
  currentAgentId="shadow-7-alpha"
  maxHeight="600px"
  onItemTransferred={(fromAgent, toAgent, itemId) => {
    console.log('Item transferred')
  }}
/>
```

**Features**:
- Switch between agent inventories
- Drag items between agents (ghost cursor)
- View item details with nature stats
- Visual rarity indicators
- Alternative transfer dialog for precision

## Item Schema

```typescript
interface RogueItem {
  id: string                    // Unique identifier (e.g., "ITM-900")
  name: string                  // Display name (e.g., "FIELD RADIO")
  emoji: string                 // Visual thumbnail (e.g., "📻")
  type: 'tool' | 'intel' | 'weapon' | 'consumable' | 'key' | 'evidence' | 'equipment'
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'unique'
  description?: string          // Item description
  weight?: number              // Item weight
  value?: number               // Item value
  stackable?: boolean          // Can multiple be carried
  maxStack?: number            // Maximum stack size
  usable?: boolean             // Can be used/consumed
  deployable?: boolean         // Can be placed on map
  oneTimeOnly?: boolean        // ARG collectible flag
  argEventId?: string          // Associated ARG event
  createdAt?: number           // Creation timestamp
  expiresAt?: number           // Expiration timestamp
  nature?: {                   // Game-specific stats
    heat?: number              // Threat/detection level
    signal?: number            // Communication strength
    stealth?: number           // Concealment value
    intel?: number             // Intelligence value
    tactical?: number          // Tactical utility
  }
  metadata?: Record<string, any>  // Extensible data
}
```

## Data Flow

### ARG Event Lifecycle

1. **Create Event**: M Console creates ARG event with items
2. **Activate Event**: Items become available in registry
3. **Create Dead Drops**: Place items at tactical locations
4. **Discovery**: Agents discover drops (optional code required)
5. **Retrieval**: Agents collect items into inventory
6. **Transfer**: Items moved between agents via drag-drop
7. **Deactivate Event**: Event archived but items persist in inventories

### Persistence

All data persists using Spark KV:

- `arg-event:{eventId}` - ARG event data
- `dead-drop:{dropId}` - Dead drop locations
- `agent-inventory:{agentId}` - Agent item lists

### Sync Strategy

- Registry reloads every 10 seconds (configurable)
- Components subscribe to real-time updates via listeners
- State updates trigger automatic UI refresh
- No polling needed - event-driven architecture

## Integration with Existing Systems

### Equipment Inventory

ARG items complement but don't replace equipment inventory:

- **Equipment**: Deployable assets with full lifecycle tracking
- **ARG Items**: Collectibles with simpler pick-up/transfer mechanics

Both can coexist on the map via different systems.

### Hybrid Tactical Map

Dead drops integrate with the existing map annotations system:

- ARG drops can be placed at grid coordinates
- Equipment can be deployed separately
- Both systems use same grid reference (A-H, 1-8)

### Ghost Cursor Drag-Drop

Inventory viewer implements the requested drag-drop pattern:

- Drag items between agent cards
- Visual feedback during drag
- Transfer confirmation toast
- Alternative click-to-transfer dialog

## Advanced Usage

### External API Integration

For dynamic item generation from external systems:

```typescript
// Point registry to external API
(window as any).__ROGUE_REGISTRY_EXTRA_ITEMS_URL__ = 
  'https://api.yourgame.com/items?session=xyz'

// API should return:
[
  {
    "id": "ITM-900",
    "name": "FIELD RADIO",
    "emoji": "📻",
    "type": "tool",
    "nature": { "signal": 5, "heat": 2 }
  }
]
```

### Custom Item Types

Extend the type system by adding to the enum:

```typescript
type: 'tool' | 'intel' | 'weapon' | 'consumable' | 'key' | 'evidence' | 'equipment' | 'custom'
```

Missing fields are ignored by the engine (graceful degradation).

### Prototype Items

Create minimal "proto items" that expand over time:

```typescript
{
  "id": "ITM-999",
  "name": "MYSTERY PACKAGE",
  "emoji": "📦",
  "type": "equipment"
  // Other fields added later
}
```

Registry creates placeholder for missing data.

## M Console Controls

When in M Console mode (`mConsoleMode = true`), operators have access to:

1. **ARG Event Creator** - Spawn new collectibles
2. **ARG Event Dashboard** - Manage active events
3. **Dead Drop Manager** - Place items on map
4. **Agent Inventory Viewer** - Monitor and transfer items
5. **Existing Equipment System** - Deploy full equipment assets

All actions log to Mission Log and Operations Feed with appropriate callsign attribution.

## Best Practices

### Item ID Generation

Use consistent format: `ITM-{timestamp}-{random}`

```typescript
const id = `ITM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
```

### One-Time Collectibles

Mark ARG items as `oneTimeOnly: true` to prevent duplication:

```typescript
{
  oneTimeOnly: true,
  argEventId: 'ARG-123'
}
```

### Access Code Security

Store codes hashed in production:

```typescript
code: hashCode('NIGHTFALL')  // Don't store plaintext
```

### Expiration

Set expiration for time-limited drops:

```typescript
expiresAt: Date.now() + (24 * 60 * 60 * 1000)  // 24 hours
```

### Nature Stats

Use consistent scales (0-10) for balance:

```typescript
nature: {
  heat: 8,      // High detection risk
  signal: 3,    // Low communication boost
  intel: 10,    // Maximum intel value
  stealth: 2,   // Low concealment
  tactical: 5   // Medium utility
}
```

## Troubleshooting

### Items Not Appearing

1. Check registry loaded: `rogueItemRegistry.isLoaded()`
2. Verify event activated: `event.active === true`
3. Confirm items added to registry: `rogueItemRegistry.getItem(id)`

### Dead Drops Not Discoverable

1. Check status: `drop.status === 'active'`
2. Verify expiration: `drop.expiresAt > Date.now()`
3. Confirm code match if secured: `code === drop.code`

### Transfer Failures

1. Check agent exists in assets list
2. Verify item in source inventory
3. Confirm target agent is different from source

### Sync Issues

1. Check KV keys: `await spark.kv.keys()`
2. Verify listeners attached
3. Restart sync: `liveArgSync.stopSync(); liveArgSync.startSync()`

## Future Enhancements

Potential extensions to the system:

- **Trading System**: Agent-to-agent item trading with confirmation
- **Item Crafting**: Combine items to create new ones
- **Decay System**: Items degrade over time
- **Rarity Loot Tables**: Weighted random item generation
- **Achievement Tracking**: Collectible completion progress
- **Item Effects**: Active abilities/buffs from equipped items
- **Auction House**: Player economy for rare items
- **Quest Items**: Story-driven unique collectibles
