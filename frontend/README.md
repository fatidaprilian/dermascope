# ImgLab Frontend

This is the React + Vite frontend for ImgLab, a public-facing image processing workbench. The UI lets users upload an image, choose a goal-based operation, compare the processed result with a test-strip wipe, and export the result as PNG, JPEG, or WebP.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Key Files

- `src/App.jsx`: workbench UI, upload flow, processing calls, comparison wipe, and export format workflow.
- `src/index.css`: shared tokens, layout primitives, and interaction states.
- `src/utils/operations.js`: goal and operation registry.

## Runtime Notes

The frontend expects the optional backend at same-origin `/api` in production or through the Vite proxy during local development. Product copy should avoid scaffold, MVP, demo, or coursework framing.
