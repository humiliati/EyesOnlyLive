export interface RogueItemNature {
  heat?: number
  signal?: number
  stealth?: number
  intel?: number
  tactical?: number
}

export interface RogueItem {
  id: string
  name: string
  emoji: string
  type: 'tool' | 'intel' | 'weapon' | 'consumable' | 'key' | 'evidence' | 'equipment'
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'unique'
  nature?: RogueItemNature
  description?: string
  weight?: number
  value?: number
  stackable?: boolean
  maxStack?: number
  usable?: boolean
  deployable?: boolean
  oneTimeOnly?: boolean
  argEventId?: string
  createdAt?: number
  expiresAt?: number
  metadata?: Record<string, any>
}

export interface RogueItemProto extends Partial<RogueItem> {
  id: string
  name: string
  emoji: string
  type: RogueItem['type']
}

class GoneRogueDataRegistry {
  private _db: {
    items: RogueItem[]
  } = { items: [] }
  
  private _itemsById: Map<string, RogueItem> = new Map()
  private _loaded = false
  private _loading: Promise<void> | null = null

  private get BASE(): string {
    return (window as any).__ROGUE_REGISTRY_BASE__ || '/data/gone-rogue/'
  }

  private get EXTRA_ITEMS_URL(): string | undefined {
    return (window as any).__ROGUE_REGISTRY_EXTRA_ITEMS_URL__
  }

  async load(): Promise<void> {
    if (this._loaded) return
    if (this._loading) return this._loading

    this._loading = this._loadData()
    await this._loading
    this._loaded = true
    this._loading = null
  }

  private async _loadData(): Promise<void> {
    const canonicalItems = await this._fetchCanonicalItems()
    const extraItems = await this._fetchExtraItems()

    this._db.items = [...canonicalItems, ...extraItems]
    this._buildIndex()
  }

  private async _fetchCanonicalItems(): Promise<RogueItem[]> {
    try {
      const response = await fetch(`${this.BASE}items.json`)
      if (!response.ok) {
        console.warn('[GoneRogue] Canonical items not found, using empty base')
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : data.items || []
    } catch (error) {
      console.warn('[GoneRogue] Failed to load canonical items:', error)
      return []
    }
  }

  private async _fetchExtraItems(): Promise<RogueItem[]> {
    if (!this.EXTRA_ITEMS_URL) return []

    try {
      const response = await fetch(this.EXTRA_ITEMS_URL)
      if (!response.ok) {
        console.warn('[GoneRogue] Extra items endpoint returned error:', response.status)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.warn('[GoneRogue] Failed to load extra items:', error)
      return []
    }
  }

  private _buildIndex(): void {
    this._itemsById.clear()
    for (const item of this._db.items) {
      this._itemsById.set(item.id, item)
    }
  }

  getItem(id: string): RogueItem | undefined {
    if (!this._loaded) {
      console.warn('[GoneRogue] Registry not loaded, call load() first')
      return this._createMissingEntry(id)
    }
    return this._itemsById.get(id) || this._createMissingEntry(id)
  }

  getAllItems(): RogueItem[] {
    if (!this._loaded) {
      console.warn('[GoneRogue] Registry not loaded, call load() first')
      return []
    }
    return [...this._db.items]
  }

  getItemsByType(type: RogueItem['type']): RogueItem[] {
    return this._db.items.filter(item => item.type === type)
  }

  getItemsByRarity(rarity: RogueItem['rarity']): RogueItem[] {
    return this._db.items.filter(item => item.rarity === rarity)
  }

  getItemsByArgEvent(argEventId: string): RogueItem[] {
    return this._db.items.filter(item => item.argEventId === argEventId)
  }

  getOneTimeItems(): RogueItem[] {
    return this._db.items.filter(item => item.oneTimeOnly)
  }

  private _createMissingEntry(id: string): RogueItem {
    return {
      id,
      name: `Unknown Item ${id}`,
      emoji: '❓',
      type: 'equipment',
      rarity: 'common',
      description: 'Item data not found in registry'
    }
  }

  addItem(item: RogueItem): void {
    if (this._itemsById.has(item.id)) {
      console.warn(`[GoneRogue] Item ${item.id} already exists, replacing`)
      this._db.items = this._db.items.filter(i => i.id !== item.id)
    }
    this._db.items.push(item)
    this._itemsById.set(item.id, item)
  }

  addItems(items: RogueItem[]): void {
    for (const item of items) {
      this.addItem(item)
    }
  }

  removeItem(id: string): boolean {
    const existed = this._itemsById.has(id)
    this._db.items = this._db.items.filter(item => item.id !== id)
    this._itemsById.delete(id)
    return existed
  }

  async reload(): Promise<void> {
    this._loaded = false
    this._loading = null
    this._db.items = []
    this._itemsById.clear()
    await this.load()
  }

  isLoaded(): boolean {
    return this._loaded
  }
}

export const rogueItemRegistry = new GoneRogueDataRegistry()
