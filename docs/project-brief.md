# DermaScope Project Brief

## Current Scope Reset

DermaScope replaces the previous general ImgLab workbench direction. The current product is a facial skin condition analysis app: Upload one face photo -> detect visible skin signals -> generate an overlay -> show condition scores, a Skin Health Score, and zone breakdowns. The repository folder can remain `imglab` during the transition, but user-facing product copy should use DermaScope.

The previous restoration, enhancement, edge, upscaling, and morphology workbench scope is legacy context only. Do not use it as the active product direction unless the user asks to restore the old workbench.

## Purpose

ImgLab is a public-facing digital image processing workbench. It helps users upload an image, apply visible processing methods, compare the result against the original, and export the processed image in a suitable file format.

The product should make the processing step easy to see. The MVP is complete; the current direction is to refine ImgLab into a production-ready public web experience with trustworthy copy, resilient export choices, and a polished goal-first workflow.

## Confirmed Facts

- Project name: ImgLab.
- Current user goal: evolve the completed MVP into a public-ready toolkit for image restoration, enhancement, upscaling, analysis, and morphology.
- Current delivery request: redesign the React + Vite frontend so it reads like a real public product, not a coursework submission, and add export format choices.
- Repository state: project docs were not fully materialized before this task. `docs/design-intent.json` existed as a seed and needed project-specific refinement.
- The first application slice now exists as a React + Vite frontend with Tailwind CSS and DaisyUI, with an optional FastAPI backend for processing.

## Current Feature Set

The current implementation keeps explainable operations as the core product value while presenting them through user goals instead of a raw algorithm list.

### Restoration

1. Gaussian blur for mild noise reduction.
2. Median filter for salt-and-pepper noise reduction.
3. Bilateral filter for edge-preserving smoothing.

### Enhancement

1. Grayscale conversion as a base operation and teaching step.
2. Histogram equalization for global contrast improvement.
3. Brightness and contrast adjustment.
4. Gamma correction.
5. Sharpening with unsharp mask or a Laplacian-style kernel.

### Edge and Segmentation Tools

1. Canny edge detection.
2. Otsu thresholding.
3. Adaptive thresholding.

These are grouped separately because they are analysis and segmentation tools, not pure enhancement.

### Upscaling

1. Bilinear interpolation.
2. Bicubic interpolation.
3. Lanczos interpolation.

Deep-learning super-resolution such as ESRGAN or Real-ESRGAN is out of MVP scope. It adds model loading, compute cost, device limits, and dependency risk that are not needed for the first coursework version.

### Morphology

1. Dilation.
2. Erosion.
3. Opening.
4. Closing.

Morphology can ship after the core upload, preview, and export flow works.

## Explicitly Out of Scope

- Wiener filter.
- Inpainting for object or scratch removal.
- ESRGAN or Real-ESRGAN.
- User accounts.
- Server-side image storage.
- Batch processing.
- Persistent project history.

These can be added later only when they have a clear product reason, operational budget, and privacy model.

## Recommended Runtime Direction

Use a browser-first single page application with React + Vite and Tailwind CSS for the current frontend. Processing can be client-side with OpenCV.js or via the optional FastAPI backend when server-side compute is preferred.

The current implementation uses React + Vite for a clearer component architecture and DaisyUI for consistent UI primitives. The static HTML version is now legacy.

### Evidence

- OpenCV.js official docs describe browser image loading, `cv.Mat` conversion, canvas display, and image processing tutorials for filtering, thresholding, morphology, histograms, Canny, and geometric transforms. Source: https://docs.opencv.org/4.x/d5/d10/tutorial_js_root.html, fetched 2026-05-07.
- Vite official docs describe a dev server and production build pipeline for modern web projects, including React templates. This is retained as a future option, not the current MVP runtime. Source: https://vite.dev/guide/, fetched 2026-05-07.
- React official docs recommend using a framework for new apps, and also document from-scratch React app options when a smaller setup is a better fit. This is retained as a future option, not the current MVP runtime. Source: https://react.dev/learn/start-a-new-react-project, fetched 2026-05-07.

## Product Requirements

1. Upload one image from the local device.
2. Show original and processed views with a comparison control.
3. Let users choose the image goal first, such as reduce noise, improve contrast, sharpen, enlarge, or detect edges.
4. Map each goal to a real implemented method with safe defaults.
5. Show processing status and validation errors.
6. Let users export the processed output as PNG, JPEG, or WebP when the browser supports the requested format.
7. Avoid accounts, project storage, and hidden cloud persistence.
8. Explain each selected goal in short practical copy near the tool controls, with the technical method shown as secondary detail.
9. Present production-ready public copy with no visible homework, demo, MVP, placeholder, or scaffold language in the UI.

## Non-Functional Requirements

- Keep processing responsive. Move heavier operations into a Web Worker when the local browser pipeline becomes the default.
- Limit maximum image size or downscale previews to avoid browser memory crashes.
- Preserve accessibility: keyboard controls, visible focus, readable contrast, and status announcements.
- Avoid hidden cloud uploads unless the user later approves server-side processing.
- Keep the UI dense enough for repeated experimentation, but not a generic admin panel or a school-project demo.

## Assumptions to Validate

- The current production direction remains a web app, not a Python desktop tool.
- The project does not need login or persistent storage.
- OpenCV.js covers the first method set well enough for coursework.
- The user wants formal docs in English, following repository governance, while day-to-day conversation can remain Indonesian.

## Next Validation Action

Validate the public-facing UI manually in a browser with real sample images, then verify export output as PNG, JPEG, and WebP.
