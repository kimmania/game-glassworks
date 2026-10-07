import './styles.css'
import { AudioManager } from './audio'
import { COLORS, LEVELS, SPEEDS, type GlassColor, type Level, type SortColor, type SpeedKey, unlockedLevelIds } from './levels'
import { loadSave, resetProgress, saveGame, type SaveData } from './storage'

type Screen = 'intro' | 'map' | 'game'
type Held = { source: 'crate' | 'slot'; color: GlassColor; column?: number; slot?: number }
type Kiln = { color: SortColor; count: number; sealed: boolean }

type GameState = {
  level: Level
  speed: SpeedKey
  crate: GlassColor[][]
  slots: (GlassColor | null)[]
  held: Held | null
  kilns: Kiln[]
  cullet: GlassColor[]
  moves: number
  startedAt: number
  elapsed: number
  ended: false | 'won' | 'stuck'
}

const audio = new AudioManager()
let save: SaveData = loadSave()
let screen: Screen = save.settings.seenIntro ? 'map' : 'intro'
let selectedLevel: Level = LEVELS[0]
let selectedSpeed: SpeedKey = save.settings.defaultSpeed
let state: GameState | null = null
let timerHandle = 0

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
  stopTimer()
  app.innerHTML = `<div id="live-region" class="sr-only" aria-live="polite"></div>`
  const wrap = h('main', 'screen intro-screen')
  wrap.innerHTML = `
    <section class="intro-card">
      <div class="furnace-mark">🔥</div>
      <h1>Glassworks</h1>
      <p class="subtitle">A Glass-Blower’s Sorting Puzzle</p>
      <p>A packed crate of hot glass arrives at your Murano bench. Only the top globe of each stack is reachable.</p>
      <p>Pull globes into a few cooling slots, then feed matching colours into their kilns. The puzzle is choosing which layer to uncover next before your bench fills.</p>
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
  stopTimer()
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
        <p>Unpack hot-glass crates with limited cooling slots. Replay each crate for cleaner solves.</p>
      </div>
      <div class="hero-actions">
        <button class="ghost" id="settings-open">⚙ Settings</button>
        <button class="ghost" id="help-open">? Help</button>
      </div>
    </header>
    <section class="progress-panel">
      <span>${Object.keys(save.completed).length}/${LEVELS.length} crates solved</span>
      <span>${totalStars}★ earned</span>
      <span>Default bench: ${SPEEDS[save.settings.defaultSpeed].label}</span>
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
    button.addEventListener('click', () => openBenchModal(level))
    grid.append(button)
  }
  app.append(wrap)
  document.querySelector('#help-open')?.addEventListener('click', showHelp)
  document.querySelector('#settings-open')?.addEventListener('click', showSettings)
  if (!save.settings.seenHelp) showHelp()
}

function openBenchModal(level: Level): void {
  selectedLevel = level
  selectedSpeed = save.settings.defaultSpeed
  showModal('Bench Setup', `
    <p class="modal-copy"><strong>${level.title}</strong> — ${level.subtitle}</p>
    <div class="speed-row">
      ${Object.entries(SPEEDS).map(([key, value]) => `<button class="speed-choice ${key === selectedSpeed ? 'selected' : ''}" data-speed="${key}">${value.label}<small>${value.description}</small></button>`).join('')}
    </div>
    <button class="primary wide" id="begin-level">Begin ${level.title}</button>`)
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
      <li><strong>Pull from the crate.</strong> Only the top globe in each vertical stack is reachable.</li>
      <li><strong>Use cooling slots.</strong> A pulled globe must go into an empty slot before it can be placed in a kiln.</li>
      <li><strong>Feed kilns by colour.</strong> Tap a slot, then tap the matching kiln. Kilns seal when full.</li>
      <li><strong>Plan the order.</strong> If every slot fills with colours you cannot use, the crate is stuck.</li>
      <li><strong>Smoky glass.</strong> Smoky has no kiln. Move it from a slot into the cullet bin to clear space.</li>
      <li><strong>Bench setup.</strong> Open Bench has 4 slots, Working Bench has 3, Tight Bench has 2.</li>
    </ol>`)
}

function showSettings(): void {
  showModal('Settings', `
    <label class="setting-row">Default bench
      <select id="setting-speed">
        ${Object.entries(SPEEDS).map(([key, speed]) => `<option value="${key}" ${save.settings.defaultSpeed === key ? 'selected' : ''}>${speed.label}</option>`).join('')}
      </select>
    </label>
    <label class="setting-row"><input id="setting-sound" type="checkbox" ${save.settings.sound ? 'checked' : ''}> Sound effects</label>
    <label class="setting-row"><input id="setting-reduced" type="checkbox" ${save.settings.reducedMotion ? 'checked' : ''}> Reduced motion</label>
    <label class="setting-row"><input id="setting-contrast" type="checkbox" ${save.settings.highContrast ? 'checked' : ''}> High-contrast patterns</label>
    <button class="danger wide" id="reset-progress">Reset all progress</button>`)
  const speed = document.querySelector<HTMLSelectElement>('#setting-speed')!
  const sound = document.querySelector<HTMLInputElement>('#setting-sound')!
  const reduced = document.querySelector<HTMLInputElement>('#setting-reduced')!
  const contrast = document.querySelector<HTMLInputElement>('#setting-contrast')!
  const persist = () => {
    save.settings.defaultSpeed = speed.value as SpeedKey
    save.settings.sound = sound.checked
    save.settings.reducedMotion = reduced.checked
    save.settings.highContrast = contrast.checked
    saveGame(save)
    render()
    showSettings()
  }
  ;[speed, sound, reduced, contrast].forEach((input) => input.addEventListener('change', persist))
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
    crate: level.crate.map((column) => [...column]),
    slots: Array.from({ length: SPEEDS[speed].slots }, () => null),
    held: null,
    kilns: level.colors.map((color) => ({ color, count: 0, sealed: false })),
    cullet: [],
    moves: 0,
    startedAt: performance.now(),
    elapsed: 0,
    ended: false,
  }
  screen = 'game'
  render()
  startTimer()
}

function renderGameShell(): void {
  if (!state) return
  app.innerHTML = `<div id="live-region" class="sr-only" aria-live="polite"></div>`
  const level = state.level
  const bench = SPEEDS[state.speed]
  const wrap = h('main', 'screen game-screen')
  wrap.innerHTML = `
    <header class="game-topbar">
      <button class="ghost" id="back-map">← Map</button>
      <div><p class="eyebrow">${bench.label} · ${bench.slots} cooling slots</p><h1>${level.title}</h1></div>
      <div class="statline"><span id="timer">0:00</span><span id="move-count">0 moves</span><span id="star-meter">☆☆☆</span></div>
      <button class="ghost" id="game-settings">⚙</button>
      <button class="ghost" id="game-help">?</button>
    </header>
    <section class="game-board logic-board">
      <div class="action-banner" id="action-banner">Choose a top globe from the crate, move it into an empty cooling slot, then feed matching kilns.</div>
      <section class="crate-panel">
        <div class="panel-title">Packed Crate <small>top row is reachable</small></div>
        <div class="crate-grid" id="crate-grid"></div>
      </section>
      <section class="bench-panel">
        <div class="panel-title">Cooling Slots <small>limited buffer space</small></div>
        <div class="slot-row" id="slot-row"></div>
        <div class="controls-row"><button class="ghost" id="clear-selection-btn">Clear Selection</button><button class="ghost" id="undo-btn">Undo Pull</button><button class="ghost" id="restart-btn">Restart</button></div>
      </section>
      <section class="kiln-panel">
        <div class="panel-title">Annealing Kilns <small>fill each colour</small></div>
        <div class="kiln-row" id="kilns"></div>
        <button class="cullet-wide" id="cullet-bin">Cullet Bin <span id="cullet-count">0</span></button>
      </section>
    </section>`
  app.append(wrap)
  document.querySelector('#back-map')?.addEventListener('click', () => route('map'))
  document.querySelector('#game-help')?.addEventListener('click', showHelp)
  document.querySelector('#game-settings')?.addEventListener('click', showSettings)
  document.querySelector('#clear-selection-btn')?.addEventListener('click', clearSelection)
  document.querySelector('#undo-btn')?.addEventListener('click', undoPull)
  document.querySelector('#restart-btn')?.addEventListener('click', () => startLevel(state!.level, state!.speed))
  document.querySelector('#cullet-bin')?.addEventListener('click', moveHeldToCullet)
  renderGameState()
}

function renderGameState(): void {
  if (!state || screen !== 'game') return
  const game = state
  const crate = document.querySelector('#crate-grid')!
  crate.innerHTML = ''
  const maxHeight = Math.max(...game.crate.map((column) => column.length), 0)
  for (let row = maxHeight - 1; row >= 0; row -= 1) {
    for (let col = 0; col < game.crate.length; col += 1) {
      const color = game.crate[col][row]
      const topIndex = game.crate[col].length - 1
      const cell = h('button', `crate-cell ${color ? `color-${color}` : 'empty'} ${row === topIndex ? 'exposed' : 'buried'}`)
      cell.disabled = !color || row !== topIndex || Boolean(state.held)
      cell.setAttribute('aria-label', color ? `${COLORS[color].name} crate globe column ${col + 1}` : `empty crate cell ${col + 1}`)
      cell.innerHTML = color ? `<span>${COLORS[color].emoji}</span>` : ''
      if (color && row === topIndex) cell.addEventListener('click', () => selectCrate(col))
      crate.append(cell)
    }
  }
  ;(crate as HTMLElement).style.gridTemplateColumns = `repeat(${game.crate.length}, minmax(54px, 1fr))`

  const slotRow = document.querySelector('#slot-row')!
  slotRow.innerHTML = ''
  game.slots.forEach((color, index) => {
    const slot = h('button', `cooling-slot ${color ? `color-${color} filled` : 'empty'} ${game.held?.source === 'slot' && game.held.slot === index ? 'selected' : ''}`)
    slot.setAttribute('aria-label', color ? `${COLORS[color].name} cooling slot ${index + 1}` : `empty cooling slot ${index + 1}`)
    slot.innerHTML = color ? `<span>${COLORS[color].emoji}</span><small>${COLORS[color].name}</small>` : '<span>＋</span><small>Empty</small>'
    slot.disabled = Boolean(game.held && !(game.held.source === 'crate' && !color))
    slot.addEventListener('click', () => clickSlot(index))
    slotRow.append(slot)
  })

  const kilnRow = document.querySelector('#kilns')!
  kilnRow.innerHTML = ''
  for (const kiln of state.kilns) {
    const match = state.held?.color === kiln.color || heldSlotColor() === kiln.color
    const button = h('button', `kiln color-${kiln.color} ${kiln.sealed ? 'sealed' : ''} ${match ? 'match-target' : ''}`)
    button.disabled = kiln.sealed || (!state.held && heldSlotColor() === null)
    button.setAttribute('aria-label', `${COLORS[kiln.color].name} kiln ${kiln.count} of ${state.level.capacity}`)
    button.innerHTML = `<span class="kiln-banner">${COLORS[kiln.color].name}</span><span class="kiln-mouth">${kiln.sealed ? '✓' : COLORS[kiln.color].emoji}</span><span class="pips">${Array.from({ length: state.level.capacity }, (_, i) => `<i class="${i < kiln.count ? 'filled' : ''}"></i>`).join('')}</span>`
    button.addEventListener('click', () => placeHeldInKiln(kiln.color))
    kilnRow.append(button)
  }

  const banner = document.querySelector('#action-banner')
  if (banner) banner.textContent = bannerText()
  const timer = document.querySelector('#timer')
  if (timer) timer.textContent = formatTime(state.elapsed)
  const moves = document.querySelector('#move-count')
  if (moves) moves.textContent = `${state.moves} moves`
  const cullet = document.querySelector('#cullet-count')
  if (cullet) cullet.textContent = `${state.cullet.length}`
  const starMeter = document.querySelector('#star-meter')
  if (starMeter) {
    const stars = calculateStars(state)
    starMeter.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars)
  }
  document.querySelector('#undo-btn')?.toggleAttribute('disabled', state.held?.source !== 'crate')
  document.querySelector('#clear-selection-btn')?.toggleAttribute('disabled', !state.held)
  checkWin()
}

function bannerText(): string {
  if (!state) return ''
  if (state.held?.source === 'crate') return `Selected ${COLORS[state.held.color].name} from column ${(state.held.column ?? 0) + 1}. Tap an empty cooling slot.`
  if (state.held?.source === 'slot') {
    if (state.held.color === 'smoky') return 'Selected Smoky glass. Move it to the Cullet Bin to free the slot.'
    return `Selected ${COLORS[state.held.color].name} from a cooling slot. Tap the matching kiln.`
  }
  if (state.slots.every(Boolean)) return 'All cooling slots are full. Place a slot into a kiln or cullet before pulling more.'
  return 'Pull an exposed top globe from the crate into an empty cooling slot.'
}

function selectCrate(column: number): void {
  if (!state || state.held) return
  const color = state.crate[column].pop()
  if (!color) return
  state.held = { source: 'crate', color, column }
  state.moves += 1
  audio.play('grab')
  announce(`${COLORS[color].name} pulled from crate column ${column + 1}.`)
  renderGameState()
}

function clickSlot(index: number): void {
  if (!state) return
  const color = state.slots[index]
  if (state.held?.source === 'crate') {
    if (color) return
    state.slots[index] = state.held.color
    announce(`${COLORS[state.held.color].name} placed into cooling slot ${index + 1}.`)
    state.held = null
    audio.play('place')
    renderGameState()
    return
  }
  if (state.held) return
  if (!color) return
  state.held = { source: 'slot', color, slot: index }
  announce(`${COLORS[color].name} selected from cooling slot ${index + 1}.`)
  audio.play('grab')
  renderGameState()
}

function heldSlotColor(): GlassColor | null {
  if (!state?.held || state.held.source !== 'slot') return null
  return state.held.color
}

function placeHeldInKiln(color: SortColor): void {
  if (!state?.held || state.held.source !== 'slot') return
  const held = state.held
  if (held.color !== color) {
    announce(`${COLORS[held.color].name} cannot go into the ${COLORS[color].name} kiln.`)
    audio.play('shatter')
    return
  }
  const kiln = state.kilns.find((item) => item.color === color)
  if (!kiln || kiln.sealed || held.slot === undefined) return
  state.slots[held.slot] = null
  state.held = null
  state.moves += 1
  kiln.count += 1
  audio.play('place')
  if (kiln.count >= state.level.capacity) {
    kiln.sealed = true
    audio.play('seal')
    announce(`${COLORS[color].name} kiln sealed.`)
  } else {
    announce(`${COLORS[color].name} placed. ${kiln.count} of ${state.level.capacity}.`)
  }
  renderGameState()
}

function moveHeldToCullet(): void {
  if (!state?.held || state.held.source !== 'slot' || state.held.slot === undefined) return
  if (state.held.color !== 'smoky') {
    announce('Only Smoky glass goes to cullet. Coloured globes need a matching kiln.')
    audio.play('shatter')
    return
  }
  state.cullet.push(state.held.color)
  state.slots[state.held.slot] = null
  state.held = null
  state.moves += 1
  audio.play('shatter')
  renderGameState()
}

function clearSelection(): void {
  if (!state?.held) return
  if (state.held.source === 'slot') {
    state.held = null
  } else if (state.held.column !== undefined) {
    state.crate[state.held.column].push(state.held.color)
    state.held = null
  }
  renderGameState()
}

function undoPull(): void {
  if (!state?.held || state.held.source !== 'crate' || state.held.column === undefined) return
  state.crate[state.held.column].push(state.held.color)
  state.moves = Math.max(0, state.moves - 1)
  announce(`${COLORS[state.held.color].name} returned to crate column ${state.held.column + 1}.`)
  state.held = null
  renderGameState()
}

function checkWin(): void {
  if (!state || state.ended) return
  if (state.kilns.every((kiln) => kiln.sealed)) endLevel('won')
}

function endLevel(kind: 'won' | 'stuck'): void {
  if (!state || state.ended) return
  state.ended = kind
  stopTimer()
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
  showModal(kind === 'won' ? 'Kilns Sealed' : 'Bench Stuck', `
    <p class="modal-copy">${kind === 'won' ? `You unpacked the crate in ${state.moves} moves.` : 'No legal staging move remains.'}</p>
    <div class="victory-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
    <p>Target: ${state.level.targetMoves} moves · Your moves: ${state.moves}</p>
    <button class="primary wide" id="next-action">Continue</button>`)
  document.querySelector('#next-action')?.addEventListener('click', () => {
    closeModal()
    route('map')
  })
}

function calculateStars(game: GameState): number {
  if (game.kilns.some((kiln) => !kiln.sealed)) return 1
  let stars = 1
  if (game.moves <= game.level.targetMoves + 4) stars = 2
  if (game.moves <= game.level.targetMoves) stars = 3
  return stars
}

function startTimer(): void {
  stopTimer()
  timerHandle = window.setInterval(() => {
    if (!state || screen !== 'game') return
    state.elapsed = (performance.now() - state.startedAt) / 1000
    const timer = document.querySelector('#timer')
    if (timer) timer.textContent = formatTime(state.elapsed)
  }, 250)
}

function stopTimer(): void {
  if (timerHandle) window.clearInterval(timerHandle)
  timerHandle = 0
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

window.addEventListener('pointerdown', () => void audio.unlock(), { once: true })
render()
