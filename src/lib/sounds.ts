export type AlertPriority = 'low' | 'normal' | 'high' | 'critical'

class SoundGenerator {
  private audioContext: AudioContext | null = null

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
      setTimeout(() => {
        this.playPingAlert(priority)
      }, config.repeatDelay)
    }
  }

  private getAlertConfig(priority: AlertPriority) {
    switch (priority) {
      case 'critical':
        return {
          frequency: 880,
          frequencyRamp: 440,
          volume: 0.4,
          duration: 0.15,
          waveType: 'sawtooth' as OscillatorType,
          repeat: true,
          repeatDelay: 200
        }
      case 'high':
        return {
          frequency: 660,
          frequencyRamp: 880,
          volume: 0.3,
          duration: 0.25,
          waveType: 'square' as OscillatorType,
          repeat: true,
          repeatDelay: 400
        }
      case 'normal':
        return {
          frequency: 800,
          frequencyRamp: undefined,
          volume: 0.25,
          duration: 0.2,
          waveType: 'sine' as OscillatorType,
          repeat: false,
          repeatDelay: 0
        }
      case 'low':
        return {
          frequency: 440,
          frequencyRamp: undefined,
          volume: 0.15,
          duration: 0.15,
          waveType: 'sine' as OscillatorType,
          repeat: false,
          repeatDelay: 0
        }
    }
  }

  stopAllSounds(): void {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

export const soundGenerator = new SoundGenerator()
