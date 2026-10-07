import type { SpeedKey } from './levels'

export const SAVE_VERSION = 1
const KEY = 'glassworks-save-v1'

export interface Settings {
  defaultSpeed: SpeedKey
  sound: boolean
  reducedMotion: boolean
  highContrast: boolean
  loopRelaxed: boolean
  seenIntro: boolean
  seenHelp: boolean
}

export interface LevelResult {
  stars: number
  bestTime: number
  bestCullet: number
}

export interface SaveData {
  version: number
  settings: Settings
  completed: Record<string, number>
  results: Record<string, LevelResult>
}

const defaultSave: SaveData = {
  version: SAVE_VERSION,
  settings: {
    defaultSpeed: 'relaxed',
    sound: true,
    reducedMotion: false,
    highContrast: false,
    loopRelaxed: true,
    seenIntro: false,
    seenHelp: false,
  },
  completed: {},
  results: {},
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(defaultSave)
    const parsed = JSON.parse(raw) as Partial<SaveData>
    if (parsed.version !== SAVE_VERSION) {
      return { ...structuredClone(defaultSave), settings: { ...defaultSave.settings, ...parsed.settings } }
    }
    return {
      version: SAVE_VERSION,
      settings: { ...defaultSave.settings, ...parsed.settings },
      completed: parsed.completed ?? {},
      results: parsed.results ?? {},
    }
  } catch {
    return structuredClone(defaultSave)
  }
}

export function saveGame(data: SaveData): void {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function resetProgress(save: SaveData): SaveData {
  return { ...structuredClone(defaultSave), settings: { ...save.settings, seenIntro: true, seenHelp: false } }
}
