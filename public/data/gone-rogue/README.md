# Gone Rogue Data Directory

This directory contains the canonical base items for the Gone Rogue minigame integration.

## Structure

```
/public/data/gone-rogue/
  ├── items.json          # Canonical item definitions
  └── README.md           # This file
```

## items.json

Contains the permanent item definitions that are always available in the registry. These items are loaded on registry initialization and merged with any live ARG event items.

### Schema

Each item in the array follows this structure:

```json
{
  "id": "ITM-001",                    // Unique identifier
  "name": "TACTICAL RADIO",           // Display name
  "emoji": "📻",                      // Visual thumbnail
  "type": "tool",                     // Item category
  "rarity": "uncommon",               // Rarity tier
  "description": "...",               // Optional description
  "weight": 2.5,                      // Optional weight
  "value": 250,                       // Optional value
  "stackable": false,                 // Can stack in inventory
  "maxStack": 1,                      // Max stack size
  "usable": true,                     // Can be used/consumed
  "deployable": false,                // Can be placed on map
  "nature": {                         // Game stats (0-10 scale)
    "signal": 5,
    "heat": 2
  }
}
```

## Loading Behavior

The Gone Rogue Data Registry loads items in this order:

1. **Canonical Base**: `/public/data/gone-rogue/items.json`
2. **Live Additions**: Dynamic items from ARG events (stored in KV)
3. **External API** (optional): `window.__ROGUE_REGISTRY_EXTRA_ITEMS_URL__`

All sources are merged into a single registry, with later sources overriding earlier ones if IDs conflict.

## Adding New Canonical Items

1. Edit `items.json` in this directory
2. Add new item object to the array
3. Ensure unique ID (format: `ITM-XXX`)
4. Include at minimum: `id`, `name`, `emoji`, `type`
5. Save file
6. Registry will load on next page refresh

## Item Types

- `tool` - Utility equipment (radios, scanners, etc.)
- `intel` - Information and documents
- `weapon` - Combat equipment
- `consumable` - Single-use items
- `key` - Access items
- `evidence` - Investigation materials
- `equipment` - General gear

## Rarity Tiers

- `common` - Standard items (gray badge)
- `uncommon` - Specialized items (green badge)
- `rare` - Advanced items (blue badge)
- `epic` - High-value items (purple badge)
- `legendary` - Mission-critical items (gold badge)
- `unique` - One-of-a-kind items (red badge)

## Nature Stats

Stats range from 0-10 and affect gameplay:

- `heat` - Detection risk (high = dangerous to carry)
- `signal` - Communication power (high = better signals)
- `stealth` - Concealment (high = harder to detect)
- `intel` - Intelligence value (high = mission-critical info)
- `tactical` - Utility (high = versatile tool)

## Best Practices

### ID Convention

Use format: `ITM-{number}` with zero-padding:
- ✅ `ITM-001`, `ITM-015`, `ITM-099`
- ❌ `ITM1`, `item-radio`, `RADIO001`

Reserve ID ranges:
- `ITM-001` to `ITM-099`: Core equipment
- `ITM-100` to `ITM-199`: Intelligence items
- `ITM-200` to `ITM-299`: Weapons
- `ITM-300` to `ITM-399`: Consumables
- `ITM-400` to `ITM-499`: Tools
- `ITM-500` to `ITM-599`: Evidence
- `ITM-600` to `ITM-999`: Reserved for expansion
- `ITM-900+`: Live ARG items (auto-generated)

### Emoji Selection

Choose emoji that clearly represent the item:
- 📻 Radios and communications
- 🔑 Keys and access items
- 💊 Medical and consumables
- 📋 Documents and intel
- 📍 GPS and tracking
- 🥽 Vision and sensors
- 💾 Data and storage
- 💨 Smoke and concealment
- 🔦 Light sources
- 🛸 Drones and vehicles
- 🚨 Alerts and beacons
- 🔓 Lockpicks and tools

### Balancing Stats

Consider gameplay implications:

**High Heat Items** (8-10):
- Create risk/reward scenarios
- Best for rare/legendary items
- Examples: Emergency beacons, classified docs

**High Signal Items** (8-10):
- Enable team coordination
- Valuable for support roles
- Examples: Radios, jammers

**High Intel Items** (8-10):
- Drive mission objectives
- Should be rare finds
- Examples: Encrypted USB, documents

**Balanced Items** (3-5 across multiple stats):
- Versatile tools
- Good for common/uncommon tiers
- Examples: Flashlights, medkits

### Weight & Value

Use consistent scales:
- **Weight**: 0.1 (USB) to 5.0 (heavy equipment)
- **Value**: 50 (common) to 5000 (legendary)

Rarity should correlate with value:
- Common: 50-200
- Uncommon: 200-500
- Rare: 500-1000
- Epic: 1000-2000
- Legendary: 2000-5000
- Unique: 5000+

## Validation

Before committing changes, verify:

1. ✅ Valid JSON syntax (use JSON validator)
2. ✅ All IDs are unique
3. ✅ All items have required fields (`id`, `name`, `emoji`, `type`)
4. ✅ Emoji render correctly (test in browser)
5. ✅ Nature stats are 0-10 range
6. ✅ Weight/value are positive numbers
7. ✅ Type is valid enum value
8. ✅ Rarity is valid tier (if specified)

## Examples

### Minimal Item

```json
{
  "id": "ITM-099",
  "name": "BASIC FLASHLIGHT",
  "emoji": "🔦",
  "type": "tool"
}
```

### Full-Featured Item

```json
{
  "id": "ITM-014",
  "name": "RECON DRONE",
  "emoji": "🛸",
  "type": "equipment",
  "rarity": "legendary",
  "description": "Miniature surveillance drone with thermal imaging",
  "weight": 1.5,
  "value": 2000,
  "stackable": false,
  "usable": true,
  "deployable": true,
  "nature": {
    "intel": 9,
    "signal": 7,
    "tactical": 8,
    "heat": 4
  }
}
```

## Testing

After adding items:

1. Refresh page to reload registry
2. Open M Console mode
3. Create ARG event
4. Verify new items appear in selection
5. Create dead drop with new items
6. Check items display correctly in inventory

## Troubleshooting

**Items not loading:**
- Check JSON syntax (use validator)
- Verify file path is correct
- Check browser console for errors
- Confirm registry.load() was called

**Emoji not displaying:**
- Use Unicode emoji (not images)
- Test emoji in browser first
- Some emoji may not render on all platforms

**Stats not working:**
- Verify nature object structure
- Check stat names match schema
- Ensure values are numbers (not strings)

## Related Documentation

- `LIVE_ARG_SYSTEM.md` - Complete API reference
- `QUICK_START_ARG.md` - Operator quick start guide
- `PRD.md` - Product requirements
