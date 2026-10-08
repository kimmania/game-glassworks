# Glassworks

A Venetian glass-blower's switch-conveyor routing puzzle for iPad and mobile.

Molten glass enters on a fixed conveyor sequence. Instead of grabbing each globe, the player programs colour gates, presses **Run Conveyor**, and watches whether every globe reaches its matching kiln route.

## First release features

- Intro story and first-launch help
- Apprentice Studio map with 5 switchboard puzzles
- Run speeds: Study Run, Workshop Run, Maestro Run
- Fixed incoming sequence per level
- Visible switch card for each editable colour
- Tap a colour switch card to cycle its kiln route
- Animated run log with correct/incorrect route feedback
- Kiln route reference panel showing the target route for each colour
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
