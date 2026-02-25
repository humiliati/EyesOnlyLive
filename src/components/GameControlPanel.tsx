import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { gameStateSync } from '@/lib/gameStateSync'
import { 
  Pause, 
  Play, 
  BellRinging, 
  CaretDown,
  CaretRight
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface GameControlPanelProps {
  isFrozen: boolean
  emergencyPanicActive: boolean
  onStateChange?: () => void
}

export function GameControlPanel({ isFrozen, emergencyPanicActive, onStateChange }: GameControlPanelProps) {
  const [freezeReason, setFreezeReason] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleFreezeGame = async () => {
    if (!freezeReason.trim()) {
      toast.error('Please provide a reason for freezing the game')
      return
    }

    await gameStateSync.freezeGame(freezeReason, 'M-CONSOLE')
    toast.success('Game Frozen', {
      description: 'All player watches and operations suspended'
    })
    setFreezeReason('')
    onStateChange?.()
  }

  const handleUnfreezeGame = async () => {
    await gameStateSync.unfreezeGame()
    toast.success('Game Resumed', {
      description: 'All operations active'
    })
    onStateChange?.()
  }

  const handleEmergencyPanic = async () => {
    await gameStateSync.triggerEmergencyPanic('M-CONSOLE')
    toast.error('EMERGENCY PANIC ACTIVATED', {
      description: 'All operations halted immediately'
    })
    onStateChange?.()
  }

  return (
    <Card className="border-accent/50 bg-card">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/5"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <CaretRight weight="bold" className="text-accent" size={14} />
          ) : (
            <CaretDown weight="bold" className="text-accent" size={14} />
          )}
          <Pause weight="bold" className="text-accent" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase font-bold">Game Control Panel</span>
        </div>
        <div className="flex items-center gap-2">
          {isFrozen && (
            <Badge variant="destructive" className="text-[9px] px-2 py-0">
              FROZEN
            </Badge>
          )}
          {emergencyPanicActive && (
            <Badge variant="destructive" className="text-[9px] px-2 py-0 animate-pulse">
              PANIC
            </Badge>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          <Separator className="bg-border" />
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="freeze-reason" className="text-xs tracking-wider uppercase">
                Freeze Reason
              </Label>
              <Input
                id="freeze-reason"
                placeholder="e.g., Technical difficulty, Rules clarification..."
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                className="text-xs"
                disabled={isFrozen}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {!isFrozen ? (
                <Button
                  onClick={handleFreezeGame}
                  variant="outline"
                  className="w-full text-xs font-bold tracking-wider border-accent text-accent hover:bg-accent/20"
                >
                  <Pause weight="bold" size={14} className="mr-1" />
                  FREEZE GAME
                </Button>
              ) : (
                <Button
                  onClick={handleUnfreezeGame}
                  variant="outline"
                  className="w-full text-xs font-bold tracking-wider border-primary text-primary hover:bg-primary/20"
                >
                  <Play weight="bold" size={14} className="mr-1" />
                  RESUME GAME
                </Button>
              )}

              <Button
                onClick={handleEmergencyPanic}
                variant="destructive"
                className="w-full text-xs font-bold tracking-wider"
              >
                <BellRinging weight="bold" size={14} className="mr-1" />
                EMERGENCY PANIC
              </Button>
            </div>

            <div className="text-[10px] text-muted-foreground space-y-1">
              <div>• <strong>Freeze Game:</strong> Pauses all watches, stops telemetry updates</div>
              <div>• <strong>Emergency Panic:</strong> Immediate game halt, all players notified</div>
              <div>• <strong>Effect:</strong> Syncs in real-time to all player/ops/M watches</div>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
