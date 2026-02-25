# Planning Guide

A covert field agent smartwatch interface that collects and transmits real-time biometric and operational telemetry to a Live ARG mission control console, immersing participants in a tactical intelligence gathering experience. Now includes Red Team player watches, real-time game state synchronization, integration with the Flaps and Seals minigame, and comprehensive equipment inventory management with dead drop and geocache capabilities.

**Experience Qualities**:
1. **Classified** - Users should feel like they're accessing restricted military-grade equipment with sensitive operational data
2. **Tactical** - Every interaction should feel purposeful, efficient, and mission-critical with no wasted space or frivolous elements
3. **Immersive** - The interface should blur the line between simulation and reality, making participants feel like active field operatives

**Complexity Level**: Complex Application (advanced functionality with multiple synchronized views)
- This has evolved from a light application to a complex multi-user system with real-time synchronization across Blue Team (Ops), Red Team, and M Console watches, plus integration with an external minigame. Features include game state management, cross-watch telemetry streaming, tactical coordination, and dynamic penalty systems.

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

### Geographic Map View with GPS Plotting
- **Functionality**: Real-time geographic map visualization displaying actual GPS coordinates (latitude/longitude) for all field assets on an interactive SVG-based map interface, with dynamic zoom and pan controls, visual breadcrumb trails connecting waypoints, lane visualization showing patrol routes between real GPS coordinates, asset status indicators with heading arrows showing direction of travel, automatic map bounds calculation to fit all assets, live coordinate updates every 3 seconds, detailed asset information dialogs showing full GPS telemetry, and legend displaying map bounds with formatted coordinates
- **Purpose**: Provides realistic geographic visualization replacing abstract grid system, enabling M console operators to see actual GPS positioning of agents on a map that resembles real tactical displays, visualizes movement patterns and patrol lanes using real-world coordinates, supports zoom/pan interaction for detailed inspection of asset clusters, and displays professional-grade GPS data formatting with cardinal directions
- **Trigger**: Component loads automatically as primary map view above the tactical grid map
- **Progression**: Map initializes with all asset GPS coordinates → Calculates optimal bounds with 20% padding → Renders SVG map with grid overlay and dotted background pattern → Plots assets as colored dots with status-based coloring → Draws lane connections as dashed lines between GPS positions → Asset positions update every 3 seconds with smooth transitions → User clicks asset to open detailed GPS dialog showing formatted coordinates, altitude, speed, heading, and last update time → User can zoom in/out using +/- buttons → User can pan map by dragging → Reset button returns to default view → Heading arrows rotate to show asset direction → Alert status assets pulse with glow filter → Hovered assets show callsign label overlay → Asset list view provides scrollable table of all GPS coordinates with formatted lat/long display
- **Success criteria**: Map bounds automatically adjust to show all assets with appropriate padding, GPS coordinates display with 6 decimal precision and cardinal direction indicators (N/S/E/W), zoom maintains center focus and scales smoothly (0.5x to 5x), pan operation feels responsive without lag, assets render as distinct colored dots (green=active, amber=enroute, red=alert pulsing, gray=inactive), heading arrows point accurately in direction of travel, lane lines render correctly between connected assets with dashed styling and glow effects, asset hover shows callsign label without overlapping other elements, asset click opens detailed dialog with full GPS telemetry including latitude, longitude, altitude, speed, heading with compass arrow, grid lines provide spatial reference at 1/8 intervals of map bounds, legend displays current map bounds with properly formatted coordinates, SVG rendering performs well with 4+ assets, list view provides alternative tabular view of all GPS data, status color coding remains consistent across all map elements, both geographic and tactical grid maps coexist and show same asset data synchronized

### GPS Coordinate History & Breadcrumb Trails
- **Functionality**: Automatic GPS coordinate history tracking for all field assets with visual breadcrumb trail visualization, displaying comprehensive movement history with waypoint timeline, calculating total distance traveled and heading changes, exporting trail data to JSON format, and clearing historical data per asset
- **Purpose**: Provides M console operators with complete movement history for all assets, enables post-mission analysis of patrol patterns and route efficiency, visualizes agent movements as connected breadcrumb trails on an SVG map, calculates metrics like total distance traveled and movement duration, and allows data export for after-action reports
- **Trigger**: GPS coordinates automatically recorded every 5 seconds for all active assets, viewable through dedicated breadcrumb trail interface
- **Progression**: GPS tracking initializes with asset map → Coordinates automatically captured every 5 seconds (max 100 points per asset) → M operator clicks asset in breadcrumb trail list → Dialog opens showing trail statistics and dual view modes → Timeline view displays chronological waypoint list with coordinates, altitude, distance between points, and heading with directional arrow → Breadcrumb map view renders SVG visualization with connected path showing start point (amber), waypoints (green dots), and current position (larger green dot) with directional arrow → Operator can export trail as JSON with full coordinate data and metadata → Operator can clear trail history to reset tracking
- **Success criteria**: Coordinates capture automatically without performance impact, trail data persists between sessions in useKV storage, trail visualization accurately represents agent movement path, distance calculations are accurate using Haversine formula, heading calculations show correct compass directions, SVG breadcrumb map scales appropriately to fit all waypoints with padding, timeline shows waypoints in reverse chronological order (newest first), export generates valid JSON with all coordinate data and timestamps, clear operation removes all historical points while maintaining trail structure, statistics (total points, distance, duration) calculate correctly, color coding matches asset status (active=green, alert=red, enroute=amber), both timeline and map views are responsive and smooth-scrolling

### M Console Sync & Scenario Deployment
- **Functionality**: Real-time synchronization service that connects watch apps to M console desktop interface, enabling scenario deployment with lane configurations, asset positioning updates, dispatch commands, M pings, and ops feed updates that broadcast automatically to all relevant agents via shared key-value storage polling
- **Purpose**: Creates seamless plumbing between M console scenario creator and field agent watch apps, allowing M console operators to deploy complete scenarios (lanes, objectives, threat levels, briefings) and have them instantly appear on all connected agents' devices, maintaining a shared tactical picture across the entire blue team during live exercises
- **Trigger**: M console operator deploys scenario from desktop interface, or makes lane/dispatch updates during active operations
- **Progression**: M console operator creates scenario with lanes, objectives, and starting positions → Clicks "DEPLOY SCENARIO" → Scenario broadcast written to shared KV store with timestamp → All connected watch apps poll KV store every 3 seconds → Agents receive broadcast if relevant to their agent ID → Watch apps update local state (mission data, lanes, asset positions) automatically → Mission log and ops feed show scenario deployment notification → Agents see updated tactical grid with new lanes and positions → For dispatch commands: M console dispatches asset to grid → Command broadcast to KV → Target agent receives dispatch order → Asset moves to enroute status → Position updates on all connected maps → For M pings: M console sends ping to specific agents → Ping broadcast to KV → Target agents receive ping with sound alert → Agents acknowledge → Acknowledgment logged
- **Success criteria**: Sync polls KV store every 3 seconds without performance degradation, broadcasts correctly filter by target agent IDs (global broadcasts reach all agents, targeted broadcasts only reach specified agents), scenario deployments update mission parameters (name, threat level, objectives) on all agents within 6 seconds, lane configurations propagate to all agents and display correctly on tactical grids, asset position updates apply immediately to GlobalAssetMap component, dispatch commands trigger asset status changes (enroute) and position updates, M pings trigger sound alerts and display in MPing component, ops feed updates appear in OperationsFeed for all agents, broadcast history viewable in ScenarioCreator deployment history tab, old broadcasts auto-cleanup after 24 hours, active scenario status persists and displays prominently, scenario end command clears active scenario across all agents, M console mode toggle switches between watch view and desktop scenario creator, ScenarioCreator component only accessible in M console mode, sync service gracefully handles connection issues and reconnects automatically

### Broadcast Templates with Acknowledgment Tracking
- **Functionality**: Pre-configured broadcast message templates for common M console directives organized by category (status checks, tactical orders, intelligence updates, warnings, coordination), with automatic acknowledgment tracking showing which agents have responded and their response type (acknowledged, unable, negative), custom message broadcasting with configurable priority and expiration times, selective agent targeting for broadcasts, and real-time acknowledgment visualization in the broadcast tracker
- **Purpose**: Accelerates M console communications during live exercises by providing standardized directive templates that can be sent to agents with one click, ensures critical directives are acknowledged by all required agents through automatic tracking, provides M console operators with instant visibility into which agents have responded and which are still pending, and creates accountability through persistent acknowledgment records in the mission log
- **Trigger**: M console mode activated, operator selects broadcast template or creates custom message, selects target agents, sends broadcast
- **Progression**: M console operator toggles to M Console mode → BroadcastTemplates component displays with template categories → Operator reviews 12 default templates (Status Check, Immediate Check-In, Rally Point, Hold Position, Regroup, Intel Update, Target Identified, Threat Alert, Compromise Warning, Exfil Ready, Comms Test, Mission Update) → Operator selects target agents from list (with Select All/Clear options) → Operator clicks template to preview message, priority, acknowledgment requirement, and expiration time → Operator clicks "Send Broadcast" → Broadcast written to KV store with requiresAck flag and tracked broadcast record → All target agents receive broadcast notification within 6 seconds → MPing component displays broadcast message on agent watch → Agent acknowledges with response (acknowledged/unable/negative) and optional message → Acknowledgment written to KV store → BroadcastAcknowledgmentTracker updates showing agent response with timestamp and response type → M console operator views real-time acknowledgment status showing who has responded and who is pending → For custom broadcasts: Operator clicks "Custom" button → Dialog opens with message text area, priority selector (low/normal/high/critical), requires ACK toggle, and expiration time input → Operator composes message and configures settings → Sends custom broadcast with same tracking functionality
- **Success criteria**: Templates display organized by category (status-check, tactical, intel, warning, coordination) with clear icons and priority badges, agent selection list shows all available assets with visual feedback for selected/unselected states, broadcast preview dialog shows complete message details before sending, broadcasts reach target agents within 6 seconds via KV sync, MPing component correctly displays broadcast messages with requiresAck indicator, acknowledgment responses record immediately with full metadata (agent ID, callsign, response type, timestamp, optional message), BroadcastAcknowledgmentTracker displays all tracked broadcasts sorted by newest first with expandable acknowledgment lists showing agent-by-agent status, pending agents clearly distinguished from acknowledged agents with visual indicators, expired broadcasts show expiration status, custom broadcasts support full text formatting with 1-60 minute expiration options, toast notifications confirm successful broadcast transmission, acknowledgments logged to mission log for historical record, tracked broadcasts persist in KV storage and reload correctly after app restart, select all/clear agents buttons work reliably, priority color coding (low=muted, normal=secondary, high=accent, critical=destructive) displays consistently across all interfaces

### Mission Planning Tools
- **Functionality**: Comprehensive mission planning interface with waypoint creation for strategic locations, distance measurement tools calculating distances and bearings between multiple points, coordinate plotting with GPS precision, visual measurement segments showing distance and compass bearing between waypoints, automatic distance calculations using Haversine formula, bearing calculations with 16-point compass labels, support for adding assets and waypoints to measurements, measurement persistence with JSON export capability, and separate management interfaces for waypoints and measurements
- **Purpose**: Enables M console operators and field agents to plan mission routes with precision distance measurements, create strategic waypoints for extraction points and objectives, measure distances between assets for tactical coordination, calculate optimal patrol routes with bearing information, visualize movement paths before execution, export mission planning data for documentation and analysis, and support pre-mission briefings with accurate geographic data
- **Trigger**: Agent or M console operator taps "OPEN TOOLS" button in Mission Planner card
- **Progression**: User opens Mission Planner interface → Tools tab displays with waypoint creation form and distance measurement tools → User creates waypoint by entering name, latitude, longitude, altitude, and description → Waypoint saved to persistent storage and logged to mission log → User initiates distance measurement by selecting assets or waypoints as measurement points → System calculates distances between consecutive points using Haversine formula → System calculates bearing angles with 16-point compass directions (N, NNE, NE, etc.) → User names and saves measurement with total distance and segment details → Measurement persists with all segment data → User switches to Waypoints tab to view all created waypoints with formatted coordinates → User switches to Measurements tab to view all distance measurements with detailed segment breakdowns → User can delete individual waypoints or measurements → User exports all planning data as JSON for external analysis
- **Success criteria**: Waypoint creation validates coordinates (lat: -90 to 90, lng: -180 to 180) before saving, waypoints persist between sessions in useKV storage, distance calculations are accurate using Haversine formula for spherical Earth model, bearing calculations show correct angles (0-360°) with corresponding compass labels (N, NE, E, SE, S, SW, W, NW, etc.), measurement tool supports 2+ points for multi-segment paths, each segment displays distance in km or meters based on magnitude, segments show bearing with both numeric degrees and compass direction, measurements persist with complete segment data and point labels, waypoint list shows formatted coordinates with cardinal directions (N/S/E/W), measurement list shows total distance with expandable segment details including bearing arrows, delete operations remove data from persistent storage immediately, export generates valid JSON with all waypoints and measurements including timestamps and metadata, UI displays recent waypoints and measurements on main card for quick access, dialog interface uses tabs for organized navigation between tools/waypoints/measurements, all coordinate inputs use monospace font for readability, operations log to mission log for traceability, toast notifications confirm all create/delete/export operations

### Red Team Player Watch
- **Functionality**: Simplified field watch for Red Team players with read-only telemetry displays (biometrics, GPS location), M Ping acknowledgment capability, GPS transmission toggle to broadcast location to M Console, and real-time game freeze notifications
- **Purpose**: Provides Red Team players with essential operational awareness without tactical planning capabilities, enables M Console monitoring of Red Team positions, creates accountability through M Ping acknowledgment tracking, and ensures all players respect game freeze commands
- **Trigger**: Red Team player logs in via flapsandseals.com main portal (not /ops)
- **Progression**: Player logs in → Red Team watch interface loads with red color scheme → Biometrics display (heart rate, blood oxygen, stress, temperature) updating every 2.5s → Location display shows GPS coordinates, speed, elevation → Player toggles "TRANSMITTING GPS" to enable location sharing → GPS telemetry broadcasts to M Console every 3s → M Ping arrives → Player acknowledges within 30s → If game frozen, pause banner appears → All telemetry updates pause during freeze
- **Success criteria**: Red Team watch visually distinct from Blue Team (red accent colors), telemetry displays are read-only with no editing, GPS transmission toggle works reliably, location broadcasts appear in M Console within 6s, M Pings trigger sound alerts, acknowledgments record within 1s, game freeze propagates within 1s and pauses all updates, battery/signal strength indicators display accurately, interface is mobile-optimized, no access to ops feed or tactical maps

### Game State Synchronization
- **Functionality**: Real-time synchronization system managing game freeze state, emergency panic button, player telemetry streaming, M ping timeout tracking, and Flaps & Seals minigame penalty calculations across all watch types (Blue Team, Red Team, M Console)
- **Purpose**: Provides M Console operators with master game controls to freeze operations during technical issues, enables emergency halt capability for safety concerns, tracks Red Team player compliance with M Pings and applies dynamic penalties to Flaps & Seals loot tables, ensures all watches stay synchronized in real-time, and creates consequences for ignoring M Console directives
- **Trigger**: M Console operator uses Game Control Panel, or automated ping timeout system detects overdue acknowledgments
- **Progression**: M Console operator clicks "FREEZE GAME" with reason → Game state written to KV with frozen flag → All watches poll KV every 1s → Freeze banner appears on all watches within 1-2s → Biometric/location updates pause → Telemetry streaming stops → Flaps & Seals detects freeze and pauses gameplay → Operator clicks "RESUME GAME" → Freeze state clears → All systems resume → For emergency panic: Red panic button triggers immediate freeze with highest priority → For ping tracking: M Ping issued → 30s timeout starts → If unacknowledged, ping marked overdue → Overdue count increments → Flaps & Seals penalty multipliers adjust automatically (1 overdue = 0.85x loot, 3 overdue = 0.6x, 5+ overdue = 0.3x) → Player acknowledges → Overdue count decrements → Penalties reduce
- **Success criteria**: Game freeze propagates to all watches within 2 seconds, freeze banner displays with reason text, all telemetry updates pause immediately, biometric simulations stop during freeze, GPS transmission pauses, M Pings cannot be issued while frozen, resume restores all functionality, emergency panic button is highly visible and requires no confirmation, panic state persists until manually cleared, ping timeouts track accurately with 30s window, overdue pings increment Flaps & Seals penalty multipliers correctly (formula: 1 overdue = 0.85x, 2 = 0.85x, 3 = 0.6x, 4 = 0.6x, 5+ = 0.3x), acknowledgments remove pings from overdue list immediately, penalty multipliers apply to both loot tables and drop rates, Flaps & Seals hook polls every 2s for current penalties, all state persists in KV storage, old pings auto-cleanup after 1 hour, game mode indicator shows normal/degraded/critical based on overdue count, freeze reason logs to mission log on all watches

### M Console Game Control Panel
- **Functionality**: Master control interface for M Console operators to freeze/unfreeze the entire game with logged reasons, trigger emergency panic button for immediate halt, view current game state (frozen/active/panic), and track which player initiated freeze/panic actions
- **Purpose**: Provides game masters with authoritative control over game flow to handle technical issues, rules clarifications, player safety concerns, or ARG timing adjustments, ensures all players see synchronized freeze state, creates audit trail of game control actions, and enables rapid emergency response
- **Trigger**: M Console operator toggles to M Console mode and views Game Control Panel at top of interface
- **Progression**: Operator enables M Console mode → Game Control Panel displays with current state badges (FROZEN/PANIC if active) → Operator enters freeze reason in text field → Operator clicks "FREEZE GAME" → Confirmation toast → Freeze state broadcasts to all watches → Panel updates to show "RESUME GAME" button → Operator clicks "RESUME GAME" → All watches resume → For emergency: Operator clicks "EMERGENCY PANIC" button → Immediate freeze with "EMERGENCY PANIC BUTTON ACTIVATED" reason → Red panic badge displays on all watches → Panel shows who initiated panic and timestamp
- **Success criteria**: Panel is collapsible with caret icon, freeze reason field validates (not empty) before allowing freeze, freeze/resume buttons toggle based on current state, current state badges display accurately (FROZEN/PANIC/ACTIVE), freeze reason displays on all watches, emergency panic button is red and destructive styling, emergency panic does not require freeze reason (auto-generated), all actions log to mission log with initiator and timestamp, toast notifications confirm all actions, panel updates immediately after state changes, current freeze reason displays in panel when frozen, resume clears freeze reason, panel only visible in M Console mode, mobile-optimized with readable controls

### Red Team Telemetry Monitoring
- **Functionality**: Real-time dashboard showing all Red Team players who are transmitting GPS, displaying their current location (lat/long), biometric vitals (heart rate, stress, O2, temp), movement data (speed, altitude, heading), and last update timestamp with stale data indicators
- **Purpose**: Enables M Console and Ops Watch operators to monitor Red Team player positions for tactical awareness, track player compliance with transmission requirements, identify stale/offline players, assess player biometric status during field exercises, and maintain god-view oversight of entire player population
- **Trigger**: M Console mode activated, component displays below Game Control Panel
- **Progression**: M Console operator views interface → Red Team Telemetry Panel displays with player count badge → Panel shows list of all transmitting players sorted by most recent update → Each player card shows callsign, player ID, GPS coordinates (4 decimal precision), vitals (HR, stress, O2, temp), movement (altitude, speed), and last update timestamp → Cards that haven't updated in 30+ seconds fade to 50% opacity and show stale indicator → Panel auto-refreshes every 5 seconds → Operator can expand/collapse panel → For new players: When Red Team player toggles "TRANSMITTING GPS" → Telemetry record appears in panel within 6 seconds → Updates every 3 seconds while transmitting → Player toggles GPS off → Last known position remains but marked as stale after 30s
- **Success criteria**: Panel displays accurate count of transmitting Red Team players, player cards show formatted GPS coordinates with N/S/E/W indicators, biometric values display with appropriate units (BPM, %, °C), last update shows human-readable time (e.g., "5s ago", "2m ago"), stale threshold is 30 seconds with visual opacity reduction, auto-refresh every 5 seconds without flicker, panel is collapsible with caret icon, empty state shows "No Red Team players transmitting" message, player cards use red color accent for team distinction, coordinates show 4 decimal precision for readability, panel scrolls smoothly with max-height 500px, component only visible in M Console mode, telemetry data syncs via gameStateSync service polling every 1-2s

### Flaps & Seals Minigame Integration
- **Functionality**: React hook (useFlapsAndSealsIntegration) that connects field watch M Ping compliance to Flaps and Seals minigame mechanics, providing real-time loot table multipliers, drop rate multipliers, overdue ping counts, game mode indicators (normal/degraded/critical), and game freeze detection
- **Purpose**: Creates meaningful consequences for ignoring M Console directives by reducing loot quality and drop rates in the minigame, incentivizes timely M Ping acknowledgments through progressive penalty tiers, provides clear feedback to players about current penalty status, and ensures game freeze state propagates to minigame to pause all gameplay
- **Trigger**: Flaps & Seals minigame component imports and uses the integration hook
- **Progression**: Minigame component initializes → useFlapsAndSealsIntegration hook starts polling gameStateSync every 2s → Hook returns current modifiers object with lootTableMultiplier, dropRateMultiplier, overduePingCount, gameMode, isFrozen, emergencyPanicActive → Minigame applies modifiers to loot generation: base loot table multiplied by lootTableMultiplier (1.0 = normal, 0.3 = critical) → Drop rates multiplied by dropRateMultiplier → Game mode message displays warning to player showing overdue count and penalty tier → If isFrozen=true, minigame pauses and shows freeze banner → Player acknowledges M Ping → Overdue count decrements → Multipliers improve → Penalties reduce → If emergencyPanic=true, minigame shows critical halt message
- **Success criteria**: Hook polls every 2 seconds without performance impact, modifiers update within 4 seconds of ping state changes, penalty tiers apply correctly (0 overdue = 1.0x, 1-2 overdue = 0.85x, 3-4 overdue = 0.6x, 5+ overdue = 0.3x), applyLootTableModifiers() function multiplies both dropRate and quantity fields, applyDropRateModifiers() function clamps results between 0 and 1, getGameModeMessage() returns appropriate warning text for each tier, game mode correctly categorizes as normal/degraded/critical, isFrozen flag accurately reflects game state, minigame can detect and respond to freeze within 4 seconds, hook cleans up subscriptions on unmount, modifiers object includes all required fields, loot tables adjust in real-time as overdue count changes, acknowledgments immediately reduce penalties, hook works in both minigame context and watch context

### Geofencing Alerts for Red Team
- **Functionality**: Real-time geofencing system that monitors Red Team player GPS positions against restricted zones marked on tactical maps, detecting when players enter dangerous areas, logging violations with timestamps and coordinates, displaying active breach alerts with player callsign and zone details, automatic violation detection every 5 seconds, distance calculations showing proximity to zone center, acknowledgment tracking for M Console operators, and historical violation log with acknowledged entries
- **Purpose**: Provides M Console operators with automatic surveillance of restricted zones to detect unauthorized Red Team incursions, creates accountability for Red Team movements through logged violation records, enables rapid response to security breaches with real-time alerts, maintains situational awareness of Red Team positions relative to danger zones, and supports post-mission analysis of player movements and compliance with operational boundaries
- **Trigger**: M Console mode activated, Red Team players transmit GPS, map annotations with "danger" type exist
- **Progression**: GeofencingAlerts component loads in M Console interface → System polls every 5 seconds checking Red Team GPS positions → For each transmitting Red Team player, calculates distance to all "danger" zone annotations using Haversine formula → If player within zone radius (default 100m, or annotation's custom radius), violation detected → New violation record created with player callsign, zone label, GPS coordinates, distance, timestamp → Alert appears in active violations section with red pulsing border and critical styling → Sound alert plays via soundGenerator → Violation logged to mission log as critical event → Ops feed entry created with geofence breach notification → M Console operator views violation details showing player position and zone details → Operator clicks "Acknowledge" button → Violation moves to acknowledged section with timestamp → Operator can dismiss violations to clear from display → Statistics show total monitored players, restricted zones, and last check time → Component collapses/expands with caret toggle → Empty state shows when no violations detected
- **Success criteria**: Distance calculations accurate using Haversine formula for spherical Earth, zone detection checks all "danger" type annotations with valid GPS coordinates (points array), violations detect within 5 seconds of player entering zone radius, no duplicate violations created for same player in same zone until acknowledged, active violations display with pulsing animation and destructive color scheme, violation details show formatted GPS coordinates (4 decimal places) with N/S/E/W indicators, distance shows in meters for readability, acknowledge action moves violation to acknowledged section immediately, dismissed violations remove from display, sound alerts play on new violation detection, mission log entries include full context (callsign, zone name), ops feed shows critical priority for breach notifications, component shows accurate count of monitored Red Team players (those with GPS enabled and transmitting), restricted zone count matches "danger" annotations on map, last check timestamp updates every 5 seconds, empty state displays helpful message when no violations exist, component only visible in M Console mode, geofencing works with variable zone radii (uses annotation.radius if specified, else 0.1km default), acknowledged violations show acknowledgedBy and acknowledgedAt metadata, "Clear" button removes all acknowledged violations

### Geofencing Alerts
- **Functionality**: Real-time monitoring system that detects when Red Team players enter restricted zones marked on the tactical map as annotations, with automatic alert generation, violation logging, and configurable alert history with filtering
- **Purpose**: Provides M Console operators with immediate awareness of security breaches, enabling rapid response to unauthorized Red Team movements in sensitive areas during live exercises
- **Trigger**: Red Team player location update crosses into a map annotation boundary marked as a restricted zone
- **Progression**: Red Team player moves → Position update received → System checks against all annotation boundaries → Violation detected → Alert generated with player callsign, zone name, timestamp → Sound alert plays → Entry logged to mission log and ops feed → Alert persists in violation history → M Console can review all violations with search/filter → Alerts can be acknowledged/dismissed
- **Success criteria**: Violations detected within 1 second of boundary crossing, zero false positives/negatives, clear visual/audio alerts, complete audit trail maintained, M Console can track patterns, history searchable by player/zone/time

### Equipment Inventory Management
- **Functionality**: Comprehensive equipment tracking system with dead drop and geocache deployment capabilities, supporting weapons, communications gear, surveillance equipment, medical supplies, explosives, tools, documents, and currency with status tracking (available, deployed, compromised, retrieved, destroyed), assignment to agents or locations on tactical map, expiration management, encryption status, access codes, complete history audit trail, and integration with mission logs
- **Purpose**: Enables M Console operators to manage operational equipment, deploy dead drops and geocaches with precise coordinates, track equipment through its full lifecycle, maintain chain of custody, and ensure accountability for sensitive materials during field operations
- **Trigger**: M Console operator creates equipment item or deploys available equipment to field location or agent
- **Progression**: Create equipment → Enter details (name, category, serial number, priority, encryption, access code) → Mark as available → Deploy equipment → Select deployment type (dead-drop, geocache, location, agent) → Set coordinates (grid or GPS) → Set expiration time (optional) → Add deployment notes → Equipment status changes to deployed → Location shown on tactical map overlay → Agents can retrieve from field → Mark as retrieved/compromised/destroyed → Complete history maintained → Mission logs updated → Communications generated for high-priority items
- **Success criteria**: Equipment searchable by multiple criteria, deployment coordinates accurate on tactical map, expiration warnings trigger automatically, history provides complete audit trail, compromised items flagged prominently, integration with map and logs seamless, dead drops and geocaches trackable by location

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
