import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash, Package, Sparkle, Lightning, Target } from '@phosphor-icons/react'
import { liveArgSync, type ArgEvent } from '@/lib/liveArgSync'
import { type RogueItem } from '@/lib/goneRogueDataRegistry'
import { toast } from 'sonner'

interface ArgEventCreatorProps {
  onEventCreated?: (event: ArgEvent) => void
  scenarioId?: string
}

const RARITY_COLORS = {
  common: 'bg-muted text-muted-foreground',
  uncommon: 'bg-primary/20 text-primary',
  rare: 'bg-blue-500/20 text-blue-400',
  epic: 'bg-purple-500/20 text-purple-400',
  legendary: 'bg-accent text-accent-foreground',
  unique: 'bg-destructive/20 text-destructive'
}

const TYPE_ICONS = {
  tool: '🔧',
  intel: '📋',
  weapon: '🔫',
  consumable: '💊',
  key: '🔑',
  evidence: '🔍',
  equipment: '📦'
}

export function ArgEventCreator({ onEventCreated, scenarioId }: ArgEventCreatorProps) {
  const [open, setOpen] = useState(false)
  const [eventName, setEventName] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [items, setItems] = useState<Partial<RogueItem>[]>([])
  const [currentItem, setCurrentItem] = useState<Partial<RogueItem>>({
    name: '',
    emoji: '📦',
    type: 'equipment',
    rarity: 'common',
    oneTimeOnly: true
  })

  const handleAddItem = () => {
    if (!currentItem.name || !currentItem.emoji || !currentItem.type) {
      toast.error('Item requires name, emoji, and type')
      return
    }

    const newItem: RogueItem = {
      id: `ITM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      name: currentItem.name,
      emoji: currentItem.emoji,
      type: currentItem.type as RogueItem['type'],
      rarity: currentItem.rarity || 'common',
      description: currentItem.description,
      oneTimeOnly: currentItem.oneTimeOnly !== false,
      weight: currentItem.weight,
      value: currentItem.value,
      stackable: currentItem.stackable,
      maxStack: currentItem.maxStack,
      usable: currentItem.usable,
      deployable: currentItem.deployable,
      nature: currentItem.nature,
      createdAt: Date.now()
    }

    setItems([...items, newItem])
    setCurrentItem({
      name: '',
      emoji: '📦',
      type: 'equipment',
      rarity: 'common',
      oneTimeOnly: true
    })
    toast.success(`Added ${newItem.name} to event`)
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleCreateEvent = async () => {
    if (!eventName || items.length === 0) {
      toast.error('Event requires name and at least one item')
      return
    }

    try {
      const event = await liveArgSync.createArgEvent({
        name: eventName,
        description: eventDescription,
        scenarioId,
        active: true,
        items: items as RogueItem[]
      })

      toast.success(`ARG Event "${event.name}" created with ${event.items.length} items`)
      
      if (onEventCreated) {
        onEventCreated(event)
      }

      setEventName('')
      setEventDescription('')
      setItems([])
      setOpen(false)
    } catch (error) {
      toast.error('Failed to create ARG event')
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="default">
          <Sparkle weight="bold" className="mr-2" size={16} />
          CREATE ARG EVENT
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Lightning weight="bold" size={20} />
            LIVE ARG EVENT CREATOR
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-name">Event Name</Label>
                <Input
                  id="event-name"
                  placeholder="e.g., MIDNIGHT DROP ALPHA"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="font-mono uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-description">Event Description</Label>
                <Textarea
                  id="event-description"
                  placeholder="Describe the ARG event..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wider">EVENT ITEMS</h3>
                <Badge variant="outline" className="tabular-nums">
                  {items.length} ITEM{items.length !== 1 ? 'S' : ''}
                </Badge>
              </div>

              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{item.emoji}</div>
                          <div>
                            <div className="font-bold text-sm">{item.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                {item.type}
                              </Badge>
                              <Badge className={`text-[9px] px-1.5 py-0 ${RARITY_COLORS[item.rarity || 'common']}`}>
                                {item.rarity}
                              </Badge>
                              {item.oneTimeOnly && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-accent">
                                  ONE-TIME
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash weight="bold" size={14} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <Card className="p-4 border-dashed border-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold tracking-wider">
                    <Plus weight="bold" size={16} />
                    ADD NEW ITEM
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item-name">Item Name</Label>
                      <Input
                        id="item-name"
                        placeholder="FIELD RADIO"
                        value={currentItem.name}
                        onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                        className="font-mono uppercase text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="item-emoji">Emoji</Label>
                      <Input
                        id="item-emoji"
                        placeholder="📻"
                        value={currentItem.emoji}
                        onChange={(e) => setCurrentItem({ ...currentItem, emoji: e.target.value })}
                        className="text-center text-2xl"
                        maxLength={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="item-type">Type</Label>
                      <Select
                        value={currentItem.type}
                        onValueChange={(value) => setCurrentItem({ ...currentItem, type: value as RogueItem['type'] })}
                      >
                        <SelectTrigger id="item-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TYPE_ICONS).map(([type, icon]) => (
                            <SelectItem key={type} value={type}>
                              {icon} {type.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="item-rarity">Rarity</Label>
                      <Select
                        value={currentItem.rarity}
                        onValueChange={(value) => setCurrentItem({ ...currentItem, rarity: value as RogueItem['rarity'] })}
                      >
                        <SelectTrigger id="item-rarity">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="common">Common</SelectItem>
                          <SelectItem value="uncommon">Uncommon</SelectItem>
                          <SelectItem value="rare">Rare</SelectItem>
                          <SelectItem value="epic">Epic</SelectItem>
                          <SelectItem value="legendary">Legendary</SelectItem>
                          <SelectItem value="unique">Unique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="item-description">Description (Optional)</Label>
                    <Textarea
                      id="item-description"
                      placeholder="Item description..."
                      value={currentItem.description || ''}
                      onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item-weight">Weight</Label>
                      <Input
                        id="item-weight"
                        type="number"
                        placeholder="1.0"
                        value={currentItem.weight || ''}
                        onChange={(e) => setCurrentItem({ ...currentItem, weight: parseFloat(e.target.value) || undefined })}
                        step="0.1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="item-value">Value</Label>
                      <Input
                        id="item-value"
                        type="number"
                        placeholder="100"
                        value={currentItem.value || ''}
                        onChange={(e) => setCurrentItem({ ...currentItem, value: parseInt(e.target.value) || undefined })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="item-stack">Max Stack</Label>
                      <Input
                        id="item-stack"
                        type="number"
                        placeholder="1"
                        value={currentItem.maxStack || ''}
                        onChange={(e) => setCurrentItem({ ...currentItem, maxStack: parseInt(e.target.value) || undefined })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="item-onetime"
                          checked={currentItem.oneTimeOnly !== false}
                          onCheckedChange={(checked) => setCurrentItem({ ...currentItem, oneTimeOnly: checked })}
                        />
                        <Label htmlFor="item-onetime" className="text-xs">One-Time Only</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="item-stackable"
                          checked={currentItem.stackable === true}
                          onCheckedChange={(checked) => setCurrentItem({ ...currentItem, stackable: checked })}
                        />
                        <Label htmlFor="item-stackable" className="text-xs">Stackable</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="item-usable"
                          checked={currentItem.usable === true}
                          onCheckedChange={(checked) => setCurrentItem({ ...currentItem, usable: checked })}
                        />
                        <Label htmlFor="item-usable" className="text-xs">Usable</Label>
                      </div>
                    </div>

                    <Button onClick={handleAddItem} size="sm">
                      <Plus weight="bold" className="mr-1" size={14} />
                      Add Item
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateEvent}
                disabled={!eventName || items.length === 0}
                className="flex-1"
              >
                <Target weight="bold" className="mr-2" size={16} />
                Create Event
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
