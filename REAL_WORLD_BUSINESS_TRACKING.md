# Real-World Business Participation & Media Tracking System

## Overview

The Real-World Business Participation system enables game masters to track physical business owner participation in ARG events, manage item crafting with photo documentation, and maintain a comprehensive debrief feed with an adaptive media player.

## Core Components

### 1. RealWorldItemCrafter

**Location:** `src/components/RealWorldItemCrafter.tsx`

Manages the creation and tracking of real-world items that are tied to actual business partnerships and participation.

#### Features:
- **Business Owner Details Tracking**
  - Business name and owner name
  - Contact information (email, phone)
  - Physical address
  - Grid location (X, Y coordinates)
  - Participation notes
  - Participation date

- **Item Crafting**
  - Item name, emoji, type, and rarity
  - Description and one-time-only flag
  - Multiple photo attachments (required)
  - Automatic ID generation for both item and business

- **Item Lifecycle Management**
  - Crafted → Deployed → Retrieved
  - Cannot delete deployed items
  - Track who retrieved items and when

#### Data Structure:

```typescript
interface BusinessOwnerDetails {
  id: string
  businessName: string
  ownerName: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  participationDate: number
  notes?: string
  gridX?: number
  gridY?: number
  latitude?: number
  longitude?: number
}

interface RealWorldItem {
  id: string
  itemId: string  // ITM-... format for game integration
  name: string
  emoji: string
  type: string
  description?: string
  businessOwner: BusinessOwnerDetails
  photos: string[]
  createdAt: number
  deployed: boolean
  deployedAt?: number
  retrievedAt?: number
  retrievedBy?: string
  rarity?: string
  oneTimeOnly?: boolean
  argEventId?: string
}
```

### 2. DebriefMediaFeed

**Location:** `src/components/DebriefMediaFeed.tsx`

A comprehensive debrief feed that displays all business participation events, item lifecycle events, and associated media with an adaptive player.

#### Features:

- **Media Player**
  - 4:3 aspect ratio display (classic video game style)
  - Super Mario 64-style stretch mode with pixelation effects
  - Video controls (play/pause)
  - Image and video support
  - Auto-detection of media type from file extensions

- **Entry Types**
  - `item-crafted`: When a real-world item is created
  - `item-deployed`: When an item is deployed to the field
  - `item-retrieved`: When an item is collected by an agent
  - `business-participation`: General business participation events
  - `photo-added`: When new photos are uploaded

- **Adaptive Incinerator**
  - Individual entry deletion (🔥 button per entry)
  - Bulk "Incinerate All" with confirmation
  - Permanent deletion (cannot be undone)
  - Borrowed from browser garbage collection concept

#### Media Player Modes:

**Standard Mode (4:3 Aspect Ratio)**
```
- object-contain scaling
- Maintains aspect ratio
- Black bars for non-4:3 content
```

**Super Mario 64 Stretch Mode**
```
- object-fill scaling
- Pixelated rendering (imageRendering: 'pixelated')
- Stretched transform: scale(1.2, 1.05)
- Enhanced contrast (1.1) and saturation (1.2)
- Nostalgic CRT-style display
```

### 3. Integration with Existing Systems

#### Dead Drop Integration

When dead drops are created or retrieved, debrief entries are automatically generated:

```typescript
addDebriefEntryFromWindow({
  type: 'business-participation',
  title: `Dead Drop Created: ${drop.name}`,
  description: `Location: Grid ${gridLocation}`,
  gridLocation: gridLocation
})
```

#### Real-World Item Integration

Item lifecycle events automatically create debrief entries with full photo documentation:

```typescript
addDebriefEntryFromWindow({
  type: 'item-crafted',
  title: `Item Crafted: ${item.name}`,
  description: item.description,
  realWorldItem: item,
  mediaUrls: item.photos,
  businessName: item.businessOwner.businessName,
  ownerName: item.businessOwner.ownerName,
  gridLocation: gridLocation
})
```

## Usage Guide

### Creating a Real-World Item

1. **Open M-Console Mode**
   - Toggle the M CONSOLE button in the header

2. **Access Real-World Item Crafter**
   - Click "Craft Item" button
   - This opens the comprehensive crafting dialog

3. **Fill Item Details**
   - Item name (e.g., "VINTAGE RADIO")
   - Emoji representation (e.g., 📻)
   - Type (Tool, Intel, Evidence, etc.)
   - Rarity level
   - Description
   - One-time-only flag

4. **Add Business Owner Information** *(Required)*
   - Business name (e.g., "Joe's Coffee Shop")
   - Owner name (e.g., "Joe Smith")
   - Contact email and phone (optional)
   - Physical address (optional)
   - Grid coordinates for map placement
   - Participation notes

5. **Upload Photos** *(Required - At least 1)*
   - Enter photo URLs or file paths
   - Format: `/assets/images/item-photo.jpg` or full URLs
   - Photos are stored as references
   - Multiple photos supported

6. **Craft the Item**
   - Review all details
   - Click "Craft Item"
   - Item is created with status "Crafted"
   - Automatic debrief entry generated

### Deploying Items

1. Find the crafted item in the list
2. Click "Deploy" button
3. Item status changes to "Deployed"
4. Debrief entry automatically created
5. Item becomes available for field retrieval

### Viewing Media in Debrief Feed

1. **Browse Debrief Entries**
   - Scroll through chronological feed
   - Each entry shows thumbnails for attached media

2. **Open Media Player**
   - Click on any media thumbnail
   - Media loads in 4:3 player above feed

3. **Player Controls**
   - Play/Pause (videos only)
   - Toggle Stretch Mode (🎮 Super Mario 64 style)
   - Close player (X button)

4. **Stretch Mode Features**
   - Activates nostalgic CRT-style rendering
   - Slight vertical/horizontal stretch
   - Pixelated effect for retro feel
   - Enhanced colors

### Managing Entries (Incinerator)

1. **Delete Individual Entries**
   - Click 🔥 button on any entry
   - Entry is permanently deleted

2. **Bulk Delete**
   - Click "🔥 Incinerate All" button
   - Confirmation dialog appears
   - All entries permanently deleted

## Photo Management Best Practices

### Recommended Photo Organization

```
/assets/
  └── images/
      └── arg-items/
          ├── business-name-001.jpg
          ├── business-name-002.jpg
          └── item-specific-photo.jpg
```

### Photo Requirements

- **Format**: JPG, PNG, GIF, WebP recommended
- **Size**: Optimized for web viewing
- **Naming**: Descriptive names with business/item reference
- **Quality**: High enough for identification, not excessively large

### Example Photo Paths

```
/assets/images/arg-items/joes-coffee-radio.jpg
/assets/images/arg-items/bakery-envelope.jpg
https://example.com/media/arg-photo.jpg
```

## Data Persistence

### Storage Keys

- `real-world-items`: Array of all crafted items
- `debrief-entries`: Array of all debrief feed entries

### Data Lifecycle

1. **Item Created** → Stored in `real-world-items`
2. **Debrief Entry Generated** → Stored in `debrief-entries`
3. **Item Deployed** → Status updated in storage
4. **Photos** → Stored as URL references (not base64)

## Integration with Gone Rogue System

Real-world items are designed to integrate with the Gone Rogue minigame:

### Item ID Format

Each real-world item generates a game-compatible ID:
```
ITM-{timestamp}-{random}  // e.g., ITM-1234567890-A3B9C2
```

### Registry Integration

Items can be exported to the Gone Rogue registry for use in gameplay:

```typescript
{
  id: item.itemId,  // ITM-...
  name: item.name,
  emoji: item.emoji,
  type: item.type,
  rarity: item.rarity,
  oneTimeOnly: item.oneTimeOnly
}
```

## Advanced Features

### Grid Location Mapping

Business locations can be placed on the tactical grid:
- gridX (0-7): Column A-H
- gridY (0-7): Row 1-8
- Displayed as: "Grid C4" (gridX=2, gridY=3)

### Participation Tracking

The system maintains a complete audit trail:
- When items were crafted
- Which business participated
- When items were deployed
- Who retrieved items
- All associated media

### Media Type Detection

Automatic detection based on file extensions:

**Images**: .jpg, .jpeg, .png, .gif, .webp, .bmp, .svg
**Videos**: .mp4, .webm, .ogg, .mov, .avi

## UI Components Hierarchy

```
App.tsx (M-Console Mode)
├── RealWorldItemCrafter
│   ├── Create Dialog
│   │   ├── Item Details Form
│   │   ├── Business Owner Form
│   │   └── Photo Upload Manager
│   └── Item List
│       └── Item Cards (with Deploy/Delete actions)
├── DebriefMediaFeed
│   ├── Media Player (4:3 aspect ratio)
│   │   ├── Image/Video Display
│   │   ├── Play Controls (video only)
│   │   ├── Stretch Mode Toggle
│   │   └── Close Button
│   ├── Entry List
│   │   └── Entry Cards
│   │       ├── Type Badge
│   │       ├── Business Info
│   │       ├── Media Thumbnails
│   │       └── Incinerator Button (🔥)
│   └── Bulk Incinerator
└── ArgEventCreator
    └── Integration with real-world items
```

## Future Enhancements

### Planned Features

1. **Direct Photo Upload**
   - File input for local photos
   - Automatic path generation
   - Image optimization

2. **Business Directory**
   - Searchable list of all participating businesses
   - Contact management
   - Participation history

3. **QR Code Generation**
   - Generate QR codes for items
   - Link to item details
   - Physical world integration

4. **Export Functions**
   - Export business contact list
   - Export participation report
   - Generate certificates of participation

5. **Media Gallery View**
   - Grid view of all photos
   - Filter by business
   - Slideshow mode

## Troubleshooting

### Photos Not Displaying

- Check file path is correct
- Ensure file exists in specified location
- Verify file extension is supported
- Check browser console for errors

### Items Not Deploying

- Verify item has "Crafted" status
- Check for pending operations
- Refresh page if state seems stuck

### Debrief Entries Missing

- Ensure `addDebriefEntryFromWindow` is called
- Check component is mounted
- Verify KV storage permissions

## API Reference

### addDebriefEntryFromWindow

Global function to add debrief entries from anywhere:

```typescript
addDebriefEntryFromWindow({
  type: 'item-crafted' | 'item-deployed' | 'item-retrieved' | 'business-participation' | 'photo-added',
  title: string,
  description?: string,
  realWorldItem?: RealWorldItem,
  mediaUrls?: string[],
  businessName?: string,
  ownerName?: string,
  gridLocation?: string
})
```

### Example Usage

```typescript
// From any component or callback
addDebriefEntryFromWindow({
  type: 'business-participation',
  title: 'New Business Partner',
  description: 'Local bakery joined ARG event',
  businessName: 'Sweet Treats Bakery',
  ownerName: 'Sarah Johnson',
  mediaUrls: ['/assets/images/bakery-exterior.jpg'],
  gridLocation: 'B3'
})
```

## Security Considerations

- Photo URLs are stored, not uploaded files
- Business contact info stored client-side only
- No automatic external requests
- Incinerator requires confirmation for bulk delete

## Performance Notes

- Photos loaded on-demand (not preloaded)
- Debrief entries rendered virtually
- Media player only loads selected media
- Efficient re-rendering with React hooks
