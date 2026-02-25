import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, MapPin, Warning, ClockCountdown, CheckCircle } from '@phosphor-icons/react'
import type { EquipmentItem } from './EquipmentInventory'

interface EquipmentMapOverlayProps {
  equipment: EquipmentItem[]
  onItemClick?: (item: EquipmentItem) => void
  maxHeight?: string
}

export function EquipmentMapOverlay({ equipment, onItemClick, maxHeight = '400px' }: EquipmentMapOverlayProps) {
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const deployedEquipment = equipment.filter(item => 
    item.status === 'deployed' && (item.gridX !== undefined || item.latitude !== undefined)
  )

  const expiredEquipment = deployedEquipment.filter(item => 
    item.expirationTime && item.expirationTime < Date.now()
  )

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

  const getDeploymentTypeColor = (type?: string) => {
    switch (type) {
      case 'dead-drop': return 'bg-accent text-accent-foreground'
      case 'geocache': return 'bg-primary text-primary-foreground'
      case 'agent': return 'bg-secondary text-secondary-foreground'
      case 'location': return 'bg-muted text-muted-foreground'
      default: return 'bg-muted text-muted-foreground'
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

  const handleItemClick = (item: EquipmentItem) => {
    setSelectedItem(item)
    setDetailsOpen(true)
    if (onItemClick) {
      onItemClick(item)
    }
  }

  return (
    <>
      <Card className="border-primary/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin weight="bold" className="text-primary" size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Deployed Equipment</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[9px] px-2 py-0.5">
              {deployedEquipment.length} ITEMS
            </Badge>
            {expiredEquipment.length > 0 && (
              <Badge className="bg-destructive text-destructive-foreground text-[9px] px-2 py-0.5 animate-pulse">
                <Warning weight="bold" size={10} className="mr-1" />
                {expiredEquipment.length}
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea style={{ maxHeight }} className="pr-3">
          <div className="space-y-2">
            {deployedEquipment.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package weight="bold" size={32} className="mx-auto mb-2 opacity-50" />
                <div className="text-xs">No deployed equipment</div>
                <div className="text-[10px]">Deploy items to track locations</div>
              </div>
            ) : (
              deployedEquipment.map(item => (
                <Card
                  key={item.id}
                  className={`p-3 space-y-2 border-border hover:border-primary/50 transition-colors cursor-pointer ${
                    isExpired(item) ? 'border-destructive/50 bg-destructive/5' : ''
                  }`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getCategoryIcon(item.category)}</span>
                      <div>
                        <div className="text-xs font-bold">{item.name}</div>
                        <div className="text-[9px] font-mono text-muted-foreground">{item.serialNumber}</div>
                      </div>
                    </div>
                    {isExpired(item) && (
                      <Badge className="bg-destructive text-destructive-foreground text-[8px] px-1.5 py-0 animate-pulse">
                        <ClockCountdown weight="bold" size={10} className="mr-1" />
                        EXPIRED
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={`${getDeploymentTypeColor(item.assignedToType)} text-[8px] px-1.5 py-0`}>
                      {item.assignedToType?.toUpperCase()}
                    </Badge>
                    {item.encrypted && (
                      <Badge variant="outline" className="text-[7px] px-1 py-0 border-primary text-primary">
                        🔒 ENC
                      </Badge>
                    )}
                  </div>

                  {item.assignedToName && (
                    <div className="text-[10px] text-muted-foreground">
                      <span className="uppercase tracking-wider">{item.assignedToType}:</span>{' '}
                      <span className="text-primary font-medium">{item.assignedToName}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px]">
                    {item.gridX !== undefined && item.gridY !== undefined && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin weight="bold" size={10} />
                        <span>Grid: {String.fromCharCode(65 + item.gridX)}{item.gridY + 1}</span>
                      </div>
                    )}
                    {item.deployedAt && (
                      <div className="text-muted-foreground">
                        {formatTimestamp(item.deployedAt)}
                      </div>
                    )}
                  </div>

                  {item.expirationTime && (
                    <div className={`text-[10px] flex items-center gap-1 ${
                      isExpired(item) ? 'text-destructive font-bold' : 'text-muted-foreground'
                    }`}>
                      <ClockCountdown weight="bold" size={10} />
                      <span>Expires: {formatTimestamp(item.expirationTime)}</span>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm tracking-wider flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(selectedItem.category)}</span>
                  {selectedItem.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Serial Number</div>
                  <div className="text-xs font-mono">{selectedItem.serialNumber}</div>
                </div>

                {selectedItem.assignedToName && (
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Deployment</div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getDeploymentTypeColor(selectedItem.assignedToType)} text-[9px]`}>
                        {selectedItem.assignedToType?.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-primary font-medium">{selectedItem.assignedToName}</span>
                    </div>
                  </div>
                )}

                {(selectedItem.gridX !== undefined || selectedItem.latitude !== undefined) && (
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Location</div>
                    <div className="text-xs space-y-1">
                      {selectedItem.gridX !== undefined && selectedItem.gridY !== undefined && (
                        <div className="flex items-center gap-1">
                          <MapPin weight="bold" size={12} className="text-primary" />
                          <span>Grid: {String.fromCharCode(65 + selectedItem.gridX)}{selectedItem.gridY + 1}</span>
                        </div>
                      )}
                      {selectedItem.latitude !== undefined && selectedItem.longitude !== undefined && (
                        <div className="font-mono text-[10px]">
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

                <div className="grid grid-cols-2 gap-3">
                  {selectedItem.deployedAt && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Deployed</div>
                      <div className="text-xs">{formatTimestamp(selectedItem.deployedAt)}</div>
                    </div>
                  )}
                  {selectedItem.expirationTime && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Expires</div>
                      <div className={`text-xs ${isExpired(selectedItem) ? 'text-destructive font-bold' : ''}`}>
                        {formatTimestamp(selectedItem.expirationTime)}
                        {isExpired(selectedItem) && ' (EXPIRED)'}
                      </div>
                    </div>
                  )}
                </div>

                {selectedItem.notes && (
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Notes</div>
                    <div className="text-xs">{selectedItem.notes}</div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {selectedItem.encrypted && (
                    <Badge variant="outline" className="text-[8px] border-primary text-primary">
                      🔒 ENCRYPTED
                    </Badge>
                  )}
                  {selectedItem.requiresAcknowledgment && (
                    <Badge variant="outline" className="text-[8px]">
                      <CheckCircle weight="bold" size={10} className="mr-1" />
                      REQUIRES ACK
                    </Badge>
                  )}
                  {isExpired(selectedItem) && (
                    <Badge className="bg-destructive text-destructive-foreground text-[8px]">
                      <Warning weight="bold" size={10} className="mr-1" />
                      EXPIRED
                    </Badge>
                  )}
                </div>
              </div>

              <Button onClick={() => setDetailsOpen(false)} className="w-full text-xs">
                CLOSE
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
