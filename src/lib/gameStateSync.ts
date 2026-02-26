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

  private ws: WebSocket | null = null
  private wsRetryMs: number = 1500
  private wsRetryTimer: number | null = null
  private lastWsRefreshAt: number = 0

  private get _eyesOnlyBaseUrl(): string | null {
    return (window as any).__EYESONLY_BASE_URL__ || null
  }
  private get _mToken(): string | null {
    return (window as any).__EYESONLY_M_TOKEN__ || null
  }
  private get _opsToken(): string | null {
    return (window as any).__EYESONLY_OPS_TOKEN__ || null
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

  private async _opsFetch(path: string, opts: RequestInit = {}): Promise<Response> {
    const base = this._eyesOnlyBaseUrl
    const token = this._opsToken
    if (!base || !token) throw new Error('Missing EyesOnly ops session (baseUrl/token)')
    return fetch(`${base}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(opts.headers || {}),
      },
    })
  }

  private get _usingEyesOnlyM(): boolean {
    return !!(this._eyesOnlyBaseUrl && this._mToken)
  }

  private get _usingEyesOnlyOps(): boolean {
    return !!(this._eyesOnlyBaseUrl && this._opsToken)
  }

  startSync(pollIntervalMs: number = 1000): void {
    if (this.syncInterval) {
      this.stopSync()
    }

    // EyesOnly mode: prefer WebSocket-driven refresh + slower polling fallback.
    if (this._usingEyesOnlyM || this._usingEyesOnlyOps) {
      this._startWs()
      const slowMs = Math.max(2500, pollIntervalMs)
      this.syncInterval = window.setInterval(() => {
        this.checkForUpdates()
      }, slowMs)
      this.checkForUpdates()
      return
    }

    // Spark KV fallback polling
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

    if (this.wsRetryTimer) {
      clearTimeout(this.wsRetryTimer)
      this.wsRetryTimer = null
    }

    if (this.ws) {
      try { this.ws.onopen = null; this.ws.onclose = null; this.ws.onmessage = null; this.ws.onerror = null } catch {}
      try { this.ws.close() } catch {}
      this.ws = null
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

  private _startWs(): void {
    if (!(this._usingEyesOnlyM || this._usingEyesOnlyOps)) return
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return

    const base = this._eyesOnlyBaseUrl!
    const isOps = this._usingEyesOnlyOps && !this._usingEyesOnlyM
    const token = isOps ? this._opsToken! : this._mToken!
    const path = isOps ? '/api/ops/ws' : '/api/m/ws'
    const wsUrl = base.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:') + `${path}?token=${encodeURIComponent(token)}`

    try {
      this.ws = new WebSocket(wsUrl)
    } catch (e) {
      this._scheduleWsRetry()
      return
    }

    this.ws.onopen = () => {
      this.wsRetryMs = 1500
    }

    this.ws.onclose = () => {
      this.ws = null
      this._scheduleWsRetry()
    }

    this.ws.onerror = () => {
      // onclose will handle retry
    }

    this.ws.onmessage = (ev) => {
      // Any realtime message means the world changed; refresh state.
      const now = Date.now()
      if (now - this.lastWsRefreshAt < 350) return
      this.lastWsRefreshAt = now
      this.checkForUpdates().catch(() => {})
    }
  }

  private _scheduleWsRetry(): void {
    if (this.wsRetryTimer) return
    const delay = this.wsRetryMs
    this.wsRetryMs = Math.min(15_000, Math.floor(this.wsRetryMs * 1.6))
    this.wsRetryTimer = window.setTimeout(() => {
      this.wsRetryTimer = null
      this._startWs()
    }, delay)
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
    if (this._usingEyesOnlyOps) {
      const res = await this._opsFetch('/api/ops/status')
      if (!res.ok) throw new Error(`EyesOnly ops status fetch failed (${res.status})`)
      const data = await res.json().catch(() => ({} as any)) as any
      return {
        frozen: !!data?.scenario?.frozen,
        freezeReason: data?.scenario?.frozen ? 'FROZEN' : undefined,
        emergencyPanicActive: false,
      }
    }

    if (this._usingEyesOnlyM) {
      // Frozen state is exposed on the grid cells response.
      const res = await this._mFetch(`/api/m/grid/${this._scenarioId}/cells`)
      if (!res.ok) throw new Error(`EyesOnly grid state fetch failed (${res.status})`)
      const data = await res.json().catch(() => ({} as any)) as any
      const frozen = !!data?.frozen

      // Best-effort: detect recent panic events from the event log.
      let emergencyPanicActive = false
      let panicInitiatedBy: string | undefined
      let panicTimestamp: number | undefined
      try {
        const evRes = await this._mFetch(`/api/m/events/${this._scenarioId}?limit=80`)
        if (evRes.ok) {
          const evData = await evRes.json().catch(() => ({} as any)) as any
          const events = Array.isArray(evData?.events) ? evData.events : []
          const panicEv = events.find((e: any) => e.event_type === 'actor_panic' || e.event_type === 'director_panic')
          if (panicEv) {
            const ts = panicEv.created_at ? new Date(panicEv.created_at).getTime() : Date.now()
            // treat last 2 hours as "active" for UI alerting
            if ((Date.now() - ts) < 2 * 60 * 60 * 1000) {
              emergencyPanicActive = true
              panicInitiatedBy = String(panicEv.payload?.callsign || panicEv.payload?.triggered_by || 'UNKNOWN')
              panicTimestamp = ts
            }
          }
        }
      } catch {}

      return {
        frozen,
        emergencyPanicActive,
        panicInitiatedBy,
        panicTimestamp,
      }
    }

    const state = await window.spark.kv.get<GameState>(`${this.kvPrefix}:game-state`)
    return state || {
      frozen: false,
      emergencyPanicActive: false
    }
  }

  async setGameState(state: GameState): Promise<void> {
    if (this._usingEyesOnlyOps) {
      // Ops cannot set scenario frozen state.
      return
    }

    if (this._usingEyesOnlyM) {
      // Only frozen is a first-class state toggle in EyesOnly.
      if (typeof state.frozen !== 'undefined') {
        await this._mFetch('/api/m/scenario/freeze', {
          method: 'POST',
          body: JSON.stringify({ scenario_id: this._scenarioId, frozen: !!state.frozen }),
        })
      }
      // Panic state: best-effort via event injection (does not replace actor panic).
      if (state.emergencyPanicActive) {
        await this._mFetch('/api/m/event', {
          method: 'POST',
          body: JSON.stringify({
            event_type: 'director_panic',
            payload: {
              message: state.freezeReason || 'DIRECTOR PANIC',
              triggered_by: state.panicInitiatedBy || 'DIRECTOR',
              ts: Date.now(),
            },
          }),
        })
      }
      return
    }

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

    if (this._usingEyesOnlyM) {
      await this._mFetch('/api/m/scenario/freeze', {
        method: 'POST',
        body: JSON.stringify({ scenario_id: this._scenarioId, frozen: true }),
      })
      await this._mFetch('/api/m/event', {
        method: 'POST',
        body: JSON.stringify({
          event_type: 'game_freeze',
          payload: { message: reason, triggered_by: initiatedBy, ts: Date.now() },
        }),
      }).catch(() => {})
      return
    }

    await this.setGameState(state)
  }

  async unfreezeGame(): Promise<void> {
    const state: GameState = {
      frozen: false,
      emergencyPanicActive: false
    }

    if (this._usingEyesOnlyM) {
      await this._mFetch('/api/m/scenario/freeze', {
        method: 'POST',
        body: JSON.stringify({ scenario_id: this._scenarioId, frozen: false }),
      })
      await this._mFetch('/api/m/event', {
        method: 'POST',
        body: JSON.stringify({
          event_type: 'game_unfreeze',
          payload: { message: 'unfreeze', ts: Date.now() },
        }),
      }).catch(() => {})
      return
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

    if (this._usingEyesOnlyM) {
      // Freeze scenario + insert director panic marker.
      await this._mFetch('/api/m/scenario/freeze', {
        method: 'POST',
        body: JSON.stringify({ scenario_id: this._scenarioId, frozen: true }),
      })
      await this._mFetch('/api/m/event', {
        method: 'POST',
        body: JSON.stringify({
          event_type: 'director_panic',
          payload: { callsign: initiatedBy, message: 'PANIC - DIRECTOR ABORT', ts: Date.now() },
        }),
      })
      return
    }

    await this.setGameState(state)
  }

  async publishTelemetry(telemetry: PlayerTelemetry): Promise<void> {
    if (this._usingEyesOnlyOps) {
      // Ops actor publishes telemetry
      await this._opsFetch('/api/ops/telemetry', {
        method: 'POST',
        body: JSON.stringify({
          lat: telemetry.latitude,
          lng: telemetry.longitude,
          altitude: telemetry.altitude,
          speed: telemetry.speed,
          heading: telemetry.heading,
          heart_rate: telemetry.heartRate,
          blood_oxygen: telemetry.bloodOxygen,
          stress_level: telemetry.stressLevel,
          temperature: telemetry.temperature,
          motion_state: telemetry.speed > 4 ? 'running' : telemetry.speed > 1 ? 'walking' : 'stationary',
        }),
      })
      return
    }

    if (this._usingEyesOnlyM) {
      // Director console does not publish telemetry.
      return
    }

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
    if (this._usingEyesOnlyOps) {
      const res = await this._opsFetch('/api/ops/actors/positions?team=red')
      if (!res.ok) throw new Error(`EyesOnly ops positions fetch failed (${res.status})`)
      const data = await res.json().catch(() => ({} as any)) as any
      const positions = Array.isArray(data?.positions) ? data.positions : []

      // Map to PlayerTelemetry; treat hidden GPS as (0,0) but keep lastUpdate so UI can show presence.
      return positions.map((p: any) => ({
        playerId: String(p.actor_id),
        playerCallsign: String(p.callsign || 'UNKNOWN'),
        playerTeam: 'red',
        latitude: p.lat == null ? 0 : Number(p.lat),
        longitude: p.lng == null ? 0 : Number(p.lng),
        altitude: 0,
        speed: 0,
        heading: 0,
        heartRate: 0,
        bloodOxygen: 0,
        stressLevel: 0,
        temperature: 0,
        lastUpdate: Number(p.last_seen_at ?? 0),
      })).sort((a: any, b: any) => (b.lastUpdate || 0) - (a.lastUpdate || 0))
    }

    if (this._usingEyesOnlyM) {
      const res = await this._mFetch(`/api/m/actors/positions/${this._scenarioId}`)
      if (!res.ok) throw new Error(`EyesOnly telemetry fetch failed (${res.status})`)
      const data = await res.json().catch(() => ({} as any)) as any
      const positions = Array.isArray(data?.positions) ? data.positions : []

      return positions.map((p: any) => ({
        playerId: String(p.actor_id),
        playerCallsign: String(p.callsign || 'UNKNOWN'),
        playerTeam: (String(p.team || 'blue').toLowerCase() === 'red' ? 'red' : 'blue'),
        latitude: Number(p.lat ?? 0),
        longitude: Number(p.lng ?? 0),
        altitude: 0,
        speed: 0,
        heading: 0,
        heartRate: 0,
        bloodOxygen: 0,
        stressLevel: 0,
        temperature: 0,
        lastUpdate: Number(p.last_seen_at ?? 0),
      })).sort((a: any, b: any) => (b.lastUpdate || 0) - (a.lastUpdate || 0))
    }

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

  async setOpsTelemetryVisible(visible: boolean): Promise<void> {
    if (!this._usingEyesOnlyOps) return
    await this._opsFetch('/api/ops/telemetry/visibility', {
      method: 'POST',
      body: JSON.stringify({ visible: !!visible }),
    })
  }

  async acknowledgePing(pingId: string): Promise<void> {
    if (this._usingEyesOnlyOps) {
      const idNum = parseInt(String(pingId), 10)
      if (!idNum) return
      await this._opsFetch('/api/ops/ack', {
        method: 'POST',
        body: JSON.stringify({ ping_event_id: idNum }),
      })
      return
    }

    const key = `${this.kvPrefix}:ping:${pingId}`
    const ping = await window.spark.kv.get<UnacknowledgedPing>(key)
    if (ping) {
      ping.acknowledged = true
      await window.spark.kv.set(key, ping)
    }
  }

  async getOverduePings(): Promise<UnacknowledgedPing[]> {
    if (this._usingEyesOnlyOps) {
      const res = await this._opsFetch('/api/ops/pings')
      if (!res.ok) throw new Error(`EyesOnly ops pings fetch failed (${res.status})`)
      const data = await res.json().catch(() => ({} as any)) as any
      const pings = Array.isArray(data?.pings) ? data.pings : []
      const now = Date.now()
      return pings.map((p: any) => {
        const payload = p.payload || {}
        const issuedAt = p.created_at ? new Date(p.created_at).getTime() : Number(payload.sent_at || Date.now())
        const timeoutMs = 30_000
        return {
          pingId: String(p.id),
          targetAgentId: String(payload.target_actor_id || ''),
          targetCallsign: String(payload.target_callsign || ''),
          issuedAt,
          timeoutMs,
          acknowledged: !!p.acked,
        } as UnacknowledgedPing
      }).filter((pp: UnacknowledgedPing) => !pp.acknowledged && (now - pp.issuedAt) > pp.timeoutMs)
    }

    if (this._usingEyesOnlyM) {
      const res = await this._mFetch(`/api/m/pings/${this._scenarioId}?limit=80`)
      if (!res.ok) throw new Error(`EyesOnly pings fetch failed (${res.status})`)
      const data = await res.json().catch(() => ({} as any)) as any
      const pings = Array.isArray(data?.pings) ? data.pings : []
      const now = Date.now()

      return pings
        .filter((p: any) => p?.event_type === 'mping')
        .map((p: any) => {
          const payload = p.payload || {}
          const issuedAt = Number(payload.sent_at || (p.created_at ? new Date(p.created_at).getTime() : Date.now()))
          const timeoutMs = 30_000
          const acknowledged = !!p.ack
          return {
            pingId: String(p.id),
            targetAgentId: String(payload.target_actor_id || ''),
            targetCallsign: String(payload.target_callsign || ''),
            issuedAt,
            timeoutMs,
            acknowledged,
          } as UnacknowledgedPing
        })
        .filter((p: UnacknowledgedPing) => !p.acknowledged && (now - p.issuedAt) > p.timeoutMs)
    }

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
