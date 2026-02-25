import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  MapPin, 
  Trash,
  PencilSimple,
  Circle,
  Square,
  Polygon,
  PencilLine,
  Target,
  Broadcast,
  Eye,
  EyeSlash
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { MapAnnotation } from './HybridTacticalMap'

interface AnnotationBroadcasterProps {
  annotations: MapAnnotation[]
  onDeleteAnnotation: (annotationId: string) => void
  onCreateAnnotation?: (annotation: Omit<MapAnnotation, 'id' | 'createdAt'>) => void
  currentUser?: string
}

export function AnnotationBroadcaster({ 
  annotations, 
  onDeleteAnnotation,
  onCreateAnnotation,
  currentUser = 'M-CONSOLE'
}: AnnotationBroadcasterProps) {
  const [filter, setFilter] = useState<'all' | 'mine' | 'others'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAnnotation, setNewAnnotation] = useState({
    label: '',
    type: 'marker' as MapAnnotation['type'],
    color: 'oklch(0.75 0.18 145)',
    lat: 40.7128,
    lng: -74.0060,
    requiresAck: false,
    priority: 'normal' as 'low' | 'normal' | 'high' | 'critical',
    notes: ''
  })

  const filteredAnnotations = annotations.filter(annotation => {
    if (filter === 'mine' && annotation.createdBy !== currentUser) return false
    if (filter === 'others' && annotation.createdBy === currentUser) return false
    if (typeFilter !== 'all' && annotation.type !== typeFilter) return false
    return true
  })

  const getAnnotationIcon = (type: MapAnnotation['type']) => {
    switch (type) {
      case 'circle': return <Circle weight="bold" size={14} />
      case 'rectangle': return <Square weight="bold" size={14} />
      case 'polygon': return <Polygon weight="bold" size={14} />
      case 'freehand': return <PencilLine weight="bold" size={14} />
      case 'marker': return <MapPin weight="bold" size={14} />
    }
  }

  const handleCreateAnnotation = () => {
    if (!newAnnotation.label.trim()) {
      toast.error('Annotation label required')
      return
    }

    if (onCreateAnnotation) {
      onCreateAnnotation({
        type: newAnnotation.type,
        label: newAnnotation.label,
        color: newAnnotation.color,
        createdBy: currentUser,
        points: [{ lat: newAnnotation.lat, lng: newAnnotation.lng }],
        radius: newAnnotation.type === 'circle' ? 500 : undefined,
        requiresAck: newAnnotation.requiresAck,
        priority: newAnnotation.priority,
        notes: newAnnotation.notes || undefined
      })

      const ackMsg = newAnnotation.requiresAck ? ' (requires acknowledgment)' : ''
      toast.success(`Annotation broadcasted to all agents${ackMsg}`)
      
      setNewAnnotation({
        label: '',
        type: 'marker',
        color: 'oklch(0.75 0.18 145)',
        lat: 40.7128,
        lng: -74.0060,
        requiresAck: false,
        priority: 'normal',
        notes: ''
      })
      setShowCreateForm(false)
    }
  }

  const handleDeleteAnnotation = (annotationId: string) => {
    onDeleteAnnotation(annotationId)
    toast.success('Annotation removed from all maps')
  }

  const annotationTypes = [
    { value: 'marker', label: 'Marker' },
    { value: 'circle', label: 'Circle' },
    { value: 'rectangle', label: 'Rectangle' },
    { value: 'polygon', label: 'Polygon' },
    { value: 'freehand', label: 'Freehand' }
  ]

  const annotationColors = [
    { value: 'oklch(0.75 0.18 145)', label: 'Primary' },
    { value: 'oklch(0.75 0.16 75)', label: 'Accent' },
    { value: 'oklch(0.65 0.25 25)', label: 'Warning' },
    { value: 'oklch(0.6 0.15 230)', label: 'Info' }
  ]

  return (
    <Card className="border-primary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Broadcast weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Map Annotations</span>
        </div>
        <Badge variant="outline" className="text-[9px] px-2">
          {annotations.length} TOTAL
        </Badge>
      </div>

      <Separator className="bg-border" />

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className="text-[10px] h-7 flex-1"
        >
          ALL
        </Button>
        <Button
          size="sm"
          variant={filter === 'mine' ? 'default' : 'outline'}
          onClick={() => setFilter('mine')}
          className="text-[10px] h-7 flex-1"
        >
          <Eye weight="bold" size={12} className="mr-1" />
          MINE
        </Button>
        <Button
          size="sm"
          variant={filter === 'others' ? 'default' : 'outline'}
          onClick={() => setFilter('others')}
          className="text-[10px] h-7 flex-1"
        >
          <EyeSlash weight="bold" size={12} className="mr-1" />
          OTHERS
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] tracking-[0.08em] uppercase">Filter by Type</Label>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {annotationTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-[200px]">
        <div className="space-y-2 pr-4">
          {filteredAnnotations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              No annotations found
            </div>
          ) : (
            filteredAnnotations.map((annotation) => (
              <div 
                key={annotation.id}
                className="border border-border bg-card/50 p-2 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <div 
                      className="mt-0.5" 
                      style={{ color: annotation.color }}
                    >
                      {getAnnotationIcon(annotation.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        {annotation.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        By {annotation.createdBy}
                      </div>
                      <div className="text-[9px] text-muted-foreground">
                        {new Date(annotation.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteAnnotation(annotation.id)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash weight="bold" size={12} />
                  </Button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    {annotation.type}
                  </Badge>
                  {annotation.points.length > 0 && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      {annotation.points.length} PT{annotation.points.length > 1 ? 'S' : ''}
                    </Badge>
                  )}
                  {annotation.requiresAck && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary text-primary">
                      ACK REQUIRED
                    </Badge>
                  )}
                  {annotation.priority && annotation.priority !== 'normal' && (
                    <Badge 
                      variant="outline" 
                      className={`text-[9px] px-1.5 py-0 ${
                        annotation.priority === 'critical' ? 'border-destructive text-destructive' :
                        annotation.priority === 'high' ? 'border-accent text-accent' :
                        'border-muted-foreground text-muted-foreground'
                      }`}
                    >
                      {annotation.priority.toUpperCase()}
                    </Badge>
                  )}
                </div>
                {annotation.requiresAck && annotation.acknowledgments && (
                  <div className="text-[9px] text-muted-foreground pl-6">
                    {annotation.acknowledgments.length} agent{annotation.acknowledgments.length !== 1 ? 's' : ''} acknowledged
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {!showCreateForm ? (
        <Button
          onClick={() => setShowCreateForm(true)}
          className="w-full text-xs"
          variant="outline"
        >
          <Target weight="bold" size={14} className="mr-2" />
          Broadcast New Annotation
        </Button>
      ) : (
        <div className="space-y-3 border border-border p-3 bg-card/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Create Annotation</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCreateForm(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] tracking-[0.08em] uppercase">Label</Label>
            <Input
              value={newAnnotation.label}
              onChange={(e) => setNewAnnotation({ ...newAnnotation, label: e.target.value })}
              placeholder="e.g., Primary Target Zone"
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-[10px] tracking-[0.08em] uppercase">Type</Label>
              <Select 
                value={newAnnotation.type} 
                onValueChange={(value) => setNewAnnotation({ ...newAnnotation, type: value as MapAnnotation['type'] })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {annotationTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] tracking-[0.08em] uppercase">Color</Label>
              <Select 
                value={newAnnotation.color} 
                onValueChange={(value) => setNewAnnotation({ ...newAnnotation, color: value })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {annotationColors.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full border" 
                          style={{ backgroundColor: color.value }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-[10px] tracking-[0.08em] uppercase">Latitude</Label>
              <Input
                type="number"
                step="0.0001"
                value={newAnnotation.lat}
                onChange={(e) => setNewAnnotation({ ...newAnnotation, lat: parseFloat(e.target.value) })}
                className="h-8 text-xs tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] tracking-[0.08em] uppercase">Longitude</Label>
              <Input
                type="number"
                step="0.0001"
                value={newAnnotation.lng}
                onChange={(e) => setNewAnnotation({ ...newAnnotation, lng: parseFloat(e.target.value) })}
                className="h-8 text-xs tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] tracking-[0.08em] uppercase">Priority</Label>
            <Select 
              value={newAnnotation.priority} 
              onValueChange={(value) => setNewAnnotation({ ...newAnnotation, priority: value as 'low' | 'normal' | 'high' | 'critical' })}
            >
              <SelectTrigger className="h-8 text-xs">
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

          <div className="space-y-2">
            <Label className="text-[10px] tracking-[0.08em] uppercase">Notes (Optional)</Label>
            <Input
              value={newAnnotation.notes}
              onChange={(e) => setNewAnnotation({ ...newAnnotation, notes: e.target.value })}
              placeholder="Additional information..."
              className="h-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requires-ack"
              checked={newAnnotation.requiresAck}
              onChange={(e) => setNewAnnotation({ ...newAnnotation, requiresAck: e.target.checked })}
              className="rounded border-border"
            />
            <Label htmlFor="requires-ack" className="text-xs cursor-pointer">
              Require agent acknowledgment
            </Label>
          </div>

          <Button
            onClick={handleCreateAnnotation}
            className="w-full text-xs"
          >
            <Broadcast weight="bold" size={14} className="mr-2" />
            Broadcast to All Agents
          </Button>
        </div>
      )}
    </Card>
  )
}
