# Patrol Route Templates Feature

## Overview
The Patrol Route Templates feature provides pre-defined waypoint sequences for efficient mission planning and execution. This enables both field agents and M Console operators to quickly deploy standardized patrol routes.

## Key Components

### PatrolRouteTemplates Component
- **Location**: `/src/components/PatrolRouteTemplates.tsx`
- **Purpose**: Provides a UI for browsing, deploying, and managing patrol route templates

### Features

#### 1. Preset Route Templates
Six pre-configured patrol routes optimized for different mission scenarios:

1. **Perimeter Patrol Alpha**
   - Pattern: Perimeter (square)
   - Waypoints: 4 corner checkpoints
   - Distance: 2.4 km
   - Estimated Time: 30 min
   - Use Case: Standard perimeter security

2. **City Block Circuit**
   - Pattern: Circular
   - Waypoints: 8 key intersections
   - Distance: 1.8 km
   - Estimated Time: 25 min
   - Use Case: Urban patrol coverage

3. **Grid Search Pattern**
   - Pattern: Grid
   - Waypoints: 12 systematic points
   - Distance: 3.2 km
   - Estimated Time: 45 min
   - Use Case: Thorough area coverage and search operations

4. **Rapid Response Route**
   - Pattern: Linear
   - Waypoints: 4 critical points
   - Distance: 1.2 km
   - Estimated Time: 15 min
   - Use Case: Quick area assessment

5. **Zigzag Sweep Pattern**
   - Pattern: Zigzag
   - Waypoints: 6 alternating points
   - Distance: 2.8 km
   - Estimated Time: 35 min
   - Use Case: Wide area coverage

6. **Star Pattern Recon**
   - Pattern: Star (radial from center)
   - Waypoints: 12 points (6 sectors + returns to center)
   - Distance: 3.6 km
   - Estimated Time: 40 min
   - Use Case: Radial reconnaissance from central observation point

#### 2. Route Patterns
Six distinct patrol patterns with visual icons:
- **Linear** (Lightning icon) - Direct path between points
- **Circular** (Clockwise arrows icon) - Loop pattern
- **Grid** (Square icon) - Systematic grid coverage
- **Perimeter** (Circle icon) - Boundary patrol
- **Zigzag** (Counter-clockwise arrows icon) - Alternating pattern
- **Star** (Star icon) - Radial from center point

#### 3. Custom Route Creation
- Create custom patrol routes with:
  - Custom name and description
  - Pattern type selection
  - Persistence across sessions
- Operations:
  - Duplicate routes
  - Export routes as JSON
  - Delete custom routes

#### 4. Route Deployment
When a route is deployed:
1. All waypoints are automatically created in Mission Planner
2. Route is logged to mission log
3. Operations feed entry is created
4. Route is stored in persistent storage
5. Sound notification is triggered

#### 5. M Console Integration
Patrol routes can be broadcast from M Console to field agents:
- Broadcast type: `patrol-route-deploy`
- Includes route data, assigned agents, priority level
- Requires acknowledgment tracking
- Automatically creates waypoints on receiving devices
- Triggers mission log entries and sound alerts

## Data Structures

### PatrolRoute Interface
```typescript
interface PatrolRoute {
  id: string
  name: string
  description: string
  waypoints: Omit<Waypoint, 'id' | 'createdAt'>[]
  pattern: 'linear' | 'circular' | 'grid' | 'perimeter' | 'zigzag' | 'star'
  estimatedDistance?: number  // in kilometers
  estimatedTime?: number      // in minutes
  createdAt: number
}
```

### PatrolRouteDeployment Interface (M Console Sync)
```typescript
interface PatrolRouteDeployment {
  route: PatrolRoute
  assignedAgents: string[]
  deployedBy: string
  startTime?: number
  priority: 'low' | 'normal' | 'high' | 'critical'
}
```

## User Interface

### Main Card Display
- Shows count of preset templates (6) and custom routes
- Quick access button to open full template dialog
- Compact summary view

### Template Dialog
Two tabs:
1. **Preset Routes Tab**
   - Browse all 6 preset templates
   - View route details (waypoints, distance, time, pattern)
   - Deploy button for instant activation
   - Expandable waypoint list for each route

2. **Custom Tab**
   - Create new custom routes
   - Manage existing custom routes
   - Duplicate and export functionality
   - Delete custom routes

### Visual Elements
- Color-coded pattern icons
- Distance and time estimates
- Waypoint count badges
- Pattern type badges
- Priority-based styling

## Integration Points

### App.tsx
- State management: `deployedRoutes` (persisted via useKV)
- Handlers:
  - `handleRouteDeployed`: Processes route deployment
  - `handleRouteWaypointsCreated`: Creates waypoints from route
- Broadcast handler: Processes `patrol-route-deploy` broadcasts from M Console

### Mission Planner
- Receives waypoints from deployed routes
- Displays all waypoints on planning map
- Allows distance measurements between route waypoints

### Mission Log
- Logs route deployment events
- Tracks route assignments from M Console

### Operations Feed
- Shows route deployment messages
- Displays M Console route assignments

## Use Cases

### Field Agent
1. Open Patrol Routes card
2. Browse preset templates
3. Select appropriate route for mission
4. Deploy route
5. Waypoints automatically populate Mission Planner
6. Follow waypoint sequence

### M Console Operator
1. Create or select patrol route
2. Broadcast route to specific agents
3. Track acknowledgments
4. Monitor route progress via GPS tracking
5. Adjust routes as needed via lane updates

### Scenario Planning
1. Pre-define patrol routes for scenarios
2. Include routes in scenario deployment
3. Routes automatically assigned when scenario activated
4. All agents receive synchronized routes

## Persistence
All data persists across sessions via `useKV`:
- `deployed-routes`: Array of deployed patrol routes
- `mission-waypoints`: All waypoints including those from routes
- Custom routes stored within PatrolRouteTemplates component

## Benefits
1. **Efficiency**: Quick deployment of proven patrol patterns
2. **Standardization**: Consistent patrol routes across missions
3. **Planning**: Pre-calculated distances and time estimates
4. **Coordination**: Synchronized routes across team members
5. **Flexibility**: Customizable routes for unique scenarios
6. **Documentation**: Exported routes for after-action review
