import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Crosshair,
  Users,
  Bell,
  Heartbeat
} from '@phosphor-icons/react'

interface SituationPanelProps {
  missionProgress: number
  threatLevel: string
  unreadAlerts: number
  teamSize: number
  biometricStatus: 'normal' | 'elevated' | 'critical'
}

export function SituationPanel({ 
  missionProgress, 
  threatLevel, 
  unreadAlerts,
  teamSize,
  biometricStatus
}: SituationPanelProps) {
  const getThreatColor = () => {
    switch (threatLevel) {
      case 'CRITICAL': return 'bg-destructive text-destructive-foreground'
      case 'HIGH': return 'bg-accent text-accent-foreground'
      case 'MODERATE': return 'bg-amber-700 text-foreground'
      default: return 'bg-primary text-primary-foreground'
    }
  }

  const getBiometricColor = () => {
    switch (biometricStatus) {
      case 'critical': return 'text-destructive'
      case 'elevated': return 'text-accent'
      default: return 'text-primary'
    }
  }

  return (
    <Card className="border-primary/30 p-3 bg-card/80 backdrop-blur-sm">
      <div className="grid grid-cols-4 gap-3">
        <div className="flex flex-col items-center justify-center space-y-1">
          <Crosshair weight="bold" className="text-primary" size={16} />
          <div className="text-lg font-bold tabular-nums">{missionProgress.toFixed(0)}%</div>
          <div className="text-[8px] text-muted-foreground tracking-wider uppercase">Mission</div>
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-1">
          <Badge className={`${getThreatColor()} text-[8px] px-1.5 py-0.5`}>
            {threatLevel}
          </Badge>
          <div className="text-[8px] text-muted-foreground tracking-wider uppercase">Threat</div>
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-1 relative">
          <Bell weight="bold" className={unreadAlerts > 0 ? 'text-destructive animate-pulse' : 'text-muted-foreground'} size={16} />
          <div className={`text-lg font-bold tabular-nums ${unreadAlerts > 0 ? 'text-destructive' : ''}`}>
            {unreadAlerts}
          </div>
          <div className="text-[8px] text-muted-foreground tracking-wider uppercase">Alerts</div>
          {unreadAlerts > 0 && (
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-destructive animate-ping"></div>
          )}
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-1">
          <Heartbeat weight="bold" className={getBiometricColor()} size={16} />
          <div className={`text-[9px] font-bold uppercase ${getBiometricColor()}`}>
            {biometricStatus}
          </div>
          <div className="text-[8px] text-muted-foreground tracking-wider uppercase">Status</div>
        </div>
      </div>
    </Card>
  )
}
