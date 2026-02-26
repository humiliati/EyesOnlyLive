import { rogueItemRegistry, type RogueItem, type RogueItemProto } from './goneRogueDataRegistry'

declare const spark: typeof window.spark

export interface ArgEvent {
  id: string
  name: string
  description: string
  timestamp: number
  scenarioId?: string
  active: boolean
  items: RogueItem[]
}

export interface DeadDropLocation {
  id: string
  name: string
  gridX: number
  gridY: number
  latitude: number
  longitude: number
  items: string[]
  discoveredBy?: string[]
  createdBy: string
  createdAt: number
  expiresAt?: number
  requiresCode?: boolean
  code?: string
  status: 'active' | 'discovered' | 'expired' | 'retrieved'
  argEventId?: string
  metadata?: Record<string, any>
}

class LiveArgSyncManager {
  private _syncInterval: number | null = null
  private _listeners: Set<(items: RogueItem[]) => void> = new Set()
  private _deadDropListeners: Set<(drops: DeadDropLocation[]) => void> = new Set()
  private _eventListeners: Set<(event: ArgEvent) => void> = new Set()

  private _gridConfig: any | null = null
  private _gridConfigAt: number = 0

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

  private get BASE_URL(): string {
    return (window as any).__ARG_API_BASE__ || '/api/m'
  }

  async createArgEvent(event: Omit<ArgEvent, 'id' | 'timestamp'>): Promise<ArgEvent> {
    try {
      const newEvent: ArgEvent = {
        id: `ARG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        ...event
      }

      await spark.kv.set(`arg-event:${newEvent.id}`, newEvent)
      
      for (const item of newEvent.items) {
        rogueItemRegistry.addItem(item)
      }

      this._notifyEventListeners(newEvent)
      
      return newEvent
    } catch (error) {
      console.error('[LiveArgSync] Failed to create ARG event:', error)
      throw error
    }
  }

  async getArgEvents(): Promise<ArgEvent[]> {
    try {
      const keys = await spark.kv.keys()
      const eventKeys = keys.filter(k => k.startsWith('arg-event:'))
      
      const events: ArgEvent[] = []
      for (const key of eventKeys) {
        const event = await spark.kv.get<ArgEvent>(key)
        if (event) events.push(event)
      }
      
      return events.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('[LiveArgSync] Failed to get ARG events:', error)
      return []
    }
  }

  async getActiveArgEvents(): Promise<ArgEvent[]> {
    const events = await this.getArgEvents()
    return events.filter(e => e.active)
  }

  async activateArgEvent(eventId: string): Promise<void> {
    try {
      const event = await spark.kv.get<ArgEvent>(`arg-event:${eventId}`)
      if (!event) {
        throw new Error(`ARG event ${eventId} not found`)
      }

      event.active = true
      await spark.kv.set(`arg-event:${eventId}`, event)

      for (const item of event.items) {
        rogueItemRegistry.addItem(item)
      }

      this._notifyEventListeners(event)
    } catch (error) {
      console.error('[LiveArgSync] Failed to activate ARG event:', error)
      throw error
    }
  }

  async deactivateArgEvent(eventId: string): Promise<void> {
    try {
      const event = await spark.kv.get<ArgEvent>(`arg-event:${eventId}`)
      if (!event) {
        throw new Error(`ARG event ${eventId} not found`)
      }

      event.active = false
      await spark.kv.set(`arg-event:${eventId}`, event)

      this._notifyEventListeners(event)
    } catch (error) {
      console.error('[LiveArgSync] Failed to deactivate ARG event:', error)
      throw error
    }
  }

  async createDeadDrop(drop: Omit<DeadDropLocation, 'id' | 'createdAt' | 'status'>): Promise<DeadDropLocation> {
    try {
      // Prefer live EyesOnly director create endpoint when session is present.
      if (this._eyesOnlyBaseUrl && this._mToken) {
        // EyesOnly dead drops are lane-based. Use calibrated grid col labels when available.
        const cfg = await this.getGridConfig();
        const laneId = this.getLaneIdForGridX(drop.gridX || 0, cfg);
        const res = await this._mFetch('/api/m/dead-drop', {
          method: 'POST',
          body: JSON.stringify({
            scenario_id: this._scenarioId,
            lane_id: laneId,
            label: drop.name || 'Dead Drop',
            lat: drop.latitude,
            lng: drop.longitude,
          }),
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({} as any)) as any
          throw new Error(d?.message || `EyesOnly dead drop create failed (${res.status})`)
        }
        const d = await res.json().catch(() => ({} as any)) as any
        const dd = d?.dead_drop || d?.drop

        const created: DeadDropLocation = {
          id: String(dd?.id),
          name: String(dd?.label || drop.name || 'Dead Drop'),
          gridX: drop.gridX || 0,
          gridY: drop.gridY || 0,
          latitude: dd?.lat ?? drop.latitude ?? 0,
          longitude: dd?.lng ?? drop.longitude ?? 0,
          items: drop.items || [],
          discoveredBy: [],
          createdBy: drop.createdBy || 'M',
          createdAt: dd?.created_at || Date.now(),
          status: 'active',
          metadata: { lane_id: dd?.lane_id, dead_drop_id: dd?.id },
        }

        this._notifyDeadDropListeners(await this.getDeadDrops())
        return created
      }

      // Fallback: Spark KV
      const newDrop: DeadDropLocation = {
        id: `DROP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        status: 'active',
        discoveredBy: [],
        ...drop
      }

      await spark.kv.set(`dead-drop:${newDrop.id}`, newDrop)
      this._notifyDeadDropListeners(await this.getDeadDrops())

      return newDrop
    } catch (error) {
      console.error('[LiveArgSync] Failed to create dead drop:', error)
      throw error
    }
  }

  async getGridConfig(force: boolean = false): Promise<any | null> {
    try {
      if (!force && this._gridConfig && (Date.now() - this._gridConfigAt) < 30_000) {
        return this._gridConfig
      }
      if (this._eyesOnlyBaseUrl && this._mToken) {
        const res = await this._mFetch(`/api/m/grid/${this._scenarioId}/cells`)
        if (!res.ok) throw new Error(`EyesOnly grid config fetch failed (${res.status})`)
        const data = await res.json().catch(() => ({} as any)) as any
        this._gridConfig = data?.config || null
        this._gridConfigAt = Date.now()
        return this._gridConfig
      }
      return null
    } catch (e) {
      return null
    }
  }

  getGridLabel(x: number, y: number, cfg?: any | null): string {
    cfg = cfg || this._gridConfig
    const col = Array.isArray(cfg?.col_labels) ? cfg.col_labels[x] : null
    const row = Array.isArray(cfg?.row_labels) ? cfg.row_labels[y] : null
    const colLbl = col || String.fromCharCode(65 + (x || 0))
    const rowLbl = row || String((y || 0) + 1)
    return `${colLbl}${rowLbl}`
  }

  getLaneIdForGridX(x: number, cfg?: any | null): string {
    cfg = cfg || this._gridConfig
    const col = Array.isArray(cfg?.col_labels) ? cfg.col_labels[x] : null
    return String(col || String.fromCharCode(65 + (x || 0)))
  }

  async getDeadDrops(): Promise<DeadDropLocation[]> {
    try {
      // Prefer live EyesOnly grid/cell dead drops (director view).
      if (this._eyesOnlyBaseUrl && this._mToken) {
        const res = await this._mFetch(`/api/m/grid/${this._scenarioId}/cells`)
        if (!res.ok) throw new Error(`EyesOnly dead drop fetch failed (${res.status})`)
        const data = await res.json().catch(() => ({} as any)) as any
        const cells = Array.isArray(data?.cells) ? data.cells : []

        const drops: DeadDropLocation[] = []
        for (const cell of cells) {
          const dd = Array.isArray(cell?.dead_drops) ? cell.dead_drops : []
          for (const d of dd) {
            const rawStatus = String(d?.status || 'active')
            const status: DeadDropLocation['status'] =
              rawStatus === 'retrieved' ? 'retrieved' :
              rawStatus === 'expired' ? 'expired' :
              rawStatus === 'discovered' ? 'discovered' :
              'active'

            drops.push({
              id: String(d?.id || ''),
              name: String(d?.label || 'Dead Drop'),
              gridX: Number(cell?.col ?? 0),
              gridY: Number(cell?.row ?? 0),
              latitude: 0,
              longitude: 0,
              items: [],
              discoveredBy: [],
              createdBy: 'M',
              createdAt: Date.now(),
              status,
              metadata: {
                cell_id: cell?.cell_id,
                lane_id: d?.lane_id,
                eyesOnlyStatus: rawStatus,
              },
            })
          }
        }

        // newest first to match previous semantics
        return drops.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      }

      // Fallback: Spark KV
      const keys = await spark.kv.keys()
      const dropKeys = keys.filter(k => k.startsWith('dead-drop:'))

      const drops: DeadDropLocation[] = []
      for (const key of dropKeys) {
        const drop = await spark.kv.get<DeadDropLocation>(key)
        if (drop) drops.push(drop)
      }

      return drops.sort((a, b) => b.createdAt - a.createdAt)
    } catch (error) {
      console.error('[LiveArgSync] Failed to get dead drops:', error)
      return []
    }
  }

  async getActiveDeadDrops(): Promise<DeadDropLocation[]> {
    const drops = await this.getDeadDrops()
    const now = Date.now()
    return drops.filter(d => {
      if (d.status !== 'active') return false
      if (d.expiresAt && d.expiresAt < now) return false
      return true
    })
  }

  async discoverDeadDrop(dropId: string, agentId: string, code?: string): Promise<boolean> {
    try {
      const drop = await spark.kv.get<DeadDropLocation>(`dead-drop:${dropId}`)
      if (!drop) {
        throw new Error(`Dead drop ${dropId} not found`)
      }

      if (drop.status !== 'active') {
        return false
      }

      if (drop.expiresAt && drop.expiresAt < Date.now()) {
        drop.status = 'expired'
        await spark.kv.set(`dead-drop:${dropId}`, drop)
        return false
      }

      if (drop.requiresCode && drop.code && code !== drop.code) {
        return false
      }

      if (!drop.discoveredBy) drop.discoveredBy = []
      if (!drop.discoveredBy.includes(agentId)) {
        drop.discoveredBy.push(agentId)
      }

      drop.status = 'discovered'
      await spark.kv.set(`dead-drop:${dropId}`, drop)
      
      this._notifyDeadDropListeners(await this.getDeadDrops())
      
      return true
    } catch (error) {
      console.error('[LiveArgSync] Failed to discover dead drop:', error)
      return false
    }
  }

  async retrieveDeadDrop(dropId: string, agentId: string): Promise<RogueItem[]> {
    try {
      const drop = await spark.kv.get<DeadDropLocation>(`dead-drop:${dropId}`)
      if (!drop) {
        throw new Error(`Dead drop ${dropId} not found`)
      }

      if (drop.status !== 'discovered') {
        throw new Error(`Dead drop ${dropId} not discovered yet`)
      }

      const items: RogueItem[] = []
      for (const itemId of drop.items) {
        const item = rogueItemRegistry.getItem(itemId)
        if (item) items.push(item)
      }

      drop.status = 'retrieved'
      await spark.kv.set(`dead-drop:${dropId}`, drop)

      await spark.kv.set(`agent-inventory:${agentId}`, [
        ...await this.getAgentInventory(agentId),
        ...drop.items
      ])

      this._notifyDeadDropListeners(await this.getDeadDrops())
      
      return items
    } catch (error) {
      console.error('[LiveArgSync] Failed to retrieve dead drop:', error)
      throw error
    }
  }

  async deleteDeadDrop(dropId: string): Promise<void> {
    try {
      // Prefer live EyesOnly director delete endpoint when session is present.
      if (this._eyesOnlyBaseUrl && this._mToken) {
        const res = await this._mFetch(`/api/m/dead-drop/${encodeURIComponent(dropId)}`, { method: 'DELETE' })
        if (!res.ok) {
          const d = await res.json().catch(() => ({} as any)) as any
          throw new Error(d?.message || `EyesOnly dead drop delete failed (${res.status})`)
        }
        this._notifyDeadDropListeners(await this.getDeadDrops())
        return
      }

      // Fallback: Spark KV
      await spark.kv.delete(`dead-drop:${dropId}`)
      this._notifyDeadDropListeners(await this.getDeadDrops())
    } catch (error) {
      console.error('[LiveArgSync] Failed to delete dead drop:', error)
      throw error
    }
  }

  async getAgentInventory(agentId: string): Promise<string[]> {
    try {
      const inventory = await spark.kv.get<string[]>(`agent-inventory:${agentId}`)
      return inventory || []
    } catch (error) {
      console.error('[LiveArgSync] Failed to get agent inventory:', error)
      return []
    }
  }

  async addItemToInventory(agentId: string, itemId: string): Promise<void> {
    try {
      const inventory = await this.getAgentInventory(agentId)
      inventory.push(itemId)
      await spark.kv.set(`agent-inventory:${agentId}`, inventory)
    } catch (error) {
      console.error('[LiveArgSync] Failed to add item to inventory:', error)
      throw error
    }
  }

  async removeItemFromInventory(agentId: string, itemId: string): Promise<void> {
    try {
      const inventory = await this.getAgentInventory(agentId)
      const index = inventory.indexOf(itemId)
      if (index > -1) {
        inventory.splice(index, 1)
        await spark.kv.set(`agent-inventory:${agentId}`, inventory)
      }
    } catch (error) {
      console.error('[LiveArgSync] Failed to remove item from inventory:', error)
      throw error
    }
  }

  onItemsUpdate(callback: (items: RogueItem[]) => void): () => void {
    this._listeners.add(callback)
    return () => this._listeners.delete(callback)
  }

  onDeadDropsUpdate(callback: (drops: DeadDropLocation[]) => void): () => void {
    this._deadDropListeners.add(callback)
    return () => this._deadDropListeners.delete(callback)
  }

  onArgEventUpdate(callback: (event: ArgEvent) => void): () => void {
    this._eventListeners.add(callback)
    return () => this._eventListeners.delete(callback)
  }

  private _notifyListeners(items: RogueItem[]): void {
    for (const listener of this._listeners) {
      listener(items)
    }
  }

  private _notifyDeadDropListeners(drops: DeadDropLocation[]): void {
    for (const listener of this._deadDropListeners) {
      listener(drops)
    }
  }

  private _notifyEventListeners(event: ArgEvent): void {
    for (const listener of this._eventListeners) {
      listener(event)
    }
  }

  startSync(intervalMs: number = 10000): void {
    if (this._syncInterval !== null) return

    this._syncInterval = window.setInterval(async () => {
      try {
        await rogueItemRegistry.reload()
        const items = rogueItemRegistry.getAllItems()
        this._notifyListeners(items)

        // Also refresh dead drops if we have a director session
        const drops = await this.getDeadDrops()
        this._notifyDeadDropListeners(drops)
      } catch (error) {
        console.error('[LiveArgSync] Sync failed:', error)
      }
    }, intervalMs)
  }

  stopSync(): void {
    if (this._syncInterval !== null) {
      window.clearInterval(this._syncInterval)
      this._syncInterval = null
    }
  }
}

export const liveArgSync = new LiveArgSyncManager()
