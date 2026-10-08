import './styles.css'
import { AudioManager } from './audio'
import { COLORS, LEVELS, ROUTE_LABELS, SPEEDS, type GlassColor, type Level, type RouteId, type SpeedKey, unlockedLevelIds } from './levels'
import { loadSave, resetProgress, saveGame, type SaveData } from './storage'

type Screen = 'intro' | 'map' | 'game'
type RunStep = { color: GlassColor; route: RouteId; expected: RouteId; ok: boolean }
type GameState = { level: Level; speed: SpeedKey; settings: Record<string, RouteId>; attempts: number; changes: number; running: boolean; run: RunStep[]; cursor: number; ended: false | 'won' }

const audio = new AudioManager()
let save: SaveData = loadSave()
let screen: Screen = save.settings.seenIntro ? 'map' : 'intro'
let selectedLevel: Level = LEVELS[0]
let selectedSpeed: SpeedKey = save.settings.defaultSpeed
let state: GameState | null = null
let runTimer = 0
const app = document.querySelector<HTMLDivElement>('#app')!

function h<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] { const el = document.createElement(tag); if (className) el.className = className; if (text) el.textContent = text; return el }
function route(next: Screen): void { screen = next; render() }
function render(): void { document.body.classList.toggle('reduced-motion', save.settings.reducedMotion); document.body.classList.toggle('high-contrast', save.settings.highContrast); audio.setEnabled(save.settings.sound); if (screen === 'intro') renderIntro(); if (screen === 'map') renderMap(); if (screen === 'game') renderGameShell() }

function renderIntro(): void {
  stopRun(); app.innerHTML = `<div id="live-region" class="sr-only" aria-live="polite"></div>`
  const wrap = h('main', 'screen intro-screen')
  wrap.innerHTML = `<section class="intro-card"><div class="furnace-mark">🔥</div><h1>Glassworks</h1><p class="subtitle">Switch Conveyor Prototype</p><p>Molten glass enters on a conveyor. You do not grab each globe — you program the gates.</p><p>Set each switch, press Run, and watch whether the sequence routes into the matching kilns.</p><button class="primary" id="enter-studio">Enter the Studio</button></section>`
  app.append(wrap)
  document.querySelector('#enter-studio')?.addEventListener('click', () => { save.settings.seenIntro = true; saveGame(save); audio.play('tap'); route('map') })
}

function renderMap(): void {
  stopRun(); state = null; app.innerHTML = `<div id="live-region" class="sr-only" aria-live="polite"></div>`
  const unlocked = unlockedLevelIds(save.completed)
  const totalStars = Object.values(save.results).reduce((sum, result) => sum + result.stars, 0)
  const wrap = h('main', 'screen map-screen')
  wrap.innerHTML = `<header class="map-hero"><div><p class="eyebrow">Murano Switchworks</p><h1>Glassworks</h1><p>Program conveyor gates, then run the glass to test your routing plan.</p></div><div class="hero-actions"><button class="ghost" id="settings-open">⚙ Settings</button><button class="ghost" id="help-open">? Help</button></div></header><section class="progress-panel"><span>${Object.keys(save.completed).length}/${LEVELS.length} switchboards solved</span><span>${totalStars}★ earned</span><span>Default run: ${SPEEDS[save.settings.defaultSpeed].label}</span></section><section class="level-grid" aria-label="Apprentice Studio levels"></section>`
  const grid = wrap.querySelector('.level-grid')!
  for (const level of LEVELS) {
    const isUnlocked = unlocked.has(level.id)
    const result = save.results[level.id]
    const button = h('button', `level-card ${isUnlocked ? '' : 'locked'}`)
    button.disabled = !isUnlocked
    button.setAttribute('aria-label', `${level.title} ${isUnlocked ? '' : 'locked'}`)
    button.innerHTML = `<span class="level-num">${level.id.split('-')[1]}</span><strong>${level.title}</strong><span>${level.subtitle}</span><span class="stars">${result ? '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars) : '☆☆☆'}</span>`
    button.addEventListener('click', () => openRunModal(level)); grid.append(button)
  }
  app.append(wrap); document.querySelector('#help-open')?.addEventListener('click', showHelp); document.querySelector('#settings-open')?.addEventListener('click', showSettings); if (!save.settings.seenHelp) showHelp()
}

function openRunModal(level: Level): void {
  selectedLevel = level; selectedSpeed = save.settings.defaultSpeed
  showModal('Run Speed', `<p class="modal-copy"><strong>${level.title}</strong> — ${level.subtitle}</p><div class="speed-row">${Object.entries(SPEEDS).map(([key, value]) => `<button class="speed-choice ${key === selectedSpeed ? 'selected' : ''}" data-speed="${key}">${value.label}<small>${value.description}</small></button>`).join('')}</div><button class="primary wide" id="begin-level">Open Switchboard</button>`)
  document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach((button) => button.addEventListener('click', () => { selectedSpeed = button.dataset.speed as SpeedKey; document.querySelectorAll('.speed-choice').forEach((el) => el.classList.remove('selected')); button.classList.add('selected') }))
  document.querySelector('#begin-level')?.addEventListener('click', () => startLevel(selectedLevel, selectedSpeed))
}

function showHelp(): void {
  save.settings.seenHelp = true; saveGame(save)
  showModal('How to Play', `<ol class="help-list"><li><strong>Study the sequence.</strong> The incoming globes are fixed for the level.</li><li><strong>Set the switches.</strong> Each gate routes one colour or the default stream to a kiln route.</li><li><strong>Press Run.</strong> Watch every globe travel to its routed kiln.</li><li><strong>Read the result.</strong> Green means the route matched; red means that gate needs adjustment.</li><li><strong>Win by routing the whole sequence correctly.</strong> Fewer switch changes earn more stars.</li></ol>`)
}

function showSettings(): void {
  showModal('Settings', `<label class="setting-row">Default run speed<select id="setting-speed">${Object.entries(SPEEDS).map(([key, speed]) => `<option value="${key}" ${save.settings.defaultSpeed === key ? 'selected' : ''}>${speed.label}</option>`).join('')}</select></label><label class="setting-row"><input id="setting-sound" type="checkbox" ${save.settings.sound ? 'checked' : ''}> Sound effects</label><label class="setting-row"><input id="setting-reduced" type="checkbox" ${save.settings.reducedMotion ? 'checked' : ''}> Reduced motion</label><label class="setting-row"><input id="setting-contrast" type="checkbox" ${save.settings.highContrast ? 'checked' : ''}> High-contrast patterns</label><button class="danger wide" id="reset-progress">Reset all progress</button>`)
  const speed = document.querySelector<HTMLSelectElement>('#setting-speed')!, sound = document.querySelector<HTMLInputElement>('#setting-sound')!, reduced = document.querySelector<HTMLInputElement>('#setting-reduced')!, contrast = document.querySelector<HTMLInputElement>('#setting-contrast')!
  const persist = () => { save.settings.defaultSpeed = speed.value as SpeedKey; save.settings.sound = sound.checked; save.settings.reducedMotion = reduced.checked; save.settings.highContrast = contrast.checked; saveGame(save); render(); showSettings() }
  ;[speed, sound, reduced, contrast].forEach((input) => input.addEventListener('change', persist))
  document.querySelector('#reset-progress')?.addEventListener('click', () => { save = resetProgress(save); saveGame(save); closeModal(); route('map') })
}

function showModal(title: string, body: string): void { closeModal(); const overlay = h('div', 'modal-backdrop'); overlay.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-label="${title}"><button class="modal-close" aria-label="Close">×</button><h2>${title}</h2>${body}</section>`; document.body.append(overlay); overlay.querySelector('.modal-close')?.addEventListener('click', closeModal) }
function closeModal(): void { document.querySelector('.modal-backdrop')?.remove() }

function startLevel(level: Level, speed: SpeedKey): void {
  closeModal(); stopRun(); audio.play('tap')
  state = { level, speed, settings: Object.fromEntries(level.gates.map((gate) => [gate.id, gate.initial])), attempts: 0, changes: 0, running: false, run: [], cursor: -1, ended: false }
  screen = 'game'; render()
}

function renderGameShell(): void {
  if (!state) return
  app.innerHTML = `<div id="live-region" class="sr-only" aria-live="polite"></div>`
  const level = state.level, speed = SPEEDS[state.speed], wrap = h('main', 'screen game-screen')
  wrap.innerHTML = `<header class="game-topbar"><button class="ghost" id="back-map">← Map</button><div><p class="eyebrow">${speed.label}</p><h1>${level.title}</h1></div><div class="statline"><span id="attempt-count">0 runs</span><span id="change-count">0 changes</span><span id="star-meter">☆☆☆</span></div><button class="ghost" id="game-settings">⚙</button><button class="ghost" id="game-help">?</button></header><section class="game-board switch-board"><div class="action-banner" id="action-banner">Set the gates, then press Run.</div><section class="sequence-panel"><div class="panel-title">Incoming Sequence <small>fixed order</small></div><div class="sequence-row" id="sequence-row"></div></section><section class="gate-panel"><div class="panel-title">Switchboard <small>tap routes to cycle</small></div><div id="gate-list"></div><button class="primary wide" id="run-btn">▶ Run Conveyor</button><button class="ghost wide" id="reset-switches">Reset Switches</button></section><section class="route-panel"><div class="panel-title">Kiln Routes <small>target map</small></div><div id="route-map"></div><div class="run-log" id="run-log"></div></section></section>`
  app.append(wrap); document.querySelector('#back-map')?.addEventListener('click', () => route('map')); document.querySelector('#game-help')?.addEventListener('click', showHelp); document.querySelector('#game-settings')?.addEventListener('click', showSettings); document.querySelector('#run-btn')?.addEventListener('click', runConveyor); document.querySelector('#reset-switches')?.addEventListener('click', resetSwitches); renderGameState()
}

function renderGameState(): void {
  if (!state || screen !== 'game') return
  const game = state
  document.querySelector('#sequence-row')!.innerHTML = game.level.sequence.map((color, index) => `<span class="seq-globe color-${color} ${index === game.cursor ? 'active' : ''} ${resultClass(index)}">${COLORS[color].emoji}<small>${COLORS[color].name}</small></span>`).join('')
  document.querySelector('#gate-list')!.innerHTML = game.level.gates.map((gate) => `<button class="gate-card" data-gate="${gate.id}" aria-label="${gate.label} set to ${ROUTE_LABELS[game.settings[gate.id]]}"><strong>${gate.label}</strong><span>${ROUTE_LABELS[game.settings[gate.id]]}</span></button>`).join('')
  document.querySelectorAll<HTMLButtonElement>('[data-gate]').forEach((button) => button.addEventListener('click', () => cycleGate(button.dataset.gate!)))
  const usedColors = Array.from(new Set(game.level.sequence))
  document.querySelector('#route-map')!.innerHTML = usedColors.map((color) => `<div class="route-row color-${color}"><span>${COLORS[color].emoji} ${COLORS[color].name}</span><strong>${ROUTE_LABELS[game.level.kilns[color]]}</strong></div>`).join('')
  document.querySelector('#attempt-count')!.textContent = `${game.attempts} runs`
  document.querySelector('#change-count')!.textContent = `${game.changes} changes`
  document.querySelector('#star-meter')!.textContent = '★'.repeat(calculateStars(game)) + '☆'.repeat(3 - calculateStars(game))
  document.querySelector('#run-btn')?.toggleAttribute('disabled', game.running)
  const banner = document.querySelector('#action-banner')
  if (banner) banner.textContent = game.running ? 'Conveyor running… watch the route lights.' : game.run.length ? runSummary() : 'Set the gates, then press Run.'
  const log = document.querySelector('#run-log')!
  log.innerHTML = game.run.length ? game.run.map((step, index) => `<div class="log-row ${step.ok ? 'ok' : 'bad'} ${index === game.cursor ? 'active' : ''}">${COLORS[step.color].emoji} ${COLORS[step.color].name}: ${ROUTE_LABELS[step.route]} ${step.ok ? '✓' : `✕ needs ${ROUTE_LABELS[step.expected]}`}</div>`).join('') : '<p>No run yet.</p>'
}

function resultClass(index: number): string { if (!state?.run[index]) return ''; return state.run[index].ok ? 'ok' : 'bad' }
function routeFor(color: GlassColor): RouteId { if (!state) return 'A'; return state.settings[color] ?? state.settings.default ?? 'A' }
function cycleGate(id: string): void { if (!state || state.running) return; const gate = state.level.gates.find((item) => item.id === id); if (!gate) return; const current = state.settings[id]; const next = gate.choices[(gate.choices.indexOf(current) + 1) % gate.choices.length]; state.settings[id] = next; state.changes += 1; state.run = []; state.cursor = -1; audio.play('tap'); renderGameState() }
function resetSwitches(): void { if (!state || state.running) return; state.settings = Object.fromEntries(state.level.gates.map((gate) => [gate.id, gate.initial])); state.changes = 0; state.run = []; state.cursor = -1; renderGameState() }

function runConveyor(): void {
  if (!state || state.running) return
  state.attempts += 1; state.running = true; state.cursor = -1
  state.run = state.level.sequence.map((color) => { const route = routeFor(color); const expected = state!.level.kilns[color]; return { color, route, expected, ok: route === expected } })
  audio.play('tap'); renderGameState()
  const step = () => {
    if (!state) return
    state.cursor += 1
    if (state.cursor >= state.run.length) { finishRun(); return }
    audio.play(state.run[state.cursor].ok ? 'place' : 'shatter')
    renderGameState()
    runTimer = window.setTimeout(step, SPEEDS[state.speed].speedMs)
  }
  runTimer = window.setTimeout(step, 250)
}

function finishRun(): void { if (!state) return; state.running = false; state.cursor = -1; renderGameState(); if (state.run.every((step) => step.ok)) endLevel() }
function runSummary(): string { if (!state) return ''; const bad = state.run.filter((step) => !step.ok).length; return bad === 0 ? 'Perfect route. Every globe reached the correct kiln.' : `${bad} globe${bad === 1 ? '' : 's'} routed wrong. Adjust gates and run again.` }
function stopRun(): void { if (runTimer) window.clearTimeout(runTimer); runTimer = 0 }
function endLevel(): void { if (!state || state.ended) return; state.ended = 'won'; const stars = calculateStars(state), existing = save.results[state.level.id]; save.completed[state.level.id] = Math.max(save.completed[state.level.id] ?? 0, stars); save.results[state.level.id] = { stars: Math.max(existing?.stars ?? 0, stars), bestTime: existing ? Math.min(existing.bestTime, state.attempts) : state.attempts, bestCullet: existing ? Math.min(existing.bestCullet, state.changes) : state.changes }; saveGame(save); audio.play('win'); showModal('Conveyor Solved', `<p class="modal-copy">Every globe reached the correct kiln.</p><div class="victory-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div><p>Runs: ${state.attempts} · Switch changes: ${state.changes}</p><button class="primary wide" id="next-action">Continue</button>`); document.querySelector('#next-action')?.addEventListener('click', () => { closeModal(); route('map') }) }
function calculateStars(game: GameState): number { if (!game.run.length || !game.run.every((step) => step.ok)) return 1; if (game.changes <= game.level.par && game.attempts === 1) return 3; if (game.changes <= game.level.par + 2) return 2; return 1 }

window.addEventListener('pointerdown', () => void audio.unlock(), { once: true })
render()
