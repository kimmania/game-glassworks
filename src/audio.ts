export class AudioManager {
  private ctx: AudioContext | null = null
  private enabled = true

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  async unlock(): Promise<void> {
    if (!this.enabled) return
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return
    if (!this.ctx) this.ctx = new AudioContextCtor()
    if (this.ctx.state === 'suspended') await this.ctx.resume()
  }

  play(kind: 'grab' | 'place' | 'seal' | 'shatter' | 'reheat' | 'win' | 'tap'): void {
    if (!this.enabled) return
    void this.unlock()
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const specs = {
      grab: [520, 0.05, 0.035],
      place: [330, 0.08, 0.055],
      seal: [150, 0.18, 0.09],
      shatter: [780, 0.12, 0.06],
      reheat: [240, 0.16, 0.075],
      win: [440, 0.35, 0.08],
      tap: [360, 0.04, 0.025],
    } as const
    const [freq, duration, volume] = specs[kind]
    osc.frequency.setValueAtTime(freq, now)
    if (kind === 'win') osc.frequency.exponentialRampToValueAtTime(freq * 1.8, now + duration)
    if (kind === 'shatter') osc.type = 'sawtooth'
    if (kind === 'seal') osc.type = 'triangle'
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(gain).connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + duration)
  }
}
