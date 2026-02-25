import { useState, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash, Camera, Building, User, Package, MapPin, Phone, EnvelopeSimple, CalendarBlank } from '@phosphor-icons/react'
import { toast } from 'sonner'

export interface BusinessOwnerDetails {
  id: string
  businessName: string
  ownerName: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  participationDate: number
  notes?: string
  gridX?: number
  gridY?: number
  latitude?: number
  longitude?: number
}

export interface RealWorldItem {
  id: string
  itemId: string
  name: string
  emoji: string
  type: string
  description?: string
  businessOwner: BusinessOwnerDetails
  photos: string[]
  createdAt: number
  deployed: boolean
  deployedAt?: number
  retrievedAt?: number
  retrievedBy?: string
  rarity?: string
  oneTimeOnly?: boolean
  argEventId?: string
}

interface RealWorldItemCrafterProps {
  maxHeight?: string
  onItemCrafted?: (item: RealWorldItem) => void
  onItemDeployed?: (item: RealWorldItem) => void
}

const ITEM_TYPES = [
  { value: 'tool', label: 'Tool', emoji: '🔧' },
  { value: 'intel', label: 'Intel', emoji: '📋' },
  { value: 'evidence', label: 'Evidence', emoji: '🔍' },
  { value: 'key', label: 'Key Item', emoji: '🔑' },
  { value: 'equipment', label: 'Equipment', emoji: '📦' },
  { value: 'consumable', label: 'Consumable', emoji: '💊' },
  { value: 'collectible', label: 'Collectible', emoji: '⭐' }
]

const RARITY_OPTIONS = [
  { value: 'common', label: 'Common', color: 'bg-muted' },
  { value: 'uncommon', label: 'Uncommon', color: 'bg-primary/20' },
  { value: 'rare', label: 'Rare', color: 'bg-blue-500/20' },
  { value: 'epic', label: 'Epic', color: 'bg-purple-500/20' },
  { value: 'legendary', label: 'Legendary', color: 'bg-accent' },
  { value: 'unique', label: 'Unique', color: 'bg-destructive/20' }
]

export function RealWorldItemCrafter({ 
  maxHeight = '600px',
  onItemCrafted,
  onItemDeployed
}: RealWorldItemCrafterProps) {
  const [items, setItems] = useKV<RealWorldItem[]>('real-world-items', [])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [photoUploadInput, setPhotoUploadInput] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])

  const [itemData, setItemData] = useState({
    name: '',
    emoji: '📦',
    type: 'equipment',
    description: '',
    rarity: 'common',
    oneTimeOnly: true
  })

  const [businessData, setBusinessData] = useState({
    businessName: '',
    ownerName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    notes: '',
    gridX: 0,
    gridY: 0,
    latitude: 40.7128,
    longitude: -74.0060
  })

  const handleAddPhoto = () => {
    if (!photoUploadInput.trim()) {
      toast.error('Please enter a photo URL or file path')
      return
    }

    if (photoUrls.includes(photoUploadInput)) {
      toast.error('Photo already added')
      return
    }

    setPhotoUrls([...photoUrls, photoUploadInput])
    setPhotoUploadInput('')
    toast.success('Photo added')
  }

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index))
  }

  const handleCraftItem = useCallback(() => {
    if (!itemData.name || !businessData.businessName || !businessData.ownerName) {
      toast.error('Item name, business name, and owner name are required')
      return
    }

    if (photoUrls.length === 0) {
      toast.error('At least one photo is required for real-world items')
      return
    }

    const businessOwner: BusinessOwnerDetails = {
      id: `BIZ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      businessName: businessData.businessName,
      ownerName: businessData.ownerName,
      contactEmail: businessData.contactEmail || undefined,
      contactPhone: businessData.contactPhone || undefined,
      address: businessData.address || undefined,
      participationDate: Date.now(),
      notes: businessData.notes || undefined,
      gridX: businessData.gridX,
      gridY: businessData.gridY,
      latitude: businessData.latitude,
      longitude: businessData.longitude
    }

    const newItem: RealWorldItem = {
      id: `RWI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      itemId: `ITM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      name: itemData.name,
      emoji: itemData.emoji,
      type: itemData.type,
      description: itemData.description || undefined,
      businessOwner,
      photos: [...photoUrls],
      createdAt: Date.now(),
      deployed: false,
      rarity: itemData.rarity,
      oneTimeOnly: itemData.oneTimeOnly
    }

    setItems((current) => [...(current || []), newItem])
    
    if (onItemCrafted) {
      onItemCrafted(newItem)
    }

    toast.success(`Crafted ${newItem.name} from ${businessOwner.businessName}`)
    
    setItemData({
      name: '',
      emoji: '📦',
      type: 'equipment',
      description: '',
      rarity: 'common',
      oneTimeOnly: true
    })
    setBusinessData({
      businessName: '',
      ownerName: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      notes: '',
      gridX: 0,
      gridY: 0,
      latitude: 40.7128,
      longitude: -74.0060
    })
    setPhotoUrls([])
    setCreateDialogOpen(false)
  }, [itemData, businessData, photoUrls, setItems, onItemCrafted])

  const handleDeployItem = useCallback((itemId: string) => {
    setItems((current) => {
      return (current || []).map(item => {
        if (item.id === itemId && !item.deployed) {
          const updatedItem = {
            ...item,
            deployed: true,
            deployedAt: Date.now()
          }
          
          if (onItemDeployed) {
            onItemDeployed(updatedItem)
          }
          
          toast.success(`${item.name} deployed to field`)
          return updatedItem
        }
        return item
      })
    })
  }, [setItems, onItemDeployed])

  const handleRetrieveItem = useCallback((itemId: string, retrievedBy: string) => {
    setItems((current) => {
      return (current || []).map(item => {
        if (item.id === itemId && item.deployed) {
          const updatedItem = {
            ...item,
            retrievedAt: Date.now(),
            retrievedBy
          }
          
          toast.success(`${item.name} retrieved by ${retrievedBy}`)
          return updatedItem
        }
        return item
      })
    })
  }, [setItems])

  const handleDeleteItem = useCallback((itemId: string) => {
    const item = items?.find(i => i.id === itemId)
    if (item?.deployed) {
      toast.error('Cannot delete deployed items')
      return
    }

    setItems((current) => (current || []).filter(i => i.id !== itemId))
    toast.success('Item deleted')
  }, [items, setItems])

  const getStatusBadge = (item: RealWorldItem) => {
    if (item.retrievedAt) {
      return <Badge variant="outline" className="text-primary border-primary">Retrieved</Badge>
    }
    if (item.deployed) {
      return <Badge variant="default" className="bg-accent text-accent-foreground">Deployed</Badge>
    }
    return <Badge variant="secondary">Crafted</Badge>
  }

  return (
    <Card className="border-primary/30 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Real World Item Crafter</span>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 text-xs">
              <Plus weight="bold" size={14} className="mr-1" />
              Craft Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-sm tracking-wider">CRAFT REAL-WORLD ITEM</DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 pb-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Package weight="bold" className="text-primary" size={16} />
                    <span className="text-xs tracking-[0.08em] uppercase text-muted-foreground">Item Details</span>
                  </div>
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-[10px] tracking-wider">Item Name</Label>
                      <Input
                        value={itemData.name}
                        onChange={(e) => setItemData({ ...itemData, name: e.target.value })}
                        placeholder="Enter item name"
                        className="h-8 text-xs"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-[10px] tracking-wider">Emoji</Label>
                      <Input
                        value={itemData.emoji}
                        onChange={(e) => setItemData({ ...itemData, emoji: e.target.value })}
                        placeholder="📦"
                        className="h-8 text-xs"
                        maxLength={2}
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-[10px] tracking-wider">Type</Label>
                      <Select value={itemData.type} onValueChange={(value) => setItemData({ ...itemData, type: value })}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ITEM_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value} className="text-xs">
                              {type.emoji} {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] tracking-wider">Rarity</Label>
                      <Select value={itemData.rarity} onValueChange={(value) => setItemData({ ...itemData, rarity: value })}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RARITY_OPTIONS.map(rarity => (
                            <SelectItem key={rarity.value} value={rarity.value} className="text-xs">
                              {rarity.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={itemData.oneTimeOnly}
                        onCheckedChange={(checked) => setItemData({ ...itemData, oneTimeOnly: checked })}
                      />
                      <Label className="text-[10px] tracking-wider">One-Time Only</Label>
                    </div>
                    
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-[10px] tracking-wider">Description</Label>
                      <Textarea
                        value={itemData.description}
                        onChange={(e) => setItemData({ ...itemData, description: e.target.value })}
                        placeholder="Enter item description"
                        className="min-h-[60px] text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building weight="bold" className="text-primary" size={16} />
                    <span className="text-xs tracking-[0.08em] uppercase text-muted-foreground">Business Owner Details</span>
                  </div>
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-[10px] tracking-wider">Business Name *</Label>
                      <Input
                        value={businessData.businessName}
                        onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
                        placeholder="Joe's Coffee Shop"
                        className="h-8 text-xs"
                      />
                    </div>
                    
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-[10px] tracking-wider">Owner Name *</Label>
                      <Input
                        value={businessData.ownerName}
                        onChange={(e) => setBusinessData({ ...businessData, ownerName: e.target.value })}
                        placeholder="Joe Smith"
                        className="h-8 text-xs"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-[10px] tracking-wider">Contact Email</Label>
                      <Input
                        value={businessData.contactEmail}
                        onChange={(e) => setBusinessData({ ...businessData, contactEmail: e.target.value })}
                        placeholder="joe@coffeeshop.com"
                        type="email"
                        className="h-8 text-xs"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-[10px] tracking-wider">Contact Phone</Label>
                      <Input
                        value={businessData.contactPhone}
                        onChange={(e) => setBusinessData({ ...businessData, contactPhone: e.target.value })}
                        placeholder="555-0123"
                        type="tel"
                        className="h-8 text-xs"
                      />
                    </div>
                    
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-[10px] tracking-wider">Address</Label>
                      <Input
                        value={businessData.address}
                        onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                        placeholder="123 Main Street, City, State"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] tracking-wider">Grid X</Label>
                      <Input
                        value={businessData.gridX}
                        onChange={(e) => setBusinessData({ ...businessData, gridX: parseInt(e.target.value) || 0 })}
                        type="number"
                        min={0}
                        max={7}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] tracking-wider">Grid Y</Label>
                      <Input
                        value={businessData.gridY}
                        onChange={(e) => setBusinessData({ ...businessData, gridY: parseInt(e.target.value) || 0 })}
                        type="number"
                        min={0}
                        max={7}
                        className="h-8 text-xs"
                      />
                    </div>
                    
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-[10px] tracking-wider">Participation Notes</Label>
                      <Textarea
                        value={businessData.notes}
                        onChange={(e) => setBusinessData({ ...businessData, notes: e.target.value })}
                        placeholder="Special arrangements, participation details, etc."
                        className="min-h-[60px] text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Camera weight="bold" className="text-primary" size={16} />
                    <span className="text-xs tracking-[0.08em] uppercase text-muted-foreground">Photos *</span>
                  </div>
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={photoUploadInput}
                        onChange={(e) => setPhotoUploadInput(e.target.value)}
                        placeholder="Enter photo URL or path (e.g., /assets/images/item-photo.jpg)"
                        className="h-8 text-xs flex-1"
                      />
                      <Button size="sm" onClick={handleAddPhoto} className="h-8 text-xs">
                        <Plus weight="bold" size={14} />
                      </Button>
                    </div>

                    {photoUrls.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-wider">Added Photos ({photoUrls.length})</Label>
                        <ScrollArea className="h-32">
                          <div className="space-y-1.5">
                            {photoUrls.map((url, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                                <Camera weight="bold" className="text-primary" size={12} />
                                <span className="flex-1 font-mono truncate">{url}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemovePhoto(index)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash weight="bold" size={12} className="text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-4 border-t">
              <Button size="sm" variant="outline" onClick={() => setCreateDialogOpen(false)} className="flex-1 text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleCraftItem} className="flex-1 text-xs">
                <Building weight="bold" size={14} className="mr-1" />
                Craft Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="mb-4" />

      <ScrollArea style={{ maxHeight }}>
        <div className="space-y-3 pr-2">
          {(!items || items.length === 0) && (
            <div className="text-center text-xs text-muted-foreground py-8">
              No real-world items crafted yet
            </div>
          )}

          {items?.map((item) => (
            <Card key={item.id} className="border-border p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className="text-2xl flex-shrink-0">{item.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{item.name}</div>
                    <div className="text-[10px] text-muted-foreground">ID: {item.itemId}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {getStatusBadge(item)}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building weight="bold" className="text-primary" size={12} />
                  <span className="text-[10px] tracking-wider uppercase text-muted-foreground">Business Owner</span>
                </div>
                <div className="text-xs space-y-1 pl-5">
                  <div className="font-bold">{item.businessOwner.businessName}</div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <User weight="bold" size={10} />
                    {item.businessOwner.ownerName}
                  </div>
                  {item.businessOwner.contactEmail && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <EnvelopeSimple weight="bold" size={10} />
                      {item.businessOwner.contactEmail}
                    </div>
                  )}
                  {item.businessOwner.contactPhone && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone weight="bold" size={10} />
                      {item.businessOwner.contactPhone}
                    </div>
                  )}
                  {item.businessOwner.address && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin weight="bold" size={10} />
                      {item.businessOwner.address}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <CalendarBlank weight="bold" size={10} />
                    {new Date(item.businessOwner.participationDate).toLocaleDateString()}
                  </div>
                  {item.businessOwner.gridX !== undefined && item.businessOwner.gridY !== undefined && (
                    <div className="text-[10px]">
                      Grid: {String.fromCharCode(65 + item.businessOwner.gridX)}{item.businessOwner.gridY + 1}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Camera weight="bold" className="text-primary" size={12} />
                  <span className="text-[10px] tracking-wider uppercase text-muted-foreground">Photos ({item.photos.length})</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {item.photos.slice(0, 3).map((photo, index) => (
                    <div key={index} className="aspect-square bg-muted rounded flex items-center justify-center text-[10px] text-muted-foreground p-1 break-all">
                      📷 {index + 1}
                    </div>
                  ))}
                  {item.photos.length > 3 && (
                    <div className="aspect-square bg-muted rounded flex items-center justify-center text-[10px] text-muted-foreground">
                      +{item.photos.length - 3}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {!item.deployed && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleDeployItem(item.id)}
                      className="flex-1 h-7 text-xs"
                    >
                      Deploy
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteItem(item.id)}
                      className="h-7 text-xs px-2"
                    >
                      <Trash weight="bold" size={12} />
                    </Button>
                  </>
                )}
                {item.deployed && !item.retrievedAt && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const retrievedBy = prompt('Enter callsign of retrieving agent:')
                      if (retrievedBy) {
                        handleRetrieveItem(item.id, retrievedBy)
                      }
                    }}
                    className="flex-1 h-7 text-xs"
                  >
                    Mark Retrieved
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}
