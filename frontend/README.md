# DermaScope Frontend

This is the React + Vite frontend for DermaScope. The UI lets users upload or capture one face photo, send it to the backend analysis API, and inspect the returned overlay, Skin Health Score, condition categories, and zone breakdown.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Key Files

- `src/App.jsx`: upload/camera intake, backend calls, analysis result, overlay, scores, and zone UI.
- `src/index.css`: DermaScope design tokens, responsive layout, motion, and component states.
- `src/utils/operations.js`: single skin-analysis goal and operation registry.

## Runtime Notes

The frontend expects the backend at same-origin `/api` in production or through the Vite proxy during local development. Product copy must avoid diagnosis, treatment, routine/product recommendations, scaffold language, demo language, and coursework framing.
