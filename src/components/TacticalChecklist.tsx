import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ListChecks, 
  CaretDown, 
  CaretUp,
  CheckCircle,
  Circle,
  Plus,
  Trash
} from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  priority: 'low' | 'normal' | 'high' | 'critical'
  completedAt?: number
  completedBy?: string
}

export interface Checklist {
  id: string
  name: string
  category: 'pre-mission' | 'mission' | 'post-mission' | 'equipment' | 'safety' | 'custom'
  items: ChecklistItem[]
  createdAt: number
  completedCount: number
  totalCount: number
}

interface TacticalChecklistProps {
  checklists: Checklist[]
  currentUser: string
  maxHeight?: string
  onToggleItem: (checklistId: string, itemId: string) => void
  onAddChecklist: (checklist: Omit<Checklist, 'id' | 'createdAt' | 'completedCount' | 'totalCount'>) => void
  onDeleteChecklist: (checklistId: string) => void
}

export function TacticalChecklist({ 
  checklists, 
  currentUser,
  maxHeight = "500px",
  onToggleItem,
  onAddChecklist,
  onDeleteChecklist
}: TacticalChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newChecklistName, setNewChecklistName] = useState('')
  const [newChecklistCategory, setNewChecklistCategory] = useState<Checklist['category']>('custom')
  const [newItems, setNewItems] = useState<string[]>([''])

  const filteredChecklists = selectedCategory === 'all' 
    ? checklists 
    : checklists.filter(c => c.category === selectedCategory)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pre-mission': return 'bg-accent text-accent-foreground'
      case 'mission': return 'bg-primary text-primary-foreground'
      case 'post-mission': return 'bg-secondary text-secondary-foreground'
      case 'equipment': return 'bg-amber-700 text-foreground'
      case 'safety': return 'bg-destructive text-destructive-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-destructive'
      case 'high': return 'text-accent'
      case 'normal': return 'text-foreground'
      case 'low': return 'text-muted-foreground'
      default: return 'text-foreground'
    }
  }

  const handleCreateChecklist = () => {
    if (!newChecklistName.trim()) return

    const items: ChecklistItem[] = newItems
      .filter(text => text.trim())
      .map((text, index) => ({
        id: `item-${Date.now()}-${index}`,
        text: text.trim(),
        completed: false,
        priority: 'normal' as const
      }))

    if (items.length === 0) return

    onAddChecklist({
      name: newChecklistName.trim(),
      category: newChecklistCategory,
      items
    })

    setNewChecklistName('')
    setNewChecklistCategory('custom')
    setNewItems([''])
    setIsDialogOpen(false)
  }

  const totalCompleted = checklists.reduce((sum, c) => sum + c.completedCount, 0)
  const totalItems = checklists.reduce((sum, c) => sum + c.totalCount, 0)
  const completionPercentage = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0

  return (
    <Card className="border-primary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Checklists</span>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
            {totalCompleted}/{totalItems}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[9px]"
              >
                <Plus weight="bold" size={12} className="mr-1" />
                NEW
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-sm uppercase tracking-wider">Create Checklist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="checklist-name" className="text-xs">Checklist Name</Label>
                  <Input
                    id="checklist-name"
                    value={newChecklistName}
                    onChange={(e) => setNewChecklistName(e.target.value)}
                    placeholder="Pre-Flight Check"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checklist-category" className="text-xs">Category</Label>
                  <Select value={newChecklistCategory} onValueChange={(v) => setNewChecklistCategory(v as Checklist['category'])}>
                    <SelectTrigger id="checklist-category" className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pre-mission">Pre-Mission</SelectItem>
                      <SelectItem value="mission">Mission</SelectItem>
                      <SelectItem value="post-mission">Post-Mission</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Checklist Items</Label>
                  <ScrollArea className="h-48">
                    <div className="space-y-2 pr-3">
                      {newItems.map((item, index) => (
                        <Input
                          key={index}
                          value={item}
                          onChange={(e) => {
                            const updated = [...newItems]
                            updated[index] = e.target.value
                            setNewItems(updated)
                          }}
                          placeholder={`Item ${index + 1}`}
                          className="text-xs"
                        />
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setNewItems([...newItems, ''])}
                        className="w-full h-7 text-[9px]"
                      >
                        <Plus weight="bold" size={12} className="mr-1" />
                        Add Item
                      </Button>
                    </div>
                  </ScrollArea>
                </div>

                <Button
                  onClick={handleCreateChecklist}
                  className="w-full text-xs"
                  disabled={!newChecklistName.trim() || newItems.every(i => !i.trim())}
                >
                  Create Checklist
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="space-y-2">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
              Overall Progress
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-sm font-bold tabular-nums">{completionPercentage}%</span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {(['all', 'pre-mission', 'mission', 'post-mission', 'equipment', 'safety', 'custom'] as const).map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className="h-6 px-2 text-[8px] uppercase"
              >
                {cat === 'all' ? 'all' : cat.replace('-', ' ')}
              </Button>
            ))}
          </div>

          <Separator className="bg-border" />

          <ScrollArea style={{ maxHeight }}>
            <div className="space-y-3 pr-3">
              {filteredChecklists.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No checklists available
                </div>
              ) : (
                filteredChecklists.map((checklist) => (
                  <div key={checklist.id} className="border border-border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-bold">{checklist.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getCategoryColor(checklist.category)} text-[8px] px-1.5 py-0 uppercase`}>
                            {checklist.category.replace('-', ' ')}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground">
                            {checklist.completedCount}/{checklist.totalCount} Complete
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteChecklist(checklist.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash weight="bold" size={12} className="text-destructive" />
                      </Button>
                    </div>

                    <Separator className="bg-border" />

                    <div className="space-y-1.5">
                      {checklist.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-start gap-2 p-1.5 rounded hover:bg-secondary/30 transition-colors ${
                            item.completed ? 'opacity-60' : ''
                          }`}
                        >
                          <Checkbox
                            id={`${checklist.id}-${item.id}`}
                            checked={item.completed}
                            onCheckedChange={() => onToggleItem(checklist.id, item.id)}
                            className="mt-0.5"
                          />
                          <label
                            htmlFor={`${checklist.id}-${item.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className={`text-xs ${item.completed ? 'line-through' : ''} ${getPriorityColor(item.priority)}`}>
                              {item.text}
                            </div>
                            {item.completed && item.completedAt && (
                              <div className="text-[8px] text-muted-foreground mt-0.5">
                                Completed by {item.completedBy || currentUser} • {new Date(item.completedAt).toLocaleTimeString()}
                              </div>
                            )}
                          </label>
                          {item.completed ? (
                            <CheckCircle weight="fill" size={14} className="text-primary mt-0.5" />
                          ) : (
                            <Circle weight="bold" size={14} className="text-muted-foreground mt-0.5" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </Card>
  )
}
