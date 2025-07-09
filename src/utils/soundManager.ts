// Sound management utility for the Spin & Win game
class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true

  constructor() {
    // Initialize audio context on first user interaction
    this.initializeAudioContext()
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.warn('Web Audio API not supported:', error)
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  private async ensureAudioContext() {
    if (!this.audioContext) {
      this.initializeAudioContext()
    }

    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  async playSpinSound() {
    if (!this.enabled || !this.audioContext) return

    try {
      await this.ensureAudioContext()
      
      const oscillator = this.audioContext!.createOscillator()
      const gainNode = this.audioContext!.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext!.destination)
      
      // Create a spinning sound effect
      oscillator.frequency.setValueAtTime(440, this.audioContext!.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext!.currentTime + 2)
      oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext!.currentTime + 4)
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext!.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 4)
      
      oscillator.start()
      oscillator.stop(this.audioContext!.currentTime + 4)
    } catch (error) {
      console.warn('Failed to play spin sound:', error)
    }
  }

  async playWinSound(points: number) {
    if (!this.enabled || !this.audioContext) return

    try {
      await this.ensureAudioContext()
      
      if (points >= 500) {
        // Big win sound
        await this.playBigWinSound()
      } else if (points >= 100) {
        // Medium win sound
        await this.playMediumWinSound()
      } else {
        // Small win sound
        await this.playSmallWinSound()
      }
    } catch (error) {
      console.warn('Failed to play win sound:', error)
    }
  }

  private async playSmallWinSound() {
    const oscillator = this.audioContext!.createOscillator()
    const gainNode = this.audioContext!.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext!.destination)
    
    // Simple ascending tone
    oscillator.frequency.setValueAtTime(523, this.audioContext!.currentTime) // C5
    oscillator.frequency.setValueAtTime(659, this.audioContext!.currentTime + 0.1) // E5
    oscillator.frequency.setValueAtTime(784, this.audioContext!.currentTime + 0.2) // G5
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext!.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.3)
    
    oscillator.start()
    oscillator.stop(this.audioContext!.currentTime + 0.3)
  }

  private async playMediumWinSound() {
    // Play multiple tones for medium win
    const frequencies = [523, 659, 784, 1047] // C5, E5, G5, C6
    
    for (let i = 0; i < frequencies.length; i++) {
      setTimeout(() => {
        const oscillator = this.audioContext!.createOscillator()
        const gainNode = this.audioContext!.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(this.audioContext!.destination)
        
        oscillator.frequency.setValueAtTime(frequencies[i], this.audioContext!.currentTime)
        gainNode.gain.setValueAtTime(0.1, this.audioContext!.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.2)
        
        oscillator.start()
        oscillator.stop(this.audioContext!.currentTime + 0.2)
      }, i * 100)
    }
  }

  private async playBigWinSound() {
    // Elaborate fanfare for big wins
    const melody = [
      { freq: 523, duration: 0.2 }, // C5
      { freq: 659, duration: 0.2 }, // E5
      { freq: 784, duration: 0.2 }, // G5
      { freq: 1047, duration: 0.4 }, // C6
      { freq: 784, duration: 0.2 }, // G5
      { freq: 1047, duration: 0.6 }, // C6
    ]
    
    let currentTime = 0
    melody.forEach((note, index) => {
      setTimeout(() => {
        const oscillator = this.audioContext!.createOscillator()
        const gainNode = this.audioContext!.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(this.audioContext!.destination)
        
        oscillator.frequency.setValueAtTime(note.freq, this.audioContext!.currentTime)
        gainNode.gain.setValueAtTime(0.15, this.audioContext!.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + note.duration)
        
        oscillator.start()
        oscillator.stop(this.audioContext!.currentTime + note.duration)
      }, currentTime * 1000)
      
      currentTime += note.duration
    })
  }

  async playClickSound() {
    if (!this.enabled || !this.audioContext) return

    try {
      await this.ensureAudioContext()
      
      const oscillator = this.audioContext!.createOscillator()
      const gainNode = this.audioContext!.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext!.destination)
      
      oscillator.frequency.setValueAtTime(800, this.audioContext!.currentTime)
      gainNode.gain.setValueAtTime(0.1, this.audioContext!.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.1)
      
      oscillator.start()
      oscillator.stop(this.audioContext!.currentTime + 0.1)
    } catch (error) {
      console.warn('Failed to play click sound:', error)
    }
  }
}

export const soundManager = new SoundManager()