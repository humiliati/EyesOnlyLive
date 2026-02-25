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

export interface MConsoleBroadcast {
  type: 'scenario-deploy' | 'lane-update' | 'dispatch-command' | 'm-ping' | 'ops-update'
  payload: any
  timestamp: number
  broadcastBy: string
  targetAgents?: string[]
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
    targetAgents?: string[]
  ): Promise<void> {
    const broadcast: MConsoleBroadcast = {
      type,
      payload,
      timestamp: Date.now(),
      broadcastBy,
      targetAgents
    }

    const key = `${this.kvPrefix}:broadcast:${broadcast.timestamp}-${Math.random().toString(36).substr(2, 9)}`
    await window.spark.kv.set(key, broadcast)
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
}

export const mConsoleSync = new MConsoleSync()
