export const COLORS = {
  amber: { name: 'Amber', hex: '#e6a817', emoji: '🟡' },
  crimson: { name: 'Crimson', hex: '#c04a3d', emoji: '🔴' },
  cobalt: { name: 'Cobalt', hex: '#2c5f8e', emoji: '🔵' },
  emerald: { name: 'Emerald', hex: '#3a7d5c', emoji: '🟢' },
  amethyst: { name: 'Amethyst', hex: '#8b5e9c', emoji: '🟣' },
} as const
export type GlassColor = keyof typeof COLORS
export type Direction = 'N' | 'E' | 'S' | 'W'
export type PieceType = 'straight' | 'corner' | 'gate'
export type ToolId = PieceType | 'remove'
export type SpeedKey = 'relaxed' | 'normal' | 'fast'
export interface SourceSpec { x: number; y: number; dir: Direction }
export interface KilnSpec { x: number; y: number; color: GlassColor }
export interface Inventory { straight: number; corner: number; gate: number }
export interface FixedPiece { x: number; y: number; type: PieceType; rot: number; color?: GlassColor }
export interface Level { id: string; studio: 'apprentice'; title: string; subtitle: string; width: number; height: number; source: SourceSpec; kilns: KilnSpec[]; sequence: GlassColor[]; inventory: Inventory; fixed?: FixedPiece[]; targetPieces: number; unlockAfter?: string }
export const SPEEDS: Record<SpeedKey, { label: string; speedMs: number; description: string }> = {
  relaxed: { label: 'Study Run', speedMs: 650, description: 'Slow animation for learning routes.' },
  normal: { label: 'Workshop Run', speedMs: 430, description: 'Standard animation pace.' },
  fast: { label: 'Maestro Run', speedMs: 260, description: 'Fast playback after you know the plan.' },
}
export const LEVELS: Level[] = [
  { id: 'apprentice-01', studio: 'apprentice', title: 'Build the Line', subtitle: 'Place belts from the furnace to the Amber kiln, then press Run.', width: 5, height: 4, source: { x: 0, y: 1, dir: 'E' }, kilns: [{ x: 4, y: 1, color: 'amber' }], sequence: ['amber', 'amber'], inventory: { straight: 3, corner: 0, gate: 0 }, targetPieces: 3 },
  { id: 'apprentice-02', studio: 'apprentice', title: 'First Turn', subtitle: 'Corners let you bend the cooling track around the bench.', width: 5, height: 5, source: { x: 0, y: 1, dir: 'E' }, kilns: [{ x: 3, y: 4, color: 'amber' }], sequence: ['amber', 'amber', 'amber'], inventory: { straight: 4, corner: 2, gate: 0 }, targetPieces: 5, unlockAfter: 'apprentice-01' },
  { id: 'apprentice-03', studio: 'apprentice', title: 'Amber Gate', subtitle: 'A colour gate sends Amber down and lets everything else continue straight.', width: 6, height: 5, source: { x: 0, y: 2, dir: 'E' }, kilns: [{ x: 5, y: 2, color: 'cobalt' }, { x: 3, y: 4, color: 'amber' }], sequence: ['amber', 'cobalt', 'amber', 'cobalt'], inventory: { straight: 5, corner: 1, gate: 1 }, targetPieces: 5, unlockAfter: 'apprentice-02' },
  { id: 'apprentice-04', studio: 'apprentice', title: 'Shared Trunk', subtitle: 'Build one trunk line, then branch a colour off with the gate.', width: 7, height: 6, source: { x: 0, y: 2, dir: 'E' }, kilns: [{ x: 6, y: 2, color: 'crimson' }, { x: 4, y: 5, color: 'amber' }], sequence: ['crimson', 'amber', 'crimson', 'amber', 'crimson'], inventory: { straight: 6, corner: 2, gate: 1 }, targetPieces: 7, unlockAfter: 'apprentice-03' },
  { id: 'apprentice-05', studio: 'apprentice', title: 'Three Kilns', subtitle: 'A larger board for experimenting with shared paths and branches.', width: 7, height: 6, source: { x: 0, y: 3, dir: 'E' }, kilns: [{ x: 6, y: 3, color: 'cobalt' }, { x: 4, y: 5, color: 'amber' }, { x: 6, y: 1, color: 'crimson' }], sequence: ['amber', 'cobalt', 'crimson', 'amber', 'cobalt'], inventory: { straight: 7, corner: 4, gate: 1 }, targetPieces: 9, unlockAfter: 'apprentice-04' },
]
export function unlockedLevelIds(completed: Record<string, number>): Set<string> { const ids = new Set<string>(); for (const level of LEVELS) if (!level.unlockAfter || completed[level.unlockAfter]) ids.add(level.id); return ids }
