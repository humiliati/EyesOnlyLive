import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Heart, 
  MapPin, 
  Target, 
  RadioButton, 
  WarningCircle,
  Lock,
  BatteryFull,
  WifiHigh,
  Eye
} from '@phosphor-icons/react'

interface BiometricData {
  heartRate: number
  bloodOxygen: number
  stressLevel: number
  temperature: number
}

interface LocationData {
  latitude: number
  longitude: number
  speed: number
  distance: number
  elevation: number
}

interface MissionData {
  name: string
  objective: string
  progress: number
  threatLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  phase: string
  startTime: number
}

function App() {
  const [isTransmitting, setIsTransmitting] = useKV<boolean>('transmission-active', false)
  const [agentCallsign] = useKV<string>('agent-callsign', 'SHADOW-7')
  const [clearanceLevel] = useKV<string>('clearance-level', 'LEVEL 4')
  const [missionData, setMissionData] = useKV<MissionData>('mission-data', {
    name: 'OPERATION NIGHTFALL',
    objective: 'Secure Package Alpha',
    progress: 0,
    threatLevel: 'LOW',
    phase: 'INFILTRATION',
    startTime: Date.now()
  })

  const [biometrics, setBiometrics] = useState<BiometricData>({
    heartRate: 72,
    bloodOxygen: 98,
    stressLevel: 15,
    temperature: 36.8
  })

  const [location, setLocation] = useState<LocationData>({
    latitude: 40.7128,
    longitude: -74.0060,
    speed: 0,
    distance: 0,
    elevation: 10
  })

  const [signalStrength, setSignalStrength] = useState(85)
  const [batteryLevel, setBatteryLevel] = useState(87)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const bioInterval = setInterval(() => {
      setBiometrics((prev) => ({
        heartRate: Math.max(60, Math.min(180, prev.heartRate + (Math.random() - 0.5) * 5)),
        bloodOxygen: Math.max(90, Math.min(100, prev.bloodOxygen + (Math.random() - 0.5) * 2)),
        stressLevel: Math.max(0, Math.min(100, prev.stressLevel + (Math.random() - 0.5) * 8)),
        temperature: Math.max(36.0, Math.min(38.5, prev.temperature + (Math.random() - 0.5) * 0.2))
      }))
    }, 2500)

    const locInterval = setInterval(() => {
      setLocation((prev) => ({
        latitude: prev.latitude + (Math.random() - 0.5) * 0.0001,
        longitude: prev.longitude + (Math.random() - 0.5) * 0.0001,
        speed: Math.max(0, Math.min(5, prev.speed + (Math.random() - 0.5) * 0.5)),
        distance: prev.distance + Math.random() * 0.05,
        elevation: Math.max(0, Math.min(100, prev.elevation + (Math.random() - 0.5) * 2))
      }))
    }, 3000)

    const signalInterval = setInterval(() => {
      setSignalStrength((prev) => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 10)))
    }, 4000)

    const batteryInterval = setInterval(() => {
      setBatteryLevel((prev) => Math.max(0, prev - 0.1))
    }, 30000)

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    const missionInterval = setInterval(() => {
      setMissionData((current) => {
        if (!current) {
          return {
            name: 'OPERATION NIGHTFALL',
            objective: 'Secure Package Alpha',
            progress: 0,
            threatLevel: 'LOW',
            phase: 'INFILTRATION',
            startTime: Date.now()
          }
        }
        const elapsed = Date.now() - current.startTime
        const newProgress = Math.min(100, (elapsed / (30 * 60 * 1000)) * 100)
        
        let newThreatLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = current.threatLevel
        if (newProgress > 75) newThreatLevel = 'CRITICAL'
        else if (newProgress > 50) newThreatLevel = 'HIGH'
        else if (newProgress > 25) newThreatLevel = 'MODERATE'
        
        return {
          ...current,
          progress: newProgress,
          threatLevel: newThreatLevel
        }
      })
    }, 5000)

    return () => {
      clearInterval(bioInterval)
      clearInterval(locInterval)
      clearInterval(signalInterval)
      clearInterval(batteryInterval)
      clearInterval(timeInterval)
      clearInterval(missionInterval)
    }
  }, [setMissionData])

  const getHeartRateStatus = () => {
    if (biometrics.heartRate > 120) return 'text-destructive'
    if (biometrics.heartRate > 100) return 'text-accent'
    return 'text-primary'
  }

  const getStressStatus = () => {
    if (biometrics.stressLevel > 70) return 'text-destructive'
    if (biometrics.stressLevel > 40) return 'text-accent'
    return 'text-primary'
  }

  const getThreatColor = () => {
    if (!missionData) return 'bg-primary text-primary-foreground'
    switch (missionData.threatLevel) {
      case 'CRITICAL': return 'bg-destructive text-destructive-foreground'
      case 'HIGH': return 'bg-accent text-accent-foreground'
      case 'MODERATE': return 'bg-amber-700 text-foreground'
      default: return 'bg-primary text-primary-foreground'
    }
  }

  const formatTime = (date: Date) => {
    return date.toTimeString().slice(0, 8)
  }

  const formatCoordinate = (value: number, precision: number = 6) => {
    return value.toFixed(precision)
  }
  
  if (!missionData) return null

  return (
    <div className="min-h-screen bg-background text-foreground scanline-effect">
      <div className="max-w-md mx-auto p-4 space-y-4">
        <header className="flex items-center justify-between border border-border p-3 bg-card">
          <div className="flex items-center gap-2">
            <Eye weight="bold" className="text-primary" size={20} />
            <div>
              <div className="text-xs tracking-widest">EYES ONLY</div>
              <div className="text-[10px] text-muted-foreground">CLASSIFIED</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold tabular-nums">{formatTime(currentTime)}</div>
            <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary text-primary">
              {clearanceLevel}
            </Badge>
          </div>
        </header>

        <Card className="border-primary/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target weight="bold" className="text-primary" size={16} />
              <span className="text-xs tracking-[0.08em] uppercase">AGENT ID</span>
            </div>
            <span className="text-sm font-bold">{agentCallsign}</span>
          </div>
          
          <Separator className="bg-border" />
          
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Mission</span>
              <Badge className={`${getThreatColor()} text-[9px] px-2 py-0`}>
                {missionData.threatLevel}
              </Badge>
            </div>
            <div className="text-sm font-medium">{missionData.name}</div>
            <div className="text-[10px] text-muted-foreground">{missionData.objective}</div>
            <div className="pt-2 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">PROGRESS</span>
                <span className="tabular-nums">{missionData.progress.toFixed(1)}%</span>
              </div>
              <Progress value={missionData.progress} className="h-1.5" />
            </div>
          </div>
        </Card>

        <Card className="border-primary/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Heart weight="bold" className="text-primary" size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Biometrics</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Heart Rate</div>
              <div className={`text-xl font-bold tabular-nums ${getHeartRateStatus()}`}>
                {Math.round(biometrics.heartRate)}
                <span className="text-xs ml-1">BPM</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Blood O₂</div>
              <div className="text-xl font-bold tabular-nums text-primary">
                {Math.round(biometrics.bloodOxygen)}
                <span className="text-xs ml-1">%</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Stress</div>
              <div className={`text-xl font-bold tabular-nums ${getStressStatus()}`}>
                {Math.round(biometrics.stressLevel)}
                <span className="text-xs ml-1">%</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Body Temp</div>
              <div className="text-xl font-bold tabular-nums text-primary">
                {biometrics.temperature.toFixed(1)}
                <span className="text-xs ml-1">°C</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-primary/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin weight="bold" className="text-primary" size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Location</span>
          </div>
          
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">Coordinates</div>
              <div className="text-xs font-mono tabular-nums text-primary">
                {formatCoordinate(location.latitude, 6)}°N
              </div>
              <div className="text-xs font-mono tabular-nums text-primary">
                {formatCoordinate(Math.abs(location.longitude), 6)}°W
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="space-y-1">
                <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Speed</div>
                <div className="text-sm font-bold tabular-nums">{location.speed.toFixed(1)}</div>
                <div className="text-[9px] text-muted-foreground">m/s</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Distance</div>
                <div className="text-sm font-bold tabular-nums">{location.distance.toFixed(2)}</div>
                <div className="text-[9px] text-muted-foreground">km</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Elevation</div>
                <div className="text-sm font-bold tabular-nums">{Math.round(location.elevation)}</div>
                <div className="text-[9px] text-muted-foreground">m</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-primary/30 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <RadioButton weight="bold" className={isTransmitting ? 'text-primary pulse-signal' : 'text-muted-foreground'} size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Transmission</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <WifiHigh weight="bold" className="text-primary" size={12} />
                <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Signal</div>
              </div>
              <div className="text-lg font-bold tabular-nums">{Math.round(signalStrength)}%</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <BatteryFull weight="bold" className={batteryLevel < 20 ? 'text-destructive' : 'text-primary'} size={12} />
                <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Power</div>
              </div>
              <div className="text-lg font-bold tabular-nums">{Math.round(batteryLevel)}%</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Lock weight="bold" className="text-primary" size={12} />
                <div className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">Secure</div>
              </div>
              <div className="text-lg font-bold">AES</div>
            </div>
          </div>
          
          <Button
            onClick={() => setIsTransmitting((prev) => !prev)}
            className={`w-full font-bold tracking-wider ${
              isTransmitting 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {isTransmitting ? '● TRANSMITTING' : '○ OFFLINE'}
          </Button>
          
          {isTransmitting && (
            <div className="text-[10px] text-center text-primary animate-pulse">
              DATA STREAM ACTIVE - ALL TELEMETRY BROADCASTING
            </div>
          )}
        </Card>

        {batteryLevel < 20 && (
          <Card className="border-destructive bg-destructive/10 p-3">
            <div className="flex items-center gap-2">
              <WarningCircle weight="bold" className="text-destructive" size={16} />
              <div className="text-xs">
                <div className="font-bold text-destructive">LOW POWER WARNING</div>
                <div className="text-[10px] text-muted-foreground">Enable conservation mode recommended</div>
              </div>
            </div>
          </Card>
        )}

        {biometrics.stressLevel > 80 && (
          <Card className="border-accent bg-accent/10 p-3">
            <div className="flex items-center gap-2">
              <WarningCircle weight="bold" className="text-accent" size={16} />
              <div className="text-xs">
                <div className="font-bold text-accent">ELEVATED STRESS DETECTED</div>
                <div className="text-[10px] text-muted-foreground">Recommend tactical breathing exercises</div>
              </div>
            </div>
          </Card>
        )}

        <div className="text-center text-[9px] text-muted-foreground tracking-wider pb-4 opacity-50">
          ░ CLASSIFIED - FOR AUTHORIZED PERSONNEL ONLY ░
        </div>
      </div>
    </div>
  )
}

export default App
