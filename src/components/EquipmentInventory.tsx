import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Package, 
  MapTrifold,
  Plus,
  Trash,
  MagnifyingGlass,
  Warning,
  CheckCircle,
  ClockCountdown,
  Barcode,
  X,
  PencilSimple
} from '@phosphor-icons/react'

export interface EquipmentItem {
  id: string
  name: string
  category: 'weapon' | 'communication' | 'surveillance' | 'medical' | 'explosive' | 'tool' | 'document' | 'currency' | 'other'
  serialNumber: string
  status: 'available' | 'deployed' | 'compromised' | 'retrieved' | 'destroyed'
  assignedTo?: string
  assignedToType?: 'agent' | 'location' | 'dead-drop' | 'geocache'
  assignedToName?: string
  gridX?: number
  gridY?: number
  latitude?: number
  longitude?: number
  description?: string
  deployedAt?: number
  retrievedAt?: number
  expirationTime?: number
  priority: 'low' | 'normal' | 'high' | 'critical'
  encrypted: boolean
  requiresAcknowledgment: boolean
  accessCode?: string
  notes?: string
  history: EquipmentHistoryEntry[]
}

export interface EquipmentHistoryEntry {
  timestamp: number
  action: 'created' | 'assigned' | 'deployed' | 'retrieved' | 'transferred' | 'compromised' | 'destroyed' | 'updated'
  performedBy: string
  details: string
  location?: { gridX?: number; gridY?: number; latitude?: number; longitude?: number }
}

interface EquipmentInventoryProps {
  assets?: Array<{ id: string; callsign: string; agentId: string }>
  maxHeight?: string
  onItemDeployed?: (item: EquipmentItem) => void
  onItemRetrieved?: (item: EquipmentItem) => void
  currentUser?: string
}

export function EquipmentInventory({ 
  assets = [], 
  maxHeight = '500px',
  onItemDeployed,
  onItemRetrieved,
  currentUser = 'M-CONSOLE'
}: EquipmentInventoryProps) {
  const [equipment, setEquipment] = useKV<EquipmentItem[]>('equipment-inventory', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null)

  const [newItem, setNewItem] = useState<Partial<EquipmentItem>>({
    name: '',
    category: 'other',
    serialNumber: '',
    status: 'available',
    description: '',
    priority: 'normal',
    encrypted: false,
    requiresAcknowledgment: false,
    accessCode: '',
    notes: ''
  })

  const filteredEquipment = useMemo(() => {
    return (equipment || []).filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory
      
      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [equipment, searchQuery, filterStatus, filterCategory])

  const statusCounts = useMemo(() => {
    const counts = {
      available: 0,
      deployed: 0,
      compromised: 0,
      retrieved: 0,
      destroyed: 0
    }
    
    ;(equipment || []).forEach(item => {
      counts[item.status]++
    })
    
    return counts
  }, [equipment])

  const handleCreateItem = () => {
    if (!newItem.name || !newItem.serialNumber) return

    const item: EquipmentItem = {
      id: `eq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newItem.name,
      category: newItem.category || 'other',
      serialNumber: newItem.serialNumber,
      status: 'available',
      description: newItem.description,
      priority: newItem.priority || 'normal',
      encrypted: newItem.encrypted || false,
      requiresAcknowledgment: newItem.requiresAcknowledgment || false,
      accessCode: newItem.accessCode,
      notes: newItem.notes,
      history: [{
        timestamp: Date.now(),
        action: 'created',
        performedBy: currentUser,
        details: `Equipment item created: ${newItem.name}`
      }]
    }

    setEquipment((current) => [...(current || []), item])
    
    setNewItem({
      name: '',
      category: 'other',
      serialNumber: '',
      status: 'available',
      description: '',
      priority: 'normal',
      encrypted: false,
      requiresAcknowledgment: false,
      accessCode: '',
      notes: ''
    })
    
    setCreateDialogOpen(false)
  }

  const handleDeployItem = (itemId: string, deployData: {
    assignedTo?: string
    assignedToType?: 'agent' | 'location' | 'dead-drop' | 'geocache'
    assignedToName?: string
    gridX?: number
    gridY?: number
    latitude?: number
    longitude?: number
    expirationTime?: number
  }) => {
    setEquipment((current) => {
      return (current || []).map(item => {
        if (item.id === itemId) {
          const updatedItem: EquipmentItem = {
            ...item,
            status: 'deployed',
            assignedTo: deployData.assignedTo,
            assignedToType: deployData.assignedToType,
            assignedToName: deployData.assignedToName,
            gridX: deployData.gridX,
            gridY: deployData.gridY,
            latitude: deployData.latitude,
            longitude: deployData.longitude,
            deployedAt: Date.now(),
            expirationTime: deployData.expirationTime,
            history: [
              ...item.history,
              {
                timestamp: Date.now(),
                action: 'deployed',
                performedBy: currentUser,
                details: `Deployed to ${deployData.assignedToType}: ${deployData.assignedToName || 'Unknown'}`,
                location: {
                  gridX: deployData.gridX,
                  gridY: deployData.gridY,
                  latitude: deployData.latitude,
                  longitude: deployData.longitude
                }
              }
            ]
          }
          
          if (onItemDeployed) {
            onItemDeployed(updatedItem)
          }
          
          return updatedItem
        }
        return item
      })
    })
  }

  const handleRetrieveItem = (itemId: string) => {
    setEquipment((current) => {
      return (current || []).map(item => {
        if (item.id === itemId && item.status === 'deployed') {
          const updatedItem: EquipmentItem = {
            ...item,
            status: 'retrieved',
            retrievedAt: Date.now(),
            history: [
              ...item.history,
              {
                timestamp: Date.now(),
                action: 'retrieved',
                performedBy: currentUser,
                details: `Retrieved from ${item.assignedToType}: ${item.assignedToName || 'Unknown'}`
              }
            ]
          }
          
          if (onItemRetrieved) {
            onItemRetrieved(updatedItem)
          }
          
          return updatedItem
        }
        return item
      })
    })
  }

  const handleMarkCompromised = (itemId: string, reason?: string) => {
    setEquipment((current) => {
      return (current || []).map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            status: 'compromised' as const,
            history: [
              ...item.history,
              {
                timestamp: Date.now(),
                action: 'compromised',
                performedBy: currentUser,
                details: reason || 'Item marked as compromised'
              }
            ]
          }
        }
        return item
      })
    })
  }

  const handleDeleteItem = (itemId: string) => {
    setEquipment((current) => (current || []).filter(item => item.id !== itemId))
    if (selectedItem?.id === itemId) {
      setSelectedItem(null)
      setDetailsDialogOpen(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'weapon': return '🔫'
      case 'communication': return '📡'
      case 'surveillance': return '📷'
      case 'medical': return '💉'
      case 'explosive': return '💣'
      case 'tool': return '🔧'
      case 'document': return '📄'
      case 'currency': return '💰'
      default: return '📦'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-primary text-primary-foreground'
      case 'deployed': return 'bg-accent text-accent-foreground'
      case 'compromised': return 'bg-destructive text-destructive-foreground'
      case 'retrieved': return 'bg-secondary text-secondary-foreground'
      case 'destroyed': return 'bg-muted text-muted-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-destructive'
      case 'high': return 'text-accent'
      case 'normal': return 'text-primary'
      case 'low': return 'text-muted-foreground'
      default: return 'text-foreground'
    }
  }

  const isExpired = (item: EquipmentItem) => {
    return item.expirationTime && item.expirationTime < Date.now()
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="border-primary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Equipment Inventory</span>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-6 text-[10px]">
              <Plus weight="bold" size={12} className="mr-1" />
              ADD ITEM
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm tracking-wider">CREATE EQUIPMENT ITEM</DialogTitle>
              <DialogDescription className="text-xs">
                Add new equipment to operational inventory
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="item-name" className="text-[10px] uppercase tracking-wider">Item Name</Label>
                <Input
                  id="item-name"
                  placeholder="Enter item name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="category" className="text-[10px] uppercase tracking-wider">Category</Label>
                  <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value as any })}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weapon">Weapon</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="surveillance">Surveillance</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="explosive">Explosive</SelectItem>
                      <SelectItem value="tool">Tool</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="currency">Currency</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="priority" className="text-[10px] uppercase tracking-wider">Priority</Label>
                  <Select value={newItem.priority} onValueChange={(value) => setNewItem({ ...newItem, priority: value as any })}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="serial" className="text-[10px] uppercase tracking-wider">Serial Number</Label>
                <Input
                  id="serial"
                  placeholder="SN-XXXX-XXXX"
                  value={newItem.serialNumber}
                  onChange={(e) => setNewItem({ ...newItem, serialNumber: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="access-code" className="text-[10px] uppercase tracking-wider">Access Code (Optional)</Label>
                <Input
                  id="access-code"
                  placeholder="Enter secure access code"
                  value={newItem.accessCode}
                  onChange={(e) => setNewItem({ ...newItem, accessCode: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="description" className="text-[10px] uppercase tracking-wider">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter item description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="text-xs resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="notes" className="text-[10px] uppercase tracking-wider">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Operational notes"
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  className="text-xs resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItem.encrypted}
                    onChange={(e) => setNewItem({ ...newItem, encrypted: e.target.checked })}
                    className="rounded border-input"
                  />
                  Encrypted
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItem.requiresAcknowledgment}
                    onChange={(e) => setNewItem({ ...newItem, requiresAcknowledgment: e.target.checked })}
                    className="rounded border-input"
                  />
                  Requires ACK
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreateItem} className="flex-1 text-xs" disabled={!newItem.name || !newItem.serialNumber}>
                  <Plus weight="bold" size={14} className="mr-1" />
                  CREATE ITEM
                </Button>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="text-xs">
                  CANCEL
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-5 gap-2">
        <Badge variant="outline" className="text-[9px] px-2 py-1 justify-center">
          <CheckCircle weight="bold" size={10} className="mr-1" />
          {statusCounts.available}
        </Badge>
        <Badge variant="outline" className="text-[9px] px-2 py-1 justify-center">
          <MapTrifold weight="bold" size={10} className="mr-1" />
          {statusCounts.deployed}
        </Badge>
        <Badge variant="outline" className="text-[9px] px-2 py-1 justify-center border-destructive text-destructive">
          <Warning weight="bold" size={10} className="mr-1" />
          {statusCounts.compromised}
        </Badge>
        <Badge variant="outline" className="text-[9px] px-2 py-1 justify-center">
          {statusCounts.retrieved}
        </Badge>
        <Badge variant="outline" className="text-[9px] px-2 py-1 justify-center text-muted-foreground">
          {statusCounts.destroyed}
        </Badge>
      </div>

      <Separator className="bg-border" />

      <div className="space-y-2">
        <div className="relative">
          <MagnifyingGlass weight="bold" className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
          <Input
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-7 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-7 text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="deployed">Deployed</SelectItem>
              <SelectItem value="compromised">Compromised</SelectItem>
              <SelectItem value="retrieved">Retrieved</SelectItem>
              <SelectItem value="destroyed">Destroyed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-7 text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="weapon">Weapon</SelectItem>
              <SelectItem value="communication">Communication</SelectItem>
              <SelectItem value="surveillance">Surveillance</SelectItem>
              <SelectItem value="medical">Medical</SelectItem>
              <SelectItem value="explosive">Explosive</SelectItem>
              <SelectItem value="tool">Tool</SelectItem>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="currency">Currency</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea style={{ maxHeight }} className="pr-3">
        <div className="space-y-2">
          {filteredEquipment.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package weight="bold" size={32} className="mx-auto mb-2 opacity-50" />
              <div className="text-xs">No equipment found</div>
              <div className="text-[10px]">Create new items to populate inventory</div>
            </div>
          ) : (
            filteredEquipment.map(item => (
              <Card
                key={item.id}
                className="p-3 space-y-2 border-border hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedItem(item)
                  setDetailsDialogOpen(true)
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getCategoryIcon(item.category)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{item.name}</div>
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                          <Barcode weight="bold" size={9} />
                          <span className="font-mono">{item.serialNumber}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={`${getStatusColor(item.status)} text-[8px] px-1.5 py-0`}>
                      {item.status.toUpperCase()}
                    </Badge>
                    {item.encrypted && (
                      <Badge variant="outline" className="text-[7px] px-1 py-0 border-primary text-primary">
                        🔒 ENC
                      </Badge>
                    )}
                  </div>
                </div>

                {item.assignedToName && (
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MapTrifold weight="bold" size={10} />
                    <span className="uppercase tracking-wider">{item.assignedToType}:</span>
                    <span className="text-primary font-medium">{item.assignedToName}</span>
                  </div>
                )}

                {item.gridX !== undefined && item.gridY !== undefined && (
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MapTrifold weight="bold" size={10} />
                    <span>Grid: {String.fromCharCode(65 + item.gridX)}{item.gridY + 1}</span>
                  </div>
                )}

                {isExpired(item) && item.status === 'deployed' && (
                  <div className="flex items-center gap-1 text-[10px] text-destructive">
                    <ClockCountdown weight="bold" size={10} />
                    <span className="font-bold uppercase">EXPIRED</span>
                  </div>
                )}

                {item.description && (
                  <div className="text-[10px] text-muted-foreground line-clamp-2">
                    {item.description}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm tracking-wider flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(selectedItem.category)}</span>
                  {selectedItem.name}
                </DialogTitle>
                <DialogDescription className="text-xs font-mono">
                  {selectedItem.serialNumber}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 pr-3">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={`${getStatusColor(selectedItem.status)} text-[9px]`}>
                      {selectedItem.status.toUpperCase()}
                    </Badge>
                    <Badge className={`${getPriorityColor(selectedItem.priority)} text-[9px]`} variant="outline">
                      {selectedItem.priority.toUpperCase()}
                    </Badge>
                  </div>

                  {selectedItem.description && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Description</div>
                      <div className="text-xs">{selectedItem.description}</div>
                    </div>
                  )}

                  {selectedItem.assignedToName && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Assignment</div>
                      <div className="text-xs">
                        <span className="uppercase tracking-wider text-muted-foreground">{selectedItem.assignedToType}:</span>{' '}
                        <span className="text-primary font-medium">{selectedItem.assignedToName}</span>
                      </div>
                    </div>
                  )}

                  {(selectedItem.gridX !== undefined || selectedItem.latitude !== undefined) && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Location</div>
                      <div className="text-xs space-y-1">
                        {selectedItem.gridX !== undefined && selectedItem.gridY !== undefined && (
                          <div>Grid: {String.fromCharCode(65 + selectedItem.gridX)}{selectedItem.gridY + 1}</div>
                        )}
                        {selectedItem.latitude !== undefined && selectedItem.longitude !== undefined && (
                          <div className="font-mono">
                            {selectedItem.latitude.toFixed(6)}°N, {Math.abs(selectedItem.longitude).toFixed(6)}°W
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedItem.accessCode && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Access Code</div>
                      <div className="text-xs font-mono bg-muted px-2 py-1 rounded">{selectedItem.accessCode}</div>
                    </div>
                  )}

                  {selectedItem.notes && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Notes</div>
                      <div className="text-xs">{selectedItem.notes}</div>
                    </div>
                  )}

                  <div className="flex gap-2 text-[10px]">
                    {selectedItem.encrypted && (
                      <Badge variant="outline" className="text-[8px] border-primary text-primary">
                        🔒 ENCRYPTED
                      </Badge>
                    )}
                    {selectedItem.requiresAcknowledgment && (
                      <Badge variant="outline" className="text-[8px]">
                        ✓ REQUIRES ACK
                      </Badge>
                    )}
                  </div>

                  {selectedItem.deployedAt && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Deployed</div>
                      <div className="text-xs">{formatTimestamp(selectedItem.deployedAt)}</div>
                    </div>
                  )}

                  {selectedItem.expirationTime && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Expiration</div>
                      <div className={`text-xs ${isExpired(selectedItem) ? 'text-destructive font-bold' : ''}`}>
                        {formatTimestamp(selectedItem.expirationTime)}
                        {isExpired(selectedItem) && ' (EXPIRED)'}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">History</div>
                    <div className="space-y-2">
                      {selectedItem.history.map((entry, index) => (
                        <div key={index} className="text-xs border-l-2 border-primary/30 pl-2 py-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold uppercase text-[10px]">{entry.action}</span>
                            <span className="text-[9px] text-muted-foreground">{formatTimestamp(entry.timestamp)}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">{entry.performedBy}</div>
                          <div className="text-[10px]">{entry.details}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="flex gap-2 pt-2 border-t">
                {selectedItem.status === 'deployed' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleRetrieveItem(selectedItem.id)
                      setDetailsDialogOpen(false)
                    }}
                    className="flex-1 text-xs"
                  >
                    <CheckCircle weight="bold" size={14} className="mr-1" />
                    RETRIEVE
                  </Button>
                )}
                
                {(selectedItem.status === 'available' || selectedItem.status === 'deployed') && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      handleMarkCompromised(selectedItem.id, 'Marked as compromised by operator')
                      setDetailsDialogOpen(false)
                    }}
                    className="flex-1 text-xs"
                  >
                    <Warning weight="bold" size={14} className="mr-1" />
                    COMPROMISED
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleDeleteItem(selectedItem.id)
                  }}
                  className="text-xs"
                >
                  <Trash weight="bold" size={14} />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
