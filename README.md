# Glassworks

A Venetian glass-blower's conveyor-builder puzzle for iPad and mobile.

Molten glass enters from a fixed furnace. The player builds the conveyor belt itself — placing straight belts, corners, and colour gates — then presses **Run Conveyor** to watch whether each globe reaches its matching kiln.

## First release features

- Intro story and first-launch help
- Apprentice Studio map with 10 conveyor-builder puzzles
- Levels open directly into the builder
- Playback speed setting for run animation
- Grid-based belt placement
- Tap placed pieces to rotate them
- Straight belts, corner belts, and selectable colour gates (matching colour follows the arrow; other colours pass straight through)
- Fixed incoming sequence per level
- Animated route log with correct/incorrect delivery feedback
- Stars, unlock progression, and persisted settings/progress
- PWA install metadata and icons
- GitHub Pages deploy workflow

## Development

```bash
npm install
npm run build
npm run smoke
npm run dev
```

The deployed app is configured for:

```text
https://kimmania.github.io/game-glassworks/
```
