import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MapTrifold, Package, Warning, ClockCountdown, Target } from '@phosphor-icons/react'
import type { EquipmentItem } from './EquipmentInventory'

interface EquipmentDeploymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableEquipment: EquipmentItem[]
  assets?: Array<{ id: string; callsign: string; agentId: string; gridX?: number; gridY?: number }>
  preselectedLocation?: { gridX: number; gridY: number }
  onDeploy: (itemId: string, deploymentData: {
    assignedTo?: string
    assignedToType: 'agent' | 'location' | 'dead-drop' | 'geocache'
    assignedToName: string
    gridX?: number
    gridY?: number
    latitude?: number
    longitude?: number
    expirationTime?: number
  }) => void
}

export function EquipmentDeploymentDialog({
  open,
  onOpenChange,
  availableEquipment,
  assets = [],
  preselectedLocation,
  onDeploy
}: EquipmentDeploymentDialogProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [deploymentType, setDeploymentType] = useState<'agent' | 'location' | 'dead-drop' | 'geocache'>('dead-drop')
  const [targetAgent, setTargetAgent] = useState<string>('')
  const [locationName, setLocationName] = useState('')
  const [gridX, setGridX] = useState<number | undefined>(preselectedLocation?.gridX)
  const [gridY, setGridY] = useState<number | undefined>(preselectedLocation?.gridY)
  const [latitude, setLatitude] = useState<string>('')
  const [longitude, setLongitude] = useState<string>('')
  const [expirationHours, setExpirationHours] = useState<string>('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (preselectedLocation) {
      setGridX(preselectedLocation.gridX)
      setGridY(preselectedLocation.gridY)
    }
  }, [preselectedLocation])

  const selectedItem = availableEquipment.find(item => item.id === selectedItemId)
  const selectedAsset = assets.find(asset => asset.agentId === targetAgent)

  const handleDeploy = () => {
    if (!selectedItemId) return
    
    let assignedTo: string | undefined
    let assignedToName: string
    let finalGridX: number | undefined
    let finalGridY: number | undefined
    let finalLatitude: number | undefined
    let finalLongitude: number | undefined

    if (deploymentType === 'agent') {
      if (!targetAgent) return
      assignedTo = targetAgent
      const asset = assets.find(a => a.agentId === targetAgent)
      assignedToName = asset?.callsign || 'Unknown Agent'
      finalGridX = asset?.gridX
      finalGridY = asset?.gridY
    } else {
      assignedToName = locationName || `${deploymentType.toUpperCase()} Location`
      finalGridX = gridX
      finalGridY = gridY
      finalLatitude = latitude ? parseFloat(latitude) : undefined
      finalLongitude = longitude ? parseFloat(longitude) : undefined
    }

    const expirationTime = expirationHours 
      ? Date.now() + (parseFloat(expirationHours) * 60 * 60 * 1000)
      : undefined

    onDeploy(selectedItemId, {
      assignedTo,
      assignedToType: deploymentType,
      assignedToName,
      gridX: finalGridX,
      gridY: finalGridY,
      latitude: finalLatitude,
      longitude: finalLongitude,
      expirationTime
    })

    setSelectedItemId('')
    setTargetAgent('')
    setLocationName('')
    setGridX(undefined)
    setGridY(undefined)
    setLatitude('')
    setLongitude('')
    setExpirationHours('')
    setNotes('')
    onOpenChange(false)
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

  const canDeploy = selectedItemId && (
    (deploymentType === 'agent' && targetAgent) ||
    (deploymentType !== 'agent' && (gridX !== undefined || latitude))
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm tracking-wider flex items-center gap-2">
            <Package weight="bold" size={16} />
            DEPLOY EQUIPMENT
          </DialogTitle>
          <DialogDescription className="text-xs">
            Deploy equipment to field locations or agents
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="equipment-select" className="text-[10px] uppercase tracking-wider">
              Select Equipment
            </Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Choose equipment item..." />
              </SelectTrigger>
              <SelectContent>
                {availableEquipment.filter(item => item.status === 'available').map(item => (
                  <SelectItem key={item.id} value={item.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span>{getCategoryIcon(item.category)}</span>
                      <span>{item.name}</span>
                      <span className="text-[9px] font-mono text-muted-foreground">({item.serialNumber})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedItem && (
            <div className="p-3 border border-primary/30 rounded-md space-y-2 bg-card/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(selectedItem.category)}</span>
                  <div>
                    <div className="text-xs font-bold">{selectedItem.name}</div>
                    <div className="text-[9px] font-mono text-muted-foreground">{selectedItem.serialNumber}</div>
                  </div>
                </div>
                <Badge className={`text-[8px] ${
                  selectedItem.priority === 'critical' ? 'bg-destructive text-destructive-foreground' :
                  selectedItem.priority === 'high' ? 'bg-accent text-accent-foreground' :
                  'bg-secondary text-secondary-foreground'
                }`}>
                  {selectedItem.priority.toUpperCase()}
                </Badge>
              </div>
              {selectedItem.description && (
                <div className="text-[10px] text-muted-foreground">{selectedItem.description}</div>
              )}
              {selectedItem.encrypted && (
                <Badge variant="outline" className="text-[8px] border-primary text-primary">
                  🔒 ENCRYPTED
                </Badge>
              )}
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="deployment-type" className="text-[10px] uppercase tracking-wider">
              Deployment Type
            </Label>
            <Select value={deploymentType} onValueChange={(value: any) => setDeploymentType(value)}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dead-drop">Dead Drop</SelectItem>
                <SelectItem value="geocache">Geocache</SelectItem>
                <SelectItem value="location">Fixed Location</SelectItem>
                <SelectItem value="agent">Assign to Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {deploymentType === 'agent' ? (
            <div className="space-y-2">
              <Label htmlFor="target-agent" className="text-[10px] uppercase tracking-wider">
                Target Agent
              </Label>
              <Select value={targetAgent} onValueChange={setTargetAgent}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select agent..." />
                </SelectTrigger>
                <SelectContent>
                  {assets.map(asset => (
                    <SelectItem key={asset.agentId} value={asset.agentId} className="text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span>{asset.callsign}</span>
                        {asset.gridX !== undefined && asset.gridY !== undefined && (
                          <span className="text-[9px] text-muted-foreground">
                            Grid: {String.fromCharCode(65 + asset.gridX)}{asset.gridY + 1}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAsset && (
                <div className="p-2 border border-border rounded text-[10px] space-y-1">
                  <div className="flex items-center gap-1">
                    <Target weight="bold" size={10} className="text-primary" />
                    <span className="font-bold">{selectedAsset.callsign}</span>
                  </div>
                  {selectedAsset.gridX !== undefined && selectedAsset.gridY !== undefined && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapTrifold weight="bold" size={10} />
                      <span>Grid: {String.fromCharCode(65 + selectedAsset.gridX)}{selectedAsset.gridY + 1}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="location-name" className="text-[10px] uppercase tracking-wider">
                  Location Name
                </Label>
                <Input
                  id="location-name"
                  placeholder={`Enter ${deploymentType} designation...`}
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="grid-x" className="text-[10px] uppercase tracking-wider">
                    Grid X (A-H)
                  </Label>
                  <Select 
                    value={gridX !== undefined ? gridX.toString() : ''} 
                    onValueChange={(value) => setGridX(parseInt(value))}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 8 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {String.fromCharCode(65 + i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grid-y" className="text-[10px] uppercase tracking-wider">
                    Grid Y (1-8)
                  </Label>
                  <Select 
                    value={gridY !== undefined ? gridY.toString() : ''} 
                    onValueChange={(value) => setGridY(parseInt(value))}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 8 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="text-[10px] uppercase tracking-wider">
                    Latitude
                  </Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    placeholder="40.712800"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude" className="text-[10px] uppercase tracking-wider">
                    Longitude
                  </Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    placeholder="-74.006000"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="expiration" className="text-[10px] uppercase tracking-wider flex items-center gap-1">
              <ClockCountdown weight="bold" size={10} />
              Expiration (Hours)
            </Label>
            <Input
              id="expiration"
              type="number"
              step="0.5"
              placeholder="Leave empty for no expiration"
              value={expirationHours}
              onChange={(e) => setExpirationHours(e.target.value)}
              className="text-xs"
            />
            {expirationHours && (
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Warning weight="bold" size={10} />
                Will expire on: {new Date(Date.now() + parseFloat(expirationHours) * 60 * 60 * 1000).toLocaleString()}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deployment-notes" className="text-[10px] uppercase tracking-wider">
              Deployment Notes
            </Label>
            <Textarea
              id="deployment-notes"
              placeholder="Add operational notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleDeploy} 
              disabled={!canDeploy}
              className="flex-1 text-xs"
            >
              <MapTrifold weight="bold" size={14} className="mr-1" />
              DEPLOY EQUIPMENT
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              CANCEL
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
