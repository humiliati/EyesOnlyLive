import { useState, useEffect, useCallback, useRef } from 'react'
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
import { GPSBreadcrumbTrail, type AssetTrail, type GPSCoordinate } from '@/components/GPSBreadcrumbTrail'
import { ScenarioCreator } from '@/components/ScenarioCreator'
import { BroadcastAcknowledgmentTracker, type TrackedBroadcast, type BroadcastAcknowledgment } from '@/components/BroadcastAcknowledgment'
import { soundGenerator } from '@/lib/sounds'
import { mConsoleSync, type MConsoleBroadcast } from '@/lib/mConsoleSync'
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
  Desktop
} from '@phosphor-icons/react'

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
  const previousOpsFeedLengthRef = useRef<number>(0)

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
  }, [addOpsFeedEntry, addLogEntry, agentCallsign, agentId])

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
    }
  }, [agentId, addLogEntry, setMissionData, setActiveLanes, setAssetLocations, setCurrentPing, addOpsFeedEntry])

  useEffect(() => {
    mConsoleSync.startSync(3000)
    
    const unsubscribe = mConsoleSync.onBroadcast(handleBroadcastReceived)
    syncUnsubscribeRef.current = unsubscribe

    return () => {
      mConsoleSync.stopSync()
      if (syncUnsubscribeRef.current) {
        syncUnsubscribeRef.current()
      }
    }
  }, [handleBroadcastReceived])

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
      }
    }, 45000 + Math.random() * 30000)

    return () => clearInterval(pingInterval)
  }, [currentPing, setCurrentPing, addLogEntry])

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
      setBiometrics((prev) => ({
        heartRate: Math.max(60, Math.min(180, prev.heartRate + (Math.random() - 0.5) * 5)),
        bloodOxygen: Math.max(90, Math.min(100, prev.bloodOxygen + (Math.random() - 0.5) * 2)),
        stressLevel: Math.max(0, Math.min(100, prev.stressLevel + (Math.random() - 0.5) * 8)),
        temperature: Math.max(36.0, Math.min(38.5, prev.temperature + (Math.random() - 0.5) * 0.2))
      }))
    }, 2500)

    const locInterval = setInterval(() => {
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
  }, [setMissionData])

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
          <ScenarioCreator
            assets={assetLocations || []}
            onScenarioDeployed={(scenario) => {
              addLogEntry('mission', 'Scenario Deployed', `${scenario.name} deployed by M console`)
            }}
          />
        )}

        <SituationPanel 
          missionProgress={missionData.progress}
          threatLevel={missionData.threatLevel}
          unreadAlerts={(opsFeedEntries || []).filter(e => !(readOpsFeedEntries || []).includes(e.id) && e.agentId !== agentId).length}
          teamSize={4}
          biometricStatus={getBiometricStatus()}
        />

        <MPing ping={currentPing || null} onAcknowledge={handleAcknowledgePing} />

        <PanicButton 
          agentCallsign={agentCallsign || 'SHADOW-7'} 
          agentId={agentId || 'shadow-7-alpha'} 
          onSOSBroadcast={handleSOSBroadcast}
        />

        <QuickResponse onSendResponse={handleQuickResponse} agentCallsign={agentCallsign || 'SHADOW-7'} />

        <StatusUpdate onStatusUpdate={handleStatusUpdate} agentCallsign={agentCallsign || 'SHADOW-7'} />

        <GlobalAssetMap 
          assets={assetLocations || []}
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

        <BroadcastAcknowledgmentTracker 
          broadcasts={trackedBroadcasts || []}
          maxHeight="400px"
        />

        <MissionLog entries={logEntries || []} maxHeight="350px" />

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
