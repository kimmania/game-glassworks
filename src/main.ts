import './styles.css'
import { AudioManager } from './audio'
import { COLORS, LEVELS, SPEEDS, type GlassColor, type Level, type SpeedKey, unlockedLevelIds } from './levels'
import { loadSave, resetProgress, saveGame, type SaveData } from './storage'

type Screen = 'intro' | 'map' | 'game'
type Globe = { id: number; color: GlassColor; x: number; state: 'forehearth' | 'belt' | 'held' }
type Kiln = { color: Exclude<GlassColor, 'smoky'>; count: number; sealed: boolean }

const audio = new AudioManager()
let save: SaveData = loadSave()
let screen: Screen = save.settings.seenIntro ? 'map' : 'intro'
let selectedLevel: Level = LEVELS[0]
let selectedSpeed: SpeedKey = save.settings.defaultSpeed
let state: {
  level: Level
  speed: SpeedKey
  sequence: GlassColor[]
  queue: GlassColor[]
  globes: Globe[]
  kilns: Kiln[]
  held: Globe | null
  reheats: number
  cullet: GlassColor[]
  startedAt: number
  elapsed: number
  nextId: number
  lastFrame: number
  spawnCooldown: number
  running: boolean
  ended: false | 'won' | 'stopped'
} | null = null

const app = document.querySelector<HTMLDivElement>('#app')!

function h<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  if (className) el.className = className
  if (text) el.textContent = text
  return el
}

function announce(message: string): void {
  const live = document.querySelector('#live-region')
  if (live) live.textContent = message
}

function route(next: Screen): void {
  screen = next
  render()
}

function render(): void {
  document.body.classList.toggle('reduced-motion', save.settings.reducedMotion)
  document.body.classList.toggle('high-contrast', save.settings.highContrast)
  audio.setEnabled(save.settings.sound)
  if (screen === 'intro') renderIntro()
  if (screen === 'map') renderMap()
  if (screen === 'game') renderGameShell()
}

function renderIntro(): void {
  app.innerHTML = `<div id="live-region" class="sr-only" aria-live="polite"></div>`
  const wrap = h('main', 'screen intro-screen')
  wrap.innerHTML = `
    <section class="intro-card">
      <div class="furnace-mark">🔥</div>
      <h1>Glassworks</h1>
      <p class="subtitle">A Glass-Blower’s Sorting Puzzle</p>
      <p>On Murano, the furnace never rests. Molten glass globes roll from the forehearth toward your kilns, each one still soft enough to shape.</p>
      <p>Sort each globe into its matching kiln before it cools. Watch the forehearth. It always tells you what comes next.</p>
      <button class="primary" id="enter-studio">Enter the Studio</button>
    </section>`
  app.append(wrap)
  document.querySelector('#enter-studio')?.addEventListener('click', () => {
    save.settings.seenIntro = true
    saveGame(save)
    audio.play('tap')
    route('map')
  })
}

function renderMap(): void {
  state = null
  app.innerHTML = `<div id="live-region" class="sr-only" aria-live="polite"></div>`
  const unlocked = unlockedLevelIds(save.completed)
  const totalStars = Object.values(save.results).reduce((sum, result) => sum + result.stars, 0)
  const wrap = h('main', 'screen map-screen')
  wrap.innerHTML = `
    <header class="map-hero">
      <div>
        <p class="eyebrow">Murano Apprentice Studio</p>
        <h1>Glassworks</h1>
        <p>Seal kilns, build your gallery, and replay each pattern for three stars.</p>
      </div>
      <div class="hero-actions">
        <button class="ghost" id="settings-open">⚙ Settings</button>
        <button class="ghost" id="help-open">? Help</button>
      </div>
    </header>
    <section class="progress-panel">
      <span>${Object.keys(save.completed).length}/${LEVELS.length} levels sealed</span>
      <span>${totalStars}★ earned</span>
      <span>Default speed: ${SPEEDS[save.settings.defaultSpeed].label}</span>
    </section>
    <section class="level-grid" aria-label="Apprentice Studio levels"></section>`
  const grid = wrap.querySelector('.level-grid')!
  for (const level of LEVELS) {
    const isUnlocked = unlocked.has(level.id)
    const result = save.results[level.id]
    const button = h('button', `level-card ${isUnlocked ? '' : 'locked'}`)
    button.disabled = !isUnlocked
    button.setAttribute('aria-label', `${level.title} ${isUnlocked ? '' : 'locked'}`)
    button.innerHTML = `
      <span class="level-num">${level.id.split('-')[1]}</span>
      <strong>${level.title}</strong>
      <span>${level.subtitle}</span>
      <span class="stars">${result ? '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars) : '☆☆☆'}</span>`
    button.addEventListener('click', () => openSpeedModal(level))
    grid.append(button)
  }
  app.append(wrap)
  document.querySelector('#help-open')?.addEventListener('click', showHelp)
  document.querySelector('#settings-open')?.addEventListener('click', showSettings)
  if (!save.settings.seenHelp) showHelp()
}

function openSpeedModal(level: Level): void {
  selectedLevel = level
  selectedSpeed = save.settings.defaultSpeed
  showModal('Speed Setting', `
    <p class="modal-copy"><strong>${level.title}</strong> — ${level.subtitle}</p>
    <div class="speed-row">
      ${Object.entries(SPEEDS).map(([key, value]) => `<button class="speed-choice ${key === selectedSpeed ? 'selected' : ''}" data-speed="${key}">${value.label}<small>${value.lookAhead} visible ahead</small></button>`).join('')}
    </div>
    <button class="primary wide" id="begin-level">Begin ${level.title}</button>
  `)
  document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedSpeed = button.dataset.speed as SpeedKey
      document.querySelectorAll('.speed-choice').forEach((el) => el.classList.remove('selected'))
      button.classList.add('selected')
    })
  })
  document.querySelector('#begin-level')?.addEventListener('click', () => startLevel(selectedLevel, selectedSpeed))
}

function showHelp(): void {
  save.settings.seenHelp = true
  saveGame(save)
  showModal('How to Play', `
    <ol class="help-list">
      <li><strong>Watch the forehearth.</strong> The glowing queue at the top shows the next globes before they become grabbable.</li>
      <li><strong>Tap a moving globe.</strong> It moves to the Selected Globe tray and the matching kiln pulses.</li>
      <li><strong>Tap the matching kiln.</strong> The globe drops in. One globe is held at a time.</li>
      <li><strong>Wrong colour shatters.</strong> A mismatched kiln breaks the globe into the cullet bin.</li>
      <li><strong>Use Reheat or Clear.</strong> Reheat sends the selected globe back through the furnace; Clear returns it to the belt.</li>
      <li><strong>Relaxed loops.</strong> With the loop toggle on, cullet in Relaxed mode recycles until every kiln is sealed.</li>
    </ol>`)
}

function showSettings(): void {
  showModal('Settings', `
    <label class="setting-row">Default speed
      <select id="setting-speed">
        ${Object.entries(SPEEDS).map(([key, speed]) => `<option value="${key}" ${save.settings.defaultSpeed === key ? 'selected' : ''}>${speed.label}</option>`).join('')}
      </select>
    </label>
    <label class="setting-row"><input id="setting-sound" type="checkbox" ${save.settings.sound ? 'checked' : ''}> Sound effects</label>
    <label class="setting-row"><input id="setting-reduced" type="checkbox" ${save.settings.reducedMotion ? 'checked' : ''}> Reduced motion</label>
    <label class="setting-row"><input id="setting-contrast" type="checkbox" ${save.settings.highContrast ? 'checked' : ''}> High-contrast patterns</label>
    <label class="setting-row"><input id="setting-loop" type="checkbox" ${save.settings.loopRelaxed ? 'checked' : ''}> Relaxed mode loops cullet until done</label>
    <button class="danger wide" id="reset-progress">Reset all progress</button>`)
  const speed = document.querySelector<HTMLSelectElement>('#setting-speed')!
  const sound = document.querySelector<HTMLInputElement>('#setting-sound')!
  const reduced = document.querySelector<HTMLInputElement>('#setting-reduced')!
  const contrast = document.querySelector<HTMLInputElement>('#setting-contrast')!
  const loop = document.querySelector<HTMLInputElement>('#setting-loop')!
  const persist = () => {
    save.settings.defaultSpeed = speed.value as SpeedKey
    save.settings.sound = sound.checked
    save.settings.reducedMotion = reduced.checked
    save.settings.highContrast = contrast.checked
    save.settings.loopRelaxed = loop.checked
    saveGame(save)
    render()
    showSettings()
  }
  ;[speed, sound, reduced, contrast, loop].forEach((input) => input.addEventListener('change', persist))
  document.querySelector('#reset-progress')?.addEventListener('click', () => {
    save = resetProgress(save)
    saveGame(save)
    closeModal()
    route('map')
  })
}

function showModal(title: string, body: string): void {
  closeModal()
  const overlay = h('div', 'modal-backdrop')
  overlay.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-label="${title}"><button class="modal-close" aria-label="Close">×</button><h2>${title}</h2>${body}</section>`
  document.body.append(overlay)
  overlay.querySelector('.modal-close')?.addEventListener('click', closeModal)
}

function closeModal(): void {
  document.querySelector('.modal-backdrop')?.remove()
}

function startLevel(level: Level, speed: SpeedKey): void {
  closeModal()
  audio.play('tap')
  state = {
    level,
    speed,
    sequence: [...level.sequence],
    queue: [...level.sequence],
    globes: [],
    kilns: level.colors.map((color) => ({ color, count: 0, sealed: false })),
    held: null,
    reheats: level.reheats,
    cullet: [],
    startedAt: performance.now(),
    elapsed: 0,
    nextId: 1,
    lastFrame: performance.now(),
    spawnCooldown: 0,
    running: true,
    ended: false,
  }
  screen = 'game'
  render()
  requestAnimationFrame(tick)
}

function renderGameShell(): void {
  if (!state) return
  app.innerHTML = `<div id="live-region" class="sr-only" aria-live="polite"></div>`
  const level = state.level
  const wrap = h('main', 'screen game-screen')
  wrap.innerHTML = `
    <header class="game-topbar">
      <button class="ghost" id="back-map">← Map</button>
      <div><p class="eyebrow">${level.studio === 'apprentice' ? 'Apprentice Studio' : level.studio}</p><h1>${level.title}</h1></div>
      <div class="statline"><span id="timer">0:00</span><span id="star-meter">☆☆☆</span></div>
      <button class="ghost" id="game-settings">⚙</button>
      <button class="ghost" id="game-help">?</button>
    </header>
    <section class="game-board">
      <div class="forehearth-panel"><span>Forehearth</span><div id="forehearth"></div></div>
      <div class="action-banner" id="action-banner">Tap a moving globe on the rack, then tap its matching kiln.</div>
      <div class="rack-zone" id="rack-zone"><div class="furnace">🔥 Furnace</div><div class="rack-line"></div><div id="belt"></div><button class="cullet-bin" id="cullet-bin">Cullet<br><span id="cullet-count">0</span></button></div>
      <div class="selected-tray" id="selected-tray"><span class="tray-label">Selected Globe</span><span id="selected-globe-readout">None — tap a moving globe.</span></div>
      <div class="controls-row"><button class="primary" id="reheat-btn">🔥 Reheat <span id="reheat-count">${state.reheats}</span></button><button class="ghost" id="clear-selection-btn">Clear Selection</button><button class="ghost" id="pause-btn">Pause</button><button class="ghost" id="restart-btn">Restart</button></div>
      <div class="kiln-row" id="kilns"></div>
    </section>`
  app.append(wrap)
  document.querySelector('#back-map')?.addEventListener('click', () => route('map'))
  document.querySelector('#game-help')?.addEventListener('click', showHelp)
  document.querySelector('#game-settings')?.addEventListener('click', showSettings)
  document.querySelector('#pause-btn')?.addEventListener('click', togglePause)
  document.querySelector('#restart-btn')?.addEventListener('click', () => startLevel(state!.level, state!.speed))
  document.querySelector('#reheat-btn')?.addEventListener('click', useReheat)
  document.querySelector('#clear-selection-btn')?.addEventListener('click', clearSelection)
  renderGameState()
}

function tick(now: number): void {
  if (!state || screen !== 'game') return
  if (!state.running || state.ended) {
    requestAnimationFrame(tick)
    return
  }
  const dt = Math.min(0.05, (now - state.lastFrame) / 1000)
  state.lastFrame = now
  state.elapsed = (now - state.startedAt) / 1000
  state.spawnCooldown -= dt
  if (state.spawnCooldown <= 0 && state.queue.length > 0) spawnGlobe()
  const rack = document.querySelector<HTMLElement>('#rack-zone')
  const rackWidth = rack?.clientWidth ?? 700
  const endX = Math.max(260, rackWidth - 86)
  const speed = SPEEDS[state.speed].pxPerSecond
  for (const globe of [...state.globes]) {
    if (globe.state !== 'belt') continue
    globe.x += speed * dt
    if (globe.x >= endX) dropToCullet(globe)
  }
  updateFrameDom()
  checkWin()
  requestAnimationFrame(tick)
}

function spawnGlobe(): void {
  if (!state) return
  const color = state.queue.shift()
  if (!color) return
  if (color !== 'smoky' && state.kilns.find((kiln) => kiln.color === color)?.sealed) {
    state.spawnCooldown = 0.05
    return
  }
  state.globes.push({ id: state.nextId++, color, x: 36, state: 'belt' })
  state.spawnCooldown = 1.15
  renderGameState()
}

function updateFrameDom(): void {
  if (!state || screen !== 'game') return
  for (const globe of state.globes) {
    const el = document.querySelector<HTMLElement>(`[data-globe-id="${globe.id}"]`)
    if (el) el.style.left = `${globe.x}px`
  }
  const timer = document.querySelector('#timer')
  if (timer) timer.textContent = formatTime(state.elapsed)
}

function renderGameState(): void {
  if (!state || screen !== 'game') return
  const fore = document.querySelector('#forehearth')!
  fore.innerHTML = state.queue.slice(0, SPEEDS[state.speed].lookAhead).map((color) => globeMarkup(color, 'preview')).join('')
  const belt = document.querySelector('#belt')!
  belt.innerHTML = ''
  for (const globe of state.globes) {
    if (globe.state === 'held') continue
    const button = h('button', `globe on-belt color-${globe.color}`)
    button.style.left = `${globe.x}px`
    button.dataset.globeId = String(globe.id)
    button.setAttribute('aria-label', `${COLORS[globe.color].name} globe`)
    button.innerHTML = `<span>${COLORS[globe.color].emoji}</span>`
    button.addEventListener('pointerup', (event) => {
      event.preventDefault()
      holdGlobe(globe.id)
    })
    belt.append(button)
  }
  const selectedTray = document.querySelector('#selected-tray')
  const selectedReadout = document.querySelector('#selected-globe-readout')
  const banner = document.querySelector('#action-banner')
  if (state.held) {
    selectedTray?.classList.add('active', `color-${state.held.color}`)
    if (selectedReadout) selectedReadout.textContent = `${COLORS[state.held.color].emoji} ${COLORS[state.held.color].name} — tap the ${COLORS[state.held.color].name} kiln.`
    if (banner) banner.textContent = `Selected ${COLORS[state.held.color].name}. Tap the matching ${COLORS[state.held.color].name} kiln, Reheat, or Clear Selection.`
  } else {
    if (selectedTray) selectedTray.className = 'selected-tray'
    if (selectedReadout) selectedReadout.textContent = 'None — tap a moving globe.'
    if (banner) banner.textContent = 'Tap a moving globe on the rack, then tap its matching kiln.'
  }
  const kilnRow = document.querySelector('#kilns')!
  kilnRow.innerHTML = ''
  for (const kiln of state.kilns) {
    const button = h('button', `kiln color-${kiln.color} ${kiln.sealed ? 'sealed' : ''} ${state.held?.color === kiln.color ? 'match-target' : ''}`)
    button.disabled = kiln.sealed
    button.setAttribute('aria-label', `${COLORS[kiln.color].name} kiln ${kiln.count} of ${state.level.capacity}`)
    button.innerHTML = `<span class="kiln-banner">${COLORS[kiln.color].name}</span><span class="kiln-mouth">${kiln.sealed ? '✓' : COLORS[kiln.color].emoji}</span><span class="pips">${Array.from({ length: state.level.capacity }, (_, i) => `<i class="${i < kiln.count ? 'filled' : ''}"></i>`).join('')}</span>`
    button.addEventListener('click', () => placeInKiln(kiln.color))
    kilnRow.append(button)
  }
  const timer = document.querySelector('#timer')
  if (timer) timer.textContent = formatTime(state.elapsed)
  const culletCount = document.querySelector('#cullet-count')
  if (culletCount) culletCount.textContent = `${state.cullet.length}${SPEEDS[state.speed].culletLimit === null ? '' : `/${SPEEDS[state.speed].culletLimit}`}`
  const reheatCount = document.querySelector('#reheat-count')
  if (reheatCount) reheatCount.textContent = `${state.reheats}`
  document.querySelector('#reheat-btn')?.toggleAttribute('disabled', !state.held || state.reheats <= 0)
  const stars = calculateStars(state)
  const starMeter = document.querySelector('#star-meter')
  if (starMeter) starMeter.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars)
}

function globeMarkup(color: GlassColor, cls: string): string {
  return `<span class="globe ${cls} color-${color}" title="${COLORS[color].name}">${COLORS[color].emoji}</span>`
}

function holdGlobe(id: number): void {
  if (!state || state.held) return
  const globe = state.globes.find((item) => item.id === id)
  if (!globe) return
  globe.state = 'held'
  state.held = globe
  audio.play('grab')
  announce(`${COLORS[globe.color].name} globe selected.`)
  renderGameState()
}

function placeInKiln(color: Exclude<GlassColor, 'smoky'>): void {
  if (!state?.held) return
  const globe = state.held
  const kiln = state.kilns.find((item) => item.color === color)
  if (!kiln || kiln.sealed) return
  state.globes = state.globes.filter((item) => item.id !== globe.id)
  state.held = null
  if (globe.color !== color) {
    shatter(globe.color)
    announce(`${COLORS[globe.color].name} shattered in the wrong kiln.`)
    renderGameState()
    return
  }
  kiln.count += 1
  audio.play('place')
  announce(`${COLORS[color].name} placed. ${kiln.count} of ${state.level.capacity}.`)
  if (kiln.count >= state.level.capacity) {
    kiln.sealed = true
    audio.play('seal')
    state.queue = state.queue.filter((next) => next !== color)
    state.globes = state.globes.filter((next) => next.color !== color)
    announce(`${COLORS[color].name} kiln sealed.`)
  }
  renderGameState()
}

function useReheat(): void {
  if (!state?.held || state.reheats <= 0) return
  const color = state.held.color
  state.globes = state.globes.filter((item) => item.id !== state!.held!.id)
  state.held = null
  state.queue.push(color)
  state.reheats -= 1
  audio.play('reheat')
  announce(`${COLORS[color].name} reheated and sent back to the forehearth.`)
  renderGameState()
}

function clearSelection(): void {
  if (!state?.held) return
  state.held.state = 'belt'
  state.held.x = Math.min(state.held.x + 12, 180)
  announce(`${COLORS[state.held.color].name} returned to the rack.`)
  state.held = null
  renderGameState()
}

function dropToCullet(globe: Globe): void {
  if (!state) return
  state.globes = state.globes.filter((item) => item.id !== globe.id)
  shatter(globe.color)
}

function shatter(color: GlassColor): void {
  if (!state) return
  state.cullet.push(color)
  audio.play('shatter')
  const speed = SPEEDS[state.speed]
  if (speed.recycle || (state.speed === 'relaxed' && save.settings.loopRelaxed)) {
    state.queue.push(color)
    return
  }
  if (speed.culletLimit !== null && state.cullet.length >= speed.culletLimit) endLevel('stopped')
}

function checkWin(): void {
  if (!state || state.ended) return
  if (state.kilns.every((kiln) => kiln.sealed)) endLevel('won')
}

function endLevel(kind: 'won' | 'stopped'): void {
  if (!state || state.ended) return
  state.running = false
  state.ended = kind
  const stars = kind === 'won' ? calculateStars(state) : 0
  if (kind === 'won') {
    const existing = save.results[state.level.id]
    save.completed[state.level.id] = Math.max(save.completed[state.level.id] ?? 0, stars)
    save.results[state.level.id] = {
      stars: Math.max(existing?.stars ?? 0, stars),
      bestTime: existing ? Math.min(existing.bestTime, state.elapsed) : state.elapsed,
      bestCullet: existing ? Math.min(existing.bestCullet, state.cullet.length) : state.cullet.length,
    }
    saveGame(save)
    audio.play('win')
  }
  showModal(kind === 'won' ? 'Kilns Sealed' : 'Bench Closed', `
    <p class="modal-copy">${kind === 'won' ? `You sealed every kiln in ${formatTime(state.elapsed)}.` : 'The cullet bin filled before the studio order was complete.'}</p>
    <div class="victory-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
    <p>Cullet: ${state.cullet.length} · Reheats left: ${state.reheats}</p>
    <button class="primary wide" id="next-action">${kind === 'won' ? 'Continue' : 'Back to Map'}</button>`)
  document.querySelector('#next-action')?.addEventListener('click', () => {
    closeModal()
    route('map')
  })
}

function calculateStars(game: NonNullable<typeof state>): number {
  if (game.kilns.some((kiln) => !kiln.sealed)) return 1
  let stars = 1
  if (game.cullet.length <= game.level.targetCullet) stars = 2
  if (game.cullet.length === 0 && game.reheats >= 1) stars = 3
  return stars
}

function togglePause(): void {
  if (!state) return
  state.running = !state.running
  if (state.running) state.lastFrame = performance.now()
  const pause = document.querySelector('#pause-btn')
  if (pause) pause.textContent = state.running ? 'Pause' : 'Resume'
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

window.addEventListener('pointerdown', () => void audio.unlock(), { once: true })
render()
