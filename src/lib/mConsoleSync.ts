import type { AssetLocation, ActiveLane } from '@/components/GlobalAssetMap'
import type { OpsFeedEntry } from '@/components/OperationsFeed'

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
  type: 'scenario-deploy' | 'lane-update' | 'dispatch-command' | 'm-ping' | 'ops-update' | 'general'
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
}

export const mConsoleSync = new MConsoleSync()
