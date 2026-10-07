# Glassworks

A Venetian glass-blower's mixed-crate sorting puzzle for iPad and mobile.

Mixed crates of molten glass arrive at the bench. Only the top globe of each crate can move. Pull globes into a limited number of bench slots, then place them back into crates to reorganize every non-empty crate into a single colour.

## First release features

- Intro story and first-launch help
- Apprentice Studio map with 10 mixed-crate puzzles
- Bench setups: Open Bench (4 slots), Working Bench (3 slots), Tight Bench (2 slots)
- Multiple mixed crates as both sources and destinations
- Top-only extraction from every crate
- Limited bench slots as the main logic constraint
- Uniform-crate win condition
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
