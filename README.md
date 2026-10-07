# Glassworks

A Venetian glass-blower's limited-buffer sorting puzzle for iPad and mobile.

A packed crate of molten glass arrives at the bench. Only the top globe of each vertical stack is reachable. Pull exposed globes into a limited number of cooling slots, then feed matching colours into their kilns. The puzzle is choosing extraction order without clogging the bench.

## First release features

- Intro story and first-launch help
- Apprentice Studio map with 10 crate puzzles
- Bench setups: Open Bench (4 slots), Working Bench (3 slots), Tight Bench (2 slots)
- Packed crate with top-only extraction
- Limited cooling slots as the main logic constraint
- Kilns that seal when each colour is complete
- Smoky glass / cullet-bin obstacle levels
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
