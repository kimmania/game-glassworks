export const COLORS = {
  amber: { name: 'Amber', hex: '#e6a817', emoji: '🟡' },
  crimson: { name: 'Crimson', hex: '#c04a3d', emoji: '🔴' },
  cobalt: { name: 'Cobalt', hex: '#2c5f8e', emoji: '🔵' },
  emerald: { name: 'Emerald', hex: '#3a7d5c', emoji: '🟢' },
  amethyst: { name: 'Amethyst', hex: '#8b5e9c', emoji: '🟣' },
} as const

export type GlassColor = keyof typeof COLORS
export type SpeedKey = 'relaxed' | 'normal' | 'fast'

export interface Level {
  id: string
  studio: 'apprentice'
  title: string
  subtitle: string
  capacity: number
  crates: GlassColor[][]
  targetMoves: number
  unlockAfter?: string
}

export const SPEEDS: Record<SpeedKey, { label: string; slots: number; description: string }> = {
  relaxed: { label: 'Open Bench', slots: 4, description: '4 bench slots — generous planning space.' },
  normal: { label: 'Working Bench', slots: 3, description: '3 bench slots — intended puzzle balance.' },
  fast: { label: 'Tight Bench', slots: 2, description: '2 bench slots — hard mode.' },
}

export const LEVELS: Level[] = [
  { id: 'apprentice-01', studio: 'apprentice', title: 'Two Crates, One Bench', subtitle: 'Sort mixed crates into uniform colour crates using the bench as temporary storage.', capacity: 3, targetMoves: 10, crates: [['amber', 'crimson', 'amber'], ['crimson', 'amber', 'crimson'], []] },
  { id: 'apprentice-02', studio: 'apprentice', title: 'Blue Under Gold', subtitle: 'The right destination is not obvious until you expose the lower layers.', capacity: 3, targetMoves: 14, crates: [['cobalt', 'amber', 'emerald'], ['emerald', 'cobalt', 'amber'], ['amber', 'emerald', 'cobalt'], []], unlockAfter: 'apprentice-01' },
  { id: 'apprentice-03', studio: 'apprentice', title: 'Three-Way Split', subtitle: 'Every crate starts mixed. Empty crates are precious staging space.', capacity: 3, targetMoves: 16, crates: [['crimson', 'cobalt', 'amethyst'], ['amethyst', 'crimson', 'cobalt'], ['cobalt', 'amethyst', 'crimson'], []], unlockAfter: 'apprentice-02' },
  { id: 'apprentice-04', studio: 'apprentice', title: 'Four Colours', subtitle: 'Four colours, one empty crate, and only three bench slots on Working Bench.', capacity: 3, targetMoves: 22, crates: [['amber', 'cobalt', 'crimson'], ['emerald', 'amber', 'cobalt'], ['crimson', 'emerald', 'amber'], ['cobalt', 'crimson', 'emerald'], []], unlockAfter: 'apprentice-03' },
  { id: 'apprentice-05', studio: 'apprentice', title: 'No Free Bottoms', subtitle: 'Every bottom layer is useful; careless staging buries the colours you need.', capacity: 3, targetMoves: 24, crates: [['amethyst', 'amber', 'crimson'], ['crimson', 'emerald', 'amethyst'], ['emerald', 'crimson', 'amber'], ['amber', 'amethyst', 'emerald'], []], unlockAfter: 'apprentice-04' },
  { id: 'apprentice-06', studio: 'apprentice', title: 'Deep Crates', subtitle: 'Capacity four makes each wrong transfer more expensive to undo.', capacity: 4, targetMoves: 30, crates: [['amber', 'cobalt', 'emerald', 'amber'], ['cobalt', 'emerald', 'amber', 'cobalt'], ['emerald', 'amber', 'cobalt', 'emerald'], []], unlockAfter: 'apprentice-05' },
  { id: 'apprentice-07', studio: 'apprentice', title: 'Two Empty Crates', subtitle: 'More crate space helps, but the bench still limits how much you can unbury at once.', capacity: 3, targetMoves: 24, crates: [['amber', 'crimson', 'cobalt'], ['cobalt', 'amber', 'crimson'], ['crimson', 'cobalt', 'amber'], [], []], unlockAfter: 'apprentice-06' },
  { id: 'apprentice-08', studio: 'apprentice', title: 'Five-Colour Bench', subtitle: 'Five colours create more destination pressure than the bench can hold at once.', capacity: 3, targetMoves: 34, crates: [['amber', 'crimson', 'cobalt'], ['emerald', 'amethyst', 'amber'], ['cobalt', 'emerald', 'crimson'], ['amethyst', 'cobalt', 'emerald'], ['crimson', 'amber', 'amethyst'], []], unlockAfter: 'apprentice-07' },
  { id: 'apprentice-09', studio: 'apprentice', title: 'Almost Sorted', subtitle: 'Looks close, but the top layers block the finishing transfers.', capacity: 4, targetMoves: 32, crates: [['crimson', 'crimson', 'cobalt', 'crimson'], ['cobalt', 'cobalt', 'emerald', 'cobalt'], ['emerald', 'emerald', 'amethyst', 'emerald'], ['amethyst', 'amethyst', 'crimson', 'amethyst'], []], unlockAfter: 'apprentice-08' },
  { id: 'apprentice-10', studio: 'apprentice', title: 'Apprentice Gallery', subtitle: 'A full mixed shipment with two empty crates and little room for sloppy staging.', capacity: 4, targetMoves: 44, crates: [['amber', 'crimson', 'cobalt', 'emerald'], ['amethyst', 'amber', 'emerald', 'crimson'], ['cobalt', 'amethyst', 'amber', 'cobalt'], ['emerald', 'cobalt', 'crimson', 'amethyst'], ['crimson', 'emerald', 'amethyst', 'amber'], [], []], unlockAfter: 'apprentice-09' },
]

export function unlockedLevelIds(completed: Record<string, number>): Set<string> {
  const ids = new Set<string>()
  for (const level of LEVELS) {
    if (!level.unlockAfter || completed[level.unlockAfter]) ids.add(level.id)
  }
  return ids
}
