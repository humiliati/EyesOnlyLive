import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Warning, PaperPlaneTilt } from '@phosphor-icons/react'
import { soundGenerator } from '@/lib/sounds'
import { motion, AnimatePresence } from 'framer-motion'

interface PanicButtonProps {
  agentCallsign: string
  agentId: string
  onSOSBroadcast: (message: string) => void
}

export function PanicButton({ agentCallsign, agentId, onSOSBroadcast }: PanicButtonProps) {
  const [isArmed, setIsArmed] = useState(false)
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownIntervalRef = useRef<number | null>(null)
  const armTimeoutRef = useRef<number | null>(null)

  const handleArmPanic = useCallback(() => {
    setIsArmed(true)
    
    armTimeoutRef.current = window.setTimeout(() => {
      setIsArmed(false)
    }, 5000)
  }, [])

  const handleTriggerPanic = useCallback(() => {
    if (armTimeoutRef.current) {
      clearTimeout(armTimeoutRef.current)
    }
    
    setIsArmed(false)
    setCountdown(3)
    
    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
          }
          
          soundGenerator.playSOSAlert()
          
          setIsBroadcasting(true)
          onSOSBroadcast(`EMERGENCY SOS - ${agentCallsign} REQUESTING IMMEDIATE ASSISTANCE`)
          
          setTimeout(() => {
            setIsBroadcasting(false)
            setCountdown(null)
          }, 3000)
          
          return null
        }
        return prev - 1
      })
    }, 1000)
  }, [agentCallsign, onSOSBroadcast])

  const handleCancelPanic = useCallback(() => {
    if (armTimeoutRef.current) {
      clearTimeout(armTimeoutRef.current)
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
    setIsArmed(false)
    setCountdown(null)
  }, [])

  return (
    <Card className={`border-2 p-4 transition-all duration-300 ${
      isBroadcasting 
        ? 'border-destructive bg-destructive/20 animate-pulse' 
        : isArmed 
          ? 'border-accent bg-accent/10' 
          : 'border-destructive/30 bg-card'
    }`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Warning 
              weight="fill" 
              className={`${isBroadcasting ? 'text-destructive animate-bounce' : isArmed ? 'text-accent' : 'text-destructive/70'}`}
              size={20} 
            />
            <span className="text-xs tracking-[0.08em] uppercase font-bold">
              {isBroadcasting ? 'BROADCASTING SOS' : isArmed ? 'PANIC ARMED' : 'Emergency Panic'}
            </span>
          </div>
          {isArmed && !countdown && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelPanic}
              className="h-6 text-[10px] px-2"
            >
              CANCEL
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {countdown !== null ? (
            <motion.div
              key="countdown"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center justify-center py-4"
            >
              <div className="text-5xl font-bold tabular-nums text-destructive">
                {countdown}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Broadcasting in...
              </div>
            </motion.div>
          ) : isBroadcasting ? (
            <motion.div
              key="broadcasting"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center justify-center py-4 gap-2"
            >
              <PaperPlaneTilt weight="fill" className="text-destructive" size={32} />
              <div className="text-xs text-center">
                <div className="font-bold text-destructive">SOS TRANSMITTED</div>
                <div className="text-[10px] text-muted-foreground">All blue team agents notified</div>
              </div>
            </motion.div>
          ) : isArmed ? (
            <motion.div
              key="armed"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Button
                onClick={handleTriggerPanic}
                className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold tracking-wider h-16 text-lg"
              >
                TRIGGER SOS
              </Button>
              <div className="text-center text-[10px] text-muted-foreground mt-2">
                Press to broadcast emergency signal
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="disarmed"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Button
                onClick={handleArmPanic}
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive/10 font-bold tracking-wider h-12"
              >
                ARM PANIC BUTTON
              </Button>
              <div className="text-center text-[10px] text-muted-foreground mt-2">
                Press once to arm, twice to trigger SOS
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isBroadcasting && !countdown && (
          <div className="text-[9px] text-destructive/70 text-center leading-tight">
            Emergency use only - Broadcasts distress signal to all field operatives
          </div>
        )}
      </div>
    </Card>
  )
}
