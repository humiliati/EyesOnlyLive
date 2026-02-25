import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LogEntry } from '@/components/MissionLog'
import { toast } from 'sonner'
import { 
  FunnelSimple,
  MagnifyingGlass,
  ClockCounterClockwise,
  CheckCircle,
  WarningCircle,
  Info,
  Target,
  MapPin,
  Heart,
  RadioButton,
  Download,
  CalendarBlank,
  X,
  Equals,
  Trash,
  Archive,
  Tag,
  CheckSquare,
  Square,
  NotePencil,
  Note,
  FileText
} from '@phosphor-icons/react'

export interface EnhancedLogEntry extends LogEntry {
  archived?: boolean
  tags?: string[]
  note?: string
}

interface HistoricalLogViewerProps {
  entries: EnhancedLogEntry[]
  onDeleteEntries?: (entryIds: string[]) => void
  onArchiveEntries?: (entryIds: string[], archived: boolean) => void
  onTagEntries?: (entryIds: string[], tags: string[]) => void
  onAddNote?: (entryId: string, note: string) => void
}

type FilterType = 'all' | 'archived' | LogEntry['type']
type TimeRange = 'all' | '1h' | '6h' | '24h' | '7d'

interface AnnotationTemplate {
  id: string
  name: string
  icon: string
  description: string
  template: (entry: EnhancedLogEntry) => string
}

const ANNOTATION_TEMPLATES: AnnotationTemplate[] = [
  {
    id: 'situation-report',
    name: 'SITREP',
    icon: '📋',
    description: 'Situation Report',
    template: (entry) => `[SITREP - ${new Date().toLocaleTimeString()}]
STATUS: 
ANALYSIS: 
RECOMMENDATION: 
FOLLOW-UP REQUIRED: [ ] YES  [ ] NO`
  },
  {
    id: 'threat-assessment',
    name: 'THREAT',
    icon: '⚠️',
    description: 'Threat Assessment',
    template: (entry) => `[THREAT ASSESSMENT]
THREAT LEVEL: 
NATURE OF THREAT: 
PROXIMITY: 
IMMEDIATE ACTION: 
ESCALATION: [ ] YES  [ ] NO`
  },
  {
    id: 'intel-brief',
    name: 'INTEL',
    icon: '🔍',
    description: 'Intelligence Brief',
    template: (entry) => `[INTELLIGENCE BRIEF]
SOURCE: 
RELIABILITY: 
INFORMATION: 
VERIFICATION STATUS: 
ACTIONABLE: [ ] YES  [ ] NO`
  },
  {
    id: 'comms-log',
    name: 'COMMS',
    icon: '📡',
    description: 'Communication Log',
    template: (entry) => `[COMMS LOG]
FROM: 
TO: 
CHANNEL: 
MESSAGE SUMMARY: 
RESPONSE REQUIRED: [ ] YES  [ ] NO`
  },
  {
    id: 'medical',
    name: 'MEDICAL',
    icon: '⚕️',
    description: 'Medical Note',
    template: (entry) => `[MEDICAL LOG]
SUBJECT: 
CONDITION: 
VITALS: 
TREATMENT: 
EVACUATION NEEDED: [ ] YES  [ ] NO`
  },
  {
    id: 'tactical',
    name: 'TACTICAL',
    icon: '🎯',
    description: 'Tactical Decision',
    template: (entry) => `[TACTICAL DECISION]
DECISION: 
RATIONALE: 
RISK ASSESSMENT: 
ALTERNATIVES CONSIDERED: 
OUTCOME: `
  },
  {
    id: 'asset-status',
    name: 'ASSET',
    icon: '📦',
    description: 'Asset/Resource Status',
    template: (entry) => `[ASSET STATUS]
ASSET ID: 
TYPE: 
CONDITION: 
LOCATION: 
NOTES: `
  },
  {
    id: 'checkpoint',
    name: 'CHECKPOINT',
    icon: '✓',
    description: 'Checkpoint/Milestone',
    template: (entry) => `[CHECKPOINT]
MILESTONE: 
TIME: ${new Date().toLocaleTimeString()}
OBJECTIVES MET: 
NEXT PHASE: 
ISSUES: `
  },
  {
    id: 'debrief',
    name: 'DEBRIEF',
    icon: '📝',
    description: 'Post-Event Debrief',
    template: (entry) => `[DEBRIEF]
EVENT: ${entry.title}
WHAT HAPPENED: 
WHAT WORKED: 
WHAT FAILED: 
LESSONS LEARNED: 
RECOMMENDATIONS: `
  },
  {
    id: 'timeline',
    name: 'TIMELINE',
    icon: '⏱️',
    description: 'Timeline Entry',
    template: (entry) => `[TIMELINE ENTRY]
T+${Math.floor((Date.now() - entry.timestamp) / 1000)}s: 
EVENT: ${entry.title}
SEQUENCE: 
CONCURRENT EVENTS: 
SIGNIFICANCE: `
  }
]

export function HistoricalLogViewer({ entries, onDeleteEntries, onArchiveEntries, onTagEntries, onAddNote }: HistoricalLogViewerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)

  const filteredEntries = useMemo(() => {
    let filtered = [...entries]

    if (!showArchived) {
      filtered = filtered.filter(entry => !entry.archived)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(query) ||
        entry.details?.toLowerCase().includes(query) ||
        entry.note?.toLowerCase().includes(query) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    if (filterType !== 'all') {
      if (filterType === 'archived') {
        filtered = filtered.filter(entry => entry.archived)
      } else {
        filtered = filtered.filter(entry => entry.type === filterType)
      }
    }

    if (timeRange !== 'all') {
      const now = Date.now()
      const timeRanges: Record<TimeRange, number> = {
        'all': 0,
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
      }
      const cutoff = now - timeRanges[timeRange]
      filtered = filtered.filter(entry => entry.timestamp >= cutoff)
    }

    return filtered.reverse()
  }, [entries, searchQuery, filterType, timeRange, showArchived])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    entries.forEach(entry => {
      entry.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [entries])

  const stats = useMemo(() => {
    const typeCount: Record<string, number> = {}
    entries.forEach(entry => {
      typeCount[entry.type] = (typeCount[entry.type] || 0) + 1
    })
    return {
      total: entries.length,
      critical: typeCount.critical || 0,
      warning: typeCount.warning || 0,
      success: typeCount.success || 0,
      mission: typeCount.mission || 0,
      info: typeCount.info || 0,
      transmission: typeCount.transmission || 0,
      biometric: typeCount.biometric || 0,
      location: typeCount.location || 0,
    }
  }, [entries])

  const handleExport = () => {
    const exportData = filteredEntries.map(entry => ({
      timestamp: new Date(entry.timestamp).toISOString(),
      type: entry.type,
      title: entry.title,
      details: entry.details || '',
      note: entry.note || '',
      archived: entry.archived || false,
      tags: entry.tags || []
    }))
    
    const jsonStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mission-log-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Mission log exported successfully')
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterType('all')
    setTimeRange('all')
  }

  const toggleSelection = (entryId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(entryId)) {
        newSet.delete(entryId)
      } else {
        newSet.add(entryId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEntries.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredEntries.map(e => e.id)))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (onDeleteEntries && selectedIds.size > 0) {
      onDeleteEntries(Array.from(selectedIds))
      toast.success(`Deleted ${selectedIds.size} log entries`)
      setSelectedIds(new Set())
      setShowDeleteDialog(false)
    }
  }

  const handleArchiveSelected = (archived: boolean) => {
    if (onArchiveEntries && selectedIds.size > 0) {
      onArchiveEntries(Array.from(selectedIds), archived)
      toast.success(`${archived ? 'Archived' : 'Unarchived'} ${selectedIds.size} log entries`)
      setSelectedIds(new Set())
    }
  }

  const handleTagSelected = () => {
    if (!newTag.trim() || selectedIds.size === 0) return
    
    if (onTagEntries) {
      const selectedEntries = filteredEntries.filter(e => selectedIds.has(e.id))
      const uniqueTags = new Set<string>()
      
      selectedEntries.forEach(entry => {
        entry.tags?.forEach(tag => uniqueTags.add(tag))
      })
      uniqueTags.add(newTag.trim())
      
      onTagEntries(Array.from(selectedIds), Array.from(uniqueTags))
      toast.success(`Tagged ${selectedIds.size} log entries with "${newTag.trim()}"`)
      setNewTag('')
      setSelectedIds(new Set())
    }
  }

  const handleRemoveTag = (entryId: string, tagToRemove: string) => {
    if (onTagEntries) {
      const entry = entries.find(e => e.id === entryId)
      if (entry?.tags) {
        const newTags = entry.tags.filter(tag => tag !== tagToRemove)
        onTagEntries([entryId], newTags)
        toast.success(`Removed tag "${tagToRemove}"`)
      }
    }
  }

  const handleStartEditNote = (entryId: string, existingNote?: string) => {
    setEditingNoteId(entryId)
    setNoteText(existingNote || '')
    setShowTemplates(!existingNote)
  }

  const handleApplyTemplate = (template: AnnotationTemplate, entry: EnhancedLogEntry) => {
    setNoteText(template.template(entry))
    setShowTemplates(false)
    toast.success(`Applied ${template.name} template`)
  }

  const handleSaveNote = (entryId: string) => {
    if (onAddNote && noteText.trim()) {
      onAddNote(entryId, noteText.trim())
      toast.success('Note added to log entry')
      setEditingNoteId(null)
      setNoteText('')
    } else if (onAddNote && !noteText.trim()) {
      onAddNote(entryId, '')
      toast.success('Note removed from log entry')
      setEditingNoteId(null)
      setNoteText('')
    }
  }

  const handleCancelEditNote = () => {
    setEditingNoteId(null)
    setNoteText('')
    setShowTemplates(false)
  }

  const getIcon = (type: LogEntry['type']) => {
    const iconProps = { size: 14, weight: 'bold' as const }
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className="text-primary" />
      case 'warning':
        return <WarningCircle {...iconProps} className="text-accent" />
      case 'critical':
        return <WarningCircle {...iconProps} className="text-destructive" />
      case 'mission':
        return <Target {...iconProps} className="text-primary" />
      case 'biometric':
        return <Heart {...iconProps} className="text-primary" />
      case 'location':
        return <MapPin {...iconProps} className="text-primary" />
      case 'transmission':
        return <RadioButton {...iconProps} className="text-primary" />
      default:
        return <Info {...iconProps} className="text-muted-foreground" />
    }
  }

  const getTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'border-primary/50'
      case 'warning':
        return 'border-accent/50'
      case 'critical':
        return 'border-destructive/50'
      case 'mission':
        return 'border-primary/50'
      case 'biometric':
        return 'border-primary/40'
      case 'location':
        return 'border-primary/40'
      case 'transmission':
        return 'border-primary/50'
      default:
        return 'border-border/50'
    }
  }

  const getTypeBadgeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-destructive/20 text-destructive border-destructive/50'
      case 'warning':
        return 'bg-accent/20 text-accent border-accent/50'
      case 'success':
        return 'bg-primary/20 text-primary border-primary/50'
      case 'mission':
        return 'bg-primary/20 text-primary border-primary/50'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toTimeString().slice(0, 8)
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const activeFiltersCount = [
    searchQuery.trim() !== '',
    filterType !== 'all',
    timeRange !== 'all'
  ].filter(Boolean).length

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full border-primary/30 hover:bg-primary/10 hover:border-primary/50"
        >
          <ClockCounterClockwise weight="bold" size={16} className="mr-2" />
          <span className="text-xs tracking-wider">VIEW HISTORICAL LOG</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-card border-primary/30">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ClockCounterClockwise weight="bold" size={20} className="text-primary" />
            <span className="tracking-wider">HISTORICAL MISSION LOG</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground tracking-wide">
            Search and filter mission events for analysis and review
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Card className="p-3 border-primary/20">
              <div className="text-[9px] tracking-wider text-muted-foreground mb-1">TOTAL EVENTS</div>
              <div className="text-2xl font-bold tabular-nums text-primary">{stats.total}</div>
            </Card>
            <Card className="p-3 border-destructive/20">
              <div className="text-[9px] tracking-wider text-muted-foreground mb-1">CRITICAL</div>
              <div className="text-2xl font-bold tabular-nums text-destructive">{stats.critical}</div>
            </Card>
            <Card className="p-3 border-accent/20">
              <div className="text-[9px] tracking-wider text-muted-foreground mb-1">WARNINGS</div>
              <div className="text-2xl font-bold tabular-nums text-accent">{stats.warning}</div>
            </Card>
            <Card className="p-3 border-primary/20">
              <div className="text-[9px] tracking-wider text-muted-foreground mb-1">MISSION</div>
              <div className="text-2xl font-bold tabular-nums text-primary">{stats.mission}</div>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                size={14} 
                weight="bold"
              />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs border-primary/30 bg-background"
              />
            </div>
            
            <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
              <SelectTrigger className="w-full sm:w-[140px] text-xs border-primary/30">
                <FunnelSimple size={14} weight="bold" className="mr-1" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="mission">Mission</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="transmission">Transmission</SelectItem>
                <SelectItem value="biometric">Biometric</SelectItem>
                <SelectItem value="location">Location</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
              <SelectTrigger className="w-full sm:w-[140px] text-xs border-primary/30">
                <CalendarBlank size={14} weight="bold" className="mr-1" />
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="6h">Last 6 Hours</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[9px] px-2 py-0.5 border-primary text-primary">
                {filteredEntries.length} RESULTS
              </Badge>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <X size={12} weight="bold" className="mr-1" />
                  CLEAR FILTERS ({activeFiltersCount})
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                className={`h-7 px-3 text-[10px] ${showArchived ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Archive size={12} weight="bold" className="mr-1" />
                {showArchived ? 'HIDE ARCHIVED' : 'SHOW ARCHIVED'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={filteredEntries.length === 0}
                className="h-7 px-3 text-[10px] border-primary/30 hover:bg-primary/10"
              >
                <Download size={12} weight="bold" className="mr-1" />
                EXPORT
              </Button>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <Card className="border-primary/50 bg-primary/5 p-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground">
                    {selectedIds.size} SELECTED
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                    className="h-6 px-2 text-[10px]"
                  >
                    <X size={12} weight="bold" className="mr-1" />
                    CLEAR
                  </Button>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteSelected}
                    className="h-7 px-3 text-[10px] border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    <Trash size={12} weight="bold" className="mr-1" />
                    DELETE
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchiveSelected(true)}
                    className="h-7 px-3 text-[10px] border-primary/30 hover:bg-primary/10"
                  >
                    <Archive size={12} weight="bold" className="mr-1" />
                    ARCHIVE
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchiveSelected(false)}
                    className="h-7 px-3 text-[10px] border-primary/30 hover:bg-primary/10"
                  >
                    <Archive size={12} weight="bold" className="mr-1" />
                    UNARCHIVE
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    <Input
                      placeholder="Tag name..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTagSelected()}
                      className="h-7 w-24 text-[10px] border-primary/30"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTagSelected}
                      disabled={!newTag.trim()}
                      className="h-7 px-3 text-[10px] border-primary/30 hover:bg-primary/10"
                    >
                      <Tag size={12} weight="bold" className="mr-1" />
                      TAG
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <Separator className="bg-border/50" />

        <ScrollArea className="h-[500px] px-6">
          <div className="space-y-3 pb-6">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Equals size={32} weight="bold" className="mx-auto text-muted-foreground/50" />
                <div className="text-sm text-muted-foreground">No events match your filters</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Clear filters to see all events
                </Button>
              </div>
            ) : (
              <>
                {filteredEntries.length > 0 && (
                  <div className="flex items-center gap-2 py-2 border-b border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleSelectAll}
                      className="h-6 px-2 text-[10px]"
                    >
                      {selectedIds.size === filteredEntries.length ? (
                        <CheckSquare size={14} weight="bold" className="mr-1 text-primary" />
                      ) : (
                        <Square size={14} weight="bold" className="mr-1" />
                      )}
                      SELECT ALL
                    </Button>
                  </div>
                )}
                
                {filteredEntries.map((entry, index) => {
                  const prevEntry = filteredEntries[index - 1]
                  const showDateDivider = !prevEntry || 
                    formatDate(entry.timestamp) !== formatDate(prevEntry.timestamp)

                  return (
                    <div key={entry.id}>
                      {showDateDivider && (
                        <div className="flex items-center gap-3 mb-3 mt-4 first:mt-0">
                          <CalendarBlank size={14} weight="bold" className="text-primary" />
                          <span className="text-[10px] tracking-wider text-muted-foreground">
                            {formatDate(entry.timestamp)}
                          </span>
                          <Separator className="flex-1 bg-border/30" />
                        </div>
                      )}
                      
                      <Card className={`border-l-4 ${getTypeColor(entry.type)} ${entry.archived ? 'opacity-60' : ''} p-3 hover:bg-muted/20 transition-colors`}>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedIds.has(entry.id)}
                            onCheckedChange={() => toggleSelection(entry.id)}
                            className="mt-1"
                          />
                          <div className="mt-0.5">{getIcon(entry.type)}</div>
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="text-xs font-medium leading-tight">{entry.title}</div>
                                {entry.archived && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-[8px] px-1.5 py-0 uppercase bg-muted text-muted-foreground"
                                  >
                                    <Archive size={10} weight="bold" className="mr-1" />
                                    ARCHIVED
                                  </Badge>
                                )}
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`text-[8px] px-1.5 py-0 uppercase shrink-0 ${getTypeBadgeColor(entry.type)}`}
                              >
                                {entry.type}
                              </Badge>
                            </div>
                            
                            {entry.details && (
                              <div className="text-[11px] text-muted-foreground leading-snug">
                                {entry.details}
                              </div>
                            )}
                            
                            {entry.tags && entry.tags.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {entry.tags.map(tag => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-[8px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                                    onClick={() => handleRemoveTag(entry.id, tag)}
                                  >
                                    <Tag size={10} weight="bold" className="mr-0.5" />
                                    {tag}
                                    <X size={10} weight="bold" className="ml-0.5" />
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            {editingNoteId === entry.id ? (
                              <div className="space-y-2 pt-1">
                                {showTemplates && (
                                  <Card className="border-primary/30 bg-background p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <FileText size={14} weight="bold" className="text-primary" />
                                        <span className="text-[10px] tracking-wider text-muted-foreground uppercase">ANNOTATION TEMPLATES</span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowTemplates(false)}
                                        className="h-5 px-1.5 text-[9px]"
                                      >
                                        <X size={12} weight="bold" />
                                      </Button>
                                    </div>
                                    <ScrollArea className="max-h-[200px]">
                                      <div className="grid grid-cols-2 gap-2 pr-3">
                                        {ANNOTATION_TEMPLATES.map(template => (
                                          <Button
                                            key={template.id}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleApplyTemplate(template, entry)}
                                            className="h-auto p-2 flex flex-col items-start gap-1 border-primary/20 hover:bg-primary/10 hover:border-primary/50"
                                          >
                                            <div className="flex items-center gap-1.5 w-full">
                                              <span className="text-base">{template.icon}</span>
                                              <span className="text-[10px] font-bold tracking-wider">{template.name}</span>
                                            </div>
                                            <span className="text-[9px] text-muted-foreground text-left">{template.description}</span>
                                          </Button>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  </Card>
                                )}
                                <Textarea
                                  value={noteText}
                                  onChange={(e) => setNoteText(e.target.value)}
                                  placeholder="Add annotation note..."
                                  className="text-[11px] min-h-[100px] border-primary/30 bg-background resize-none font-mono"
                                  autoFocus={!showTemplates}
                                />
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSaveNote(entry.id)}
                                    className="h-6 px-2 text-[10px] border-primary/30 hover:bg-primary/10"
                                  >
                                    <Note size={12} weight="bold" className="mr-1" />
                                    SAVE NOTE
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowTemplates(!showTemplates)}
                                    className={`h-6 px-2 text-[10px] ${showTemplates ? 'border-primary bg-primary/10' : 'border-primary/30'} hover:bg-primary/10`}
                                  >
                                    <FileText size={12} weight="bold" className="mr-1" />
                                    {showTemplates ? 'HIDE TEMPLATES' : 'TEMPLATES'}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelEditNote}
                                    className="h-6 px-2 text-[10px]"
                                  >
                                    <X size={12} weight="bold" className="mr-1" />
                                    CANCEL
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {entry.note && (
                                  <div className="bg-accent/10 border border-accent/30 rounded p-2 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1">
                                        <Note size={12} weight="bold" className="text-accent" />
                                        <span className="text-[9px] tracking-wider text-accent uppercase">Annotation</span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleStartEditNote(entry.id, entry.note)}
                                        className="h-5 px-1.5 text-[9px] text-muted-foreground hover:text-foreground"
                                      >
                                        <NotePencil size={10} weight="bold" className="mr-0.5" />
                                        EDIT
                                      </Button>
                                    </div>
                                    <div className="text-[11px] text-foreground leading-snug whitespace-pre-wrap">
                                      {entry.note}
                                    </div>
                                  </div>
                                )}
                                {!entry.note && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStartEditNote(entry.id)}
                                    className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                                  >
                                    <NotePencil size={12} weight="bold" className="mr-1" />
                                    ADD NOTE
                                  </Button>
                                )}
                              </>
                            )}
                            
                            <div className="flex items-center gap-3 text-[9px] text-muted-foreground/70">
                              <span className="tabular-nums font-mono">{formatTime(entry.timestamp)}</span>
                              <span>•</span>
                              <span>{formatRelativeTime(entry.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </ScrollArea>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-card border-destructive/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Trash size={20} weight="bold" />
                Delete Log Entries
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete {selectedIds.size} log {selectedIds.size === 1 ? 'entry' : 'entries'}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
