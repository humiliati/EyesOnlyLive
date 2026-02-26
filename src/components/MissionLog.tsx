import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ClockCounterClockwise,
  CheckCircle,
  WarningCircle,
  Info,
  Target,
  MapPin,
  Heart,
  RadioButton,
  CaretDown
} from '@phosphor-icons/react'

export interface LogEntry {
  id: string
  timestamp: number
  type: 'info' | 'success' | 'warning' | 'critical' | 'mission' | 'biometric' | 'location' | 'transmission'
  title: string
  details?: string
}

interface MissionLogProps {
  entries: LogEntry[]
  maxHeight?: string
  onDragStart?: (id: string) => void
  onDragEnd?: () => void
  onDragOver?: (id: string) => void
  isDragging?: boolean
  isDragTarget?: boolean
}

export function MissionLog({ 
  entries, 
  maxHeight = '300px',
  onDragStart,
  onDragEnd,
  onDragOver,
  isDragging = false,
  isDragTarget = false
}: MissionLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevEntriesLength = useRef(entries.length)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const touchStartY = useRef<number>(0)
  const touchStartX = useRef<number>(0)
  const isTouchDragging = useRef<boolean>(false)
  const [touchActive, setTouchActive] = useState(false)
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const [isDragCancelled, setIsDragCancelled] = useState(false)
  const wasDragTargetRef = useRef<boolean>(false)

  useEffect(() => {
    if (entries.length > prevEntriesLength.current && scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
    prevEntriesLength.current = entries.length
  }, [entries])

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

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toTimeString().slice(0, 8)
  }

  const formatRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartY.current = touch.clientY
    touchStartX.current = touch.clientX
    isTouchDragging.current = false
    setTouchActive(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTouchDragging.current) {
      const touch = e.touches[0]
      const deltaY = Math.abs(touch.clientY - touchStartY.current)
      const deltaX = Math.abs(touch.clientX - touchStartX.current)
      
      if (deltaY > 10 && deltaY > deltaX) {
        isTouchDragging.current = true
        onDragStart?.('mission-log')
        setGhostPosition({ x: touch.clientX, y: touch.clientY })
      }
    }

    if (isTouchDragging.current) {
      e.preventDefault()
      const touch = e.touches[0]
      setGhostPosition({ x: touch.clientX, y: touch.clientY })
      
      const element = document.elementFromPoint(touch.clientX, touch.clientY)
      
      if (element) {
        const panel = element.closest('[data-panel-id]')
        if (panel) {
          const panelId = panel.getAttribute('data-panel-id')
          if (panelId) {
            onDragOver?.(panelId)
          }
        }
      }
    }
  }

  const handleTouchEnd = () => {
    if (isTouchDragging.current) {
      if (!wasDragTargetRef.current) {
        setIsDragCancelled(true)
        setTimeout(() => setIsDragCancelled(false), 400)
      }
      onDragEnd?.()
      isTouchDragging.current = false
    }
    wasDragTargetRef.current = false
    setTouchActive(false)
    setGhostPosition(null)
  }

  wasDragTargetRef.current = isDragTarget

  return (
    <>
    <motion.div
      layout
      initial={false}
      animate={isDragCancelled ? {
        scale: [0.98, 1.02, 1],
        opacity: [0.7, 1],
        rotate: [0, -1, 1, 0]
      } : {}}
      transition={{
        layout: {
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8
        },
        scale: {
          type: "spring",
          stiffness: 400,
          damping: 20,
          duration: 0.4
        },
        opacity: {
          duration: 0.3
        },
        rotate: {
          type: "spring",
          stiffness: 500,
          damping: 25
        }
      }}
    >
      <Card 
        data-panel-id="mission-log"
        className={`border-primary/30 p-4 space-y-3 transition-all ${
          isDragging ? 'drag-target-glow opacity-70 scale-[0.98] cursor-grabbing' : 'cursor-grab hover:border-primary/50'
        } ${isDragTarget ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''} ${
          touchActive ? 'touch-active' : ''
        }`}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          wasDragTargetRef.current = false
          onDragStart?.('mission-log')
        }}
        onDragEnd={(e) => {
          if (e.dataTransfer.dropEffect === 'none' || !wasDragTargetRef.current) {
            setIsDragCancelled(true)
            setTimeout(() => setIsDragCancelled(false), 400)
          }
          wasDragTargetRef.current = false
          onDragEnd?.()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          onDragOver?.('mission-log')
        }}
        onDragEnter={(e) => {
          e.preventDefault()
          onDragOver?.('mission-log')
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
      <div 
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={(e) => {
          e.stopPropagation()
          setIsCollapsed(!isCollapsed)
        }}
      >
        <div className="flex items-center gap-2">
          <ClockCounterClockwise weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Mission Log</span>
          <CaretDown 
            weight="bold" 
            size={12} 
            className={`text-primary transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
          />
        </div>
        <Badge variant="outline" className="text-[9px] px-2 py-0 border-primary text-primary">
          {entries.length} EVENTS
        </Badge>
      </div>

      {!isCollapsed && (
        <ScrollArea ref={scrollRef} style={{ height: maxHeight }} className="pr-3">
          <div className="space-y-2">
            {entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-[10px] tracking-wider">
                NO EVENTS LOGGED
              </div>
            ) : (
              entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`border-l-2 ${getTypeColor(entry.type)} pl-3 pb-2 ${
                    index === entries.length - 1 ? '' : 'border-b border-border/30 mb-2'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">{getIcon(entry.type)}</div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[11px] font-medium leading-tight">{entry.title}</div>
                      <div className="text-[9px] text-muted-foreground tabular-nums shrink-0">
                        {formatRelativeTime(entry.timestamp)}
                      </div>
                    </div>
                    {entry.details && (
                      <div className="text-[10px] text-muted-foreground leading-tight">
                        {entry.details}
                      </div>
                    )}
                    <div className="text-[9px] text-muted-foreground/70 tabular-nums font-mono">
                      {formatTime(entry.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
        </ScrollArea>
      )}
      </Card>
    </motion.div>
    {ghostPosition && isTouchDragging.current && (
      <div
        ref={ghostRef}
        className="fixed pointer-events-none z-50 opacity-80 ghost-panel-preview"
        style={{
          left: `${ghostPosition.x}px`,
          top: `${ghostPosition.y}px`,
        }}
      >
        <Card className="border-primary bg-card shadow-2xl animate-pulse-border w-[calc(100vw-2rem)] max-w-md">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClockCounterClockwise weight="bold" className="text-primary" size={16} />
                <span className="text-xs tracking-[0.08em] uppercase">Mission Log</span>
              </div>
              <Badge variant="outline" className="text-[9px] px-2 py-0 border-primary text-primary">
                {entries.length} EVENTS
              </Badge>
            </div>
            <div className="space-y-2 opacity-60">
              {entries.slice(-3).map((entry) => (
                <div key={entry.id} className="border-l-2 border-border/50 pl-3 space-y-0.5">
                  <div className="text-[10px] font-medium truncate">{entry.title}</div>
                  <div className="text-[9px] text-muted-foreground truncate">
                    {entry.details || formatRelativeTime(entry.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    )}
  </>
  )
}
