# ImgLab Design Contract

## 1. Design Intent and Product Personality

ImgLab should feel like a focused digital darkroom bench: calm, precise, and goal-first. The interface must prioritize intent over algorithm labels while keeping the processing flow visible and trustworthy. The core flow remains: Upload Image -> Select Goal -> See Result.

## 2. Audience and Use-Context Signals

Primary users are students, instructors, and casual image editors who want fast, explainable results. The UI must support repeated experimentation without exposing deep parameters upfront.

## 3. Visual Direction and Distinctive Moves

Conceptual anchor: a silver-gelatin darkroom test-strip bench with an optical enlarger, contact sheet, safelight, and calibration marks.

Distinctive moves:
- Test-strip wipe reveal with a physical handle on the wipe line.
- Bench surfaces with layered panels to imply a working table, not a generic dashboard.
- Safelight status indicator that reflects backend readiness and processing state.
- Goal rail that reads like a contact sheet: compact labels, tight grouping, and short intent copy.

Authored visual bet: the first viewport feels like a working bench where the image and test strip are the central instruments.

## 4. Color, Typography, Spacing, and Density Decisions

Palette logic: graphite and dark paper neutrals with a safelight amber primary and a cool cyan secondary for measurement cues. The palette must avoid glow or grid wallpaper and keep the image color judgment intact.

Typography:
- Display: Space Grotesk for compact, confident headings.
- Body: IBM Plex Sans for legible UI copy.
- Numeric metadata: JetBrains Mono for aligned numbers.

Spacing and density: medium density with clear separation between the stage, tool rail, and status line. Avoid loose whitespace that makes the UI feel empty.

## 5. Token Architecture and Alias Strategy

Use Tailwind utilities with DaisyUI semantic tokens. Alias palette tokens to the anchor (safelight, graphite, paper) and keep a single source of truth in the DaisyUI theme config.

## 6. Responsive Recomposition Plan

Mobile:
- Stack dropzone above a collapsible goal rail.
- Test-strip wipe slider sits directly under the image stage.

Tablet:
- Stage and goal rail sit side-by-side with compact headers.

Desktop:
- Stage dominates left; tool rail becomes a vertical contact sheet on the right.
- Status and export controls remain on a single top strip.

## 7. Motion, Interaction, and Feedback Rules

Motion signature: a test-strip wipe reveals the processed image over the original with a manual handle. Reduced-motion users see an immediate swap or a short fade.

Interaction rules:
- Primary transitions stay under 200ms except the test-strip wipe.
- Processing state shows both a spinner and a clear status message.
- Errors remain inline and dismissible.

## 8. Component Language, States, and Morphology

Components:
- Dropzone: framed pad with a dashed edge, subtle lift, and clear action copy.
- Test-strip stage: layered frame, wipe line, and handle.
- Goal rail: compact button list with intent summary and category cues.
- Status pill: safelight indicator with backend readiness text.

States: default, hover, focus-visible, active, disabled, loading, empty, error, success.

## 9. Source Boundaries and Context Hygiene

Valid sources: repo evidence, this design contract, and official docs for React, Vite, Tailwind CSS, and DaisyUI. Do not copy unrelated product UI.

Invalid sources: dashboard templates, decorative grid wallpapers, soft glow backdrops, or generic abstract backgrounds.

## 10. Accessibility Non-Negotiables

Meet WCAG 2.2 AA. Maintain visible focus rings, keyboard navigation for goal selection and wipe slider, and text contrast that stays readable over the bench surfaces.

## 11. Anti-Patterns to Avoid

- Decorative grid, line, or glow backgrounds.
- Calibration marks used as wallpaper rather than functional overlay.
- Placeholder or demo copy in production UI.
- Parameter-heavy panels before the user selects a goal.

## 12. Implementation Notes for Future UI Tasks

- Keep the React + Vite + Tailwind CSS + DaisyUI stack.
- Preserve the test-strip wipe as the signature interaction.
- Update design-intent.json and this document in the same change when the UI shifts.
