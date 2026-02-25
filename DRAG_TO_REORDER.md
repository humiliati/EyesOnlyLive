# Drag-to-Reorder Data Field Cards

## Overview
The main data field cards (Agent ID, Biometrics, Location, Transmission) can now be reordered via drag-and-drop or touch gestures. The order persists between sessions.

## Features Implemented

### 1. **Drag-and-Drop Reordering**
- Click and hold the six-dot handle (⋮⋮) on any card
- Drag the card to a new position
- Release to drop and reorder
- Visual feedback with border highlights and shadow effects
- Sound effect confirmation on successful reorder
- Toast notification confirms the change

### 2. **Touch Support**
- Full touch gesture support for mobile devices
- Touch and drag on the handle icon
- Same visual feedback as desktop
- Responsive touch targets for easy manipulation

### 3. **Collapsible Cards**
- All cards except Agent ID can be collapsed
- Click the caret (▼) icon to collapse/expand
- Collapsed state is preserved per card
- Smooth animation transitions
- Cards can be reordered while collapsed or expanded

### 4. **Visual Feedback (Command & Conquer Aesthetic)**
- **Dragging:** Card becomes semi-transparent with reduced scale
- **Drop Target:** Pulsing accent border with glow effect
- **Hover State:** Subtle green glow and scale increase
- **Active Drag Indicator:** Small pulsing dot on the drag handle
- **Tactical Grid Overlay:** Subtle grid pattern animation
- **Corner Accents:** Animated corner borders on hover

### 5. **State Persistence**
- Card order is saved to KV storage automatically
- Order persists across page refreshes and sessions
- Each agent can have their own preferred layout

## Card Order Management

### Default Order
1. Agent ID / Mission
2. Biometrics
3. Location
4. Transmission

### Customization
Users can rearrange cards to prioritize information based on mission needs:
- Medical officer might prioritize Biometrics at the top
- Navigator might prefer Location first
- Communications specialist might want Transmission prominent

## Technical Details

### Storage Key
`data-card-order` - Array of card IDs stored in KV

### Card IDs
- `agent-id` - Agent identification and mission status (non-collapsible)
- `mission` - Currently merged with agent-id
- `biometrics` - Heart rate, O₂, stress, temperature
- `location` - GPS coordinates, speed, elevation
- `transmission` - Signal, power, encryption status

### Drag Events
- Desktop: Standard HTML5 drag-and-drop API
- Mobile: Touch events with custom gesture detection
- Both methods update the same card order state

## Command & Conquer UI Influence

The drag-to-reorder feature incorporates several C&C UI elements:

1. **Tactical Precision:** Sharp, angular borders with corner accents
2. **Glowing Effects:** Green primary glow, amber accent glow for emphasis
3. **Military Readouts:** Monospace fonts, uppercase labels, grid overlays
4. **Responsive Feedback:** Immediate visual and audio confirmation
5. **Functional Aesthetics:** Every animation serves a purpose (feedback, status, orientation)

## Sound Design
- **Drag Start:** Subtle check-in alert (low priority)
- **Successful Drop:** Transmission alert (normal priority)
- **Audio Cues:** Match the tactical theme without being intrusive

## Accessibility
- Keyboard navigation supported (tab to handle, arrow keys to reorder)
- Focus states clearly visible
- Sufficient touch targets (44x44px minimum)
- Screen reader compatible labels

## Future Enhancements
- Long-press to lock card position
- Double-tap handle to reset to default order
- Preset layouts (Medic, Tactical, Communications, etc.)
- Position indicators (1/5, 2/5) in collapsed view
- Extend to other panels (Operations Feed, Mission Log)
