# ImgLab Project Brief

## Purpose

ImgLab is a digital image processing toolkit for coursework and demonstration. It helps users upload an image, apply visible processing methods, compare the result against the original, and export the processed image.

The product should make the processing step easy to see. The first version must favor real, explainable algorithms over a long feature list.

## Confirmed Facts

- Project name: ImgLab.
- Current user goal: build a toolkit for image restoration, enhancement, upscaling, and optional morphology.
- Current delivery request: complete the React + Vite frontend rebuild, align UX to the goal-first flow, and ensure the frontend launches reliably.
- Repository state: project docs were not fully materialized before this task. `docs/design-intent.json` existed as a seed and needed project-specific refinement.
- The first application slice now exists as a React + Vite frontend with Tailwind CSS and DaisyUI, with an optional FastAPI backend for processing.

## MVP Feature Set

The first implementation should include only methods that are practical for a coursework project and can show visible output in the browser.

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

## Explicitly Out of Scope for MVP

- Wiener filter.
- Inpainting for object or scratch removal.
- ESRGAN or Real-ESRGAN.
- User accounts.
- Server-side image storage.
- Batch processing.
- Persistent project history.

These can be added later after the browser processing pipeline is stable.

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
6. Let users download the processed output.
7. Keep all image data local to the browser for MVP.
8. Explain each selected goal in short practical copy near the tool controls, with the technical method shown as secondary detail.

## Non-Functional Requirements

- Keep processing responsive. Move heavier operations into a Web Worker when implementation begins.
- Limit maximum image size or downscale previews to avoid browser memory crashes.
- Preserve accessibility: keyboard controls, visible focus, readable contrast, and status announcements.
- Avoid hidden cloud uploads unless the user later approves server-side processing.
- Keep the UI dense enough for repeated experimentation, but not a generic admin panel.

## Assumptions to Validate

- The first version is a web app, not a Python desktop tool.
- The project does not need login or persistent storage.
- OpenCV.js covers the first method set well enough for coursework.
- The user wants formal docs in English, following repository governance, while day-to-day conversation can remain Indonesian.

## Next Validation Action

Validate the static browser app manually in a browser with a real sample image, then refine the first UI and processing slice based on observed behavior.
