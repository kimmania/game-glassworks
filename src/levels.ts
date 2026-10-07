export const COLORS = {
  amber: { name: 'Amber', hex: '#e6a817', emoji: '🟡' },
  crimson: { name: 'Crimson', hex: '#c04a3d', emoji: '🔴' },
  cobalt: { name: 'Cobalt', hex: '#2c5f8e', emoji: '🔵' },
  emerald: { name: 'Emerald', hex: '#3a7d5c', emoji: '🟢' },
  amethyst: { name: 'Amethyst', hex: '#8b5e9c', emoji: '🟣' },
  smoky: { name: 'Smoky', hex: '#6b6b6b', emoji: '⚫' },
} as const

export type GlassColor = keyof typeof COLORS
export type SortColor = Exclude<GlassColor, 'smoky'>
export type SpeedKey = 'relaxed' | 'normal' | 'fast'

export interface Level {
  id: string
  studio: 'apprentice'
  title: string
  subtitle: string
  colors: SortColor[]
  capacity: number
  crate: GlassColor[][]
  targetMoves: number
  unlockAfter?: string
}

export const SPEEDS: Record<SpeedKey, { label: string; slots: number; description: string }> = {
  relaxed: { label: 'Open Bench', slots: 4, description: '4 cooling slots — generous planning space.' },
  normal: { label: 'Working Bench', slots: 3, description: '3 cooling slots — intended puzzle balance.' },
  fast: { label: 'Tight Bench', slots: 2, description: '2 cooling slots — hard mode.' },
}

export const LEVELS: Level[] = [
  {
    id: 'apprentice-01',
    studio: 'apprentice',
    title: 'First Crate',
    subtitle: 'Only the top globe of each stack can be pulled. Use the cooling slots to uncover matches.',
    colors: ['amber', 'crimson', 'cobalt'],
    capacity: 3,
    targetMoves: 18,
    crate: [
      ['amber', 'crimson', 'amber'],
      ['crimson', 'cobalt', 'crimson'],
      ['cobalt', 'amber', 'cobalt'],
    ],
  },
  {
    id: 'apprentice-02',
    studio: 'apprentice',
    title: 'Buried Blues',
    subtitle: 'Cobalt is trapped low in the crate. Make room before you expose it.',
    colors: ['amber', 'emerald', 'cobalt'],
    capacity: 3,
    targetMoves: 18,
    crate: [
      ['cobalt', 'amber', 'emerald'],
      ['amber', 'emerald', 'cobalt'],
      ['emerald', 'cobalt', 'amber'],
    ],
    unlockAfter: 'apprentice-01',
  },
  {
    id: 'apprentice-03',
    studio: 'apprentice',
    title: 'Two Slot Lesson',
    subtitle: 'A small buffer means the wrong first pull can clog the bench.',
    colors: ['crimson', 'cobalt', 'amethyst'],
    capacity: 3,
    targetMoves: 19,
    crate: [
      ['amethyst', 'crimson', 'cobalt'],
      ['cobalt', 'amethyst', 'crimson'],
      ['crimson', 'cobalt', 'amethyst'],
    ],
    unlockAfter: 'apprentice-02',
  },
  {
    id: 'apprentice-04',
    studio: 'apprentice',
    title: 'Four Kilns',
    subtitle: 'Four colours share three cooling slots. Preserve at least one escape space.',
    colors: ['amber', 'crimson', 'cobalt', 'emerald'],
    capacity: 3,
    targetMoves: 24,
    crate: [
      ['amber', 'cobalt', 'crimson'],
      ['emerald', 'amber', 'cobalt'],
      ['crimson', 'emerald', 'amber'],
      ['cobalt', 'crimson', 'emerald'],
    ],
    unlockAfter: 'apprentice-03',
  },
  {
    id: 'apprentice-05',
    studio: 'apprentice',
    title: 'Crowded Bench',
    subtitle: 'The crate exposes tempting colours in the wrong order.',
    colors: ['amber', 'crimson', 'emerald', 'amethyst'],
    capacity: 3,
    targetMoves: 25,
    crate: [
      ['amethyst', 'amber', 'crimson'],
      ['crimson', 'emerald', 'amethyst'],
      ['emerald', 'crimson', 'amber'],
      ['amber', 'amethyst', 'emerald'],
    ],
    unlockAfter: 'apprentice-04',
  },
  {
    id: 'apprentice-06',
    studio: 'apprentice',
    title: 'Deep Layers',
    subtitle: 'Four-globe kilns require longer plans and cleaner staging.',
    colors: ['amber', 'cobalt', 'emerald'],
    capacity: 4,
    targetMoves: 26,
    crate: [
      ['amber', 'cobalt', 'emerald', 'amber'],
      ['cobalt', 'emerald', 'amber', 'cobalt'],
      ['emerald', 'amber', 'cobalt', 'emerald'],
    ],
    unlockAfter: 'apprentice-05',
  },
  {
    id: 'apprentice-07',
    studio: 'apprentice',
    title: 'First Smoke',
    subtitle: 'Smoky glass has no kiln. It must go into the cullet bin, but it still consumes a slot first.',
    colors: ['amber', 'crimson', 'cobalt'],
    capacity: 3,
    targetMoves: 22,
    crate: [
      ['amber', 'smoky', 'crimson'],
      ['cobalt', 'amber', 'cobalt'],
      ['crimson', 'cobalt', 'amber'],
      ['smoky', 'crimson'],
    ],
    unlockAfter: 'apprentice-06',
  },
  {
    id: 'apprentice-08',
    studio: 'apprentice',
    title: 'Maestro’s Pattern',
    subtitle: 'Five colours, three slots. Decide what to finish before you pull deeper.',
    colors: ['amber', 'crimson', 'cobalt', 'emerald', 'amethyst'],
    capacity: 3,
    targetMoves: 32,
    crate: [
      ['amber', 'crimson', 'cobalt'],
      ['emerald', 'amethyst', 'amber'],
      ['cobalt', 'emerald', 'crimson'],
      ['amethyst', 'cobalt', 'emerald'],
      ['crimson', 'amber', 'amethyst'],
    ],
    unlockAfter: 'apprentice-07',
  },
  {
    id: 'apprentice-09',
    studio: 'apprentice',
    title: 'Bronze Doors',
    subtitle: 'Once a kiln seals, its colour is safe. Work toward completed sets.',
    colors: ['crimson', 'cobalt', 'emerald', 'amethyst'],
    capacity: 4,
    targetMoves: 36,
    crate: [
      ['crimson', 'cobalt', 'emerald', 'amethyst'],
      ['cobalt', 'amethyst', 'crimson', 'emerald'],
      ['emerald', 'crimson', 'amethyst', 'cobalt'],
      ['amethyst', 'emerald', 'cobalt', 'crimson'],
    ],
    unlockAfter: 'apprentice-08',
  },
  {
    id: 'apprentice-10',
    studio: 'apprentice',
    title: 'Apprentice Gallery',
    subtitle: 'A full five-colour crate with little room for mistakes.',
    colors: ['amber', 'crimson', 'cobalt', 'emerald', 'amethyst'],
    capacity: 4,
    targetMoves: 44,
    crate: [
      ['amber', 'crimson', 'cobalt', 'emerald'],
      ['amethyst', 'amber', 'emerald', 'crimson'],
      ['cobalt', 'amethyst', 'amber', 'cobalt'],
      ['emerald', 'cobalt', 'crimson', 'amethyst'],
      ['crimson', 'emerald', 'amethyst', 'amber'],
    ],
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
