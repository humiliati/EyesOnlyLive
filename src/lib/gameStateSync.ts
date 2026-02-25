import type { AssetLocation } from '@/components/GlobalAssetMap'
import type { PingMessage } from '@/components/MPing'

export interface GameState {
  frozen: boolean
  freezeReason?: string
  freezeInitiatedBy?: string
  freezeTimestamp?: number
  emergencyPanicActive: boolean
  panicInitiatedBy?: string
  panicTimestamp?: number
}

export interface PlayerTelemetry {
  playerId: string
  playerCallsign: string
  playerTeam: 'red' | 'blue'
  latitude: number
  longitude: number
  altitude: number
  speed: number
  heading: number
  heartRate: number
  bloodOxygen: number
  stressLevel: number
  temperature: number
  lastUpdate: number
}

export interface UnacknowledgedPing {
  pingId: string
  targetAgentId: string
  targetCallsign: string
  issuedAt: number
  timeoutMs: number
  acknowledged: boolean
}

export type GameStateEventHandler = (state: GameState) => void
export type TelemetryEventHandler = (telemetry: PlayerTelemetry) => void
export type PingStatusEventHandler = (ping: UnacknowledgedPing) => void

class GameStateSync {
  private kvPrefix = 'game-state-sync'
  private gameStateHandlers: Set<GameStateEventHandler> = new Set()
  private telemetryHandlers: Set<TelemetryEventHandler> = new Set()
  private pingStatusHandlers: Set<PingStatusEventHandler> = new Set()
  private syncInterval: number | null = null
  private lastSyncTimestamp: number = 0

  startSync(pollIntervalMs: number = 1000): void {
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

  onGameStateChange(handler: GameStateEventHandler): () => void {
    this.gameStateHandlers.add(handler)
    return () => {
      this.gameStateHandlers.delete(handler)
    }
  }

  onTelemetryUpdate(handler: TelemetryEventHandler): () => void {
    this.telemetryHandlers.add(handler)
    return () => {
      this.telemetryHandlers.delete(handler)
    }
  }

  onPingStatusChange(handler: PingStatusEventHandler): () => void {
    this.pingStatusHandlers.add(handler)
    return () => {
      this.pingStatusHandlers.delete(handler)
    }
  }

  private async checkForUpdates(): Promise<void> {
    try {
      const state = await this.getGameState()
      this.gameStateHandlers.forEach(handler => handler(state))

      const telemetryUpdates = await this.getRecentTelemetry()
      telemetryUpdates.forEach(telemetry => {
        this.telemetryHandlers.forEach(handler => handler(telemetry))
      })

      const overduePings = await this.getOverduePings()
      overduePings.forEach(ping => {
        this.pingStatusHandlers.forEach(handler => handler(ping))
      })
    } catch (error) {
      console.error('[GameStateSync] Failed to check for updates:', error)
    }
  }

  async getGameState(): Promise<GameState> {
    const state = await window.spark.kv.get<GameState>(`${this.kvPrefix}:game-state`)
    return state || {
      frozen: false,
      emergencyPanicActive: false
    }
  }

  async setGameState(state: GameState): Promise<void> {
    await window.spark.kv.set(`${this.kvPrefix}:game-state`, state)
  }

  async freezeGame(reason: string, initiatedBy: string): Promise<void> {
    const state: GameState = {
      frozen: true,
      freezeReason: reason,
      freezeInitiatedBy: initiatedBy,
      freezeTimestamp: Date.now(),
      emergencyPanicActive: false
    }
    await this.setGameState(state)
  }

  async unfreezeGame(): Promise<void> {
    const state: GameState = {
      frozen: false,
      emergencyPanicActive: false
    }
    await this.setGameState(state)
  }

  async triggerEmergencyPanic(initiatedBy: string): Promise<void> {
    const state: GameState = {
      frozen: true,
      freezeReason: 'EMERGENCY PANIC BUTTON ACTIVATED',
      freezeInitiatedBy: initiatedBy,
      freezeTimestamp: Date.now(),
      emergencyPanicActive: true,
      panicInitiatedBy: initiatedBy,
      panicTimestamp: Date.now()
    }
    await this.setGameState(state)
  }

  async publishTelemetry(telemetry: PlayerTelemetry): Promise<void> {
    const key = `${this.kvPrefix}:telemetry:${telemetry.playerId}`
    await window.spark.kv.set(key, telemetry)

    const timelineKey = `${this.kvPrefix}:telemetry-timeline:${Date.now()}-${telemetry.playerId}`
    await window.spark.kv.set(timelineKey, telemetry)
  }

  async getTelemetry(playerId: string): Promise<PlayerTelemetry | null> {
    const key = `${this.kvPrefix}:telemetry:${playerId}`
    return await window.spark.kv.get<PlayerTelemetry>(key) || null
  }

  async getAllTelemetry(): Promise<PlayerTelemetry[]> {
    const allKeys = await window.spark.kv.keys()
    const telemetryKeys = allKeys.filter((key: string) => 
      key.startsWith(`${this.kvPrefix}:telemetry:`) &&
      !key.includes('telemetry-timeline')
    )

    const telemetry: PlayerTelemetry[] = []

    for (const key of telemetryKeys) {
      const data = await window.spark.kv.get<PlayerTelemetry>(key)
      if (data) {
        telemetry.push(data)
      }
    }

    return telemetry.sort((a, b) => b.lastUpdate - a.lastUpdate)
  }

  async getRecentTelemetry(sinceTimestamp?: number): Promise<PlayerTelemetry[]> {
    const allTelemetry = await this.getAllTelemetry()
    const cutoff = sinceTimestamp || this.lastSyncTimestamp
    return allTelemetry.filter(t => t.lastUpdate > cutoff)
  }

  async recordPing(ping: UnacknowledgedPing): Promise<void> {
    const key = `${this.kvPrefix}:ping:${ping.pingId}`
    await window.spark.kv.set(key, ping)
  }

  async acknowledgePing(pingId: string): Promise<void> {
    const key = `${this.kvPrefix}:ping:${pingId}`
    const ping = await window.spark.kv.get<UnacknowledgedPing>(key)
    if (ping) {
      ping.acknowledged = true
      await window.spark.kv.set(key, ping)
    }
  }

  async getOverduePings(): Promise<UnacknowledgedPing[]> {
    const allKeys = await window.spark.kv.keys()
    const pingKeys = allKeys.filter((key: string) => key.startsWith(`${this.kvPrefix}:ping:`))

    const overduePings: UnacknowledgedPing[] = []
    const now = Date.now()

    for (const key of pingKeys) {
      const ping = await window.spark.kv.get<UnacknowledgedPing>(key)
      if (ping && !ping.acknowledged && (now - ping.issuedAt) > ping.timeoutMs) {
        overduePings.push(ping)
      }
    }

    return overduePings
  }

  async getActivePings(): Promise<UnacknowledgedPing[]> {
    const allKeys = await window.spark.kv.keys()
    const pingKeys = allKeys.filter((key: string) => key.startsWith(`${this.kvPrefix}:ping:`))

    const activePings: UnacknowledgedPing[] = []

    for (const key of pingKeys) {
      const ping = await window.spark.kv.get<UnacknowledgedPing>(key)
      if (ping && !ping.acknowledged) {
        activePings.push(ping)
      }
    }

    return activePings.sort((a, b) => a.issuedAt - b.issuedAt)
  }

  async clearOldPings(olderThanMs: number = 60 * 60 * 1000): Promise<void> {
    const cutoffTime = Date.now() - olderThanMs
    const allKeys = await window.spark.kv.keys()
    const pingKeys = allKeys.filter((key: string) => key.startsWith(`${this.kvPrefix}:ping:`))

    for (const key of pingKeys) {
      const ping = await window.spark.kv.get<UnacknowledgedPing>(key)
      if (ping && ping.issuedAt < cutoffTime) {
        await window.spark.kv.delete(key)
      }
    }
  }

  async clearOldTelemetry(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    const cutoffTime = Date.now() - olderThanMs
    const allKeys = await window.spark.kv.keys()
    const timelineKeys = allKeys.filter((key: string) => key.startsWith(`${this.kvPrefix}:telemetry-timeline:`))

    for (const key of timelineKeys) {
      const parts = key.split(':')
      if (parts.length >= 3) {
        const timestamp = parseInt(parts[2].split('-')[0])
        if (timestamp < cutoffTime) {
          await window.spark.kv.delete(key)
        }
      }
    }
  }

  async getGameStateForFlapsAndSeals(): Promise<{
    lootTableMultiplier: number
    dropRateMultiplier: number
    overduePingCount: number
    gameMode: 'normal' | 'degraded' | 'critical'
  }> {
    const overduePings = await this.getOverduePings()
    const overdueCount = overduePings.length

    let lootTableMultiplier = 1.0
    let dropRateMultiplier = 1.0
    let gameMode: 'normal' | 'degraded' | 'critical' = 'normal'

    if (overdueCount >= 5) {
      gameMode = 'critical'
      lootTableMultiplier = 0.3
      dropRateMultiplier = 0.2
    } else if (overdueCount >= 3) {
      gameMode = 'degraded'
      lootTableMultiplier = 0.6
      dropRateMultiplier = 0.5
    } else if (overdueCount >= 1) {
      lootTableMultiplier = 0.85
      dropRateMultiplier = 0.8
    }

    return {
      lootTableMultiplier,
      dropRateMultiplier,
      overduePingCount: overdueCount,
      gameMode
    }
  }
}

export const gameStateSync = new GameStateSync()
