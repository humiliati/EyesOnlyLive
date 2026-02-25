# Map Annotation Broadcasting System

## Overview

The Map Annotation Broadcasting System enables M Console operators to create, share, and manage map annotations in real-time across all field agents. This feature allows for dynamic marking of areas of interest, targets, zones, and other tactical information directly on the hybrid tactical map.

## Key Features

### 1. Annotation Broadcasting
- **Real-time Sync**: All annotations are automatically broadcast to connected field agents
- **Bi-directional**: Both M Console and field agents can create annotations
- **Live Updates**: Annotations appear immediately on all connected maps
- **Delete Propagation**: Removed annotations are deleted from all agent views

### 2. Annotation Types
The system supports multiple annotation types:
- **Marker**: Point-based markers for specific locations
- **Circle**: Circular areas with adjustable radius
- **Rectangle**: Rectangular zones
- **Polygon**: Custom shaped areas with multiple points
- **Freehand**: Hand-drawn paths and areas

### 3. M Console Control Panel
Located in M Console mode, the AnnotationBroadcaster component provides:

#### Management Features
- **Filter Options**:
  - All annotations
  - Only mine (created by M Console)
  - Only others (created by field agents)
- **Type Filter**: Filter by annotation type
- **Visual List**: Scrollable list of all active annotations
- **Creation Time**: Timestamps for all annotations
- **Creator Attribution**: Shows who created each annotation

#### Broadcast Creation
- Simple form-based interface
- Required fields:
  - Label (descriptive name)
  - Type (marker, circle, rectangle, polygon, freehand)
  - Color (primary, accent, warning, info)
  - Coordinates (latitude/longitude)
- One-click broadcast to all agents

#### Annotation Management
- Delete any annotation (propagates to all agents)
- View annotation details
- Track annotation history

### 4. Field Agent Experience
Field agents receive and display annotations automatically:
- Annotations appear on HybridTacticalMap
- Creator attribution shown
- Real-time updates
- Can create their own annotations
- Log entries track annotation activity

## Technical Implementation

### Data Flow

```
M Console Creates Annotation
    ↓
handleCreateAnnotation() in App.tsx
    ↓
mConsoleSync.broadcastAnnotation()
    ↓
Broadcast stored in KV store
    ↓
All agents poll for updates
    ↓
handleBroadcastReceived() processes 'annotation-update'
    ↓
Annotations added to local state
    ↓
Maps re-render with new annotations
```

### Broadcast Types

The system uses the `annotation-update` broadcast type with three actions:

1. **Create**: Adds a new annotation
```typescript
{
  action: 'create',
  annotation: MapAnnotation,
  broadcastBy: string
}
```

2. **Update**: Modifies an existing annotation
```typescript
{
  action: 'update',
  annotation: MapAnnotation,
  broadcastBy: string
}
```

3. **Delete**: Removes an annotation
```typescript
{
  action: 'delete',
  annotationId: string,
  broadcastBy: string
}
```

### Key Files

**mConsoleSync.ts**
- `broadcastAnnotation()`: Publishes annotation changes
- `getSharedAnnotations()`: Retrieves all shared annotations
- `setSharedAnnotations()`: Updates shared annotation store

**AnnotationBroadcaster.tsx**
- M Console management interface
- Filtering and viewing capabilities
- Creation form
- Delete functionality

**App.tsx**
- `handleCreateAnnotation()`: Creates and broadcasts new annotations
- `handleDeleteAnnotation()`: Removes and broadcasts deletion
- `handleBroadcastReceived()`: Processes incoming annotation updates

**HybridTacticalMap.tsx**
- Renders annotations on map
- Drawing tools for field agents
- Visual representation of all annotation types

## Usage Guide

### For M Console Operators

1. **Switch to M Console Mode**
   - Click the "M CONSOLE" button in the header

2. **View Existing Annotations**
   - Scroll through the Map Annotations card
   - Use filters to narrow down the list
   - See who created each annotation and when

3. **Create New Annotation**
   - Click "Broadcast New Annotation"
   - Fill in the form:
     - Label: Descriptive name (e.g., "Primary Target Zone")
     - Type: Choose annotation type
     - Color: Select color scheme
     - Coordinates: Enter latitude/longitude
   - Click "Broadcast to All Agents"

4. **Delete Annotations**
   - Click the trash icon next to any annotation
   - Deletion propagates to all agents immediately

### For Field Agents

1. **View Annotations**
   - All annotations appear automatically on tactical maps
   - Different colors indicate different priorities/types
   - Creator name shown for each annotation

2. **Create Annotations**
   - Use drawing tools on HybridTacticalMap
   - Add label and select type
   - Annotation broadcasts automatically to M Console and other agents

3. **Track Changes**
   - Mission log shows when annotations are added/removed
   - Operations feed displays annotation activity
   - Real-time notifications for new annotations

## Integration Points

### Scenario Deployment
Scenarios can include pre-defined annotations:
```typescript
{
  name: "Operation Nightfall",
  annotations: [
    {
      type: 'circle',
      label: 'Primary Objective',
      coordinates: [...],
      color: 'primary'
    }
  ]
}
```

### Patrol Routes
Annotations can mark waypoints and checkpoints along patrol routes.

### Asset Dispatch
Annotations can designate rally points and target zones for dispatched assets.

## Best Practices

### M Console
- Use descriptive labels that clearly communicate intent
- Apply consistent color coding (e.g., red for threats, green for objectives)
- Clean up old annotations regularly to avoid map clutter
- Coordinate with field agents on annotation naming conventions

### Field Agents
- Mark areas of interest immediately
- Use appropriate annotation types (marker for points, circle for areas)
- Add context in labels (e.g., "Hostiles - North Building")
- Report significant findings via annotations

## Future Enhancements

Potential improvements to the system:
- Annotation templates for common scenarios
- Time-based auto-expiration
- Priority levels for annotations
- Grouped annotations (layers)
- Annotation history and replay
- Rich text in labels
- Photo/media attachments
- Permission-based editing
- Annotation acknowledgment tracking

## Troubleshooting

**Annotations not appearing**
- Verify M Console sync is active
- Check network connectivity
- Confirm agent ID is in target list
- Review browser console for errors

**Duplicated annotations**
- Clear old broadcast data: `mConsoleSync.clearOldBroadcasts()`
- Refresh the application
- Check for multiple broadcast instances

**Performance issues**
- Limit total active annotations to <100
- Use type filters to reduce rendered annotations
- Delete obsolete annotations regularly

## API Reference

### mConsoleSync Methods

```typescript
// Broadcast annotation change
await mConsoleSync.broadcastAnnotation(
  action: 'create' | 'update' | 'delete',
  annotation: MapAnnotation | undefined,
  annotationId: string | undefined,
  broadcastBy: string
)

// Get all shared annotations
const annotations = await mConsoleSync.getSharedAnnotations()

// Update shared annotations
await mConsoleSync.setSharedAnnotations(annotations)
```

### Component Props

```typescript
<AnnotationBroadcaster
  annotations={MapAnnotation[]}
  onDeleteAnnotation={(annotationId: string) => void}
  onCreateAnnotation={(annotation: Omit<MapAnnotation, 'id' | 'createdAt'>) => void}
  currentUser={string}
/>
```

## Security Considerations

- All annotations are visible to all agents in the operation
- Attribution tracks who created each annotation
- No built-in encryption (rely on transport layer security)
- Deletion is permanent and cannot be undone
- Consider operational security when labeling sensitive areas
