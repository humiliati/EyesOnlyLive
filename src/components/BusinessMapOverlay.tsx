import { useMemo, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building, Package, MapPin } from '@phosphor-icons/react'
import { type BusinessPartner } from '@/components/BusinessPartnershipDirectory'
import { type RealWorldItem } from '@/components/RealWorldItemCrafter'
import { toast } from 'sonner'

interface BusinessMapOverlayProps {
  maxHeight?: string
  onBusinessClick?: (businessId: string) => void
  onNavigateToGrid?: (gridX: number, gridY: number) => void
  onItemDroppedOnGrid?: (item: RealWorldItem, gridX: number, gridY: number) => void
}

export function BusinessMapOverlay({ 
  maxHeight = '400px',
  onBusinessClick,
  onNavigateToGrid,
  onItemDroppedOnGrid
}: BusinessMapOverlayProps) {
  const [businesses] = useKV<BusinessPartner[]>('business-partners', [])
  const [items] = useKV<RealWorldItem[]>('real-world-items', [])
  const [dragOverGrid, setDragOverGrid] = useState<{ x: number; y: number } | null>(null)

  const gridSize = 8

  const gridData = useMemo(() => {
    const grid: Map<string, { businesses: BusinessPartner[]; itemCount: number }> = new Map()

    businesses?.forEach(business => {
      if (business.gridX !== undefined && business.gridY !== undefined) {
        const key = `${business.gridX},${business.gridY}`
        const existing = grid.get(key) || { businesses: [], itemCount: 0 }
        existing.businesses.push(business)
        grid.set(key, existing)
      }
    })

    items?.forEach(item => {
      if (item.businessOwner.gridX !== undefined && item.businessOwner.gridY !== undefined) {
        const key = `${item.businessOwner.gridX},${item.businessOwner.gridY}`
        const existing = grid.get(key)
        if (existing) {
          existing.itemCount++
        }
      }
    })

    return grid
  }, [businesses, items])

  const handleDrop = (e: React.DragEvent, gridX: number, gridY: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverGrid(null)

    try {
      const itemData = e.dataTransfer.getData('application/json')
      if (itemData) {
        const item: RealWorldItem = JSON.parse(itemData)
        if (onItemDroppedOnGrid) {
          onItemDroppedOnGrid(item, gridX, gridY)
        }
        toast.success(`${item.emoji} ${item.name} dropped on Grid ${String.fromCharCode(65 + gridX)}${gridY + 1}`)
      }
    } catch (error) {
      toast.error('Failed to drop item')
    }
  }

  const handleDragOver = (e: React.DragEvent, gridX: number, gridY: number) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    setDragOverGrid({ x: gridX, y: gridY })
  }

  const handleDragLeave = () => {
    setDragOverGrid(null)
  }

  const renderGridCell = (gridX: number, gridY: number) => {
    const key = `${gridX},${gridY}`
    const data = gridData.get(key)
    const isDragOver = dragOverGrid?.x === gridX && dragOverGrid?.y === gridY
    
    if (!data || data.businesses.length === 0) {
      return (
        <div 
          className={`w-full h-full border border-border/30 flex items-center justify-center transition-all ${
            isDragOver 
              ? 'bg-primary/30 border-primary border-2 scale-95' 
              : 'bg-muted/20'
          }`}
          onDrop={(e) => handleDrop(e, gridX, gridY)}
          onDragOver={(e) => handleDragOver(e, gridX, gridY)}
          onDragLeave={handleDragLeave}
        >
          <span className="text-[8px] text-muted-foreground opacity-50">
            {String.fromCharCode(65 + gridX)}{gridY + 1}
          </span>
        </div>
      )
    }

    return (
      <div 
        className={`w-full h-full border-2 hover:bg-accent/30 cursor-pointer transition-all relative group ${
          isDragOver 
            ? 'bg-primary/40 border-primary scale-95' 
            : 'bg-accent/20 border-accent'
        }`}
        onClick={() => {
          onNavigateToGrid?.(gridX, gridY)
          if (data.businesses.length === 1) {
            onBusinessClick?.(data.businesses[0].id)
          }
        }}
        onDrop={(e) => handleDrop(e, gridX, gridY)}
        onDragOver={(e) => handleDragOver(e, gridX, gridY)}
        onDragLeave={handleDragLeave}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-0.5">
          <div className="flex items-center gap-0.5 mb-0.5">
            <Building weight="bold" className="text-accent" size={10} />
            <span className="text-[9px] font-bold text-accent">{data.businesses.length}</span>
          </div>
          {data.itemCount > 0 && (
            <Badge className="bg-primary text-primary-foreground text-[7px] px-1 py-0 h-3">
              {data.itemCount} 📦
            </Badge>
          )}
        </div>
        
        <div className="absolute top-0.5 left-0.5">
          <span className="text-[7px] text-muted-foreground font-mono">
            {String.fromCharCode(65 + gridX)}{gridY + 1}
          </span>
        </div>

        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-card border border-accent rounded shadow-lg p-1.5 text-[9px] w-32 z-10">
            <div className="font-bold mb-1">Businesses:</div>
            {data.businesses.map(b => (
              <div key={b.id} className="truncate text-[8px] text-muted-foreground">
                • {b.businessName}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="border-primary/30 p-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin weight="bold" className="text-primary" size={16} />
        <span className="text-xs tracking-[0.08em] uppercase">Business Map Overview</span>
      </div>

      <div 
        className="grid gap-1"
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          maxHeight 
        }}
      >
        {Array.from({ length: gridSize * gridSize }, (_, index) => {
          const gridX = index % gridSize
          const gridY = Math.floor(index / gridSize)
          return (
            <div 
              key={`${gridX}-${gridY}`}
              className="aspect-square"
            >
              {renderGridCell(gridX, gridY)}
            </div>
          )
        })}
      </div>

      <div className="mt-3 text-[10px] text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-accent/20 border-2 border-accent rounded" />
            <span>Business Location</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-muted/20 border border-border/30 rounded" />
            <span>Empty</span>
          </div>
        </div>
        <div className="font-mono">
          {gridData.size} active grids
        </div>
      </div>

      <div className="mt-2 p-2 bg-primary/10 border border-primary/30 rounded text-[10px] text-primary">
        <div className="flex items-center gap-1 font-bold mb-0.5">
          <Package weight="bold" size={12} />
          <span>Drag & Drop Items</span>
        </div>
        <div className="text-[9px] text-muted-foreground">
          Drag real-world items from inventory onto the map to deploy them to specific business locations
        </div>
      </div>
    </Card>
  )
}
