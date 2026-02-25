import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Backpack, MapPin, User, Warning, ArrowsLeftRight, HandGrabbing } from '@phosphor-icons/react'
import { liveArgSync } from '@/lib/liveArgSync'
import { rogueItemRegistry, type RogueItem } from '@/lib/goneRogueDataRegistry'
import { type AssetLocation } from '@/components/GlobalAssetMap'
import { toast } from 'sonner'

interface AgentInventoryViewerProps {
  assets: AssetLocation[]
  currentAgentId: string
  maxHeight?: string
  onItemTransferred?: (fromAgent: string, toAgent: string, itemId: string) => void
}

const RARITY_COLORS = {
  common: 'bg-muted text-muted-foreground',
  uncommon: 'bg-primary/20 text-primary',
  rare: 'bg-blue-500/20 text-blue-400',
  epic: 'bg-purple-500/20 text-purple-400',
  legendary: 'bg-accent text-accent-foreground',
  unique: 'bg-destructive/20 text-destructive'
}

export function AgentInventoryViewer({ 
  assets, 
  currentAgentId, 
  maxHeight = '600px',
  onItemTransferred 
}: AgentInventoryViewerProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(currentAgentId)
  const [inventory, setInventory] = useState<RogueItem[]>([])
  const [draggedItem, setDraggedItem] = useState<{ itemId: string; sourceAgentId: string } | null>(null)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [transferTargetAgentId, setTransferTargetAgentId] = useState<string>('')
  const [itemToTransfer, setItemToTransfer] = useState<string>('')

  useEffect(() => {
    loadInventory(selectedAgentId)
  }, [selectedAgentId])

  useEffect(() => {
    rogueItemRegistry.load()
  }, [])

  const loadInventory = async (agentId: string) => {
    const itemIds = await liveArgSync.getAgentInventory(agentId)
    const items = itemIds.map(id => rogueItemRegistry.getItem(id)).filter((item): item is RogueItem => item !== undefined)
    setInventory(items)
  }

  const handleDragStart = (itemId: string, sourceAgentId: string) => {
    setDraggedItem({ itemId, sourceAgentId })
    toast('Drag item to another agent to transfer', { duration: 2000 })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetAgentId: string) => {
    if (!draggedItem) return
    
    if (draggedItem.sourceAgentId === targetAgentId) {
      toast.error('Cannot transfer to same agent')
      setDraggedItem(null)
      return
    }

    try {
      await liveArgSync.removeItemFromInventory(draggedItem.sourceAgentId, draggedItem.itemId)
      await liveArgSync.addItemToInventory(targetAgentId, draggedItem.itemId)
      
      const item = rogueItemRegistry.getItem(draggedItem.itemId)
      const sourceAsset = assets.find(a => a.agentId === draggedItem.sourceAgentId)
      const targetAsset = assets.find(a => a.agentId === targetAgentId)
      
      toast.success(`${item?.name} transferred from ${sourceAsset?.callsign} to ${targetAsset?.callsign}`)
      
      if (onItemTransferred) {
        onItemTransferred(draggedItem.sourceAgentId, targetAgentId, draggedItem.itemId)
      }
      
      loadInventory(selectedAgentId)
    } catch (error) {
      toast.error('Failed to transfer item')
      console.error(error)
    }
    
    setDraggedItem(null)
  }

  const handleTransferClick = (itemId: string) => {
    setItemToTransfer(itemId)
    setTransferDialogOpen(true)
  }

  const handleConfirmTransfer = async () => {
    if (!transferTargetAgentId || !itemToTransfer) return
    
    try {
      await liveArgSync.removeItemFromInventory(selectedAgentId, itemToTransfer)
      await liveArgSync.addItemToInventory(transferTargetAgentId, itemToTransfer)
      
      const item = rogueItemRegistry.getItem(itemToTransfer)
      const sourceAsset = assets.find(a => a.agentId === selectedAgentId)
      const targetAsset = assets.find(a => a.agentId === transferTargetAgentId)
      
      toast.success(`${item?.name} transferred from ${sourceAsset?.callsign} to ${targetAsset?.callsign}`)
      
      if (onItemTransferred) {
        onItemTransferred(selectedAgentId, transferTargetAgentId, itemToTransfer)
      }
      
      loadInventory(selectedAgentId)
      setTransferDialogOpen(false)
      setTransferTargetAgentId('')
      setItemToTransfer('')
    } catch (error) {
      toast.error('Failed to transfer item')
      console.error(error)
    }
  }

  const selectedAsset = assets.find(a => a.agentId === selectedAgentId)

  return (
    <>
      <Card className="border-primary/30">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Backpack weight="bold" className="text-primary" size={20} />
              <span className="text-sm font-bold tracking-wider">AGENT INVENTORY</span>
            </div>
            <Badge variant="outline" className="text-[10px] tabular-nums">
              {inventory.length} ITEM{inventory.length !== 1 ? 'S' : ''}
            </Badge>
          </div>

          <div className="flex gap-2 flex-wrap">
            {assets.map((asset) => (
              <Button
                key={asset.agentId}
                size="sm"
                variant={selectedAgentId === asset.agentId ? 'default' : 'outline'}
                onClick={() => setSelectedAgentId(asset.agentId)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(asset.agentId)}
                className="text-[10px] h-7 px-2"
              >
                {asset.callsign}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea style={{ maxHeight }}>
          <div className="p-4 space-y-2">
            {selectedAsset && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded border border-border mb-3">
                <User weight="bold" className="text-primary" size={20} />
                <div className="flex-1">
                  <div className="font-bold text-sm">{selectedAsset.callsign}</div>
                  <div className="text-[10px] text-muted-foreground">
                    Grid {String.fromCharCode(65 + selectedAsset.gridX)}{selectedAsset.gridY + 1}
                  </div>
                </div>
                <Badge variant="outline" className={`text-[9px] ${
                  selectedAsset.status === 'active' ? 'text-primary' :
                  selectedAsset.status === 'alert' ? 'text-destructive' :
                  'text-accent'
                }`}>
                  {selectedAsset.status}
                </Badge>
              </div>
            )}

            {inventory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Backpack weight="bold" className="mx-auto mb-2 opacity-50" size={32} />
                <div>No items in inventory</div>
                <div className="text-xs mt-1">Items from dead drops will appear here</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
                  <HandGrabbing weight="bold" size={12} />
                  <span>Drag items between agents to transfer</span>
                </div>
                {inventory.map((item) => (
                  <Card 
                    key={item.id} 
                    className="p-3 border-primary/20 cursor-move hover:border-primary/50 transition-colors"
                    draggable
                    onDragStart={() => handleDragStart(item.id, selectedAgentId)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-3xl">{item.emoji}</div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{item.name}</div>
                          {item.description && (
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {item.description}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              {item.type}
                            </Badge>
                            {item.rarity && (
                              <Badge className={`text-[9px] px-1.5 py-0 ${RARITY_COLORS[item.rarity]}`}>
                                {item.rarity}
                              </Badge>
                            )}
                            {item.oneTimeOnly && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-accent">
                                ONE-TIME
                              </Badge>
                            )}
                            {item.usable && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-primary">
                                USABLE
                              </Badge>
                            )}
                            {item.deployable && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-primary">
                                DEPLOYABLE
                              </Badge>
                            )}
                          </div>
                          {item.nature && Object.keys(item.nature).length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              {Object.entries(item.nature).map(([key, value]) => (
                                <div key={key} className="text-[9px] text-muted-foreground">
                                  {key}: <span className="text-primary font-bold">{value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTransferClick(item.id)}
                        className="h-8 w-8 p-0"
                      >
                        <ArrowsLeftRight weight="bold" size={14} />
                      </Button>
                    </div>
                    {item.weight !== undefined && item.value !== undefined && (
                      <>
                        <Separator className="my-2" />
                        <div className="flex items-center gap-4 text-[9px] text-muted-foreground">
                          <div>Weight: <span className="text-foreground font-bold">{item.weight}</span></div>
                          <div>Value: <span className="text-foreground font-bold">{item.value}</span></div>
                        </div>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <ArrowsLeftRight weight="bold" size={20} />
              TRANSFER ITEM
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="text-sm">
              Select target agent to transfer item:
            </div>

            <div className="space-y-2">
              {assets
                .filter(a => a.agentId !== selectedAgentId)
                .map((asset) => (
                  <Button
                    key={asset.agentId}
                    variant={transferTargetAgentId === asset.agentId ? 'default' : 'outline'}
                    onClick={() => setTransferTargetAgentId(asset.agentId)}
                    className="w-full justify-start"
                  >
                    <User weight="bold" className="mr-2" size={16} />
                    {asset.callsign}
                    <span className="ml-auto text-[10px] opacity-70">
                      Grid {String.fromCharCode(65 + asset.gridX)}{asset.gridY + 1}
                    </span>
                  </Button>
                ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setTransferDialogOpen(false)
                  setTransferTargetAgentId('')
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmTransfer}
                disabled={!transferTargetAgentId}
                className="flex-1"
              >
                Transfer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
