# Planning Guide

A covert field agent smartwatch interface that collects and transmits real-time biometric and operational telemetry to a Live ARG mission control console, immersing participants in a tactical intelligence gathering experience.

**Experience Qualities**:
1. **Classified** - Users should feel like they're accessing restricted military-grade equipment with sensitive operational data
2. **Tactical** - Every interaction should feel purposeful, efficient, and mission-critical with no wasted space or frivolous elements
3. **Immersive** - The interface should blur the line between simulation and reality, making participants feel like active field operatives

**Complexity Level**: Light Application (multiple features with basic state)
- This is a focused telemetry collection interface with multiple data streams (biometrics, location, mission status) that persist state and simulate real-time updates, but doesn't require complex multi-view navigation or advanced data processing

## Essential Features

### Real-Time Biometric Monitoring
- **Functionality**: Displays simulated heart rate, blood oxygen, stress level, and body temperature with live updating values
- **Purpose**: Creates immersion by showing the agent's physical state and adds realism to the ARG experience
- **Trigger**: Automatically starts when app loads
- **Progression**: App loads → Biometric sensors initialize → Values update every 2-3 seconds with realistic fluctuations → Visual indicators show status (normal/elevated/critical)
- **Success criteria**: Metrics update smoothly, values stay within realistic ranges, stress indicators respond to simulated mission events

### Location & Movement Tracking
- **Functionality**: Shows current coordinates, movement speed, distance traveled, and elevation with GPS-style precision
- **Purpose**: Reinforces the field operative narrative and provides spatial context for mission tracking
- **Trigger**: Automatically starts with biometric monitoring
- **Progression**: GPS initializes → Coordinates display with decimal precision → Movement metrics calculate based on simulated position changes → Map grid reference updates
- **Success criteria**: Coordinates appear authentic, movement data correlates logically, updates feel real-time

### Mission Status Dashboard
- **Functionality**: Displays current mission name, objective status, time elapsed, threat level, and operational phase
- **Purpose**: Provides narrative context and mission urgency to drive engagement
- **Trigger**: Loads with initial mission parameters
- **Progression**: Mission brief displays → Objective checklist shows progress → Threat level indicator updates based on conditions → Phase transitions trigger status changes
- **Success criteria**: Mission data is clearly readable, status updates feel consequential, threat indicators grab attention

### Telemetry Transmission Control
- **Functionality**: Manual control to start/stop telemetry broadcast with signal strength indicator and encryption status
- **Purpose**: Gives agents control over their data stream and adds tactical decision-making element
- **Trigger**: User toggles transmission button
- **Progression**: User taps transmit button → Connection sequence animates → Signal strength indicator appears → Encryption status confirms → Data streams to console → User can disable transmission
- **Success criteria**: Toggle feels responsive, connection sequence is satisfying, encryption status is clear, transmission state persists

### Agent Profile & Authentication
- **Functionality**: Shows agent callsign, clearance level, unit designation, and authentication status
- **Purpose**: Personalizes the experience and reinforces role-playing elements
- **Trigger**: Displays on app initialization
- **Progression**: Authentication sequence plays → Agent credentials appear → Clearance badge displays → Profile remains accessible in header
- **Success criteria**: Profile feels official and classified, authentication sequence is slick, credentials are prominent

### Mission Log Timeline
- **Functionality**: Displays chronological timeline of all mission events, status changes, biometric alerts, and system notifications with timestamps
- **Purpose**: Provides mission history and situational awareness, creates immersion through detailed event tracking
- **Trigger**: Automatically logs events as they occur throughout the mission
- **Progression**: Mission starts → Initial events logged → Biometric/location/transmission changes recorded → Critical alerts flagged → User can scroll through timeline → Events persist between sessions
- **Success criteria**: Events log in real-time, timeline is easily scannable, critical events are visually distinct, scrolling is smooth, log persists across sessions

### Unread Activity Notifications
- **Functionality**: Visual notification badges that track and display unread agent activities from the operations feed, automatically marking entries as read when scrolled into view
- **Purpose**: Ensures agents never miss critical updates from blue team operatives, maintaining situational awareness in fast-moving operations
- **Trigger**: New activity arrives from other agents in the operations feed
- **Progression**: New agent activity posted → Unread count badge appears with pulsing animation → Red dot indicators mark specific unread entries → User scrolls to view entry → Entry auto-marks as read after 500ms in viewport → Badge count decrements → All indicators cleared when fully caught up
- **Success criteria**: Badge shows accurate unread count, individual entries clearly marked as unread, smooth auto-read detection, animations grab attention without being distracting, read state persists between sessions

### Situation Awareness Panel
- **Functionality**: Condensed at-a-glance dashboard showing mission progress, threat level, unread alerts count, and biometric status in a compact 4-column layout
- **Purpose**: Provides instant situational awareness without scrolling, allowing M console operators to rapidly assess agent status during live exercises
- **Trigger**: Displays immediately below header on app load
- **Progression**: Page loads → Panel appears with current metrics → Values update in real-time → Critical conditions trigger color changes and animations → Panel persists during scroll
- **Success criteria**: All key metrics visible at once, color coding is instantly recognizable, updates smoothly without flicker, critical alerts are unmissable

### Quick Response System
- **Functionality**: Pre-configured response buttons organized by category (Status, Commands, Intel, Tactical) that send standardized messages back to M console with one tap
- **Purpose**: Enables rapid communication during high-pressure situations, reducing time to acknowledge directives and report status
- **Trigger**: User taps to select category, then taps specific response
- **Progression**: User opens Quick Response → Selects category (Status/Commands/Intel/Tactical) → Views 6 pre-configured responses → Taps response → Message immediately posted to ops feed and mission log → Confirmation shown → Can send another
- **Success criteria**: Responses send instantly, messages appear in both ops feed and mission log, visual feedback confirms transmission, no accidental double-sends

### Quick Status Updates
- **Functionality**: One-tap status buttons with icons for common field updates (Position secure, Moving to target, Target acquired, Package secured, Area clear, Eyes on target, Contact detected, Need support)
- **Purpose**: Allows agents to push critical status changes to M console instantly without typing, maintaining operational tempo
- **Trigger**: User taps any status button
- **Progression**: User taps status button → Status posted to ops feed → Entry added to mission log → Button shows "SENT" confirmation for 3 seconds → Button re-enables
- **Success criteria**: Status posts immediately, confirmation is clear, prevents double-taps during cooldown, high-priority statuses (alerts) use appropriate color coding

### Historical Mission Log Viewer
- **Functionality**: Comprehensive log viewer with advanced filtering by event type (critical, warning, success, mission, info, transmission, biometric, location), time range filtering (last hour, 6 hours, 24 hours, 7 days, all time), full-text search across event titles and details, batch operations (delete, archive, tag multiple entries), custom annotation notes, and JSON export capability
- **Purpose**: Enables M console operators to review and analyze past mission events for after-action reports, identify patterns in agent behavior, and investigate specific incidents during or after operations
- **Trigger**: User taps "VIEW HISTORICAL LOG" button below the mission log feed
- **Progression**: User opens historical viewer dialog → Overview stats display (total events, critical count, warning count, mission events) → User enters search terms or selects filters → Results update instantly → User scrolls through filtered timeline with date dividers → User can select multiple entries for batch operations → User can export filtered results as JSON → Dialog closes, returning to main interface
- **Success criteria**: Search is instant and accurate, filters combine correctly, date dividers organize events clearly, export generates valid JSON, dialog is responsive and smooth, shows empty state with helpful message when no results match

### Annotation Templates
- **Functionality**: Pre-defined note formats for common operational situations including SITREP (situation reports), threat assessments, intelligence briefs, communications logs, medical notes, tactical decisions, asset status reports, checkpoint milestones, post-event debriefs, and timeline entries
- **Purpose**: Accelerates note-taking during high-pressure operations by providing standardized documentation formats that ensure consistent reporting and reduce cognitive load on M console operators
- **Trigger**: User clicks "ADD NOTE" or "EDIT" on any log entry, then clicks "TEMPLATES" button
- **Progression**: User opens note editor on log entry → Clicks "TEMPLATES" button → Template selector appears showing 10 pre-formatted options with icons and descriptions → User clicks desired template → Template populates text area with structured format including relevant log entry details → User fills in template fields → Saves annotated note → Template saves to log entry
- **Success criteria**: Templates apply instantly, formats are clearly structured with fillable fields, relevant event data auto-populates in template, templates save properly with preserved formatting, users can edit/modify templates after applying, templates include checkboxes and consistent field labels

### Global Asset Tracking Map
- **Functionality**: Interactive 8x8 tactical grid (A-H, 1-8) displaying real-time positions of all field agents, with visual indicators for agent status (active, inactive, alert, enroute), ability to dispatch agents to specific grid coordinates with mission directives, creation of active patrol lanes spanning multiple grid squares, comprehensive dispatch logging with timestamps and priorities, and grid-based spatial awareness for coordinating multi-agent operations
- **Purpose**: Provides M console operators with god-view oversight of all field assets, enables rapid tactical repositioning of agents, coordinates patrol routes and operational zones, maintains historical record of all dispatch commands for post-mission analysis, and enhances situational awareness during live exercises
- **Trigger**: Component loads automatically with the main interface, displays below status update section
- **Progression**: Map initializes with current asset positions → M operator views 8x8 grid with color-coded asset dots → Single-click selects grid to view assets in that square → Double-click opens dispatch dialog → Operator selects asset from dropdown → Enters mission directive → Confirms dispatch → Asset moves to target grid with status "enroute" → Dispatch logged with timestamp → Asset auto-transitions to "active" after ~25 seconds → For lane creation: Operator clicks "CREATE LANE" → Enters lane name and priority → Selects start/end grids → Assigns assets via checkboxes → Confirms → Lane appears as highlighted region on grid → All lane creation logged
- **Success criteria**: Grid displays all 64 squares clearly on mobile viewport, asset positions update in real-time, status colors are instantly distinguishable (green=active, gray=inactive, red=alert, amber=enroute), grid cell hover states provide visual feedback, selected grid shows detailed asset list with last-update timestamps, dispatch dialog validates all required fields before allowing submission, dispatch commands log immediately with full context, lanes render as visually distinct overlays on grid, lane assignments persist between sessions, dispatch log scrolls smoothly and maintains chronological order

## Edge Case Handling
- **Connection Loss**: Display "SIGNAL LOST" warning overlay with reconnection countdown and fallback to cached data
- **Critical Biometrics**: Flash red indicators and display warning messages when heart rate or stress exceeds thresholds
- **Mission Completion**: Transition to "MISSION COMPLETE" state with summary screen and option to start new mission
- **Data Corruption**: Show "TELEMETRY ERROR" with diagnostic codes and auto-recovery attempt
- **Low Battery**: Display power warning when simulated watch battery drops below 20% and suggest data conservation mode

## Design Direction
The interface should evoke the feeling of classified military technology - monochromatic with tactical green and amber accents, hard edges, technical typography, subtle scan lines and CRT effects. Think encrypted communications, night vision displays, and covert operations equipment. The design should feel serious, functional, and slightly worn from field use.

## Color Selection
A military-grade tactical color scheme with phosphor green displays and amber alert indicators on a dark, near-black background.

- **Primary Color**: Tactical Green (oklch(0.75 0.18 145)) - Evokes night vision and encrypted terminal displays, used for active data streams and primary readouts
- **Secondary Colors**: 
  - Deep Slate Background (oklch(0.15 0.01 240)) - Near-black with slight blue cast for equipment housing
  - Muted Steel (oklch(0.45 0.02 240)) - Subdued gray for inactive elements and dividers
- **Accent Color**: Amber Alert (oklch(0.75 0.16 75)) - High-visibility warning color for critical alerts and mission status indicators
- **Foreground/Background Pairings**: 
  - Background (Deep Slate #1a1d26): Tactical Green text (#88f395) - Ratio 8.2:1 ✓
  - Background (Deep Slate #1a1d26): Amber Alert text (#f0a444) - Ratio 7.5:1 ✓
  - Card (Darker Slate #12141a): Muted Steel text (#6b7280) - Ratio 5.1:1 ✓
  - Primary (Tactical Green): Deep Slate text (#1a1d26) - Ratio 8.2:1 ✓

## Font Selection
Typography should communicate precision, military spec, and technological sophistication with a monospace aesthetic that reinforces the terminal/tactical device feeling.

- **Typographic Hierarchy**:
  - H1 (Section Headers): JetBrains Mono Bold/16px/tight tracking (0.02em)
  - H2 (Data Labels): JetBrains Mono Medium/11px/wide tracking (0.08em)/uppercase
  - Body (Metric Values): JetBrains Mono Regular/20px/tabular numbers
  - Small (Status Text): JetBrains Mono Regular/10px/tight leading
  - Code (Coordinates): JetBrains Mono Regular/12px/monospace digits

## Animations
Animations should feel technical and purposeful - data streams cycling, scanlines sweeping, signals pulsing. Avoid organic motion in favor of mechanical precision with occasional glitch effects for authenticity. Key moments like transmission start and alert triggers should have satisfying technological feedback.

## Component Selection
- **Components**: 
  - Card: House each telemetry module (biometrics, location, mission) with dark backgrounds and subtle borders
  - Badge: Display clearance level, mission phase, and threat indicators with appropriate color coding
  - Progress: Show mission objective completion, battery level, and signal strength with linear bars
  - Separator: Divide sections with thin tactical lines, possibly with small corner brackets
  - Button: Transmission toggle as a prominent tactical switch with active/inactive states
  - Alert: Critical warnings and status messages with amber/red color schemes
- **Customizations**: 
  - Custom digital clock display component with military time
  - Scanline overlay effect using CSS gradients for CRT aesthetic
  - Pulsing signal indicator for active transmission
  - Glitch text effect for mission briefs appearing
  - Grid coordinate reference system overlay
- **States**: 
  - Buttons: Default (muted green border), Hover (bright green glow), Active (solid green fill), Disabled (dark gray)
  - Metrics: Normal (green), Elevated (amber), Critical (red pulse)
  - Transmission: Off (gray), Connecting (amber pulse), Active (green pulse), Error (red)
- **Icon Selection**: 
  - Phosphor icons with weight="bold" for technical aesthetic
  - Activity for heart rate, MapPin for location, Target for mission, Broadcast for transmission
  - Warning for alerts, LockKey for encryption, Battery for power status
- **Spacing**: 
  - Tight spacing (2-3) between related data points, medium spacing (4-6) between metric groups
  - Generous padding (6-8) inside cards for breathing room
  - Minimal margins to maximize screen real estate on watch-sized interface
- **Mobile**: 
  - Design mobile-first at smartwatch dimensions (320-400px width)
  - Stack all telemetry cards vertically for scrolling
  - Keep critical data (biometrics, transmission status) above the fold
  - Fixed header with agent ID and mission status always visible
  - Larger touch targets (44px min) for button interactions on small screens
