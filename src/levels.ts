export const COLORS = {
  amber: { name: 'Amber', hex: '#e6a817', emoji: '🟡' },
  crimson: { name: 'Crimson', hex: '#c04a3d', emoji: '🔴' },
  cobalt: { name: 'Cobalt', hex: '#2c5f8e', emoji: '🔵' },
  emerald: { name: 'Emerald', hex: '#3a7d5c', emoji: '🟢' },
  amethyst: { name: 'Amethyst', hex: '#8b5e9c', emoji: '🟣' },
} as const

export type GlassColor = keyof typeof COLORS
export type RouteId = 'A' | 'B' | 'C' | 'D'
export type SpeedKey = 'relaxed' | 'normal' | 'fast'

export interface GateSpec {
  id: string
  label: string
  choices: RouteId[]
  initial: RouteId
}

export interface Level {
  id: string
  studio: 'apprentice'
  title: string
  subtitle: string
  sequence: GlassColor[]
  kilns: Record<GlassColor, RouteId>
  gates: GateSpec[]
  par: number
  unlockAfter?: string
}

export const SPEEDS: Record<SpeedKey, { label: string; speedMs: number; description: string }> = {
  relaxed: { label: 'Study Run', speedMs: 650, description: 'Slow animation for learning routes.' },
  normal: { label: 'Workshop Run', speedMs: 430, description: 'Standard animation pace.' },
  fast: { label: 'Maestro Run', speedMs: 260, description: 'Fast playback after you know the plan.' },
}

export const ROUTE_LABELS: Record<RouteId, string> = {
  A: 'Upper Kiln',
  B: 'Middle Kiln',
  C: 'Lower Kiln',
  D: 'Side Kiln',
}

export const LEVELS: Level[] = [
  {
    id: 'apprentice-01', studio: 'apprentice', title: 'First Switchboard',
    subtitle: 'Every colour has its own switch card. Tap each card to choose that colour’s kiln route.',
    sequence: ['amber', 'crimson', 'amber', 'crimson'],
    kilns: { amber: 'A', crimson: 'B', cobalt: 'C', emerald: 'D', amethyst: 'D' },
    gates: [
      { id: 'amber', label: 'Amber Switch', choices: ['A', 'B'], initial: 'B' },
      { id: 'crimson', label: 'Crimson Switch', choices: ['A', 'B'], initial: 'A' },
    ],
    par: 2,
  },
  {
    id: 'apprentice-02', studio: 'apprentice', title: 'Three Colours',
    subtitle: 'Two gates divide a three-colour stream.',
    sequence: ['amber', 'cobalt', 'crimson', 'amber', 'cobalt', 'crimson'],
    kilns: { amber: 'A', crimson: 'B', cobalt: 'C', emerald: 'D', amethyst: 'D' },
    gates: [
      { id: 'amber', label: 'Amber Gate', choices: ['A', 'B', 'C'], initial: 'B' },
      { id: 'cobalt', label: 'Cobalt Gate', choices: ['A', 'B', 'C'], initial: 'A' },
    ],
    par: 2,
    unlockAfter: 'apprentice-01',
  },
  {
    id: 'apprentice-03', studio: 'apprentice', title: 'Default Path',
    subtitle: 'Unassigned colours follow the default route. Set only what must change.',
    sequence: ['emerald', 'amber', 'crimson', 'emerald', 'amber', 'crimson'],
    kilns: { amber: 'A', crimson: 'B', emerald: 'C', cobalt: 'D', amethyst: 'D' },
    gates: [
      { id: 'default', label: 'Default Gate', choices: ['A', 'B', 'C'], initial: 'A' },
      { id: 'crimson', label: 'Crimson Override', choices: ['A', 'B', 'C'], initial: 'C' },
    ],
    par: 2,
    unlockAfter: 'apprentice-02',
  },
  {
    id: 'apprentice-04', studio: 'apprentice', title: 'Four Kilns',
    subtitle: 'Four routes, three adjustable gates, one correct routing table.',
    sequence: ['amber', 'cobalt', 'emerald', 'crimson', 'amber', 'emerald', 'cobalt', 'crimson'],
    kilns: { amber: 'A', crimson: 'B', cobalt: 'C', emerald: 'D', amethyst: 'D' },
    gates: [
      { id: 'amber', label: 'Amber Gate', choices: ['A', 'B', 'C', 'D'], initial: 'D' },
      { id: 'cobalt', label: 'Cobalt Gate', choices: ['A', 'B', 'C', 'D'], initial: 'B' },
      { id: 'emerald', label: 'Emerald Gate', choices: ['A', 'B', 'C', 'D'], initial: 'A' },
    ],
    par: 3,
    unlockAfter: 'apprentice-03',
  },
  {
    id: 'apprentice-05', studio: 'apprentice', title: 'Shared Mistake',
    subtitle: 'One wrong default sends multiple colours astray.',
    sequence: ['amethyst', 'emerald', 'amber', 'amethyst', 'crimson', 'emerald', 'amber'],
    kilns: { amber: 'A', crimson: 'B', emerald: 'C', amethyst: 'D', cobalt: 'A' },
    gates: [
      { id: 'default', label: 'Default Gate', choices: ['A', 'B', 'C', 'D'], initial: 'B' },
      { id: 'amber', label: 'Amber Override', choices: ['A', 'B', 'C', 'D'], initial: 'C' },
      { id: 'emerald', label: 'Emerald Override', choices: ['A', 'B', 'C', 'D'], initial: 'D' },
    ],
    par: 3,
    unlockAfter: 'apprentice-04',
  },
]

export function unlockedLevelIds(completed: Record<string, number>): Set<string> {
  const ids = new Set<string>()
  for (const level of LEVELS) {
    if (!level.unlockAfter || completed[level.unlockAfter]) ids.add(level.id)
  }
  return ids
}
