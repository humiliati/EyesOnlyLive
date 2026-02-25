import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster } from 'sonner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { MissionLog, type LogEntry } from '@/components/MissionLog'
import { MPing, type PingMessage } from '@/components/MPing'
import { OperationsFeed, type OpsFeedEntry } from '@/components/OperationsFeed'
import { QuickResponse } from '@/components/QuickResponse'
import { StatusUpdate } from '@/components/StatusUpdate'
import { SituationPanel } from '@/components/SituationPanel'
import { PanicButton } from '@/components/PanicButton'
import { HistoricalLogViewer, type EnhancedLogEntry } from '@/components/HistoricalLogViewer'
import { GlobalAssetMap, type AssetLocation, type ActiveLane } from '@/components/GlobalAssetMap'
import { GeographicMap } from '@/components/GeographicMap'
import { GPSBreadcrumbTrail, type AssetTrail, type GPSCoordinate } from '@/components/GPSBreadcrumbTrail'
import { ScenarioCreator } from '@/components/ScenarioCreator'
import { HybridTacticalMap, type MapAnnotation } from '@/components/HybridTacticalMap'
import { BroadcastAcknowledgmentTracker, type TrackedBroadcast, type BroadcastAcknowledgment } from '@/components/BroadcastAcknowledgment'
import { BroadcastTemplates } from '@/components/BroadcastTemplates'
import { BroadcastScheduler } from '@/components/BroadcastScheduler'
import { AnnotationBroadcaster } from '@/components/AnnotationBroadcaster'
import { AnnotationAcknowledgmentTracker } from '@/components/AnnotationAcknowledgmentTracker'
import { AnnotationAckDashboard } from '@/components/AnnotationAckDashboard'
import { OverdueAnnotationAlerts } from '@/components/OverdueAnnotationAlerts'
import { MissionPlanner, type Waypoint, type DistanceMeasurement } from '@/components/MissionPlanner'
import { PatrolRouteTemplates, type PatrolRoute } from '@/components/PatrolRouteTemplates'
import { GeofencingAlerts, type GeofenceViolation } from '@/components/GeofencingAlerts'
import { CommunicationsLog, type CommLog } from '@/components/CommunicationsLog'
import { AssetStatusBoard, type AssetStatus } from '@/components/AssetStatusBoard'
import { TacticalChecklist, type Checklist, type ChecklistItem } from '@/components/TacticalChecklist'
import { EnvironmentalData } from '@/components/EnvironmentalData'
import { AfterActionReport } from '@/components/AfterActionReport'
import { soundGenerator } from '@/lib/sounds'
import { mConsoleSync, type MConsoleBroadcast } from '@/lib/mConsoleSync'
import { gameStateSync, type GameState } from '@/lib/gameStateSync'
import { GameControlPanel } from '@/components/GameControlPanel'
import { RedTeamTelemetryPanel } from '@/components/RedTeamTelemetryPanel'
import { RedTeamManagementPanel } from '@/components/RedTeamManagementPanel'
import { EquipmentInventory, type EquipmentItem } from '@/components/EquipmentInventory'
import { EquipmentDeploymentDialog } from '@/components/EquipmentDeploymentDialog'
import { EquipmentMapOverlay } from '@/components/EquipmentMapOverlay'
import { ArgEventCreator } from '@/components/ArgEventCreator'
import { ArgEventDashboard } from '@/components/ArgEventDashboard'
import { DeadDropManager } from '@/components/DeadDropManager'
import { AgentInventoryViewer } from '@/components/AgentInventoryViewer'
import { 
  Heart, 
  MapPin, 
  Target, 
  RadioButton, 
  WarningCircle,
  Lock,
  BatteryFull,
  WifiHigh,
  Eye,
  Desktop,
  Pause
} from '@phosphor-icons/react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface BiometricData {
  heartRate: number
  bloodOxygen: number
  stressLevel: number
  temperature: number
}

interface LocationData {
  latitude: number
  longitude: number
  speed: number
  distance: number
  elevation: number
}

interface MissionData {
  name: string
  objective: string
  progress: number
  threatLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  phase: string
  startTime: number
}

function App() {
  const [isTransmitting, setIsTransmitting] = useKV<boolean>('transmission-active', false)
  const [agentCallsign] = useKV<string>('agent-callsign', 'SHADOW-7')
  const [agentId] = useKV<string>('agent-id', 'shadow-7-alpha')
  const [clearanceLevel] = useKV<string>('clearance-level', 'LEVEL 4')
  const [missionData, setMissionData] = useKV<MissionData>('mission-data', {
    name: 'OPERATION NIGHTFALL',
    objective: 'Secure Package Alpha',
    progress: 0,
    threatLevel: 'LOW',
    phase: 'INFILTRATION',
    startTime: Date.now()
  })
  const [logEntries, setLogEntries] = useKV<EnhancedLogEntry[]>('mission-log', [])
  const [currentPing, setCurrentPing] = useKV<PingMessage | null>('current-m-ping', null)
  const [opsFeedEntries, setOpsFeedEntries] = useKV<OpsFeedEntry[]>('ops-feed', [])
  const [readOpsFeedEntries, setReadOpsFeedEntries] = useKV<string[]>('read-ops-feed-entries', [])
  const [assetLocations, setAssetLocations] = useKV<AssetLocation[]>('asset-locations', [])
  const [activeLanes, setActiveLanes] = useKV<ActiveLane[]>('active-lanes', [])
  const [gpsTrails, setGpsTrails] = useKV<AssetTrail[]>('gps-trails', [])
  const [trackedBroadcasts, setTrackedBroadcasts] = useKV<TrackedBroadcast[]>('tracked-broadcasts', [])
  const [missionWaypoints, setMissionWaypoints] = useKV<Waypoint[]>('mission-waypoints', [])
  const [distanceMeasurements, setDistanceMeasurements] = useKV<DistanceMeasurement[]>('distance-measurements', [])
  const [deployedRoutes, setDeployedRoutes] = useKV<PatrolRoute[]>('deployed-routes', [])
  const [mapAnnotations, setMapAnnotations] = useKV<MapAnnotation[]>('map-annotations', [])
  const [redTeamPlayers] = useKV<import('@/components/RedTeamManagementPanel').RedTeamPlayer[]>('red-team-players', [])
  const previousOpsFeedLengthRef = useRef<number>(0)
  const [redTeamTelemetry, setRedTeamTelemetry] = useState<import('@/lib/gameStateSync').PlayerTelemetry[]>([])
  const [commLogs, setCommLogs] = useKV<CommLog[]>('communications-log', [])
  const [checklists, setChecklists] = useKV<Checklist[]>('tactical-checklists', [])
  const [equipment, setEquipment] = useKV<EquipmentItem[]>('equipment-inventory', [])
  const [deployDialogOpen, setDeployDialogOpen] = useState(false)
  const [deployLocation, setDeployLocation] = useState<{ gridX: number; gridY: number } | undefined>()

  const [biometrics, setBiometrics] = useState<BiometricData>({
    heartRate: 72,
    bloodOxygen: 98,
    stressLevel: 15,
    temperature: 36.8
  })

  const [location, setLocation] = useState<LocationData>({
    latitude: 40.7128,
    longitude: -74.0060,
    speed: 0,
    distance: 0,
    elevation: 10
  })

  const [signalStrength, setSignalStrength] = useState(85)
  const [batteryLevel, setBatteryLevel] = useState(87)
  const [currentTime, setCurrentTime] = useState(new Date())
  const previousPingIdRef = useRef<string | null>(null)
  const [mConsoleMode, setMConsoleMode] = useState(false)
  const syncUnsubscribeRef = useRef<(() => void) | null>(null)
  const [gameState, setGameState] = useState<GameState>({
    frozen: false,
    emergencyPanicActive: false
  })

  const addLogEntry = useCallback((type: LogEntry['type'], title: string, details?: string) => {
    const newEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      title,
      details
    }
    setLogEntries((current) => [...(current || []), newEntry])
  }, [setLogEntries])

  const addOpsFeedEntry = useCallback((entry: Omit<OpsFeedEntry, 'id' | 'timestamp'>) => {
    const newEntry: OpsFeedEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...entry
    }
    setOpsFeedEntries((current) => [...(current || []), newEntry])
  }, [setOpsFeedEntries])

  const handleAcknowledgePing = useCallback(async (pingId: string, response?: 'acknowledged' | 'unable' | 'negative', message?: string) => {
    setCurrentPing((current) => {
      if (current && current.id === pingId) {
        return { ...current, acknowledged: true }
      }
      return current || null
    })
    
    const responseText = response === 'acknowledged' ? 'Acknowledged' 
      : response === 'unable' ? 'Unable to comply' 
      : response === 'negative' ? 'Negative'
      : 'Acknowledged'
    
    addLogEntry('info', 'M Ping Acknowledged', `Command confirmation transmitted: ${responseText}`)
    addOpsFeedEntry({
      agentCallsign: agentCallsign || 'SHADOW-7',
      agentId: agentId || 'shadow-7-alpha',
      type: 'check-in',
      message: `M directive response: ${responseText}${message ? ` - ${message}` : ''}`
    })

    if (currentPing?.broadcastId) {
      const ack: BroadcastAcknowledgment = {
        broadcastId: currentPing.broadcastId,
        agentId: agentId || 'shadow-7-alpha',
        agentCallsign: agentCallsign || 'SHADOW-7',
        acknowledgedAt: Date.now(),
        response: response || 'acknowledged',
        responseMessage: message,
        receivedAt: Date.now()
      }

      await mConsoleSync.recordAcknowledgment(ack)

      setTrackedBroadcasts((current) => {
        return (current || []).map(broadcast => {
          if (broadcast.id === currentPing.broadcastId) {
            const existingAcks = broadcast.acknowledgments || []
            const updatedAcks = existingAcks.filter(a => a.agentId !== ack.agentId)
            return {
              ...broadcast,
              acknowledgments: [...updatedAcks, ack]
            }
          }
          return broadcast
        })
      })
    }
  }, [setCurrentPing, addLogEntry, addOpsFeedEntry, agentCallsign, agentId, currentPing, setTrackedBroadcasts])

  const handleMarkOpsFeedAsRead = useCallback((entryId: string) => {
    setReadOpsFeedEntries((current) => {
      const readList = current || []
      if (!readList.includes(entryId)) {
        return [...readList, entryId]
      }
      return readList
    })
  }, [setReadOpsFeedEntries])

  const handleQuickResponse = useCallback((response: string, category: string) => {
    addOpsFeedEntry({
      agentCallsign: agentCallsign || 'SHADOW-7',
      agentId: agentId || 'shadow-7-alpha',
      type: 'transmission',
      message: `Response to M: ${response}`,
      priority: 'normal'
    })
    addLogEntry('transmission', 'Response Sent to M', response)

    const newCommLog: CommLog = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      direction: 'outgoing',
      from: agentCallsign || 'SHADOW-7',
      to: 'M-CONSOLE',
      message: response,
      channel: 'tactical',
      priority: 'normal',
      encrypted: true,
      acknowledged: false
    }
    setCommLogs((current) => [...(current || []), newCommLog])
  }, [addOpsFeedEntry, addLogEntry, agentCallsign, agentId, setCommLogs])

  const handleStatusUpdate = useCallback((status: string, type: string) => {
    addOpsFeedEntry({
      agentCallsign: agentCallsign || 'SHADOW-7',
      agentId: agentId || 'shadow-7-alpha',
      type: type as OpsFeedEntry['type'],
      message: status,
      priority: type === 'alert' ? 'high' : 'normal'
    })
    addLogEntry(type as LogEntry['type'], 'Status Updated', status)
  }, [addOpsFeedEntry, addLogEntry, agentCallsign, agentId])

  const handleSOSBroadcast = useCallback((sosMessage: string) => {
    addOpsFeedEntry({
      agentCallsign: agentCallsign || 'SHADOW-7',
      agentId: agentId || 'shadow-7-alpha',
      type: 'alert',
      message: sosMessage,
      priority: 'critical'
    })
    addLogEntry('critical', 'EMERGENCY SOS BROADCAST', sosMessage)
    
    const blueTeamAgents = [
      { callsign: 'PHANTOM-3', id: 'phantom-3-bravo' },
      { callsign: 'VIPER-5', id: 'viper-5-charlie' },
      { callsign: 'RAVEN-2', id: 'raven-2-delta' },
      { callsign: 'FALCON-8', id: 'falcon-8-echo' },
    ]
    
    blueTeamAgents.forEach((agent, index) => {
      setTimeout(() => {
        addOpsFeedEntry({
          agentCallsign: agent.callsign,
          agentId: agent.id,
          type: 'alert',
          message: `Received SOS from ${agentCallsign} - Responding`,
          priority: 'high'
        })
      }, 1500 + index * 800)
    })
  }, [addOpsFeedEntry, addLogEntry, agentCallsign, agentId])

  const handleDeleteEntries = useCallback((entryIds: string[]) => {
    setLogEntries((current) => {
      return (current || []).filter(entry => !entryIds.includes(entry.id))
    })
  }, [setLogEntries])

  const handleArchiveEntries = useCallback((entryIds: string[], archived: boolean) => {
    setLogEntries((current) => {
      return (current || []).map(entry => 
        entryIds.includes(entry.id) ? { ...entry, archived } : entry
      )
    })
  }, [setLogEntries])

  const handleTagEntries = useCallback((entryIds: string[], tags: string[]) => {
    setLogEntries((current) => {
      return (current || []).map(entry => 
        entryIds.includes(entry.id) ? { ...entry, tags } : entry
      )
    })
  }, [setLogEntries])

  const handleAddNote = useCallback((entryId: string, note: string) => {
    setLogEntries((current) => {
      return (current || []).map(entry => 
        entry.id === entryId ? { ...entry, note: note || undefined } : entry
      )
    })
  }, [setLogEntries])

  const handleToggleChecklistItem = useCallback((checklistId: string, itemId: string) => {
    setChecklists((current) => {
      return (current || []).map(checklist => {
        if (checklist.id !== checklistId) return checklist

        const updatedItems = checklist.items.map(item => {
          if (item.id !== itemId) return item
          return {
            ...item,
            completed: !item.completed,
            completedAt: !item.completed ? Date.now() : undefined,
            completedBy: !item.completed ? agentCallsign || 'SHADOW-7' : undefined
          }
        })

        const completedCount = updatedItems.filter(i => i.completed).length
        return { ...checklist, items: updatedItems, completedCount, totalCount: updatedItems.length }
      })
    })
  }, [setChecklists, agentCallsign])

  const handleAddChecklist = useCallback((checklist: Omit<Checklist, 'id' | 'createdAt' | 'completedCount' | 'totalCount'>) => {
    const newChecklist: Checklist = {
      ...checklist,
      id: `checklist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      completedCount: 0,
      totalCount: checklist.items.length
    }
    setChecklists((current) => [...(current || []), newChecklist])
    addLogEntry('info', 'Checklist Created', `${checklist.name} with ${checklist.items.length} items`)
  }, [setChecklists, addLogEntry])

  const handleDeleteChecklist = useCallback((checklistId: string) => {
    setChecklists((current) => (current || []).filter(c => c.id !== checklistId))
    addLogEntry('info', 'Checklist Deleted', 'Checklist removed from system')
  }, [setChecklists, addLogEntry])

  const handleEquipmentDeployed = useCallback((item: EquipmentItem) => {
    const locationDesc = item.gridX !== undefined && item.gridY !== undefined
      ? `Grid ${String.fromCharCode(65 + item.gridX)}${item.gridY + 1}`
      : 'coordinates'
    
    addLogEntry('mission', 'Equipment Deployed', `${item.name} (${item.serialNumber}) deployed to ${item.assignedToType}: ${item.assignedToName}`)
    addOpsFeedEntry({
      agentCallsign: agentCallsign || 'SHADOW-7',
      agentId: agentId || 'shadow-7-alpha',
      type: 'mission',
      message: `${item.assignedToType?.toUpperCase()} established: ${item.assignedToName} - ${item.name}`,
      priority: item.priority === 'critical' || item.priority === 'high' ? 'high' : 'normal'
    })

    if (item.requiresAcknowledgment) {
      const newCommLog: CommLog = {
        id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        direction: 'outgoing',
        from: agentCallsign || 'SHADOW-7',
        to: 'ALL-STATIONS',
        message: `${item.assignedToType?.toUpperCase()}: ${item.assignedToName} at ${locationDesc} - ACK required`,
        channel: 'tactical',
        priority: item.priority === 'critical' ? 'critical' : item.priority === 'high' ? 'high' : 'normal',
        encrypted: item.encrypted,
        acknowledged: false
      }
      setCommLogs((current) => [...(current || []), newCommLog])
    }
  }, [addLogEntry, addOpsFeedEntry, agentCallsign, agentId, setCommLogs])

  const handleEquipmentRetrieved = useCallback((item: EquipmentItem) => {
    addLogEntry('success', 'Equipment Retrieved', `${item.name} (${item.serialNumber}) recovered from ${item.assignedToType}: ${item.assignedToName}`)
    addOpsFeedEntry({
      agentCallsign: agentCallsign || 'SHADOW-7',
      agentId: agentId || 'shadow-7-alpha',
      type: 'mission',
      message: `Equipment retrieved: ${item.name} from ${item.assignedToName}`,
      priority: 'normal'
    })
  }, [addLogEntry, addOpsFeedEntry, agentCallsign, agentId])

  const handleDispatchAsset = useCallback((assetId: string, targetGrid: { x: number; y: number }, message: string) => {
    setAssetLocations((current) => {
      return (current || []).map(asset => 
        asset.id === assetId 
          ? { ...asset, gridX: targetGrid.x, gridY: targetGrid.y, status: 'enroute' as const, lastUpdate: Date.now() }
          : asset
      )
    })
    
    const asset = assetLocations?.find(a => a.id === assetId)
    if (asset) {
      addLogEntry('mission', 'Asset Dispatched', `${asset.callsign} dispatched to grid - ${message}`)
      addOpsFeedEntry({
        agentCallsign: asset.callsign,
        agentId: asset.agentId,
        type: 'location',
        message: `Dispatching to target grid: ${message}`,
        priority: 'high'
      })
    }
  }, [setAssetLocations, assetLocations, addLogEntry, addOpsFeedEntry])

  const handleCreateLane = useCallback((lane: Omit<ActiveLane, 'id' | 'createdAt'>) => {
    const newLane: ActiveLane = {
      ...lane,
      id: `lane-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    }
    setActiveLanes((current) => [...(current || []), newLane])
    addLogEntry('mission', 'Lane Created', `Active lane "${lane.name}" established with ${lane.assignedAssets.length} asset(s)`)
  }, [setActiveLanes, addLogEntry])

  const handleClearGPSTrail = useCallback((assetId: string) => {
    setGpsTrails((current) => {
      return (current || []).map(trail => 
        trail.assetId === assetId ? { ...trail, coordinates: [] } : trail
      )
    })
    const asset = assetLocations?.find(a => a.id === assetId)
    if (asset) {
      addLogEntry('info', 'GPS Trail Cleared', `History cleared for ${asset.callsign}`)
    }
  }, [setGpsTrails, assetLocations, addLogEntry])

  const handleExportGPSTrail = useCallback((assetId: string) => {
    const asset = assetLocations?.find(a => a.id === assetId)
    if (asset) {
      addLogEntry('info', 'GPS Trail Exported', `Trail data exported for ${asset.callsign}`)
    }
  }, [assetLocations, addLogEntry])

  const handleWaypointCreated = useCallback((waypoint: Waypoint) => {
    setMissionWaypoints((current) => [...(current || []), waypoint])
    addLogEntry('mission', 'Waypoint Created', `${waypoint.name} plotted at coordinates`)
    addOpsFeedEntry({
      agentCallsign: agentCallsign || 'SHADOW-7',
      agentId: agentId || 'shadow-7-alpha',
      type: 'mission',
      message: `Mission waypoint created: ${waypoint.name}`,
      priority: 'normal'
    })
  }, [setMissionWaypoints, addLogEntry, addOpsFeedEntry, agentCallsign, agentId])

  const handleMeasurementCreated = useCallback((measurement: DistanceMeasurement) => {
    setDistanceMeasurements((current) => [...(current || []), measurement])
    addLogEntry('mission', 'Distance Measured', `${measurement.name} - ${measurement.totalDistance.toFixed(2)}km total distance`)
    addOpsFeedEntry({
      agentCallsign: agentCallsign || 'SHADOW-7',
      agentId: agentId || 'shadow-7-alpha',
      type: 'mission',
      message: `Distance measurement recorded: ${measurement.name}`,
      priority: 'normal'
    })
  }, [setDistanceMeasurements, addLogEntry, addOpsFeedEntry, agentCallsign, agentId])

  const handleRouteDeployed = useCallback((route: PatrolRoute) => {
    setDeployedRoutes((current) => [...(current || []), route])
    addLogEntry('mission', 'Patrol Route Deployed', `${route.name} with ${route.waypoints.length} waypoints activated`)
    addOpsFeedEntry({
      agentCallsign: agentCallsign || 'SHADOW-7',
      agentId: agentId || 'shadow-7-alpha',
      type: 'mission',
      message: `Patrol route deployed: ${route.name}`,
      priority: 'high'
    })
  }, [setDeployedRoutes, addLogEntry, addOpsFeedEntry, agentCallsign, agentId])

  const handleRouteWaypointsCreated = useCallback((waypoints: Waypoint[]) => {
    setMissionWaypoints((current) => [...(current || []), ...waypoints])
  }, [setMissionWaypoints])

  const handleGeofenceViolation = useCallback((violation: GeofenceViolation) => {
    addLogEntry('critical', 'GEOFENCE BREACH', `${violation.redTeamCallsign} entered restricted zone: ${violation.annotationLabel}`)
    addOpsFeedEntry({
      agentCallsign: 'M-CONSOLE',
      agentId: 'M-CONSOLE',
      type: 'alert',
      message: `⚠️ GEOFENCE ALERT: ${violation.redTeamCallsign} breached ${violation.annotationLabel}`,
      priority: 'critical'
    })
    soundGenerator.playActivityAlert('alert', 'critical')
  }, [addLogEntry, addOpsFeedEntry])

  const handleCreateAnnotation = useCallback(async (annotation: Omit<MapAnnotation, 'id' | 'createdAt'>) => {
    const newAnnotation: MapAnnotation = {
      ...annotation,
      id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    }
    setMapAnnotations((current) => [...(current || []), newAnnotation])
    
    const ackMsg = annotation.requiresAck ? ' (requires acknowledgment)' : ''
    addLogEntry('mission', 'Area Marked', `${annotation.label} marked on tactical map${ackMsg}`)
    addOpsFeedEntry({
      agentCallsign: agentCallsign || 'SHADOW-7',
      agentId: agentId || 'shadow-7-alpha',
      type: 'mission',
      message: `Map annotation: ${annotation.label}${ackMsg}`,
      priority: annotation.priority || 'normal'
    })

    await mConsoleSync.broadcastAnnotation('create', newAnnotation, undefined, agentCallsign || 'SHADOW-7')
  }, [setMapAnnotations, addLogEntry, addOpsFeedEntry, agentCallsign, agentId])

  const handleDeleteAnnotation = useCallback(async (annotationId: string) => {
    setMapAnnotations((current) => (current || []).filter(a => a.id !== annotationId))
    addLogEntry('info', 'Annotation Deleted', 'Map marking removed')

    await mConsoleSync.broadcastAnnotation('delete', undefined, annotationId, agentCallsign || 'SHADOW-7')
  }, [setMapAnnotations, addLogEntry, agentCallsign])

  const handleAcknowledgeAnnotation = useCallback(async (
    annotationId: string,
    response: 'acknowledged' | 'unable' | 'noted',
    message?: string
  ) => {
    const ack: import('@/components/HybridTacticalMap').AnnotationAcknowledgment = {
      annotationId,
      agentId: agentId || 'shadow-7-alpha',
      agentCallsign: agentCallsign || 'SHADOW-7',
      acknowledgedAt: Date.now(),
      response,
      responseMessage: message
    }

    await mConsoleSync.recordAnnotationAcknowledgment(ack)

    setMapAnnotations((current) => {
      return (current || []).map(annotation => {
        if (annotation.id === annotationId) {
          const existingAcks = annotation.acknowledgments || []
          const filteredAcks = existingAcks.filter(a => a.agentId !== ack.agentId)
          return {
            ...annotation,
            acknowledgments: [...filteredAcks, ack]
          }
        }
        return annotation
      })
    })

    const responseText = response === 'acknowledged' ? 'Acknowledged' 
      : response === 'unable' ? 'Unable to comply' 
      : 'Noted'
    
    const annotation = mapAnnotations?.find(a => a.id === annotationId)
    addLogEntry('info', 'Annotation Acknowledged', `${annotation?.label}: ${responseText}`)
    addOpsFeedEntry({
      agentCallsign: agentCallsign || 'SHADOW-7',
      agentId: agentId || 'shadow-7-alpha',
      type: 'check-in',
      message: `Map annotation response: ${responseText}${message ? ` - ${message}` : ''}`,
      priority: 'normal'
    })
  }, [agentId, agentCallsign, setMapAnnotations, mapAnnotations, addLogEntry, addOpsFeedEntry])

  const handleBroadcastAcknowledge = useCallback(async (
    broadcastId: string, 
    response: 'acknowledged' | 'unable' | 'negative',
    message?: string
  ) => {
    const ack: BroadcastAcknowledgment = {
      broadcastId,
      agentId: agentId || 'shadow-7-alpha',
      agentCallsign: agentCallsign || 'SHADOW-7',
      acknowledgedAt: Date.now(),
      response,
      responseMessage: message,
      receivedAt: Date.now()
    }

    await mConsoleSync.recordAcknowledgment(ack)

    setTrackedBroadcasts((current) => {
      return (current || []).map(broadcast => {
        if (broadcast.id === broadcastId) {
          const existingAcks = broadcast.acknowledgments || []
          const updatedAcks = existingAcks.filter(a => a.agentId !== ack.agentId)
          return {
            ...broadcast,
            acknowledgments: [...updatedAcks, ack]
          }
        }
        return broadcast
      })
    })

    const responseText = response === 'acknowledged' ? 'Acknowledged' 
      : response === 'unable' ? 'Unable to comply' 
      : 'Negative'
    
    addLogEntry('info', 'Broadcast Acknowledged', `Response: ${responseText}`)
    addOpsFeedEntry({
      agentCallsign: agentCallsign || 'SHADOW-7',
      agentId: agentId || 'shadow-7-alpha',
      type: 'transmission',
      message: `Broadcast response: ${responseText}${message ? ` - ${message}` : ''}`,
      priority: 'normal'
    })
  }, [agentId, agentCallsign, setTrackedBroadcasts, addLogEntry, addOpsFeedEntry])

  const handleBroadcastReceived = useCallback((broadcast: MConsoleBroadcast) => {
    if (!mConsoleSync.isRelevantBroadcast(broadcast, agentId || 'shadow-7-alpha')) {
      return
    }

    if (broadcast.requiresAck) {
      setTrackedBroadcasts((current) => {
        const exists = (current || []).find(b => b.id === broadcast.id)
        if (exists) return current || []

        const newTracked: TrackedBroadcast = {
          id: broadcast.id,
          type: broadcast.type === 'ops-update' ? 'general' : broadcast.type,
          message: broadcast.payload?.message || 'New directive from M',
          priority: broadcast.payload?.priority || 'normal',
          issuedBy: broadcast.broadcastBy,
          issuedAt: broadcast.timestamp,
          targetAgents: broadcast.targetAgents || [],
          acknowledgments: [],
          requiresAck: true,
          autoExpireMs: broadcast.autoExpireMs
        }

        return [...(current || []), newTracked]
      })

      addLogEntry('info', 'Acknowledgment Required', broadcast.payload?.message || 'New directive requires response')
      soundGenerator.playPingAlert('high')
    }

    switch (broadcast.type) {
      case 'scenario-deploy': {
        const scenario = broadcast.payload
        addLogEntry('mission', 'Scenario Deployed', `${scenario.name} - ${scenario.description}`)
        
        if (scenario.threatLevel) {
          setMissionData((current) => ({
            ...current!,
            name: scenario.name,
            objective: scenario.description,
            threatLevel: scenario.threatLevel,
            progress: 0,
            phase: 'DEPLOYMENT',
            startTime: Date.now()
          }))
        }

        if (scenario.lanes && scenario.lanes.length > 0) {
          const lanesWithIds: ActiveLane[] = scenario.lanes.map((lane: Omit<ActiveLane, 'id' | 'createdAt'>) => ({
            ...lane,
            id: `lane-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now()
          }))
          setActiveLanes(lanesWithIds)
          addLogEntry('info', 'Lanes Updated', `${lanesWithIds.length} lane(s) configured by M console`)
        }

        if (scenario.assetPositions && scenario.assetPositions.length > 0) {
          setAssetLocations((current) => {
            return (current || []).map(asset => {
              const position = scenario.assetPositions.find((p: any) => p.agentId === asset.agentId)
              if (position) {
                return { ...asset, gridX: position.gridX, gridY: position.gridY, lastUpdate: Date.now() }
              }
              return asset
            })
          })
          addLogEntry('info', 'Asset Positions Updated', `${scenario.assetPositions.length} asset(s) repositioned`)
        }

        addOpsFeedEntry({
          agentCallsign: broadcast.broadcastBy,
          agentId: 'M-CONSOLE',
          type: 'mission',
          message: `Scenario deployed: ${scenario.name}`,
          priority: 'high'
        })
        
        soundGenerator.playActivityAlert('mission', 'high')
        break
      }

      case 'lane-update': {
        const update = broadcast.payload
        if (update.action === 'create' && update.lane) {
          const newLane: ActiveLane = {
            ...update.lane as ActiveLane,
            id: update.laneId || `lane-${Date.now()}`,
            createdAt: Date.now()
          }
          setActiveLanes((current) => [...(current || []), newLane])
          addLogEntry('info', 'Lane Created', `New lane "${newLane.name}" established by M console`)
        } else if (update.action === 'delete' && update.laneId) {
          setActiveLanes((current) => (current || []).filter(l => l.id !== update.laneId))
          addLogEntry('info', 'Lane Removed', `Lane removed by M console`)
        }
        break
      }

      case 'dispatch-command': {
        const command = broadcast.payload
        setAssetLocations((current) => {
          return (current || []).map(asset => 
            asset.agentId === command.assetId 
              ? { ...asset, gridX: command.targetGrid.x, gridY: command.targetGrid.y, status: 'enroute' as const, lastUpdate: Date.now() }
              : asset
          )
        })
        
        addLogEntry('mission', 'Dispatch Order', `${command.directive}`)
        addOpsFeedEntry({
          agentCallsign: broadcast.broadcastBy,
          agentId: 'M-CONSOLE',
          type: 'mission',
          message: command.directive,
          priority: command.priority
        })
        break
      }

      case 'm-ping': {
        const pingData = broadcast.payload
        setCurrentPing({
          id: `ping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          message: pingData.message,
          priority: pingData.priority,
          acknowledged: false
        })
        addLogEntry('info', 'Message from M', pingData.message)
        break
      }

      case 'ops-update': {
        const entry = broadcast.payload
        addOpsFeedEntry(entry)
        break
      }

      case 'patrol-route-deploy': {
        const deployment = broadcast.payload as import('@/lib/mConsoleSync').PatrolRouteDeployment
        handleRouteDeployed(deployment.route)
        
        const waypoints = deployment.route.waypoints.map((wp, index) => ({
          ...wp,
          id: `wp-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now()
        }))
        handleRouteWaypointsCreated(waypoints)
        
        addLogEntry('mission', 'Patrol Route Assigned', `${deployment.route.name} deployed by ${deployment.deployedBy}`)
        addOpsFeedEntry({
          agentCallsign: broadcast.broadcastBy,
          agentId: 'M-CONSOLE',
          type: 'mission',
          message: `Patrol route deployed: ${deployment.route.name}`,
          priority: deployment.priority
        })
        
        soundGenerator.playActivityAlert('mission', deployment.priority)
        break
      }

      case 'annotation-update': {
        const annotationBroadcast = broadcast.payload as import('@/lib/mConsoleSync').AnnotationBroadcast
        
        if (annotationBroadcast.action === 'create' && annotationBroadcast.annotation) {
          setMapAnnotations((current) => {
            const exists = (current || []).find(a => a.id === annotationBroadcast.annotation!.id)
            if (exists) return current || []
            return [...(current || []), annotationBroadcast.annotation!]
          })
          
          const ackMsg = annotationBroadcast.annotation.requiresAck ? ' (requires acknowledgment)' : ''
          addLogEntry('info', 'Map Annotation Received', `${annotationBroadcast.annotation.label} added by ${broadcast.broadcastBy}${ackMsg}`)
          addOpsFeedEntry({
            agentCallsign: broadcast.broadcastBy,
            agentId: 'M-CONSOLE',
            type: 'mission',
            message: `Map marked: ${annotationBroadcast.annotation.label}${ackMsg}`,
            priority: annotationBroadcast.annotation.priority || 'normal'
          })

          if (annotationBroadcast.annotation.requiresAck) {
            soundGenerator.playActivityAlert('mission', annotationBroadcast.annotation.priority || 'normal')
          }
        } else if (annotationBroadcast.action === 'delete' && annotationBroadcast.annotationId) {
          setMapAnnotations((current) => 
            (current || []).filter(a => a.id !== annotationBroadcast.annotationId)
          )
          
          addLogEntry('info', 'Map Annotation Removed', `Marking removed by ${broadcast.broadcastBy}`)
        } else if (annotationBroadcast.action === 'update' && annotationBroadcast.annotation) {
          setMapAnnotations((current) => 
            (current || []).map(a => 
              a.id === annotationBroadcast.annotation!.id ? annotationBroadcast.annotation! : a
            )
          )
          
          addLogEntry('info', 'Map Annotation Updated', `${annotationBroadcast.annotation.label} updated by ${broadcast.broadcastBy}`)
        }
        break
      }
    }
  }, [agentId, addLogEntry, setMissionData, setActiveLanes, setAssetLocations, setCurrentPing, addOpsFeedEntry])

  useEffect(() => {
    mConsoleSync.startSync(3000)
    gameStateSync.startSync(1000)
    
    const unsubscribe = mConsoleSync.onBroadcast(handleBroadcastReceived)
    syncUnsubscribeRef.current = unsubscribe

    const unsubscribeGameState = gameStateSync.onGameStateChange((state) => {
      setGameState(state)
      if (state.frozen) {
        addLogEntry('critical', 'Game Frozen', state.freezeReason || 'Operations suspended by M Console')
      }
    })

    const unsubscribeTelemetry = gameStateSync.onTelemetryUpdate((telemetry) => {
      if (telemetry.playerTeam === 'red') {
        setRedTeamTelemetry((current) => {
          const filtered = current.filter(t => t.playerId !== telemetry.playerId)
          return [telemetry, ...filtered]
        })
      }
    })

    const loadRedTeamTelemetry = async () => {
      const allTelemetry = await gameStateSync.getAllTelemetry()
      const redTeamOnly = allTelemetry.filter(t => t.playerTeam === 'red')
      setRedTeamTelemetry(redTeamOnly)
    }

    loadRedTeamTelemetry()
    const telemetryInterval = setInterval(loadRedTeamTelemetry, 5000)

    return () => {
      mConsoleSync.stopSync()
      gameStateSync.stopSync()
      if (syncUnsubscribeRef.current) {
        syncUnsubscribeRef.current()
      }
      unsubscribeGameState()
      unsubscribeTelemetry()
      clearInterval(telemetryInterval)
    }
  }, [handleBroadcastReceived, addLogEntry])

  useEffect(() => {
    const loadTrackedBroadcasts = async () => {
      const broadcasts = await mConsoleSync.getTrackedBroadcasts()
      if (broadcasts.length > 0) {
        setTrackedBroadcasts(broadcasts)
      }
    }

    loadTrackedBroadcasts()

    const syncInterval = setInterval(loadTrackedBroadcasts, 10000)
    return () => clearInterval(syncInterval)
  }, [setTrackedBroadcasts])

  useEffect(() => {
    if (assetLocations && assetLocations.length === 0) {
      const blueTeamAgents = [
        { callsign: 'PHANTOM-3', id: 'phantom-3-bravo', gridX: 2, gridY: 1 },
        { callsign: 'VIPER-5', id: 'viper-5-charlie', gridX: 5, gridY: 3 },
        { callsign: 'RAVEN-2', id: 'raven-2-delta', gridX: 1, gridY: 5 },
        { callsign: 'FALCON-8', id: 'falcon-8-echo', gridX: 6, gridY: 6 },
      ]

      const initialAssets: AssetLocation[] = blueTeamAgents.map(agent => ({
        id: agent.id,
        callsign: agent.callsign,
        agentId: agent.id,
        gridX: agent.gridX,
        gridY: agent.gridY,
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
        altitude: 10 + Math.random() * 50,
        speed: Math.random() * 3,
        heading: Math.random() * 360,
        status: 'active' as const,
        lastUpdate: Date.now()
      }))

      setAssetLocations(initialAssets)
      addLogEntry('info', 'Asset Tracking Initialized', `${initialAssets.length} assets detected on tactical grid`)
    }
  }, [assetLocations, setAssetLocations, addLogEntry])

  useEffect(() => {
    if (assetLocations && assetLocations.length > 0) {
      setGpsTrails((current) => {
        const existingTrails = current || []
        const updatedTrails = assetLocations.map(asset => {
          const existingTrail = existingTrails.find(t => t.assetId === asset.id)
          if (existingTrail) {
            return existingTrail
          }
          return {
            assetId: asset.id,
            callsign: asset.callsign,
            coordinates: [],
            status: asset.status,
            color: asset.status === 'alert' 
              ? 'oklch(0.65 0.25 25)' 
              : asset.status === 'enroute'
              ? 'oklch(0.75 0.16 75)'
              : 'oklch(0.75 0.18 145)'
          }
        })
        return updatedTrails
      })
    }
  }, [assetLocations, setGpsTrails])

  useEffect(() => {
    const gpsHistoryInterval = setInterval(() => {
      if (assetLocations && assetLocations.length > 0) {
        setGpsTrails((current) => {
          const trails = current || []
          return trails.map(trail => {
            const asset = assetLocations.find(a => a.id === trail.assetId)
            if (!asset) return trail

            const newCoordinate: GPSCoordinate = {
              latitude: asset.latitude,
              longitude: asset.longitude,
              altitude: asset.altitude,
              timestamp: Date.now()
            }

            const updatedCoordinates = [...trail.coordinates, newCoordinate]
            const maxCoordinates = 100
            const trimmedCoordinates = updatedCoordinates.length > maxCoordinates
              ? updatedCoordinates.slice(-maxCoordinates)
              : updatedCoordinates

            return {
              ...trail,
              coordinates: trimmedCoordinates,
              status: asset.status,
              color: asset.status === 'alert' 
                ? 'oklch(0.65 0.25 25)' 
                : asset.status === 'enroute'
                ? 'oklch(0.75 0.16 75)'
                : 'oklch(0.75 0.18 145)'
            }
          })
        })
      }
    }, 5000)

    return () => clearInterval(gpsHistoryInterval)
  }, [assetLocations, setGpsTrails])

  useEffect(() => {
    const assetUpdateInterval = setInterval(() => {
      setAssetLocations((current) => {
        if (!current || current.length === 0) return current || []
        
        const randomAsset = current[Math.floor(Math.random() * current.length)]
        const updatedAssets = current.map(asset => {
          if (asset.id === randomAsset.id && asset.status === 'enroute') {
            return { ...asset, status: 'active' as const, lastUpdate: Date.now() }
          }
          return asset
        })
        return updatedAssets
      })
    }, 25000)

    return () => clearInterval(assetUpdateInterval)
  }, [setAssetLocations])

  useEffect(() => {
    const gpsUpdateInterval = setInterval(() => {
      setAssetLocations((current) => {
        if (!current || current.length === 0) return current || []
        
        return current.map(asset => ({
          ...asset,
          latitude: asset.latitude + (Math.random() - 0.5) * 0.0001,
          longitude: asset.longitude + (Math.random() - 0.5) * 0.0001,
          altitude: Math.max(0, Math.min(100, (asset.altitude || 10) + (Math.random() - 0.5) * 2)),
          speed: Math.max(0, Math.min(5, (asset.speed || 0) + (Math.random() - 0.5) * 0.3)),
          heading: ((asset.heading || 0) + (Math.random() - 0.5) * 5 + 360) % 360,
          lastUpdate: Date.now()
        }))
      })
    }, 3000)

    return () => clearInterval(gpsUpdateInterval)
  }, [setAssetLocations])

  useEffect(() => {
    if (currentPing && !currentPing.acknowledged) {
      if (previousPingIdRef.current !== currentPing.id) {
        soundGenerator.playPingAlert(currentPing.priority)
        previousPingIdRef.current = currentPing.id
      }
    }
  }, [currentPing])

  useEffect(() => {
    if (opsFeedEntries && opsFeedEntries.length > previousOpsFeedLengthRef.current) {
      if (previousOpsFeedLengthRef.current > 0) {
        const latestEntry = opsFeedEntries[opsFeedEntries.length - 1]
        if (latestEntry.agentId !== agentId) {
          soundGenerator.playActivityAlert(latestEntry.type, latestEntry.priority)
        }
      }
      previousOpsFeedLengthRef.current = opsFeedEntries.length
    }
  }, [opsFeedEntries, agentId])

  useEffect(() => {
    if (logEntries && logEntries.length === 0) {
      addLogEntry('mission', 'Mission Initialized', `${agentCallsign} deployed to field`)
      addLogEntry('info', 'Telemetry Systems Online', 'All sensors operational')
    }
  }, [logEntries, addLogEntry, agentCallsign])

  useEffect(() => {
    if (opsFeedEntries && opsFeedEntries.length === 0) {
      const blueTeamAgents = [
        { callsign: 'PHANTOM-3', id: 'phantom-3-bravo' },
        { callsign: 'VIPER-5', id: 'viper-5-charlie' },
        { callsign: 'RAVEN-2', id: 'raven-2-delta' },
      ]
      
      blueTeamAgents.forEach((agent, index) => {
        setTimeout(() => {
          addOpsFeedEntry({
            agentCallsign: agent.callsign,
            agentId: agent.id,
            type: 'check-in',
            message: 'Operational status confirmed'
          })
        }, index * 500)
      })
    }
  }, [opsFeedEntries, addOpsFeedEntry])

  useEffect(() => {
    if (checklists && checklists.length === 0) {
      const defaultChecklists: Omit<Checklist, 'id' | 'createdAt' | 'completedCount' | 'totalCount'>[] = [
        {
          name: 'Pre-Mission Equipment Check',
          category: 'pre-mission',
          items: [
            { id: 'item-1', text: 'Verify communications device fully charged', completed: false, priority: 'critical' },
            { id: 'item-2', text: 'Test encrypted radio channels', completed: false, priority: 'high' },
            { id: 'item-3', text: 'Confirm GPS coordinates calibrated', completed: false, priority: 'high' },
            { id: 'item-4', text: 'Check biometric sensors operational', completed: false, priority: 'normal' },
            { id: 'item-5', text: 'Review mission briefing and objectives', completed: false, priority: 'critical' }
          ]
        },
        {
          name: 'Field Safety Protocol',
          category: 'safety',
          items: [
            { id: 'item-1', text: 'Establish emergency extraction point', completed: false, priority: 'critical' },
            { id: 'item-2', text: 'Verify panic button functionality', completed: false, priority: 'critical' },
            { id: 'item-3', text: 'Confirm backup communications channel', completed: false, priority: 'high' },
            { id: 'item-4', text: 'Identify nearest safe house location', completed: false, priority: 'high' }
          ]
        }
      ]

      defaultChecklists.forEach(checklist => handleAddChecklist(checklist))
    }
  }, [checklists, handleAddChecklist])

  useEffect(() => {
    const pingMessages = [
      { message: 'Status check: Confirm operational status', priority: 'normal' as const },
      { message: 'Intelligence update: New target coordinates received', priority: 'high' as const },
      { message: 'URGENT: Possible hostiles in your sector', priority: 'critical' as const },
      { message: 'Mission parameter update: Proceed to checkpoint beta', priority: 'high' as const },
      { message: 'Routine check-in required', priority: 'low' as const },
    ]

    const pingInterval = setInterval(() => {
      if (!currentPing || currentPing.acknowledged) {
        const randomMessage = pingMessages[Math.floor(Math.random() * pingMessages.length)]
        setCurrentPing({
          id: `ping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          message: randomMessage.message,
          priority: randomMessage.priority,
          acknowledged: false
        })
        addLogEntry('info', 'Incoming Message from M', randomMessage.message)

        const newCommLog: CommLog = {
          id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          direction: 'incoming',
          from: 'M-CONSOLE',
          to: agentCallsign || 'SHADOW-7',
          message: randomMessage.message,
          channel: randomMessage.priority === 'critical' ? 'emergency' : 'secure',
          priority: randomMessage.priority,
          encrypted: true,
          acknowledged: false
        }
        setCommLogs((current) => [...(current || []), newCommLog])
      }
    }, 45000 + Math.random() * 30000)

    return () => clearInterval(pingInterval)
  }, [currentPing, setCurrentPing, addLogEntry, agentCallsign, setCommLogs])

  useEffect(() => {
    const blueTeamAgents = [
      { callsign: 'PHANTOM-3', id: 'phantom-3-bravo' },
      { callsign: 'VIPER-5', id: 'viper-5-charlie' },
      { callsign: 'RAVEN-2', id: 'raven-2-delta' },
      { callsign: 'FALCON-8', id: 'falcon-8-echo' },
    ]

    const activities = [
      { type: 'status' as const, messages: ['Position secure', 'Area clear', 'No contact', 'Holding position'] },
      { type: 'location' as const, messages: ['Moving to waypoint', 'Approaching target zone', 'Relocating to sector', 'En route to extraction'] },
      { type: 'mission' as const, messages: ['Objective acquired', 'Target identified', 'Package secured', 'Mission progress 50%'] },
      { type: 'alert' as const, messages: ['Contact detected', 'Possible threat nearby', 'Unidentified movement'], priority: 'high' as const },
      { type: 'transmission' as const, messages: ['Opening secure channel', 'Data link established', 'Transmitting intel'] },
    ]

    const opsInterval = setInterval(() => {
      const agent = blueTeamAgents[Math.floor(Math.random() * blueTeamAgents.length)]
      const activity = activities[Math.floor(Math.random() * activities.length)]
      const message = activity.messages[Math.floor(Math.random() * activity.messages.length)]
      
      addOpsFeedEntry({
        agentCallsign: agent.callsign,
        agentId: agent.id,
        type: activity.type,
        message,
        priority: activity.priority
      })
    }, 15000 + Math.random() * 20000)

    return () => clearInterval(opsInterval)
  }, [addOpsFeedEntry])

  useEffect(() => {
    const bioInterval = setInterval(() => {
      if (gameState.frozen) return
      
      setBiometrics((prev) => ({
        heartRate: Math.max(60, Math.min(180, prev.heartRate + (Math.random() - 0.5) * 5)),
        bloodOxygen: Math.max(90, Math.min(100, prev.bloodOxygen + (Math.random() - 0.5) * 2)),
        stressLevel: Math.max(0, Math.min(100, prev.stressLevel + (Math.random() - 0.5) * 8)),
        temperature: Math.max(36.0, Math.min(38.5, prev.temperature + (Math.random() - 0.5) * 0.2))
      }))
    }, 2500)

    const locInterval = setInterval(() => {
      if (gameState.frozen) return
      
      setLocation((prev) => ({
        latitude: prev.latitude + (Math.random() - 0.5) * 0.0001,
        longitude: prev.longitude + (Math.random() - 0.5) * 0.0001,
        speed: Math.max(0, Math.min(5, prev.speed + (Math.random() - 0.5) * 0.5)),
        distance: prev.distance + Math.random() * 0.05,
        elevation: Math.max(0, Math.min(100, prev.elevation + (Math.random() - 0.5) * 2))
      }))
    }, 3000)

    const signalInterval = setInterval(() => {
      setSignalStrength((prev) => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 10)))
    }, 4000)

    const batteryInterval = setInterval(() => {
      setBatteryLevel((prev) => Math.max(0, prev - 0.1))
    }, 30000)

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    const missionInterval = setInterval(() => {
      if (gameState.frozen) return
      
      setMissionData((current) => {
        if (!current) {
          return {
            name: 'OPERATION NIGHTFALL',
            objective: 'Secure Package Alpha',
            progress: 0,
            threatLevel: 'LOW',
            phase: 'INFILTRATION',
            startTime: Date.now()
          }
        }
        const elapsed = Date.now() - current.startTime
        const newProgress = Math.min(100, (elapsed / (30 * 60 * 1000)) * 100)
        
        let newThreatLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = current.threatLevel
        if (newProgress > 75) newThreatLevel = 'CRITICAL'
        else if (newProgress > 50) newThreatLevel = 'HIGH'
        else if (newProgress > 25) newThreatLevel = 'MODERATE'
        
        return {
          ...current,
          progress: newProgress,
          threatLevel: newThreatLevel
        }
      })
    }, 5000)

    return () => {
      clearInterval(bioInterval)
      clearInterval(locInterval)
      clearInterval(signalInterval)
      clearInterval(batteryInterval)
      clearInterval(timeInterval)
      clearInterval(missionInterval)
    }
  }, [setMissionData, gameState.frozen])

  useEffect(() => {
    if (biometrics.heartRate > 140) {
      addLogEntry('critical', 'Critical Heart Rate', `Elevated to ${Math.round(biometrics.heartRate)} BPM`)
    } else if (biometrics.heartRate > 120) {
      addLogEntry('warning', 'Elevated Heart Rate', `Increased to ${Math.round(biometrics.heartRate)} BPM`)
    }
  }, [Math.floor(biometrics.heartRate / 20)])

  useEffect(() => {
    if (biometrics.stressLevel > 80) {
      addLogEntry('critical', 'High Stress Detected', `Stress level at ${Math.round(biometrics.stressLevel)}%`)
    } else if (biometrics.stressLevel > 60) {
      addLogEntry('warning', 'Elevated Stress', `Stress level at ${Math.round(biometrics.stressLevel)}%`)
    }
  }, [Math.floor(biometrics.stressLevel / 20)])

  useEffect(() => {
    if (batteryLevel < 20 && batteryLevel > 19) {
      addLogEntry('warning', 'Low Battery Warning', `Power level critical at ${Math.round(batteryLevel)}%`)
    } else if (batteryLevel < 10 && batteryLevel > 9) {
      addLogEntry('critical', 'Critical Battery Level', `Power at ${Math.round(batteryLevel)}% - Conservation mode recommended`)
    }
  }, [Math.floor(batteryLevel / 10)])

  useEffect(() => {
    if (signalStrength < 30 && signalStrength > 20) {
      addLogEntry('warning', 'Weak Signal', `Signal strength at ${Math.round(signalStrength)}%`)
    } else if (signalStrength < 20) {
      addLogEntry('critical', 'Signal Loss Imminent', `Connection unstable at ${Math.round(signalStrength)}%`)
    }
  }, [Math.floor(signalStrength / 10)])

  useEffect(() => {
    if (isTransmitting) {
      addOpsFeedEntry({
        agentCallsign: agentCallsign || 'SHADOW-7',
        agentId: agentId || 'shadow-7-alpha',
        type: 'transmission',
        message: 'Secure data stream active'
      })
    }
  }, [isTransmitting, addOpsFeedEntry, agentCallsign, agentId])

  useEffect(() => {
    if (!missionData) return
    
    const prevThreat = missionData.threatLevel
    if (prevThreat !== missionData.threatLevel) {
      addLogEntry(
        missionData.threatLevel === 'CRITICAL' || missionData.threatLevel === 'HIGH' ? 'critical' : 'warning',
        `Threat Level: ${missionData.threatLevel}`,
        'Mission parameters updated'
      )
    }

    if (missionData.progress >= 25 && missionData.progress < 26) {
      addLogEntry('mission', 'Checkpoint Reached', '25% mission progress achieved')
    } else if (missionData.progress >= 50 && missionData.progress < 51) {
      addLogEntry('mission', 'Halfway Point', '50% mission progress - Phase transition')
    } else if (missionData.progress >= 75 && missionData.progress < 76) {
      addLogEntry('mission', 'Final Phase', '75% mission progress - Objective in sight')
    } else if (missionData.progress >= 100) {
      addLogEntry('success', 'Mission Complete', 'All objectives achieved')
    }
  }, [missionData?.progress, missionData?.threatLevel])

  const getHeartRateStatus = () => {
    if (biometrics.heartRate > 120) return 'text-destructive'
    if (biometrics.heartRate > 100) return 'text-accent'
    return 'text-primary'
  }

  const getStressStatus = () => {
    if (biometrics.stressLevel > 70) return 'text-destructive'
    if (biometrics.stressLevel > 40) return 'text-accent'
    return 'text-primary'
  }

  const getThreatColor = () => {
    if (!missionData) return 'bg-primary text-primary-foreground'
    switch (missionData.threatLevel) {
      case 'CRITICAL': return 'bg-destructive text-destructive-foreground'
      case 'HIGH': return 'bg-accent text-accent-foreground'
      case 'MODERATE': return 'bg-amber-700 text-foreground'
      default: return 'bg-primary text-primary-foreground'
    }
  }

  const getBiometricStatus = (): 'normal' | 'elevated' | 'critical' => {
    if (biometrics.heartRate > 140 || biometrics.stressLevel > 80) return 'critical'
    if (biometrics.heartRate > 120 || biometrics.stressLevel > 60) return 'elevated'
    return 'normal'
  }

  const formatTime = (date: Date) => {
    return date.toTimeString().slice(0, 8)
  }

  const formatCoordinate = (value: number, precision: number = 6) => {
    return value.toFixed(precision)
  }

  const allAssets = useMemo(() => {
    const blueTeamAssets = assetLocations || []
    
    const enabledRedTeamPlayers = (redTeamPlayers || []).filter(p => p.gpsEnabled)
    
    const redTeamAssets: AssetLocation[] = enabledRedTeamPlayers
      .map(player => {
        const telemetryData = redTeamTelemetry.find(t => t.playerId === player.playerId)
        if (!telemetryData) return null
        
        const gridX = Math.floor((telemetryData.longitude + 74.0060) * 100) % 8
        const gridY = Math.floor((telemetryData.latitude - 40.7128) * 100) % 8
        
        return {
          id: `red-${player.playerId}`,
          callsign: player.callsign,
          agentId: player.playerId,
          gridX: Math.max(0, Math.min(7, gridX)),
          gridY: Math.max(0, Math.min(7, gridY)),
          latitude: telemetryData.latitude,
          longitude: telemetryData.longitude,
          altitude: telemetryData.altitude,
          speed: telemetryData.speed,
          heading: telemetryData.heading,
          status: 'alert' as const,
          lastUpdate: telemetryData.lastUpdate
        } as AssetLocation
      })
      .filter((asset): asset is AssetLocation => asset !== null)
    
    return [...blueTeamAssets, ...redTeamAssets]
  }, [assetLocations, redTeamPlayers, redTeamTelemetry])

  const redTeamAssets = useMemo(() => {
    return allAssets.filter(asset => asset.status === 'alert')
  }, [allAssets])

  const assetStatusData = useMemo((): AssetStatus[] => {
    return allAssets.map(asset => {
      const isOperational = asset.status === 'active'
      const isDegraded = asset.status === 'enroute'
      const isCritical = asset.status === 'alert'
      const isOffline = asset.status === 'inactive'

      const heartRate = isCritical ? 145 + Math.random() * 20 : 
                        isDegraded ? 95 + Math.random() * 20 :
                        70 + Math.random() * 15

      const stressLevel = isCritical ? 75 + Math.random() * 20 :
                          isDegraded ? 50 + Math.random() * 20 :
                          15 + Math.random() * 25

      const batteryLevel = isOffline ? Math.random() * 15 :
                           isCritical ? 25 + Math.random() * 20 :
                           60 + Math.random() * 40

      const signalStrength = isOffline ? Math.random() * 20 :
                             isCritical ? 35 + Math.random() * 30 :
                             70 + Math.random() * 30

      const missionReady = isOperational && batteryLevel > 30 && signalStrength > 50

      const equipmentStatus: 'green' | 'amber' | 'red' = 
        isCritical || batteryLevel < 20 ? 'red' :
        isDegraded || batteryLevel < 40 ? 'amber' :
        'green'

      return {
        id: asset.id,
        callsign: asset.callsign,
        status: isOffline ? 'offline' : isCritical ? 'critical' : isDegraded ? 'degraded' : 'operational',
        heartRate: Math.round(heartRate),
        stressLevel: Math.round(stressLevel),
        batteryLevel: Math.round(batteryLevel),
        signalStrength: Math.round(signalStrength),
        lastUpdate: asset.lastUpdate,
        missionReady,
        equipmentStatus
      }
    })
  }, [allAssets])
  
  if (!missionData) return null

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-background text-foreground scanline-effect">
        <div className="max-w-md mx-auto p-4 space-y-4">
        <header className="flex items-center justify-between border border-border p-3 bg-card">
          <div className="flex items-center gap-2">
            <Eye weight="bold" className="text-primary" size={20} />
            <div>
              <div className="text-xs tracking-widest">EYES ONLY</div>
              <div className="text-[10px] text-muted-foreground">CLASSIFIED</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant={mConsoleMode ? "default" : "outline"}
              onClick={() => setMConsoleMode(!mConsoleMode)}
              className="text-[8px] h-6 px-2"
            >
              <Desktop weight="bold" size={12} className="mr-1" />
              {mConsoleMode ? 'M CONSOLE' : 'WATCH'}
            </Button>
            <div className="text-right">
              <div className="text-sm font-bold tabular-nums">{formatTime(currentTime)}</div>
              <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary text-primary">
                {clearanceLevel}
              </Badge>
            </div>
          </div>
        </header>

        {mConsoleMode && (
          <>
            <GameControlPanel 
              isFrozen={gameState.frozen}
              emergencyPanicActive={gameState.emergencyPanicActive}
              onStateChange={async () => {
                const newState = await gameStateSync.getGameState()
                setGameState(newState)
              }}
            />

            <ArgEventCreator
              scenarioId={missionData?.name}
              onEventCreated={(event) => {
                addLogEntry('mission', 'ARG Event Created', `${event.name} with ${event.items.length} items`)
                addOpsFeedEntry({
                  agentCallsign: 'M-CONSOLE',
                  agentId: 'M-CONSOLE',
                  type: 'mission',
                  message: `ARG Event deployed: ${event.name}`,
                  priority: 'high'
                })
              }}
            />

            <ArgEventDashboard
              maxHeight="600px"
              onEventActivated={(event) => {
                addLogEntry('mission', 'ARG Event Activated', `${event.name} is now live`)
                addOpsFeedEntry({
                  agentCallsign: 'M-CONSOLE',
                  agentId: 'M-CONSOLE',
                  type: 'mission',
                  message: `ARG Event activated: ${event.name}`,
                  priority: 'high'
                })
              }}
            />

            <DeadDropManager
              assets={allAssets}
              maxHeight="600px"
              currentUser={agentCallsign || 'M-CONSOLE'}
              onDropCreated={(drop) => {
                addLogEntry('mission', 'Dead Drop Created', `${drop.name} placed at Grid ${String.fromCharCode(65 + drop.gridX)}${drop.gridY + 1}`)
                addOpsFeedEntry({
                  agentCallsign: 'M-CONSOLE',
                  agentId: 'M-CONSOLE',
                  type: 'mission',
                  message: `Dead drop established: ${drop.name}`,
                  priority: 'normal'
                })
              }}
              onDropRetrieved={(drop, items) => {
                addLogEntry('success', 'Dead Drop Retrieved', `${items.length} items collected from ${drop.name}`)
                addOpsFeedEntry({
                  agentCallsign: 'M-CONSOLE',
                  agentId: 'M-CONSOLE',
                  type: 'mission',
                  message: `Dead drop retrieved: ${drop.name} - ${items.length} items`,
                  priority: 'normal'
                })
              }}
            />

            <AgentInventoryViewer
              assets={allAssets}
              currentAgentId={agentId || 'shadow-7-alpha'}
              maxHeight="600px"
              onItemTransferred={(fromAgent, toAgent, itemId) => {
                const fromAsset = allAssets.find(a => a.agentId === fromAgent)
                const toAsset = allAssets.find(a => a.agentId === toAgent)
                addLogEntry('mission', 'Item Transferred', `Item moved from ${fromAsset?.callsign} to ${toAsset?.callsign}`)
                addOpsFeedEntry({
                  agentCallsign: 'M-CONSOLE',
                  agentId: 'M-CONSOLE',
                  type: 'mission',
                  message: `Item transfer: ${fromAsset?.callsign} → ${toAsset?.callsign}`,
                  priority: 'normal'
                })
              }}
            />

            <RedTeamManagementPanel maxHeight="600px" />

            <RedTeamTelemetryPanel maxHeight="500px" />

            <GeofencingAlerts
              annotations={mapAnnotations || []}
              redTeamAssets={redTeamAssets}
              maxHeight="500px"
              onViolationDetected={handleGeofenceViolation}
            />

            <AnnotationAckDashboard
              annotations={mapAnnotations || []}
              assets={allAssets}
              maxHeight="600px"
              onRefresh={() => {
                addLogEntry('info', 'Dashboard Refreshed', 'Annotation acknowledgment statistics updated')
              }}
            />
            
            <ScenarioCreator
              assets={allAssets}
              onScenarioDeployed={(scenario) => {
                addLogEntry('mission', 'Scenario Deployed', `${scenario.name} deployed by M console`)
              }}
            />
            
            <BroadcastScheduler
              assets={allAssets}
              onBroadcastScheduled={(broadcast) => {
                addLogEntry('info', 'Broadcast Scheduled', `"${broadcast.name}" scheduled for ${broadcast.scheduleType === 'once' ? 'one-time delivery' : 'recurring delivery'}`)
              }}
            />
            
            <BroadcastTemplates
              assets={allAssets}
              onBroadcastSent={(templateId, targetAgents) => {
                addLogEntry('transmission', 'Broadcast Sent', `Template broadcast sent to ${targetAgents.length} agent(s)`)
              }}
            />

            <AnnotationBroadcaster
              annotations={mapAnnotations || []}
              onDeleteAnnotation={handleDeleteAnnotation}
              onCreateAnnotation={handleCreateAnnotation}
              currentUser="M-CONSOLE"
            />

            <AssetStatusBoard
              assets={assetStatusData}
              maxHeight="500px"
              onSelectAsset={(assetId) => {
                const asset = allAssets.find(a => a.id === assetId)
                if (asset) {
                  addLogEntry('info', 'Asset Selected', `Viewing status for ${asset.callsign}`)
                }
              }}
            />

            <EquipmentInventory
              assets={allAssets}
              maxHeight="500px"
              onItemDeployed={handleEquipmentDeployed}
              onItemRetrieved={handleEquipmentRetrieved}
              currentUser={agentCallsign || 'SHADOW-7'}
            />

            <EquipmentMapOverlay
              equipment={equipment || []}
              maxHeight="400px"
              onItemClick={(item) => {
                addLogEntry('info', 'Equipment Selected', `Viewing ${item.name} at ${item.assignedToName}`)
              }}
            />
          </>
        )}

        {gameState.frozen && (
          <Alert className="border-accent bg-accent/20 animate-pulse-border">
            <Pause weight="bold" className="text-accent" size={20} />
            <AlertDescription className="text-sm">
              <div className="font-bold text-accent">GAME FROZEN</div>
              <div className="text-xs text-muted-foreground mt-1">
                {gameState.freezeReason || 'All operations suspended by M Console'}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <SituationPanel 
          missionProgress={missionData.progress}
          threatLevel={missionData.threatLevel}
          unreadAlerts={(opsFeedEntries || []).filter(e => !(readOpsFeedEntries || []).includes(e.id) && e.agentId !== agentId).length}
          teamSize={4}
          biometricStatus={getBiometricStatus()}
        />

        <MPing ping={currentPing || null} onAcknowledge={handleAcknowledgePing} />

        <OverdueAnnotationAlerts
          annotations={mapAnnotations || []}
          assets={allAssets}
          currentAgentId={agentId || 'shadow-7-alpha'}
          currentAgentCallsign={agentCallsign || 'SHADOW-7'}
          onAcknowledge={handleAcknowledgeAnnotation}
          maxHeight="400px"
        />

        <PanicButton 
          agentCallsign={agentCallsign || 'SHADOW-7'} 
          agentId={agentId || 'shadow-7-alpha'} 
          onSOSBroadcast={handleSOSBroadcast}
        />

        <QuickResponse onSendResponse={handleQuickResponse} agentCallsign={agentCallsign || 'SHADOW-7'} />

        <StatusUpdate onStatusUpdate={handleStatusUpdate} agentCallsign={agentCallsign || 'SHADOW-7'} />

        <MissionPlanner 
          assets={allAssets}
          onWaypointCreated={handleWaypointCreated}
          onMeasurementCreated={handleMeasurementCreated}
        />

        <PatrolRouteTemplates
          onRouteDeployed={handleRouteDeployed}
          onWaypointsCreated={handleRouteWaypointsCreated}
        />

        <HybridTacticalMap 
          assets={allAssets}
          lanes={activeLanes || []}
          annotations={mapAnnotations || []}
          onAssetClick={(asset) => {
            addLogEntry('info', 'Asset Selected', `Viewing details for ${asset.callsign}`)
          }}
          onDispatchAsset={handleDispatchAsset}
          onCreateLane={handleCreateLane}
          onCreateAnnotation={handleCreateAnnotation}
          onDeleteAnnotation={handleDeleteAnnotation}
        />

        <EquipmentDeploymentDialog
          open={deployDialogOpen}
          onOpenChange={setDeployDialogOpen}
          availableEquipment={equipment || []}
          assets={allAssets}
          preselectedLocation={deployLocation}
          onDeploy={(itemId, deployData) => {
            setEquipment((current) => {
              return (current || []).map(item => {
                if (item.id === itemId) {
                  const updatedItem: EquipmentItem = {
                    ...item,
                    status: 'deployed',
                    ...deployData,
                    deployedAt: Date.now(),
                    history: [
                      ...item.history,
                      {
                        timestamp: Date.now(),
                        action: 'deployed',
                        performedBy: agentCallsign || 'SHADOW-7',
                        details: `Deployed to ${deployData.assignedToType}: ${deployData.assignedToName}`,
                        location: {
                          gridX: deployData.gridX,
                          gridY: deployData.gridY,
                          latitude: deployData.latitude,
                          longitude: deployData.longitude
                        }
                      }
                    ]
                  }
                  handleEquipmentDeployed(updatedItem)
                  return updatedItem
                }
                return item
              })
            })
          }}
        />

        <GeographicMap 
          assets={allAssets}
          lanes={activeLanes || []}
          onAssetClick={(asset) => {
            addLogEntry('info', 'Asset Selected', `Viewing details for ${asset.callsign}`)
          }}
        />

        <GlobalAssetMap 
          assets={allAssets}
          onDispatchAsset={handleDispatchAsset}
          onCreateLane={handleCreateLane}
        />

        <GPSBreadcrumbTrail 
          trails={gpsTrails || []}
          onClearTrail={handleClearGPSTrail}
          onExportTrail={handleExportGPSTrail}
        />

        <Card className="border-primary/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target weight="bold" className="text-primary" size={16} />
              <span className="text-xs tracking-[0.08em] uppercase">AGENT ID</span>
            </div>
            <span className="text-sm font-bold">{agentCallsign}</span>
          </div>
          
          <Separator className="bg-border" />
          
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Mission</span>
              <Badge className={`${getThreatColor()} text-[9px] px-2 py-0`}>
                {missionData.threatLevel}
              </Badge>
            </div>
            <div className="text-sm font-medium">{missionData.name}</div>
            <div className="text-[10px] text-muted-foreground">{missionData.objective}</div>
            <div className="pt-2 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">PROGRESS</span>
                <span className="tabular-nums">{missionData.progress.toFixed(1)}%</span>
              </div>
              <Progress value={missionData.progress} className="h-1.5" />
            </div>
          </div>
        </Card>

        <Card className="border-primary/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Heart weight="bold" className="text-primary" size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Biometrics</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Heart Rate</div>
              <div className={`text-xl font-bold tabular-nums ${getHeartRateStatus()}`}>
                {Math.round(biometrics.heartRate)}
                <span className="text-xs ml-1">BPM</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Blood O₂</div>
              <div className="text-xl font-bold tabular-nums text-primary">
                {Math.round(biometrics.bloodOxygen)}
                <span className="text-xs ml-1">%</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Stress</div>
              <div className={`text-xl font-bold tabular-nums ${getStressStatus()}`}>
                {Math.round(biometrics.stressLevel)}
                <span className="text-xs ml-1">%</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Body Temp</div>
              <div className="text-xl font-bold tabular-nums text-primary">
                {biometrics.temperature.toFixed(1)}
                <span className="text-xs ml-1">°C</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-primary/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin weight="bold" className="text-primary" size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Location</span>
          </div>
          
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Coordinates</div>
              <div className="text-xs font-mono tabular-nums text-primary">
                {formatCoordinate(location.latitude, 6)}°N
              </div>
              <div className="text-xs font-mono tabular-nums text-primary">
                {formatCoordinate(Math.abs(location.longitude), 6)}°W
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="space-y-1">
                <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Speed</div>
                <div className="text-sm font-bold tabular-nums">{location.speed.toFixed(1)}</div>
                <div className="text-[9px] text-muted-foreground">m/s</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Distance</div>
                <div className="text-sm font-bold tabular-nums">{location.distance.toFixed(2)}</div>
                <div className="text-[9px] text-muted-foreground">km</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Elevation</div>
                <div className="text-sm font-bold tabular-nums">{Math.round(location.elevation)}</div>
                <div className="text-[9px] text-muted-foreground">m</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-primary/30 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <RadioButton weight="bold" className={isTransmitting ? 'text-primary pulse-signal' : 'text-muted-foreground'} size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Transmission</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <WifiHigh weight="bold" className="text-primary" size={12} />
                <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Signal</div>
              </div>
              <div className="text-lg font-bold tabular-nums">{Math.round(signalStrength)}%</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <BatteryFull weight="bold" className={batteryLevel < 20 ? 'text-destructive' : 'text-primary'} size={12} />
                <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Power</div>
              </div>
              <div className="text-lg font-bold tabular-nums">{Math.round(batteryLevel)}%</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Lock weight="bold" className="text-primary" size={12} />
                <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Secure</div>
              </div>
              <div className="text-lg font-bold">AES</div>
            </div>
          </div>
          
          <Button
            onClick={() => setIsTransmitting((prev) => !prev)}
            className={`w-full font-bold tracking-wider ${
              isTransmitting 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {isTransmitting ? '● TRANSMITTING' : '○ OFFLINE'}
          </Button>
          
          {isTransmitting && (
            <div className="text-[10px] text-center text-primary animate-pulse">
              DATA STREAM ACTIVE - ALL TELEMETRY BROADCASTING
            </div>
          )}
        </Card>

        <OperationsFeed 
          entries={opsFeedEntries || []} 
          currentAgentId={agentId || 'shadow-7-alpha'} 
          maxHeight="300px"
          readEntries={new Set(readOpsFeedEntries || [])}
          onMarkAsRead={handleMarkOpsFeedAsRead}
        />

        <AnnotationAcknowledgmentTracker
          annotations={mapAnnotations || []}
          currentAgentId={agentId || 'shadow-7-alpha'}
          currentAgentCallsign={agentCallsign || 'SHADOW-7'}
          onAcknowledge={handleAcknowledgeAnnotation}
          maxHeight="350px"
        />

        <BroadcastAcknowledgmentTracker 
          broadcasts={trackedBroadcasts || []}
          maxHeight="400px"
        />

        <MissionLog entries={logEntries || []} maxHeight="350px" />

        <CommunicationsLog
          logs={commLogs || []}
          maxHeight="400px"
          onExport={() => {
            addLogEntry('info', 'Comms Log Exported', `${commLogs?.length || 0} communications exported`)
          }}
        />

        <TacticalChecklist
          checklists={checklists || []}
          currentUser={agentCallsign || 'SHADOW-7'}
          maxHeight="500px"
          onToggleItem={handleToggleChecklistItem}
          onAddChecklist={handleAddChecklist}
          onDeleteChecklist={handleDeleteChecklist}
        />

        <EnvironmentalData
          latitude={location.latitude}
          longitude={location.longitude}
        />

        <AfterActionReport
          missionName={missionData.name}
          missionObjective={missionData.objective}
          startTime={missionData.startTime}
          endTime={missionData.progress >= 100 ? Date.now() : undefined}
          logEntries={logEntries || []}
          opsFeedEntries={opsFeedEntries || []}
          assets={allAssets}
          agentCallsign={agentCallsign || 'SHADOW-7'}
        />

        <HistoricalLogViewer 
          entries={logEntries || []} 
          onDeleteEntries={handleDeleteEntries}
          onArchiveEntries={handleArchiveEntries}
          onTagEntries={handleTagEntries}
          onAddNote={handleAddNote}
        />

        {batteryLevel < 20 && (
          <Card className="border-destructive bg-destructive/10 p-3">
            <div className="flex items-center gap-2">
              <WarningCircle weight="bold" className="text-destructive" size={16} />
              <div className="text-xs">
                <div className="font-bold text-destructive">LOW POWER WARNING</div>
                <div className="text-[10px] text-muted-foreground">Enable conservation mode recommended</div>
              </div>
            </div>
          </Card>
        )}

        {biometrics.stressLevel > 80 && (
          <Card className="border-accent bg-accent/10 p-3">
            <div className="flex items-center gap-2">
              <WarningCircle weight="bold" className="text-accent" size={16} />
              <div className="text-xs">
                <div className="font-bold text-accent">ELEVATED STRESS DETECTED</div>
                <div className="text-[10px] text-muted-foreground">Recommend tactical breathing exercises</div>
              </div>
            </div>
          </Card>
        )}

        <div className="text-center text-[9px] text-muted-foreground tracking-wider pb-4 opacity-50">
          ░ CLASSIFIED - FOR AUTHORIZED PERSONNEL ONLY ░
        </div>
        </div>
      </div>
    </>
  )
}

export default App
