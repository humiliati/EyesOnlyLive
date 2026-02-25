import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Pause, 
  Image as ImageIcon, 
  VideoCamera, 
  FileText,
  Building,
  Calendar,
  MapPin,
  ArrowsOut,
  ArrowsIn,
  X
} from '@phosphor-icons/react'
import { type RealWorldItem } from '@/components/RealWorldItemCrafter'
import { toast } from 'sonner'

export interface DebriefEntry {
  id: string
  timestamp: number
  type: 'item-crafted' | 'item-deployed' | 'item-retrieved' | 'business-participation' | 'photo-added'
  title: string
  description?: string
  realWorldItem?: RealWorldItem
  mediaUrls?: string[]
  businessName?: string
  ownerName?: string
  gridLocation?: string
}

interface DebriefMediaFeedProps {
  maxHeight?: string
  autoPlayVideos?: boolean
}

export function DebriefMediaFeed({ 
  maxHeight = '600px',
  autoPlayVideos = false
}: DebriefMediaFeedProps) {
  const [entries, setEntries] = useKV<DebriefEntry[]>('debrief-entries', [])
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isStretchMode, setIsStretchMode] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleMediaClick = (url: string, type: 'image' | 'video') => {
    setSelectedMedia({ url, type })
    setIsPlaying(false)
  }

  const handleCloseMedia = () => {
    setSelectedMedia(null)
    setIsPlaying(false)
  }

  const getMediaType = (url: string): 'image' | 'video' => {
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/)) {
      return 'image'
    }
    if (lowerUrl.match(/\.(mp4|webm|ogg|mov|avi)$/)) {
      return 'video'
    }
    return 'image'
  }

  const addDebriefEntry = (entry: Omit<DebriefEntry, 'id' | 'timestamp'>) => {
    const newEntry: DebriefEntry = {
      id: `DBF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      timestamp: Date.now(),
      ...entry
    }
    setEntries((current) => [newEntry, ...(current || [])])
  }

  useEffect(() => {
    (window as any).__addDebriefEntry = addDebriefEntry
    return () => {
      delete (window as any).__addDebriefEntry
    }
  }, [])

  const handleIncinerateEntry = (entryId: string) => {
    setEntries((current) => (current || []).filter(e => e.id !== entryId))
    toast.success('Entry incinerated')
  }

  const handleIncinerateAll = () => {
    if (!entries || entries.length === 0) return
    
    const confirmed = confirm(`Incinerate all ${entries.length} debrief entries? This cannot be undone.`)
    if (confirmed) {
      setEntries([])
      toast.success('All entries incinerated')
    }
  }

  const getTypeBadge = (type: DebriefEntry['type']) => {
    const badges = {
      'item-crafted': { label: 'Crafted', variant: 'secondary' as const },
      'item-deployed': { label: 'Deployed', variant: 'default' as const },
      'item-retrieved': { label: 'Retrieved', variant: 'outline' as const },
      'business-participation': { label: 'Business', variant: 'default' as const },
      'photo-added': { label: 'Photo', variant: 'secondary' as const }
    }
    const badge = badges[type]
    return <Badge variant={badge.variant} className="text-[9px] px-1.5 py-0">{badge.label}</Badge>
  }

  return (
    <Card className="border-primary/30 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <VideoCamera weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Debrief Feed</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px] px-2 py-0">
            {entries?.length || 0} Entries
          </Badge>
          {entries && entries.length > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleIncinerateAll}
              className="h-6 text-[9px] px-2"
            >
              🔥 Incinerate All
            </Button>
          )}
        </div>
      </div>

      <Separator className="mb-4" />

      {selectedMedia && (
        <Card className="border-accent bg-card/95 mb-4 overflow-hidden">
          <div className="flex items-center justify-between p-2 border-b border-border">
            <div className="flex items-center gap-2">
              {selectedMedia.type === 'image' ? (
                <ImageIcon weight="bold" className="text-primary" size={14} />
              ) : (
                <VideoCamera weight="bold" className="text-primary" size={14} />
              )}
              <span className="text-[10px] tracking-wider uppercase">Media Player</span>
            </div>
            <div className="flex items-center gap-1">
              {selectedMedia.type === 'video' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePlayPause}
                  className="h-6 w-6 p-0"
                >
                  {isPlaying ? (
                    <Pause weight="bold" size={12} />
                  ) : (
                    <Play weight="bold" size={12} />
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsStretchMode(!isStretchMode)}
                className="h-6 w-6 p-0"
                title={isStretchMode ? 'Super Mario 64 Style' : '4:3 Aspect Ratio'}
              >
                {isStretchMode ? (
                  <ArrowsIn weight="bold" size={12} />
                ) : (
                  <ArrowsOut weight="bold" size={12} />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCloseMedia}
                className="h-6 w-6 p-0"
              >
                <X weight="bold" size={12} />
              </Button>
            </div>
          </div>

          <div className="bg-black flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
            {selectedMedia.type === 'image' ? (
              <img
                src={selectedMedia.url}
                alt="Media content"
                className={`max-h-full max-w-full ${
                  isStretchMode 
                    ? 'object-fill w-full h-full' 
                    : 'object-contain'
                }`}
                style={isStretchMode ? {
                  imageRendering: 'pixelated',
                  transform: 'scale(1.2, 1.05)',
                  filter: 'contrast(1.1) saturate(1.2)'
                } : {}}
              />
            ) : (
              <video
                ref={videoRef}
                src={selectedMedia.url}
                className={`max-h-full max-w-full ${
                  isStretchMode 
                    ? 'object-fill w-full h-full' 
                    : 'object-contain'
                }`}
                style={isStretchMode ? {
                  transform: 'scale(1.2, 1.05)',
                  filter: 'contrast(1.1) saturate(1.2)'
                } : {}}
                controls={false}
                autoPlay={autoPlayVideos}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
            )}
          </div>

          <div className="p-2 bg-muted">
            <div className="text-[9px] text-muted-foreground font-mono truncate">
              {selectedMedia.url}
            </div>
          </div>
        </Card>
      )}

      <ScrollArea style={{ maxHeight: selectedMedia ? `calc(${maxHeight} - 300px)` : maxHeight }}>
        <div className="space-y-3 pr-2">
          {(!entries || entries.length === 0) && (
            <div className="text-center text-xs text-muted-foreground py-8">
              No debrief entries yet
            </div>
          )}

          {entries?.map((entry) => (
            <Card key={entry.id} className="border-border p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getTypeBadge(entry.type)}
                    <div className="text-[9px] text-muted-foreground tabular-nums">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="font-bold text-sm">{entry.title}</div>
                  {entry.description && (
                    <div className="text-xs text-muted-foreground mt-1">{entry.description}</div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleIncinerateEntry(entry.id)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                  title="Incinerate entry"
                >
                  🔥
                </Button>
              </div>

              {(entry.businessName || entry.ownerName || entry.gridLocation) && (
                <>
                  <Separator />
                  <div className="space-y-1 text-xs">
                    {entry.businessName && (
                      <div className="flex items-center gap-1.5">
                        <Building weight="bold" className="text-primary" size={10} />
                        <span className="text-muted-foreground">{entry.businessName}</span>
                      </div>
                    )}
                    {entry.ownerName && (
                      <div className="flex items-center gap-1.5">
                        <Calendar weight="bold" className="text-primary" size={10} />
                        <span className="text-muted-foreground">{entry.ownerName}</span>
                      </div>
                    )}
                    {entry.gridLocation && (
                      <div className="flex items-center gap-1.5">
                        <MapPin weight="bold" className="text-primary" size={10} />
                        <span className="text-muted-foreground">Grid {entry.gridLocation}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {entry.mediaUrls && entry.mediaUrls.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-[10px] tracking-wider uppercase text-muted-foreground">
                      Media ({entry.mediaUrls.length})
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {entry.mediaUrls.map((url, index) => {
                        const mediaType = getMediaType(url)
                        return (
                          <button
                            key={index}
                            onClick={() => handleMediaClick(url, mediaType)}
                            className="aspect-square bg-muted rounded flex items-center justify-center hover:bg-muted/80 transition-colors border-2 border-transparent hover:border-primary"
                          >
                            {mediaType === 'image' ? (
                              <ImageIcon weight="bold" className="text-primary" size={16} />
                            ) : (
                              <VideoCamera weight="bold" className="text-primary" size={16} />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              {entry.realWorldItem && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <div className="text-xl">{entry.realWorldItem.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{entry.realWorldItem.name}</div>
                      <div className="text-[10px] text-muted-foreground">{entry.realWorldItem.type}</div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>

      <div className="mt-4 p-2 bg-muted/50 rounded border border-border">
        <div className="text-[9px] text-muted-foreground text-center">
          🔥 ADAPTIVE GARBAGE INCINERATOR - Click 🔥 to permanently delete entries
        </div>
      </div>
    </Card>
  )
}

export function addDebriefEntryFromWindow(entry: Omit<DebriefEntry, 'id' | 'timestamp'>) {
  const addFunc = (window as any).__addDebriefEntry
  if (addFunc) {
    addFunc(entry)
  }
}
