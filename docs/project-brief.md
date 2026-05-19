# DermaScope Project Brief

## Current Scope

DermaScope is a production-facing facial skin signal mapping app. A user uploads or captures one face photo, the backend analyzes visible image-processing signals, and the frontend returns an overlay, category scores, a total Skin Health Score, and a zone-by-zone breakdown.

The repository folder may still be named `imglab`. User-facing product copy and active contracts should use DermaScope.

## Purpose

DermaScope helps users inspect visible facial skin-condition signals from a normal photo without accounts, stored photos, or special capture hardware. It explains what the image-processing pipeline measured while avoiding diagnosis, treatment, cure, or product-recommendation claims.

## Confirmed Facts

- Project name: DermaScope.
- Current delivery request: redesign the React + Vite frontend around a concept that differs from the previous conservation condition-map direction.
- Active runtime: React + Vite frontend with Tailwind CSS and DaisyUI.
- Active backend: FastAPI + OpenCV-Python for `/api/process`.
- Active flow: upload or camera capture -> analyze -> overlay -> scores -> zone breakdown.
- Persistence decision: no database and no stored image history.

## Current Feature Set

1. Upload one PNG, JPEG, or WebP face photo up to 10 MB.
2. Capture one browser camera frame when permission is available.
3. Send the image to `POST /api/process` with `goal_id=skin-health-analysis`.
4. Detect a face region with OpenCV-Python and use a centered fallback if needed.
5. Split the face into forehead, left cheek, right cheek, nose, and chin.
6. Estimate acne, dark spots, wrinkles, redness, and enlarged pores with explainable image-processing heuristics.
7. Return a preprocessed face crop preview before analysis.
8. Return an overlay PNG plus structured metadata in `X-DermaScope-Analysis`.
9. Show a Skin Health Score, category scores, condition counts/coverage, warnings, and zone breakdown.

## Explicitly Out of Scope

- Medical diagnosis or treatment recommendations.
- Personalized skincare routines or product matching.
- User accounts.
- Persistent image storage.
- Batch processing.
- Saved scan history.
- Deep-learning model packaging unless future scope and operational budget are approved.

## Product Requirements

1. Keep the first action obvious: provide a face photo through upload or camera.
2. Show service readiness before analysis.
3. Validate file type and file size before upload.
4. Preserve the face image as the dominant evidence surface.
5. Show a cropped face preview after preprocessing so distant photos become easier to inspect.
6. Show the overlay result when processing succeeds.
7. Use distinct marker shapes and labels for acne, dark spots, wrinkles, redness, and pores.
8. Show the overall Skin Health Score, category measurements, and zone breakdown.
9. Keep error recovery inline and understandable.
10. State clearly that the result is image-processing evidence, not a diagnosis.
11. Avoid visible homework, demo, MVP, placeholder, or scaffold language in production UI.

## Non-Functional Requirements

- Keep processing responsive for one uploaded or captured face image.
- Protect privacy by avoiding stored photo history.
- Maintain keyboard access and visible focus for upload, source switch, camera, analyze, reset, and dismiss actions.
- Maintain WCAG 2.2 AA contrast and non-color-only condition meaning.
- Recompose layout across mobile, tablet, and desktop rather than only scaling the desktop view.
- Keep the UI specific to face-signal inspection and avoid generic dashboard chrome.

## Design Direction

The active redesign direction is a brutal topographic survey plate. The face photo is treated as a measured surface, condition signals are mapped as cartographic symbol layers, and measurements sit in station rows beside or below the surface depending on viewport.

See `docs/DESIGN.md` and `docs/design-intent.json` for the full research dossier, anchor selection, anti-repeat ledger, token logic, responsive rules, and review rubric.

## Runtime Direction

Keep React + Vite + Tailwind CSS + DaisyUI for the current frontend. Keep FastAPI + OpenCV-Python for the current analysis backend.

Evidence was refreshed on 2026-05-19:

- React docs: https://react.dev/learn/creating-a-react-app
- Vite docs: https://vite.dev/guide/
- Tailwind CSS Vite installation docs: https://tailwindcss.com/docs/installation/using-vite
- DaisyUI install docs: https://daisyui.com/docs/install/

## Next Validation Action

Manually test the redesigned frontend with real face photos across upload, camera capture, offline backend, successful analysis, fallback warning, and mobile viewport states.
