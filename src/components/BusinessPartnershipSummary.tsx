import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Building, Package, CheckCircle, Clock, MapPin, TrendUp } from '@phosphor-icons/react'
import { type RealWorldItem } from '@/components/RealWorldItemCrafter'

interface BusinessPartnershipSummaryProps {
  maxHeight?: string
}

export function BusinessPartnershipSummary({ maxHeight = '400px' }: BusinessPartnershipSummaryProps) {
  const [items] = useKV<RealWorldItem[]>('real-world-items', [])

  const stats = {
    totalBusinesses: new Set(items?.map(i => i.businessOwner.id) || []).size,
    totalItems: items?.length || 0,
    craftedItems: items?.filter(i => !i.deployed).length || 0,
    deployedItems: items?.filter(i => i.deployed && !i.retrievedAt).length || 0,
    retrievedItems: items?.filter(i => i.retrievedAt).length || 0,
    totalPhotos: items?.reduce((acc, item) => acc + item.photos.length, 0) || 0
  }

  const businessList = Array.from(
    new Map(
      items?.map(item => [
        item.businessOwner.id,
        {
          ...item.businessOwner,
          itemCount: items.filter(i => i.businessOwner.id === item.businessOwner.id).length,
          deployedCount: items.filter(i => i.businessOwner.id === item.businessOwner.id && i.deployed).length,
          retrievedCount: items.filter(i => i.businessOwner.id === item.businessOwner.id && i.retrievedAt).length
        }
      ]) || []
    ).values()
  )

  const getParticipationLevel = (itemCount: number): { label: string; color: string } => {
    if (itemCount >= 5) return { label: 'Elite', color: 'bg-accent text-accent-foreground' }
    if (itemCount >= 3) return { label: 'Active', color: 'bg-primary text-primary-foreground' }
    if (itemCount >= 1) return { label: 'Partner', color: 'bg-secondary text-secondary-foreground' }
    return { label: 'New', color: 'bg-muted text-muted-foreground' }
  }

  return (
    <Card className="border-primary/30 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Building weight="bold" className="text-primary" size={16} />
        <span className="text-xs tracking-[0.08em] uppercase">Business Partnership Summary</span>
      </div>

      <Separator className="mb-4" />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="border-border p-3 space-y-1">
          <div className="text-[10px] tracking-wider uppercase text-muted-foreground">Businesses</div>
          <div className="flex items-baseline gap-1">
            <div className="text-2xl font-bold tabular-nums">{stats.totalBusinesses}</div>
            <Building weight="bold" className="text-primary" size={12} />
          </div>
        </Card>

        <Card className="border-border p-3 space-y-1">
          <div className="text-[10px] tracking-wider uppercase text-muted-foreground">Total Items</div>
          <div className="flex items-baseline gap-1">
            <div className="text-2xl font-bold tabular-nums">{stats.totalItems}</div>
            <Package weight="bold" className="text-primary" size={12} />
          </div>
        </Card>

        <Card className="border-border p-3 space-y-1">
          <div className="text-[10px] tracking-wider uppercase text-muted-foreground">Photos</div>
          <div className="flex items-baseline gap-1">
            <div className="text-2xl font-bold tabular-nums">{stats.totalPhotos}</div>
            <span className="text-[10px] text-muted-foreground">📸</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-muted rounded">
          <div className="text-lg font-bold tabular-nums">{stats.craftedItems}</div>
          <div className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
            <Clock weight="bold" size={10} />
            Crafted
          </div>
        </div>
        <div className="text-center p-2 bg-accent/20 rounded">
          <div className="text-lg font-bold tabular-nums">{stats.deployedItems}</div>
          <div className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
            <TrendUp weight="bold" size={10} />
            Deployed
          </div>
        </div>
        <div className="text-center p-2 bg-primary/20 rounded">
          <div className="text-lg font-bold tabular-nums">{stats.retrievedItems}</div>
          <div className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
            <CheckCircle weight="bold" size={10} />
            Retrieved
          </div>
        </div>
      </div>

      <Separator className="mb-4" />

      <div className="space-y-2 mb-2">
        <div className="text-[10px] tracking-wider uppercase text-muted-foreground">Business Partners</div>
      </div>

      <ScrollArea style={{ maxHeight }}>
        <div className="space-y-2 pr-2">
          {businessList.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-4">
              No business partners yet
            </div>
          )}

          {businessList.map((business) => {
            const participation = getParticipationLevel(business.itemCount)
            return (
              <Card key={business.id} className="border-border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{business.businessName}</div>
                    <div className="text-xs text-muted-foreground truncate">{business.ownerName}</div>
                  </div>
                  <Badge className={`${participation.color} text-[9px] px-2 py-0 flex-shrink-0`}>
                    {participation.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-bold tabular-nums">{business.itemCount}</div>
                    <div className="text-[9px] text-muted-foreground">Items</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold tabular-nums">{business.deployedCount}</div>
                    <div className="text-[9px] text-muted-foreground">Deployed</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold tabular-nums">{business.retrievedCount}</div>
                    <div className="text-[9px] text-muted-foreground">Retrieved</div>
                  </div>
                </div>

                {(business.address || (business.gridX !== undefined && business.gridY !== undefined)) && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      {business.address && (
                        <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                          <MapPin weight="bold" className="text-primary flex-shrink-0 mt-0.5" size={10} />
                          <span className="break-all">{business.address}</span>
                        </div>
                      )}
                      {business.gridX !== undefined && business.gridY !== undefined && (
                        <div className="text-[10px] text-muted-foreground">
                          Grid: {String.fromCharCode(65 + business.gridX)}{business.gridY + 1}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {business.notes && (
                  <>
                    <Separator />
                    <div className="text-[10px] text-muted-foreground italic">
                      {business.notes.length > 100 
                        ? `${business.notes.substring(0, 100)}...` 
                        : business.notes}
                    </div>
                  </>
                )}
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
}
