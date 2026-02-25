import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  MapPin, 
  Package, 
  Plus, 
  Trash, 
  Eye, 
  Key,
  Clock,
  CheckCircle,
  XCircle,
  Warning
} from '@phosphor-icons/react'
import { liveArgSync, type DeadDropLocation } from '@/lib/liveArgSync'
import { rogueItemRegistry, type RogueItem } from '@/lib/goneRogueDataRegistry'
import { type AssetLocation } from '@/components/GlobalAssetMap'
import { toast } from 'sonner'

interface DeadDropManagerProps {
  assets: AssetLocation[]
  maxHeight?: string
  onDropCreated?: (drop: DeadDropLocation) => void
  onDropRetrieved?: (drop: DeadDropLocation, items: RogueItem[]) => void
  currentUser: string
}

export function DeadDropManager({ 
  assets, 
  maxHeight = '600px',
  onDropCreated,
  onDropRetrieved,
  currentUser 
}: DeadDropManagerProps) {
  const [drops, setDrops] = useState<DeadDropLocation[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [availableItems, setAvailableItems] = useState<RogueItem[]>([])
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  
  const [newDrop, setNewDrop] = useState<Partial<DeadDropLocation>>({
    name: '',
    gridX: 0,
    gridY: 0,
    latitude: 40.7128,
    longitude: -74.0060,
    items: [],
    requiresCode: false,
    code: ''
  })

  useEffect(() => {
    loadDrops()
    loadAvailableItems()
    
    const unsubscribe = liveArgSync.onDeadDropsUpdate((updatedDrops) => {
      setDrops(updatedDrops)
    })

    return () => unsubscribe()
  }, [])

  const loadDrops = async () => {
    const allDrops = await liveArgSync.getDeadDrops()
    setDrops(allDrops)
  }

  const loadAvailableItems = async () => {
    await rogueItemRegistry.load()
    const items = rogueItemRegistry.getAllItems()
    setAvailableItems(items)
  }

  const handleCreateDrop = async () => {
    if (!newDrop.name || selectedItemIds.length === 0) {
      toast.error('Dead drop requires name and at least one item')
      return
    }

    try {
      const drop = await liveArgSync.createDeadDrop({
        name: newDrop.name,
        gridX: newDrop.gridX || 0,
        gridY: newDrop.gridY || 0,
        latitude: newDrop.latitude || 40.7128,
        longitude: newDrop.longitude || -74.0060,
        items: selectedItemIds,
        requiresCode: newDrop.requiresCode || false,
        code: newDrop.requiresCode ? newDrop.code : undefined,
        createdBy: currentUser
      })

      toast.success(`Dead drop "${drop.name}" created at Grid ${getGridLabel(drop.gridX, drop.gridY)}`)
      
      if (onDropCreated) {
        onDropCreated(drop)
      }

      setNewDrop({
        name: '',
        gridX: 0,
        gridY: 0,
        latitude: 40.7128,
        longitude: -74.0060,
        items: [],
        requiresCode: false,
        code: ''
      })
      setSelectedItemIds([])
      setCreateDialogOpen(false)
    } catch (error) {
      toast.error('Failed to create dead drop')
      console.error(error)
    }
  }

  const handleDeleteDrop = async (dropId: string) => {
    try {
      await liveArgSync.deleteDeadDrop(dropId)
      toast.success('Dead drop deleted')
    } catch (error) {
      toast.error('Failed to delete dead drop')
      console.error(error)
    }
  }

  const handleDiscoverDrop = async (dropId: string, agentId: string, code?: string) => {
    const success = await liveArgSync.discoverDeadDrop(dropId, agentId, code)
    if (success) {
      toast.success('Dead drop discovered!')
      loadDrops()
    } else {
      toast.error('Failed to discover dead drop. Check access code.')
    }
  }

  const handleRetrieveDrop = async (dropId: string, agentId: string) => {
    try {
      const items = await liveArgSync.retrieveDeadDrop(dropId, agentId)
      const drop = drops.find(d => d.id === dropId)
      
      toast.success(`Retrieved ${items.length} item(s) from dead drop`)
      
      if (drop && onDropRetrieved) {
        onDropRetrieved(drop, items)
      }
      
      loadDrops()
    } catch (error) {
      toast.error('Failed to retrieve dead drop')
      console.error(error)
    }
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const getGridLabel = (x: number, y: number): string => {
    return `${String.fromCharCode(65 + x)}${y + 1}`
  }

  const getStatusIcon = (status: DeadDropLocation['status']) => {
    switch (status) {
      case 'active':
        return <Clock weight="bold" className="text-primary" size={14} />
      case 'discovered':
        return <Eye weight="bold" className="text-accent" size={14} />
      case 'retrieved':
        return <CheckCircle weight="bold" className="text-primary" size={14} />
      case 'expired':
        return <XCircle weight="bold" className="text-muted-foreground" size={14} />
    }
  }

  const getStatusColor = (status: DeadDropLocation['status']) => {
    switch (status) {
      case 'active':
        return 'bg-primary/20 text-primary'
      case 'discovered':
        return 'bg-accent/20 text-accent'
      case 'retrieved':
        return 'bg-primary/20 text-primary'
      case 'expired':
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <Card className="border-primary/30">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package weight="bold" className="text-primary" size={20} />
            <span className="text-sm font-bold tracking-wider">DEAD DROP MANAGER</span>
          </div>
          <Badge variant="outline" className="text-[10px] tabular-nums">
            {drops.length} DROP{drops.length !== 1 ? 'S' : ''}
          </Badge>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="sm">
              <Plus weight="bold" className="mr-2" size={16} />
              CREATE DEAD DROP
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <MapPin weight="bold" size={20} />
                CREATE DEAD DROP
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="max-h-[calc(90vh-80px)]">
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="drop-name">Drop Name</Label>
                  <Input
                    id="drop-name"
                    placeholder="CACHE ALPHA"
                    value={newDrop.name}
                    onChange={(e) => setNewDrop({ ...newDrop, name: e.target.value })}
                    className="font-mono uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grid-x">Grid X (A-H)</Label>
                    <Select
                      value={String(newDrop.gridX)}
                      onValueChange={(value) => setNewDrop({ ...newDrop, gridX: parseInt(value) })}
                    >
                      <SelectTrigger id="grid-x">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 8 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {String.fromCharCode(65 + i)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grid-y">Grid Y (1-8)</Label>
                    <Select
                      value={String(newDrop.gridY)}
                      onValueChange={(value) => setNewDrop({ ...newDrop, gridY: parseInt(value) })}
                    >
                      <SelectTrigger id="grid-y">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 8 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      value={newDrop.latitude}
                      onChange={(e) => setNewDrop({ ...newDrop, latitude: parseFloat(e.target.value) })}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      value={newDrop.longitude}
                      onChange={(e) => setNewDrop({ ...newDrop, longitude: parseFloat(e.target.value) })}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Items in Drop</Label>
                    <Badge variant="outline" className="text-[9px]">
                      {selectedItemIds.length} SELECTED
                    </Badge>
                  </div>
                  <ScrollArea className="h-[200px] border border-border rounded p-2">
                    <div className="space-y-1">
                      {availableItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => toggleItemSelection(item.id)}
                          className={`p-2 rounded cursor-pointer transition-colors ${
                            selectedItemIds.includes(item.id)
                              ? 'bg-primary/20 border border-primary'
                              : 'bg-card hover:bg-muted border border-border'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="text-xl">{item.emoji}</div>
                            <div className="flex-1">
                              <div className="text-xs font-bold">{item.name}</div>
                              <div className="text-[10px] text-muted-foreground">{item.type}</div>
                            </div>
                            {selectedItemIds.includes(item.id) && (
                              <CheckCircle weight="fill" className="text-primary" size={16} />
                            )}
                          </div>
                        </div>
                      ))}
                      {availableItems.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-8">
                          No items available. Create an ARG event first.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="requires-code"
                        checked={newDrop.requiresCode === true}
                        onCheckedChange={(checked) => setNewDrop({ ...newDrop, requiresCode: checked })}
                      />
                      <Label htmlFor="requires-code" className="text-sm">Requires Access Code</Label>
                    </div>
                    {newDrop.requiresCode && <Key weight="bold" className="text-accent" size={16} />}
                  </div>

                  {newDrop.requiresCode && (
                    <Input
                      placeholder="Enter access code..."
                      value={newDrop.code}
                      onChange={(e) => setNewDrop({ ...newDrop, code: e.target.value })}
                      className="font-mono"
                    />
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateDrop}
                    disabled={!newDrop.name || selectedItemIds.length === 0}
                    className="flex-1"
                  >
                    <MapPin weight="bold" className="mr-2" size={16} />
                    Create Drop
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea style={{ maxHeight }}>
        <div className="p-4 space-y-2">
          {drops.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No dead drops created. Create one to begin.
            </div>
          ) : (
            drops.map((drop) => (
              <Card key={drop.id} className="p-3 border-primary/20">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <MapPin weight="bold" className="text-primary mt-0.5" size={18} />
                      <div className="flex-1">
                        <div className="font-bold text-sm">{drop.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Grid {getGridLabel(drop.gridX, drop.gridY)} • {drop.latitude.toFixed(6)}, {drop.longitude.toFixed(6)}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`text-[9px] px-1.5 py-0 ${getStatusColor(drop.status)}`}>
                            <span className="mr-1">{getStatusIcon(drop.status)}</span>
                            {drop.status}
                          </Badge>
                          {drop.requiresCode && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-accent">
                              <Key weight="bold" size={10} className="mr-1" />
                              SECURED
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            {drop.items.length} ITEM{drop.items.length !== 1 ? 'S' : ''}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteDrop(drop.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash weight="bold" size={14} />
                    </Button>
                  </div>

                  {drop.items.length > 0 && (
                    <>
                      <Separator />
                      <div className="flex flex-wrap gap-1">
                        {drop.items.map((itemId) => {
                          const item = rogueItemRegistry.getItem(itemId)
                          return (
                            <div
                              key={itemId}
                              className="text-lg"
                              title={item?.name}
                            >
                              {item?.emoji}
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}

                  {drop.discoveredBy && drop.discoveredBy.length > 0 && (
                    <>
                      <Separator />
                      <div className="text-[10px] text-muted-foreground">
                        Discovered by: {drop.discoveredBy.join(', ')}
                      </div>
                    </>
                  )}

                  <div className="text-[9px] text-muted-foreground">
                    Created by {drop.createdBy} • {new Date(drop.createdAt).toLocaleString()}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
