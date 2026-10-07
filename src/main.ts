import './styles.css'
import { AudioManager } from './audio'
import { COLORS, LEVELS, SPEEDS, type GlassColor, type Level, type SpeedKey, unlockedLevelIds } from './levels'
import { loadSave, resetProgress, saveGame, type SaveData } from './storage'

type Screen = 'intro' | 'map' | 'game'
type Held = { source: 'crate' | 'slot'; color: GlassColor; crate?: number; slot?: number }
type GameState = { level: Level; speed: SpeedKey; crates: GlassColor[][]; slots: (GlassColor | null)[]; held: Held | null; moves: number; startedAt: number; elapsed: number; ended: false | 'won' }

const audio = new AudioManager()
let save: SaveData = loadSave()
let screen: Screen = save.settings.seenIntro ? 'map' : 'intro'
let selectedLevel: Level = LEVELS[0]
let selectedSpeed: SpeedKey = save.settings.defaultSpeed
let state: GameState | null = null
let timerHandle = 0
const app = document.querySelector<HTMLDivElement>('#app')!

function h<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] { const el = document.createElement(tag); if (className) el.className = className; if (text) el.textContent = text; return el }
function announce(message: string): void { const live = document.querySelector('#live-region'); if (live) live.textContent = message }
function route(next: Screen): void { screen = next; render() }
function render(): void { document.body.classList.toggle('reduced-motion', save.settings.reducedMotion); document.body.classList.toggle('high-contrast', save.settings.highContrast); audio.setEnabled(save.settings.sound); if (screen === 'intro') renderIntro(); if (screen === 'map') renderMap(); if (screen === 'game') renderGameShell() }

function renderIntro(): void {
  stopTimer(); app.innerHTML = `<div id="live-region" class="sr-only" aria-live="polite"></div>`
  const wrap = h('main', 'screen intro-screen')
  wrap.innerHTML = `<section class="intro-card"><div class="furnace-mark">🔥</div><h1>Glassworks</h1><p class="subtitle">A Glass-Blower’s Sorting Puzzle</p><p>Mixed crates of molten glass arrive at your Murano bench. Only the top globe of each crate can move.</p><p>Use the bench as temporary storage while you reorganize every crate into a single colour.</p><button class="primary" id="enter-studio">Enter the Studio</button></section>`
  app.append(wrap)
  document.querySelector('#enter-studio')?.addEventListener('click', () => { save.settings.seenIntro = true; saveGame(save); audio.play('tap'); route('map') })
}

function renderMap(): void {
  stopTimer(); state = null; app.innerHTML = `<div id="live-region" class="sr-only" aria-live="polite"></div>`
  const unlocked = unlockedLevelIds(save.completed)
  const totalStars = Object.values(save.results).reduce((sum, result) => sum + result.stars, 0)
  const wrap = h('main', 'screen map-screen')
  wrap.innerHTML = `<header class="map-hero"><div><p class="eyebrow">Murano Apprentice Studio</p><h1>Glassworks</h1><p>Sort mixed shipments into uniform colour crates with limited bench space.</p></div><div class="hero-actions"><button class="ghost" id="settings-open">⚙ Settings</button><button class="ghost" id="help-open">? Help</button></div></header><section class="progress-panel"><span>${Object.keys(save.completed).length}/${LEVELS.length} shipments sorted</span><span>${totalStars}★ earned</span><span>Default bench: ${SPEEDS[save.settings.defaultSpeed].label}</span></section><section class="level-grid" aria-label="Apprentice Studio levels"></section>`
  const grid = wrap.querySelector('.level-grid')!
  for (const level of LEVELS) {
    const isUnlocked = unlocked.has(level.id)
    const result = save.results[level.id]
    const button = h('button', `level-card ${isUnlocked ? '' : 'locked'}`)
    button.disabled = !isUnlocked
    button.setAttribute('aria-label', `${level.title} ${isUnlocked ? '' : 'locked'}`)
    button.innerHTML = `<span class="level-num">${level.id.split('-')[1]}</span><strong>${level.title}</strong><span>${level.subtitle}</span><span class="stars">${result ? '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars) : '☆☆☆'}</span>`
    button.addEventListener('click', () => openBenchModal(level)); grid.append(button)
  }
  app.append(wrap); document.querySelector('#help-open')?.addEventListener('click', showHelp); document.querySelector('#settings-open')?.addEventListener('click', showSettings); if (!save.settings.seenHelp) showHelp()
}

function openBenchModal(level: Level): void {
  selectedLevel = level; selectedSpeed = save.settings.defaultSpeed
  showModal('Bench Setup', `<p class="modal-copy"><strong>${level.title}</strong> — ${level.subtitle}</p><div class="speed-row">${Object.entries(SPEEDS).map(([key, value]) => `<button class="speed-choice ${key === selectedSpeed ? 'selected' : ''}" data-speed="${key}">${value.label}<small>${value.description}</small></button>`).join('')}</div><button class="primary wide" id="begin-level">Begin ${level.title}</button>`)
  document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach((button) => button.addEventListener('click', () => { selectedSpeed = button.dataset.speed as SpeedKey; document.querySelectorAll('.speed-choice').forEach((el) => el.classList.remove('selected')); button.classList.add('selected') }))
  document.querySelector('#begin-level')?.addEventListener('click', () => startLevel(selectedLevel, selectedSpeed))
}

function showHelp(): void {
  save.settings.seenHelp = true; saveGame(save)
  showModal('How to Play', `<ol class="help-list"><li><strong>Sort the crates.</strong> Win when every non-empty crate contains only one colour.</li><li><strong>Only tops move.</strong> You can pull only the top globe from any crate.</li><li><strong>Use the bench.</strong> Pulled globes first go into limited bench slots.</li><li><strong>Bench to crate.</strong> Select a bench globe, then place it onto any crate with space.</li><li><strong>Think ahead.</strong> The bench can clog if you expose colours in the wrong order.</li><li><strong>Bench setup.</strong> Open Bench has 4 slots, Working Bench has 3, Tight Bench has 2.</li></ol>`)
}

function showSettings(): void {
  showModal('Settings', `<label class="setting-row">Default bench<select id="setting-speed">${Object.entries(SPEEDS).map(([key, speed]) => `<option value="${key}" ${save.settings.defaultSpeed === key ? 'selected' : ''}>${speed.label}</option>`).join('')}</select></label><label class="setting-row"><input id="setting-sound" type="checkbox" ${save.settings.sound ? 'checked' : ''}> Sound effects</label><label class="setting-row"><input id="setting-reduced" type="checkbox" ${save.settings.reducedMotion ? 'checked' : ''}> Reduced motion</label><label class="setting-row"><input id="setting-contrast" type="checkbox" ${save.settings.highContrast ? 'checked' : ''}> High-contrast patterns</label><button class="danger wide" id="reset-progress">Reset all progress</button>`)
  const speed = document.querySelector<HTMLSelectElement>('#setting-speed')!, sound = document.querySelector<HTMLInputElement>('#setting-sound')!, reduced = document.querySelector<HTMLInputElement>('#setting-reduced')!, contrast = document.querySelector<HTMLInputElement>('#setting-contrast')!
  const persist = () => { save.settings.defaultSpeed = speed.value as SpeedKey; save.settings.sound = sound.checked; save.settings.reducedMotion = reduced.checked; save.settings.highContrast = contrast.checked; saveGame(save); render(); showSettings() }
  ;[speed, sound, reduced, contrast].forEach((input) => input.addEventListener('change', persist))
  document.querySelector('#reset-progress')?.addEventListener('click', () => { save = resetProgress(save); saveGame(save); closeModal(); route('map') })
}

function showModal(title: string, body: string): void { closeModal(); const overlay = h('div', 'modal-backdrop'); overlay.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-label="${title}"><button class="modal-close" aria-label="Close">×</button><h2>${title}</h2>${body}</section>`; document.body.append(overlay); overlay.querySelector('.modal-close')?.addEventListener('click', closeModal) }
function closeModal(): void { document.querySelector('.modal-backdrop')?.remove() }

function startLevel(level: Level, speed: SpeedKey): void {
  closeModal(); audio.play('tap')
  state = { level, speed, crates: level.crates.map((crate) => [...crate]), slots: Array.from({ length: SPEEDS[speed].slots }, () => null), held: null, moves: 0, startedAt: performance.now(), elapsed: 0, ended: false }
  screen = 'game'; render(); startTimer()
}

function renderGameShell(): void {
  if (!state) return
  app.innerHTML = `<div id="live-region" class="sr-only" aria-live="polite"></div>`
  const level = state.level, bench = SPEEDS[state.speed], wrap = h('main', 'screen game-screen')
  wrap.innerHTML = `<header class="game-topbar"><button class="ghost" id="back-map">← Map</button><div><p class="eyebrow">${bench.label} · ${bench.slots} bench slots</p><h1>${level.title}</h1></div><div class="statline"><span id="timer">0:00</span><span id="move-count">0 moves</span><span id="star-meter">☆☆☆</span></div><button class="ghost" id="game-settings">⚙</button><button class="ghost" id="game-help">?</button></header><section class="game-board logic-board"><div class="action-banner" id="action-banner">Pull top globes into the bench, then rebuild crates as uniform colours.</div><section class="crate-panel"><div class="panel-title">Mixed Crates <small>top globe only</small></div><div class="crate-grid" id="crate-grid"></div></section><section class="bench-panel"><div class="panel-title">Bench Slots <small>temporary storage</small></div><div class="slot-row" id="slot-row"></div><div class="controls-row"><button class="ghost" id="clear-selection-btn">Clear Selection</button><button class="ghost" id="undo-btn">Undo Pull</button><button class="ghost" id="restart-btn">Restart</button></div></section></section>`
  app.append(wrap); document.querySelector('#back-map')?.addEventListener('click', () => route('map')); document.querySelector('#game-help')?.addEventListener('click', showHelp); document.querySelector('#game-settings')?.addEventListener('click', showSettings); document.querySelector('#clear-selection-btn')?.addEventListener('click', clearSelection); document.querySelector('#undo-btn')?.addEventListener('click', undoPull); document.querySelector('#restart-btn')?.addEventListener('click', () => startLevel(state!.level, state!.speed)); renderGameState()
}

function renderGameState(): void {
  if (!state || screen !== 'game') return
  const game = state, crateGrid = document.querySelector('#crate-grid')!
  crateGrid.innerHTML = ''
  const maxHeight = Math.max(game.level.capacity, ...game.crates.map((crate) => crate.length))
  for (let row = maxHeight - 1; row >= 0; row -= 1) for (let col = 0; col < game.crates.length; col += 1) {
    const color = game.crates[col][row], topIndex = game.crates[col].length - 1
    const canPull = Boolean(color) && row === topIndex && !game.held
    const canReceive = !color && row === game.crates[col].length && game.held?.source === 'slot' && game.crates[col].length < game.level.capacity
    const cell = h('button', `crate-cell ${color ? `color-${color}` : 'empty'} ${canPull ? 'exposed' : ''} ${canReceive ? 'receive-target' : ''}`)
    cell.disabled = !(canPull || canReceive); cell.setAttribute('aria-label', color ? `${COLORS[color].name} crate ${col + 1}` : `crate ${col + 1} empty space`); cell.innerHTML = color ? `<span>${COLORS[color].emoji}</span>` : canReceive ? '<span>↓</span>' : ''
    if (canPull) cell.addEventListener('click', () => selectCrate(col)); if (canReceive) cell.addEventListener('click', () => placeHeldInCrate(col)); crateGrid.append(cell)
  }
  ;(crateGrid as HTMLElement).style.gridTemplateColumns = `repeat(${game.crates.length}, minmax(54px, 1fr))`
  const slotRow = document.querySelector('#slot-row')!; slotRow.innerHTML = ''
  game.slots.forEach((color, index) => { const slot = h('button', `cooling-slot ${color ? `color-${color} filled` : 'empty'} ${game.held?.source === 'slot' && game.held.slot === index ? 'selected' : ''}`); slot.setAttribute('aria-label', color ? `${COLORS[color].name} bench slot ${index + 1}` : `empty bench slot ${index + 1}`); slot.innerHTML = color ? `<span>${COLORS[color].emoji}</span><small>${COLORS[color].name}</small>` : '<span>＋</span><small>Empty</small>'; slot.disabled = Boolean(game.held && !(game.held.source === 'crate' && !color)); slot.addEventListener('click', () => clickSlot(index)); slotRow.append(slot) })
  const banner = document.querySelector('#action-banner'); if (banner) banner.textContent = bannerText()
  document.querySelector('#move-count')!.textContent = `${game.moves} moves`; document.querySelector('#timer')!.textContent = formatTime(game.elapsed)
  const stars = calculateStars(game); document.querySelector('#star-meter')!.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars)
  document.querySelector('#undo-btn')?.toggleAttribute('disabled', game.held?.source !== 'crate'); document.querySelector('#clear-selection-btn')?.toggleAttribute('disabled', !game.held); checkWin()
}

function bannerText(): string { if (!state) return ''; if (state.held?.source === 'crate') return `Selected ${COLORS[state.held.color].name} from crate ${(state.held.crate ?? 0) + 1}. Tap an empty bench slot.`; if (state.held?.source === 'slot') return `Selected ${COLORS[state.held.color].name}. Tap a crate with space to place it.`; if (state.slots.every(Boolean)) return 'Bench full. Move a bench globe into a crate before pulling more.'; return 'Pull an exposed top globe from any crate into an empty bench slot.' }
function selectCrate(crateIndex: number): void { if (!state || state.held) return; const color = state.crates[crateIndex].pop(); if (!color) return; state.held = { source: 'crate', color, crate: crateIndex }; state.moves += 1; audio.play('grab'); announce(`${COLORS[color].name} pulled from crate ${crateIndex + 1}.`); renderGameState() }
function clickSlot(index: number): void { if (!state) return; const color = state.slots[index]; if (state.held?.source === 'crate') { if (color) return; state.slots[index] = state.held.color; announce(`${COLORS[state.held.color].name} placed on bench slot ${index + 1}.`); state.held = null; audio.play('place'); renderGameState(); return } if (state.held || !color) return; state.held = { source: 'slot', color, slot: index }; announce(`${COLORS[color].name} selected from bench slot ${index + 1}.`); audio.play('grab'); renderGameState() }
function placeHeldInCrate(crateIndex: number): void { if (!state?.held || state.held.source !== 'slot' || state.held.slot === undefined) return; if (state.crates[crateIndex].length >= state.level.capacity) return; const color = state.held.color; state.crates[crateIndex].push(color); state.slots[state.held.slot] = null; state.held = null; state.moves += 1; audio.play('place'); announce(`${COLORS[color].name} placed into crate ${crateIndex + 1}.`); renderGameState() }
function clearSelection(): void { if (!state?.held) return; if (state.held.source === 'crate' && state.held.crate !== undefined) { state.crates[state.held.crate].push(state.held.color); state.moves = Math.max(0, state.moves - 1) } state.held = null; renderGameState() }
function undoPull(): void { if (!state?.held || state.held.source !== 'crate' || state.held.crate === undefined) return; state.crates[state.held.crate].push(state.held.color); state.moves = Math.max(0, state.moves - 1); announce(`${COLORS[state.held.color].name} returned to crate ${state.held.crate + 1}.`); state.held = null; renderGameState() }
function isUniform(crate: GlassColor[]): boolean { return crate.length === 0 || crate.every((color) => color === crate[0]) }
function checkWin(): void { if (!state || state.ended) return; const nonEmpty = state.crates.filter((crate) => crate.length > 0); const allFullOrEmpty = state.crates.every((crate) => crate.length === 0 || crate.length === state!.level.capacity); if (state.slots.every((slot) => slot === null) && nonEmpty.every(isUniform) && allFullOrEmpty) endLevel('won') }
function endLevel(_kind: 'won'): void { if (!state || state.ended) return; state.ended = 'won'; stopTimer(); const stars = calculateStars(state), existing = save.results[state.level.id]; save.completed[state.level.id] = Math.max(save.completed[state.level.id] ?? 0, stars); save.results[state.level.id] = { stars: Math.max(existing?.stars ?? 0, stars), bestTime: existing ? Math.min(existing.bestTime, state.elapsed) : state.elapsed, bestCullet: 0 }; saveGame(save); audio.play('win'); showModal('Crates Sorted', `<p class="modal-copy">Every crate now holds a single colour. Solved in ${state.moves} moves.</p><div class="victory-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div><p>Target: ${state.level.targetMoves} moves · Your moves: ${state.moves}</p><button class="primary wide" id="next-action">Continue</button>`); document.querySelector('#next-action')?.addEventListener('click', () => { closeModal(); route('map') }) }
function calculateStars(game: GameState): number { if (!game.crates.every(isUniform) || !game.slots.every((slot) => slot === null)) return 1; let stars = 1; if (game.moves <= game.level.targetMoves + 4) stars = 2; if (game.moves <= game.level.targetMoves) stars = 3; return stars }
function startTimer(): void { stopTimer(); timerHandle = window.setInterval(() => { if (!state || screen !== 'game') return; state.elapsed = (performance.now() - state.startedAt) / 1000; const timer = document.querySelector('#timer'); if (timer) timer.textContent = formatTime(state.elapsed) }, 250) }
function stopTimer(): void { if (timerHandle) window.clearInterval(timerHandle); timerHandle = 0 }
function formatTime(seconds: number): string { const mins = Math.floor(seconds / 60), secs = Math.floor(seconds % 60); return `${mins}:${secs.toString().padStart(2, '0')}` }
window.addEventListener('pointerdown', () => void audio.unlock(), { once: true })
render()
