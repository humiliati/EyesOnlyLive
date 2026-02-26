import type { AssetLocation, ActiveLane } from '@/components/GlobalAssetMap'
import type { OpsFeedEntry } from '@/components/OperationsFeed'
import type { PatrolRoute } from '@/components/PatrolRouteTemplates'
import type { MapAnnotation, AnnotationAcknowledgment } from '@/components/HybridTacticalMap'

export interface ScenarioDeployment {
  id: string
  name: string
  description: string
  deployedAt: number
  deployedBy: string
  lanes: Omit<ActiveLane, 'id' | 'createdAt'>[]
  assetPositions: Array<{
    agentId: string
    gridX: number
    gridY: number
  }>
  briefing?: string
  objectiveList?: string[]
  threatLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
}

export interface PatrolRouteDeployment {
  route: PatrolRoute
  assignedAgents: string[]
  deployedBy: string
  startTime?: number
  priority: 'low' | 'normal' | 'high' | 'critical'
}

export interface AnnotationBroadcast {
  action: 'create' | 'update' | 'delete'
  annotation?: MapAnnotation
  annotationId?: string
  timestamp: number
  broadcastBy: string
}

export interface LaneUpdate {
  action: 'create' | 'update' | 'delete' | 'complete' | 'compromise'
  laneId?: string
  lane?: Partial<ActiveLane>
  timestamp: number
  updatedBy: string
}

export interface DispatchCommand {
  assetId: string
  targetGrid: { x: number; y: number }
  directive: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  issuedBy: string
  timestamp: number
}

export interface BroadcastAcknowledgment {
  broadcastId: string
  agentId: string
  agentCallsign: string
  acknowledgedAt: number
  response: 'acknowledged' | 'unable' | 'negative'
  responseMessage?: string
  receivedAt: number
}

export interface MConsoleBroadcast {
  id: string
  type: 'scenario-deploy' | 'lane-update' | 'dispatch-command' | 'm-ping' | 'ops-update' | 'general' | 'patrol-route-deploy' | 'annotation-update'
  payload: any
  timestamp: number
  broadcastBy: string
  targetAgents?: string[]
  requiresAck?: boolean
  autoExpireMs?: number
}

export type SyncEventHandler = (broadcast: MConsoleBroadcast) => void

class MConsoleSync {
  private kvPrefix = 'm-console-sync'
  private eventHandlers: Set<SyncEventHandler> = new Set()
  private syncInterval: number | null = null
  private lastSyncTimestamp: number = 0

  private get _eyesOnlyBaseUrl(): string | null {
    return (window as any).__EYESONLY_BASE_URL__ || null
  }
  private get _mToken(): string | null {
    return (window as any).__EYESONLY_M_TOKEN__ || null
  }
  private get _scenarioId(): number {
    return parseInt(String((window as any).__EYESONLY_SCENARIO_ID__ || '1'), 10) || 1
  }

  private async _mFetch(path: string, opts: RequestInit = {}): Promise<Response> {
    const base = this._eyesOnlyBaseUrl
    const token = this._mToken
    if (!base || !token) throw new Error('Missing EyesOnly director session (baseUrl/token)')
    return fetch(`${base}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(opts.headers || {}),
      },
    })
  }

  startSync(pollIntervalMs: number = 2000): void {
    if (this.syncInterval) {
      this.stopSync()
    }

    this.syncInterval = window.setInterval(() => {
      this.checkForUpdates()
    }, pollIntervalMs)

    this.checkForUpdates()
  }

  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  onBroadcast(handler: SyncEventHandler): () => void {
    this.eventHandlers.add(handler)
    return () => {
      this.eventHandlers.delete(handler)
    }
  }

  private async checkForUpdates(): Promise<void> {
    try {
      const broadcasts = await this.fetchBroadcastsSince(this.lastSyncTimestamp)
      
      if (broadcasts.length > 0) {
        broadcasts.forEach(broadcast => {
          this.eventHandlers.forEach(handler => {
            handler(broadcast)
          })
        })

        this.lastSyncTimestamp = Math.max(...broadcasts.map(b => b.timestamp))
      }
    } catch (error) {
      console.error('[MConsoleSync] Failed to check for updates:', error)
    }
  }

  private async fetchBroadcastsSince(timestamp: number): Promise<MConsoleBroadcast[]> {
    // Prefer live EyesOnly M events when director session is present.
    if (this._eyesOnlyBaseUrl && this._mToken) {
      const res = await this._mFetch(`/api/m/events/${this._scenarioId}?limit=120`)
      if (!res.ok) throw new Error(`EyesOnly events fetch failed (${res.status})`)
      const data = await res.json().catch(() => ({} as any)) as any
      const events = Array.isArray(data?.events) ? data.events : (Array.isArray(data) ? data : [])

      const mapped: MConsoleBroadcast[] = events.map((ev: any) => {
        const ts = ev.created_at ? new Date(ev.created_at).getTime() : (ev.timestamp || ev.createdAt || Date.now())
        const type = (ev.event_type || ev.type || 'general') as any
        return {
          id: String(ev.id || ev.event_id || `${ts}-${Math.random().toString(36).slice(2)}`),
          type,
          payload: ev.payload || ev.data || {},
          timestamp: ts,
          broadcastBy: String(ev.actor_callsign || ev.from || ev.created_by || 'M'),
        }
      })

      return mapped
        .filter((b) => b.timestamp > timestamp)
        .sort((a, b) => a.timestamp - b.timestamp)
    }

    // Fallback: Spark KV simulation
    const allKeys = await window.spark.kv.keys()
    const broadcastKeys = allKeys.filter((key: string) => key.startsWith(`${this.kvPrefix}:broadcast:`))

    const broadcasts: MConsoleBroadcast[] = []

    for (const key of broadcastKeys) {
      const broadcast = await window.spark.kv.get<MConsoleBroadcast>(key)
      if (broadcast && broadcast.timestamp > timestamp) {
        broadcasts.push(broadcast)
      }
    }

    return broadcasts.sort((a, b) => a.timestamp - b.timestamp)
  }

  async publishBroadcast(
    type: MConsoleBroadcast['type'],
    payload: any,
    broadcastBy: string,
    targetAgents?: string[],
    requiresAck: boolean = false,
    autoExpireMs?: number
  ): Promise<string> {
    // Prefer real EyesOnly event injection when director session is present.
    if (this._eyesOnlyBaseUrl && this._mToken) {
      const res = await this._mFetch('/api/m/event', {
        method: 'POST',
        body: JSON.stringify({
          event_type: type,
          payload: {
            ...payload,
            _ey: { broadcastBy, targetAgents, requiresAck, autoExpireMs },
          },
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({} as any)) as any
        throw new Error(d?.message || `EyesOnly event inject failed (${res.status})`)
      }
      const d = await res.json().catch(() => ({} as any)) as any
      return String(d?.event?.id || d?.id || `event-${Date.now()}`)
    }

    // Fallback: Spark KV simulation
    const broadcastId = `broadcast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const broadcast: MConsoleBroadcast = {
      id: broadcastId,
      type,
      payload,
      timestamp: Date.now(),
      broadcastBy,
      targetAgents,
      requiresAck,
      autoExpireMs
    }

    const key = `${this.kvPrefix}:broadcast:${broadcast.timestamp}-${Math.random().toString(36).substr(2, 9)}`
    await window.spark.kv.set(key, broadcast)

    return broadcastId
  }

  async deployScenario(scenario: ScenarioDeployment, deployedBy: string): Promise<void> {
    await this.publishBroadcast('scenario-deploy', scenario, deployedBy)
  }

  async updateLane(update: LaneUpdate, updatedBy: string): Promise<void> {
    await this.publishBroadcast('lane-update', update, updatedBy)
  }

  async dispatchAsset(command: DispatchCommand, issuedBy: string): Promise<void> {
    await this.publishBroadcast('dispatch-command', command, issuedBy, [command.assetId])
  }

  async broadcastMPing(
    message: string,
    priority: 'low' | 'normal' | 'high' | 'critical',
    targetAgents: string[],
    issuedBy: string
  ): Promise<void> {
    await this.publishBroadcast('m-ping', { message, priority }, issuedBy, targetAgents)
  }

  async broadcastOpsUpdate(entry: OpsFeedEntry, issuedBy: string): Promise<void> {
    await this.publishBroadcast('ops-update', entry, issuedBy)
  }

  async getRecentBroadcasts(limit: number = 50): Promise<MConsoleBroadcast[]> {
    const broadcasts = await this.fetchBroadcastsSince(0)
    return broadcasts.slice(-limit)
  }

  async clearOldBroadcasts(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    const cutoffTime = Date.now() - olderThanMs
    const allKeys = await window.spark.kv.keys()
    const broadcastKeys = allKeys.filter((key: string) => key.startsWith(`${this.kvPrefix}:broadcast:`))
    
    for (const key of broadcastKeys) {
      const broadcast = await window.spark.kv.get<MConsoleBroadcast>(key)
      if (broadcast && broadcast.timestamp < cutoffTime) {
        await window.spark.kv.delete(key)
      }
    }
  }

  async getActiveScenario(): Promise<ScenarioDeployment | null> {
    return await window.spark.kv.get<ScenarioDeployment>(`${this.kvPrefix}:active-scenario`) || null
  }

  async setActiveScenario(scenario: ScenarioDeployment | null): Promise<void> {
    if (scenario) {
      await window.spark.kv.set(`${this.kvPrefix}:active-scenario`, scenario)
    } else {
      await window.spark.kv.delete(`${this.kvPrefix}:active-scenario`)
    }
  }

  async getSharedLanes(): Promise<ActiveLane[]> {
    return await window.spark.kv.get<ActiveLane[]>(`${this.kvPrefix}:shared-lanes`) || []
  }

  async setSharedLanes(lanes: ActiveLane[]): Promise<void> {
    await window.spark.kv.set(`${this.kvPrefix}:shared-lanes`, lanes)
  }

  async getSharedAssetPositions(): Promise<AssetLocation[]> {
    return await window.spark.kv.get<AssetLocation[]>(`${this.kvPrefix}:shared-assets`) || []
  }

  async setSharedAssetPositions(assets: AssetLocation[]): Promise<void> {
    await window.spark.kv.set(`${this.kvPrefix}:shared-assets`, assets)
  }

  isRelevantBroadcast(broadcast: MConsoleBroadcast, agentId: string): boolean {
    if (!broadcast.targetAgents || broadcast.targetAgents.length === 0) {
      return true
    }
    return broadcast.targetAgents.includes(agentId)
  }

  async recordAcknowledgment(ack: BroadcastAcknowledgment): Promise<void> {
    const key = `${this.kvPrefix}:ack:${ack.broadcastId}:${ack.agentId}`
    await window.spark.kv.set(key, ack)
  }

  async getAcknowledgments(broadcastId: string): Promise<BroadcastAcknowledgment[]> {
    const allKeys = await window.spark.kv.keys()
    const ackKeys = allKeys.filter((key: string) => 
      key.startsWith(`${this.kvPrefix}:ack:${broadcastId}:`)
    )
    
    const acks: BroadcastAcknowledgment[] = []
    
    for (const key of ackKeys) {
      const ack = await window.spark.kv.get<BroadcastAcknowledgment>(key)
      if (ack) {
        acks.push(ack)
      }
    }

    return acks.sort((a, b) => a.acknowledgedAt - b.acknowledgedAt)
  }

  async getAgentAcknowledgment(broadcastId: string, agentId: string): Promise<BroadcastAcknowledgment | null> {
    const key = `${this.kvPrefix}:ack:${broadcastId}:${agentId}`
    return await window.spark.kv.get<BroadcastAcknowledgment>(key) || null
  }

  async broadcastWithAck(
    type: MConsoleBroadcast['type'],
    payload: any,
    message: string,
    priority: 'low' | 'normal' | 'high' | 'critical',
    broadcastBy: string,
    targetAgents: string[],
    autoExpireMs?: number
  ): Promise<string> {
    const broadcastId = await this.publishBroadcast(
      type,
      { ...payload, message, priority },
      broadcastBy,
      targetAgents,
      true,
      autoExpireMs
    )

    const trackedKey = `${this.kvPrefix}:tracked:${broadcastId}`
    await window.spark.kv.set(trackedKey, {
      id: broadcastId,
      type,
      message,
      priority,
      issuedBy: broadcastBy,
      issuedAt: Date.now(),
      targetAgents,
      requiresAck: true,
      autoExpireMs
    })

    return broadcastId
  }

  async getTrackedBroadcasts(): Promise<any[]> {
    const allKeys = await window.spark.kv.keys()
    const trackedKeys = allKeys.filter((key: string) => 
      key.startsWith(`${this.kvPrefix}:tracked:`)
    )
    
    const broadcasts: any[] = []
    
    for (const key of trackedKeys) {
      const broadcast = await window.spark.kv.get<any>(key)
      if (broadcast) {
        const acknowledgments = await this.getAcknowledgments(broadcast.id)
        broadcasts.push({
          ...broadcast,
          acknowledgments
        })
      }
    }

    return broadcasts.sort((a, b) => b.issuedAt - a.issuedAt)
  }

  async deleteTrackedBroadcast(broadcastId: string): Promise<void> {
    const trackedKey = `${this.kvPrefix}:tracked:${broadcastId}`
    await window.spark.kv.delete(trackedKey)

    const allKeys = await window.spark.kv.keys()
    const ackKeys = allKeys.filter((key: string) => 
      key.startsWith(`${this.kvPrefix}:ack:${broadcastId}:`)
    )
    
    for (const key of ackKeys) {
      await window.spark.kv.delete(key)
    }
  }

  async broadcastAnnotation(
    action: 'create' | 'update' | 'delete',
    annotation: MapAnnotation | undefined,
    annotationId: string | undefined,
    broadcastBy: string
  ): Promise<void> {
    const broadcast: AnnotationBroadcast = {
      action,
      annotation,
      annotationId,
      timestamp: Date.now(),
      broadcastBy
    }
    await this.publishBroadcast('annotation-update', broadcast, broadcastBy)
  }

  async getSharedAnnotations(): Promise<MapAnnotation[]> {
    return await window.spark.kv.get<MapAnnotation[]>(`${this.kvPrefix}:shared-annotations`) || []
  }

  async setSharedAnnotations(annotations: MapAnnotation[]): Promise<void> {
    await window.spark.kv.set(`${this.kvPrefix}:shared-annotations`, annotations)
  }

  async recordAnnotationAcknowledgment(ack: AnnotationAcknowledgment): Promise<void> {
    const key = `${this.kvPrefix}:annotation-ack:${ack.annotationId}:${ack.agentId}`
    await window.spark.kv.set(key, ack)

    const sharedAnnotations = await this.getSharedAnnotations()
    const updatedAnnotations = sharedAnnotations.map(annotation => {
      if (annotation.id === ack.annotationId) {
        const existingAcks = annotation.acknowledgments || []
        const filteredAcks = existingAcks.filter(a => a.agentId !== ack.agentId)
        return {
          ...annotation,
          acknowledgments: [...filteredAcks, ack]
        }
      }
      return annotation
    })
    
    await this.setSharedAnnotations(updatedAnnotations)
  }

  async getAnnotationAcknowledgments(annotationId: string): Promise<AnnotationAcknowledgment[]> {
    const allKeys = await window.spark.kv.keys()
    const ackKeys = allKeys.filter((key: string) => 
      key.startsWith(`${this.kvPrefix}:annotation-ack:${annotationId}:`)
    )
    
    const acks: AnnotationAcknowledgment[] = []
    
    for (const key of ackKeys) {
      const ack = await window.spark.kv.get<AnnotationAcknowledgment>(key)
      if (ack) {
        acks.push(ack)
      }
    }

    return acks.sort((a, b) => a.acknowledgedAt - b.acknowledgedAt)
  }

  async getAgentAnnotationAcknowledgment(annotationId: string, agentId: string): Promise<AnnotationAcknowledgment | null> {
    const key = `${this.kvPrefix}:annotation-ack:${annotationId}:${agentId}`
    return await window.spark.kv.get<AnnotationAcknowledgment>(key) || null
  }

  async broadcastAnnotationWithAck(
    annotation: MapAnnotation,
    broadcastBy: string,
    targetAgents: string[],
    autoExpireMs?: number
  ): Promise<string> {
    const annotationWithAck = {
      ...annotation,
      requiresAck: true
    }

    const broadcastId = await this.publishBroadcast(
      'annotation-update',
      {
        action: 'create',
        annotation: annotationWithAck,
        timestamp: Date.now(),
        broadcastBy
      },
      broadcastBy,
      targetAgents,
      true,
      autoExpireMs
    )

    const sharedAnnotations = await this.getSharedAnnotations()
    await this.setSharedAnnotations([...sharedAnnotations, annotationWithAck])

    return broadcastId
  }
}

export const mConsoleSync = new MConsoleSync()
