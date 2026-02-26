import { ReactNode, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CaretDown, DotsSixVertical } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface DraggableDataCardProps {
  id: string
  icon: ReactNode
  title: string
  headerContent?: ReactNode
  children: ReactNode
  defaultCollapsed?: boolean
  canCollapse?: boolean
  onDragStart?: (id: string) => void
  onDragEnd?: () => void
  onDragOver?: (id: string) => void
  isDragging?: boolean
  isDragTarget?: boolean
  className?: string
}

export function DraggableDataCard({
  id,
  icon,
  title,
  headerContent,
  children,
  defaultCollapsed = false,
  canCollapse = true,
  onDragStart,
  onDragEnd,
  onDragOver,
  isDragging = false,
  isDragTarget = false,
  className
}: DraggableDataCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [isDragHover, setIsDragHover] = useState(false)
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null)
  const [isDragCancelled, setIsDragCancelled] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML)
    const rect = e.currentTarget.getBoundingClientRect()
    dragStartPosRef.current = { x: rect.left, y: rect.top }
    setIsDragCancelled(false)
    if (onDragStart) onDragStart(id)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragHover(false)
    
    if (e.dataTransfer.dropEffect === 'none') {
      setIsDragCancelled(true)
      setTimeout(() => setIsDragCancelled(false), 400)
    }
    
    if (onDragEnd) onDragEnd()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (onDragOver && !isDragging) {
      onDragOver(id)
    }
  }

  const handleDragEnter = () => {
    if (!isDragging) {
      setIsDragHover(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragHover(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragHover(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStartY(touch.clientY)
    if (onDragStart) onDragStart(id)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return
    
    const touch = e.touches[0]
    const deltaY = touch.clientY - touchStartY
    
    if (Math.abs(deltaY) > 50) {
      const elements = document.querySelectorAll('[data-draggable-card]')
      elements.forEach((element) => {
        const rect = element.getBoundingClientRect()
        if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          const targetId = element.getAttribute('data-draggable-card')
          if (targetId && onDragOver && targetId !== id) {
            onDragOver(targetId)
          }
        }
      })
    }
  }

  const handleTouchEnd = () => {
    setTouchStartY(null)
    
    const wasDragging = touchStartY !== null
    if (wasDragging && !isDragTarget) {
      setIsDragCancelled(true)
      setTimeout(() => setIsDragCancelled(false), 400)
    }
    
    if (onDragEnd) onDragEnd()
  }

  return (
    <motion.div
      animate={isDragCancelled ? {
        scale: [0.95, 1.02, 1],
        opacity: [0.6, 1]
      } : {}}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.4
      }}
    >
    <Card
      data-draggable-card={id}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'border-primary/30 p-2.5 space-y-2 transition-all duration-200',
        'hover:border-primary/50 hover:shadow-[0_0_20px_rgba(120,185,127,0.15)]',
        'active:shadow-[0_0_30px_rgba(120,185,127,0.25)]',
        isDragging && 'opacity-40 scale-95 cursor-grabbing border-primary/70',
        isDragTarget && !isDragging && 'border-accent animate-pulse-border shadow-[0_0_25px_rgba(191,173,101,0.3)] scale-[1.02]',
        isDragHover && !isDragging && 'border-accent/70 bg-accent/5 scale-[1.01]',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-1">
          <button
            className={cn(
              'cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-all duration-200',
              'hover:scale-110 active:scale-95',
              'hover:drop-shadow-[0_0_8px_rgba(120,185,127,0.6)]',
              'relative'
            )}
            onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
            onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
          >
            <DotsSixVertical weight="bold" size={16} />
            {isDragging && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
            )}
          </button>
          {icon}
          <span className="text-xs tracking-[0.08em] uppercase">{title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {headerContent}
          {canCollapse && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                'text-muted-foreground hover:text-primary transition-all duration-200',
                'hover:scale-110 active:scale-95',
                'hover:drop-shadow-[0_0_8px_rgba(120,185,127,0.6)]',
                isCollapsed ? 'rotate-180' : 'rotate-0'
              )}
            >
              <CaretDown weight="bold" size={14} />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          <Separator className="bg-border" />
          <div className="animate-in fade-in-50 duration-200">
            {children}
          </div>
        </>
      )}
    </Card>
    </motion.div>
  )
}
