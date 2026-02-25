import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LogEntry } from '@/components/MissionLog'
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
  Equals
} from '@phosphor-icons/react'

interface HistoricalLogViewerProps {
  entries: LogEntry[]
}

type FilterType = 'all' | LogEntry['type']
type TimeRange = 'all' | '1h' | '6h' | '24h' | '7d'

export function HistoricalLogViewer({ entries }: HistoricalLogViewerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [isOpen, setIsOpen] = useState(false)

  const filteredEntries = useMemo(() => {
    let filtered = [...entries]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(query) ||
        entry.details?.toLowerCase().includes(query)
      )
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(entry => entry.type === filterType)
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
  }, [entries, searchQuery, filterType, timeRange])

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
      details: entry.details || ''
    }))
    
    const jsonStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mission-log-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterType('all')
    setTimeRange('all')
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
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={filteredEntries.length === 0}
              className="h-7 px-3 text-[10px] border-primary/30 hover:bg-primary/10"
            >
              <Download size={12} weight="bold" className="mr-1" />
              EXPORT JSON
            </Button>
          </div>
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
              filteredEntries.map((entry, index) => {
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
                    
                    <Card className={`border-l-4 ${getTypeColor(entry.type)} p-3 hover:bg-muted/20 transition-colors`}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getIcon(entry.type)}</div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-xs font-medium leading-tight">{entry.title}</div>
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
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
