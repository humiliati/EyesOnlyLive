import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  MapPin, 
  Target, 
  WarningCircle, 
  ShieldCheck,
  Package,
  Eye,
  FirstAid
} from '@phosphor-icons/react'

interface StatusUpdateProps {
  onStatusUpdate: (status: string, type: string) => void
  agentCallsign: string
}

export function StatusUpdate({ onStatusUpdate, agentCallsign }: StatusUpdateProps) {
  const [recentUpdate, setRecentUpdate] = useState<string | null>(null)

  const handleUpdate = (status: string, type: string) => {
    onStatusUpdate(status, type)
    setRecentUpdate(status)
    setTimeout(() => setRecentUpdate(null), 3000)
  }

  const statusOptions = [
    { status: 'Position secure', type: 'status', icon: CheckCircle, color: 'text-primary' },
    { status: 'Moving to target', type: 'location', icon: MapPin, color: 'text-primary' },
    { status: 'Target acquired', type: 'mission', icon: Target, color: 'text-primary' },
    { status: 'Package secured', type: 'mission', icon: Package, color: 'text-primary' },
    { status: 'Area clear', type: 'status', icon: ShieldCheck, color: 'text-primary' },
    { status: 'Eyes on target', type: 'mission', icon: Eye, color: 'text-primary' },
    { status: 'Contact detected', type: 'alert', icon: WarningCircle, color: 'text-accent', priority: 'high' as const },
    { status: 'Need support', type: 'alert', icon: FirstAid, color: 'text-destructive', priority: 'high' as const },
  ]

  return (
    <Card className="border-primary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Quick Status</span>
        </div>
        {recentUpdate && (
          <Badge className="bg-primary text-primary-foreground text-[9px] px-2 py-0 animate-pulse">
            SENT
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {statusOptions.map((option) => {
          const Icon = option.icon
          return (
            <Button
              key={option.status}
              onClick={() => handleUpdate(option.status, option.type)}
              variant="outline"
              className={`text-[9px] flex-col h-auto py-2 px-2 gap-1 border-primary/30 hover:bg-primary/20 hover:border-primary ${
                recentUpdate === option.status ? 'bg-primary/30 border-primary' : ''
              }`}
              size="sm"
              disabled={recentUpdate === option.status}
            >
              <Icon weight="bold" size={14} className={option.color} />
              <span className="leading-tight text-center">{option.status}</span>
            </Button>
          )
        })}
      </div>

      <div className="text-[9px] text-center text-muted-foreground tracking-wider pt-1">
        RAPID STATUS UPDATES TO M CONSOLE
      </div>
    </Card>
  )
}
