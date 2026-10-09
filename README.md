# Glassworks

A Venetian glass-blower's conveyor-builder puzzle for iPad and mobile.

Molten glass enters from a fixed furnace. The player builds the conveyor belt itself — placing straight belts, corners, and colour gates — then presses **Run Conveyor** to watch whether each globe reaches its matching kiln.

## First release features

- Intro story and first-launch help
- Apprentice Studio map with 26 conveyor-builder puzzles
- Levels open directly into the builder
- Playback speed setting for run animation
- Grid-based belt placement
- Tap placed pieces to rotate them
- Straight belts, corner belts, selectable colour gates, and true bridge/overpass crossing pieces
- Fixed pieces and blocked hot tiles in later levels
- Fixed incoming sequences per level, including multi-source bridge levels
- Fixed draw queue levels where the next piece is assigned and cannot be moved after placement
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
