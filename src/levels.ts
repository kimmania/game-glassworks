export const COLORS = {
  amber: { name: 'Amber', hex: '#e6a817', emoji: '🟡' },
  crimson: { name: 'Crimson', hex: '#c04a3d', emoji: '🔴' },
  cobalt: { name: 'Cobalt', hex: '#2c5f8e', emoji: '🔵' },
  emerald: { name: 'Emerald', hex: '#3a7d5c', emoji: '🟢' },
  amethyst: { name: 'Amethyst', hex: '#8b5e9c', emoji: '🟣' },
  smoky: { name: 'Smoky', hex: '#6b6b6b', emoji: '⚫' },
} as const

export type GlassColor = keyof typeof COLORS
export type SpeedKey = 'relaxed' | 'normal' | 'fast'

export interface Level {
  id: string
  studio: 'apprentice'
  title: string
  subtitle: string
  colors: Exclude<GlassColor, 'smoky'>[]
  capacity: number
  sequence: GlassColor[]
  reheats: number
  targetCullet: number
  targetTime: number
  unlockAfter?: string
}

export const SPEEDS: Record<SpeedKey, { label: string; pxPerSecond: number; lookAhead: number; culletLimit: number | null; recycle: boolean }> = {
  relaxed: { label: 'Relaxed', pxPerSecond: 54, lookAhead: 6, culletLimit: null, recycle: true },
  normal: { label: 'Normal', pxPerSecond: 86, lookAhead: 4, culletLimit: 8, recycle: false },
  fast: { label: 'Fast', pxPerSecond: 124, lookAhead: 3, culletLimit: 5, recycle: false },
}

export const LEVELS: Level[] = [
  {
    id: 'apprentice-01',
    studio: 'apprentice',
    title: 'First Fire',
    subtitle: 'Sort three colours while the forehearth teaches the rhythm.',
    colors: ['amber', 'crimson', 'cobalt'],
    capacity: 3,
    reheats: 3,
    targetCullet: 0,
    targetTime: 80,
    sequence: ['amber', 'crimson', 'cobalt', 'amber', 'cobalt', 'crimson', 'amber', 'crimson', 'cobalt'],
  },
  {
    id: 'apprentice-02',
    studio: 'apprentice',
    title: 'Canal Light',
    subtitle: 'A longer run with repeated pairs. Watch the forehearth before you grab.',
    colors: ['amber', 'emerald', 'cobalt'],
    capacity: 3,
    reheats: 3,
    targetCullet: 0,
    targetTime: 85,
    sequence: ['emerald', 'amber', 'emerald', 'cobalt', 'amber', 'cobalt', 'emerald', 'amber', 'cobalt'],
    unlockAfter: 'apprentice-01',
  },
  {
    id: 'apprentice-03',
    studio: 'apprentice',
    title: 'Three Hot Hands',
    subtitle: 'The same colour returns before you expect it. One globe at a time.',
    colors: ['crimson', 'cobalt', 'amethyst'],
    capacity: 3,
    reheats: 2,
    targetCullet: 1,
    targetTime: 90,
    sequence: ['crimson', 'cobalt', 'crimson', 'amethyst', 'cobalt', 'amethyst', 'crimson', 'amethyst', 'cobalt'],
    unlockAfter: 'apprentice-02',
  },
  {
    id: 'apprentice-04',
    studio: 'apprentice',
    title: 'Four Kilns',
    subtitle: 'Four colours, small kilns, no combos — just clean sorting.',
    colors: ['amber', 'crimson', 'cobalt', 'emerald'],
    capacity: 3,
    reheats: 2,
    targetCullet: 1,
    targetTime: 110,
    sequence: ['amber', 'cobalt', 'crimson', 'emerald', 'amber', 'crimson', 'cobalt', 'emerald', 'cobalt', 'amber', 'emerald', 'crimson'],
    unlockAfter: 'apprentice-03',
  },
  {
    id: 'apprentice-05',
    studio: 'apprentice',
    title: 'Crowded Bench',
    subtitle: 'The rack gets busier; Reheat buys time, not points.',
    colors: ['amber', 'crimson', 'emerald', 'amethyst'],
    capacity: 3,
    reheats: 2,
    targetCullet: 1,
    targetTime: 110,
    sequence: ['amethyst', 'amber', 'crimson', 'emerald', 'amethyst', 'crimson', 'amber', 'emerald', 'crimson', 'amethyst', 'emerald', 'amber'],
    unlockAfter: 'apprentice-04',
  },
  {
    id: 'apprentice-06',
    studio: 'apprentice',
    title: 'Long Cooling Rack',
    subtitle: 'Four-globe kilns ask for steadier throughput.',
    colors: ['amber', 'cobalt', 'emerald'],
    capacity: 4,
    reheats: 2,
    targetCullet: 1,
    targetTime: 120,
    sequence: ['amber', 'cobalt', 'emerald', 'amber', 'emerald', 'cobalt', 'amber', 'cobalt', 'emerald', 'cobalt', 'amber', 'emerald'],
    unlockAfter: 'apprentice-05',
  },
  {
    id: 'apprentice-07',
    studio: 'apprentice',
    title: 'First Smoke',
    subtitle: 'Smoky glass has no kiln. Let it break or spend a Reheat if you need space.',
    colors: ['amber', 'crimson', 'cobalt'],
    capacity: 3,
    reheats: 2,
    targetCullet: 2,
    targetTime: 100,
    sequence: ['amber', 'smoky', 'crimson', 'cobalt', 'amber', 'crimson', 'smoky', 'cobalt', 'amber', 'crimson', 'cobalt'],
    unlockAfter: 'apprentice-06',
  },
  {
    id: 'apprentice-08',
    studio: 'apprentice',
    title: 'Maestro’s Pattern',
    subtitle: 'A balanced five-colour sequence. The forehearth is your plan.',
    colors: ['amber', 'crimson', 'cobalt', 'emerald', 'amethyst'],
    capacity: 3,
    reheats: 2,
    targetCullet: 2,
    targetTime: 145,
    sequence: ['amber', 'crimson', 'cobalt', 'emerald', 'amethyst', 'amber', 'cobalt', 'crimson', 'emerald', 'amethyst', 'cobalt', 'amber', 'amethyst', 'emerald', 'crimson'],
    unlockAfter: 'apprentice-07',
  },
  {
    id: 'apprentice-09',
    studio: 'apprentice',
    title: 'Bronze Doors',
    subtitle: 'Completed kilns seal and their colours leave the sequence.',
    colors: ['crimson', 'cobalt', 'emerald', 'amethyst'],
    capacity: 4,
    reheats: 1,
    targetCullet: 2,
    targetTime: 150,
    sequence: ['crimson', 'cobalt', 'emerald', 'amethyst', 'crimson', 'emerald', 'cobalt', 'amethyst', 'emerald', 'crimson', 'amethyst', 'cobalt', 'crimson', 'emerald', 'cobalt', 'amethyst'],
    unlockAfter: 'apprentice-08',
  },
  {
    id: 'apprentice-10',
    studio: 'apprentice',
    title: 'Apprentice Gallery',
    subtitle: 'Finish the first studio. Fast mode is optional; clean sorting is not.',
    colors: ['amber', 'crimson', 'cobalt', 'emerald', 'amethyst'],
    capacity: 4,
    reheats: 1,
    targetCullet: 2,
    targetTime: 170,
    sequence: ['amber', 'crimson', 'cobalt', 'emerald', 'amethyst', 'cobalt', 'amber', 'emerald', 'crimson', 'amethyst', 'emerald', 'cobalt', 'amber', 'crimson', 'amethyst', 'amber', 'emerald', 'cobalt', 'amethyst', 'crimson'],
    unlockAfter: 'apprentice-09',
  },
]

export function unlockedLevelIds(completed: Record<string, number>): Set<string> {
  const ids = new Set<string>()
  for (const level of LEVELS) {
    if (!level.unlockAfter || completed[level.unlockAfter]) ids.add(level.id)
  }
  return ids
}
