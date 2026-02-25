export type AlertPriority = 'low' | 'normal' | 'high' | 'critical'
export type ActivityType = 'status' | 'location' | 'mission' | 'alert' | 'transmission' | 'check-in'

interface SoundConfig {
  frequency: number
  frequencyRamp?: number
  volume: number
  duration: number
  waveType: OscillatorType
  repeat: boolean
  repeatDelay: number
}

class SoundGenerator {
  private audioContext: AudioContext | null = null
  private repeatTimeouts: number[] = []

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }
    return this.audioContext
  }

  playPingAlert(priority: AlertPriority = 'normal'): void {
    const ctx = this.getAudioContext()
    const now = ctx.currentTime

    const config = this.getAlertConfig(priority)
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.type = config.waveType
    oscillator.frequency.setValueAtTime(config.frequency, now)
    
    if (config.frequencyRamp) {
      oscillator.frequency.exponentialRampToValueAtTime(
        config.frequencyRamp,
        now + config.duration * 0.5
      )
    }
    
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration)
    
    oscillator.start(now)
    oscillator.stop(now + config.duration)
    
    if (config.repeat) {
      const timeout = window.setTimeout(() => {
        this.playPingAlert(priority)
      }, config.repeatDelay)
      this.repeatTimeouts.push(timeout)
    }
  }

  playActivityAlert(activityType: ActivityType, priority?: AlertPriority): void {
    const ctx = this.getAudioContext()
    const now = ctx.currentTime

    const config = this.getActivityConfig(activityType, priority)
    
    if (config.notes && config.notes.length > 0) {
      config.notes.forEach((note, index) => {
        const delay = index * config.noteDelay!
        this.playTone(
          note.frequency,
          note.duration,
          config.volume,
          config.waveType,
          now + delay,
          note.frequencyRamp
        )
      })
    } else {
      this.playTone(
        config.frequency,
        config.duration,
        config.volume,
        config.waveType,
        now,
        config.frequencyRamp
      )
    }
  }

  private playTone(
    frequency: number,
    duration: number,
    volume: number,
    waveType: OscillatorType,
    startTime: number,
    frequencyRamp?: number
  ): void {
    const ctx = this.getAudioContext()
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.type = waveType
    oscillator.frequency.setValueAtTime(frequency, startTime)
    
    if (frequencyRamp) {
      oscillator.frequency.exponentialRampToValueAtTime(
        frequencyRamp,
        startTime + duration * 0.5
      )
    }
    
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
    
    oscillator.start(startTime)
    oscillator.stop(startTime + duration)
  }

  private getAlertConfig(priority: AlertPriority): SoundConfig {
    switch (priority) {
      case 'critical':
        return {
          frequency: 880,
          frequencyRamp: 440,
          volume: 0.4,
          duration: 0.15,
          waveType: 'sawtooth',
          repeat: true,
          repeatDelay: 200
        }
      case 'high':
        return {
          frequency: 660,
          frequencyRamp: 880,
          volume: 0.3,
          duration: 0.25,
          waveType: 'square',
          repeat: true,
          repeatDelay: 400
        }
      case 'normal':
        return {
          frequency: 800,
          frequencyRamp: undefined,
          volume: 0.25,
          duration: 0.2,
          waveType: 'sine',
          repeat: false,
          repeatDelay: 0
        }
      case 'low':
        return {
          frequency: 440,
          frequencyRamp: undefined,
          volume: 0.15,
          duration: 0.15,
          waveType: 'sine',
          repeat: false,
          repeatDelay: 0
        }
    }
  }

  private getActivityConfig(
    activityType: ActivityType,
    priority?: AlertPriority
  ): SoundConfig & { notes?: Array<{ frequency: number; duration: number; frequencyRamp?: number }>; noteDelay?: number } {
    const baseVolume = priority === 'critical' ? 0.35 : priority === 'high' ? 0.25 : 0.18

    switch (activityType) {
      case 'status':
        return {
          frequency: 523,
          volume: baseVolume * 0.8,
          duration: 0.12,
          waveType: 'sine',
          repeat: false,
          repeatDelay: 0,
          notes: [
            { frequency: 523, duration: 0.12 }
          ],
          noteDelay: 0
        }

      case 'check-in':
        return {
          frequency: 659,
          volume: baseVolume * 0.9,
          duration: 0.15,
          waveType: 'sine',
          repeat: false,
          repeatDelay: 0,
          notes: [
            { frequency: 659, duration: 0.1 },
            { frequency: 784, duration: 0.15 }
          ],
          noteDelay: 0.12
        }

      case 'location':
        return {
          frequency: 440,
          volume: baseVolume * 0.85,
          duration: 0.18,
          waveType: 'triangle',
          repeat: false,
          repeatDelay: 0,
          notes: [
            { frequency: 440, duration: 0.08 },
            { frequency: 554, duration: 0.08 },
            { frequency: 659, duration: 0.1 }
          ],
          noteDelay: 0.09
        }

      case 'mission':
        return {
          frequency: 880,
          volume: baseVolume * 1.1,
          duration: 0.2,
          waveType: 'square',
          repeat: false,
          repeatDelay: 0,
          notes: [
            { frequency: 880, duration: 0.15 },
            { frequency: 1047, duration: 0.18 }
          ],
          noteDelay: 0.08
        }

      case 'transmission':
        return {
          frequency: 1320,
          frequencyRamp: 1760,
          volume: baseVolume * 0.75,
          duration: 0.25,
          waveType: 'sawtooth',
          repeat: false,
          repeatDelay: 0,
          notes: [
            { frequency: 1320, duration: 0.08, frequencyRamp: 1760 },
            { frequency: 1760, duration: 0.08, frequencyRamp: 1320 }
          ],
          noteDelay: 0.1
        }

      case 'alert':
        if (priority === 'critical') {
          return {
            frequency: 988,
            frequencyRamp: 740,
            volume: 0.4,
            duration: 0.2,
            waveType: 'sawtooth',
            repeat: false,
            repeatDelay: 0,
            notes: [
              { frequency: 988, duration: 0.15, frequencyRamp: 740 },
              { frequency: 988, duration: 0.15, frequencyRamp: 740 }
            ],
            noteDelay: 0.18
          }
        } else if (priority === 'high') {
          return {
            frequency: 880,
            frequencyRamp: 660,
            volume: 0.3,
            duration: 0.18,
            waveType: 'square',
            repeat: false,
            repeatDelay: 0,
            notes: [
              { frequency: 880, duration: 0.15, frequencyRamp: 660 },
              { frequency: 880, duration: 0.15, frequencyRamp: 660 }
            ],
            noteDelay: 0.2
          }
        } else {
          return {
            frequency: 740,
            frequencyRamp: 587,
            volume: baseVolume,
            duration: 0.2,
            waveType: 'triangle',
            repeat: false,
            repeatDelay: 0
          }
        }

      default:
        return {
          frequency: 523,
          volume: baseVolume,
          duration: 0.15,
          waveType: 'sine',
          repeat: false,
          repeatDelay: 0
        }
    }
  }

  playSOSAlert(): void {
    const ctx = this.getAudioContext()
    const now = ctx.currentTime

    const dotDuration = 0.08
    const dashDuration = 0.24
    const elementGap = 0.12
    const letterGap = 0.3
    
    const frequency = 1200
    const volume = 0.45

    let currentTime = now

    const playDot = (startTime: number) => {
      this.playTone(frequency, dotDuration, volume, 'sine', startTime)
      return startTime + dotDuration + elementGap
    }

    const playDash = (startTime: number) => {
      this.playTone(frequency, dashDuration, volume, 'sine', startTime)
      return startTime + dashDuration + elementGap
    }

    currentTime = playDot(currentTime)
    currentTime = playDot(currentTime)
    currentTime = playDot(currentTime)
    
    currentTime += letterGap

    currentTime = playDash(currentTime)
    currentTime = playDash(currentTime)
    currentTime = playDash(currentTime)
    
    currentTime += letterGap

    currentTime = playDot(currentTime)
    currentTime = playDot(currentTime)
    currentTime = playDot(currentTime)
  }

  playOverdueAlert(severity: 'warning' | 'critical' = 'warning'): void {
    const ctx = this.getAudioContext()
    const now = ctx.currentTime

    if (severity === 'critical') {
      const notes = [
        { frequency: 1047, duration: 0.12 },
        { frequency: 880, duration: 0.12 },
        { frequency: 1047, duration: 0.12 },
        { frequency: 880, duration: 0.12 }
      ]
      
      notes.forEach((note, index) => {
        const delay = index * 0.15
        this.playTone(note.frequency, note.duration, 0.35, 'square', now + delay)
      })
    } else {
      const notes = [
        { frequency: 880, duration: 0.15 },
        { frequency: 784, duration: 0.15 }
      ]
      
      notes.forEach((note, index) => {
        const delay = index * 0.18
        this.playTone(note.frequency, note.duration, 0.25, 'triangle', now + delay)
      })
    }
  }

  stopAllSounds(): void {
    this.repeatTimeouts.forEach(timeout => clearTimeout(timeout))
    this.repeatTimeouts = []
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

export const soundGenerator = new SoundGenerator()
