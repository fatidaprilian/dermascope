# ImgLab Design Contract

## 1. Design Intent and Product Personality

ImgLab should feel like a focused public image inspection studio: calm, precise, and credible enough to ship as a real web product. The interface must prioritize intent over algorithm labels while keeping the processing flow visible and trustworthy. The core flow remains: Upload Image -> Select Goal -> Compare Result -> Export Format.

## 2. Audience and Use-Context Signals

Primary users are students, instructors, and image-workflow users who want fast, explainable results without account setup. The UI must support repeated experimentation without exposing deep parameters upfront, and it must avoid homework, demo, scaffold, or MVP language in the product surface.

## 3. Visual Direction and Distinctive Moves

Conceptual anchor: a light inspection studio with a calibrated review table, neutral paper panels, a focused image stage, measurement controls, and an export tray.

Distinctive moves:
- Comparison wipe reveal with a physical handle on the wipe line.
- Bright inspection surfaces that feel like a real public tool, not a dark control room.
- Service status indicator that reflects backend readiness and processing state.
- Goal rail that reads like an inspection checklist: compact labels, tight grouping, and short intent copy.
- Export tray with explicit PNG, JPEG, and WebP choices after processing.

Authored visual bet: the first viewport feels like a real image lab where the uploaded image, comparison wipe, and export tray are the central instruments.

## 4. Color, Typography, Spacing, and Density Decisions

Palette logic: clean studio whites, warm paper panels, graphite text, blue primary actions, cyan measurement/focus cues, and restrained success/error colors. The image stage may stay dark neutral to preserve image contrast, but the page shell should feel bright and public. The palette must avoid glow or grid wallpaper and keep the image color judgment intact.

Typography:
- Display: Space Grotesk for compact, confident headings.
- Body: IBM Plex Sans for legible UI copy.
- Numeric metadata: JetBrains Mono for aligned numbers.

Spacing and density: production-dense with clear separation between the stage, tool rail, export tray, and status line. Avoid loose whitespace that makes the UI feel like a class assignment or placeholder shell.

## 5. Token Architecture and Alias Strategy

Use Tailwind utilities with DaisyUI semantic tokens. Alias palette tokens to the anchor (studio paper, graphite text, blue action, cyan measurement) and keep shared visual behavior in `frontend/src/index.css`.

## 6. Responsive Recomposition Plan

Mobile:
- Prioritize upload or the image stage first.
- Place the goal rail after the stage and keep export choices directly below the processed result.
- Comparison wipe slider sits directly under the image stage.

Tablet:
- Stage and goal rail split into two columns with compact metadata.
- Export controls stay attached to the result status, not hidden in navigation.

Desktop:
- Stage dominates left; tool rail becomes a vertical contact sheet on the right.
- Status, output metadata, and export controls remain visible without becoming admin chrome.

## 7. Motion, Interaction, and Feedback Rules

Motion signature: a comparison wipe reveals the processed image over the original with a manual handle. Reduced-motion users see an immediate swap or a short fade.

Interaction rules:
- Primary transitions stay under 200ms except the comparison wipe.
- Processing state shows both a spinner and a clear status message.
- Export format selection updates the filename and output MIME without reprocessing the image.
- Errors remain inline and dismissible.

## 8. Component Language, States, and Morphology

Components:
- Dropzone: framed pad with a dashed edge, subtle lift, and clear action copy.
- Comparison stage: layered frame, wipe line, and handle.
- Goal rail: compact button list with intent summary and category cues.
- Status pill: service indicator with backend readiness text.
- Export tray: segmented format choices plus a decisive export action.

States: default, hover, focus-visible, active, disabled, loading, empty, error, success.

## 9. Source Boundaries and Context Hygiene

Valid sources: repo evidence, this design contract, and official docs for React, Vite, Tailwind CSS, and DaisyUI. Do not copy unrelated product UI.

Invalid sources: dashboard templates, decorative grid wallpapers, soft glow backdrops, generic abstract backgrounds, and coursework/demo copy.

## 10. Accessibility Non-Negotiables

Meet WCAG 2.2 AA. Maintain visible focus rings, keyboard navigation for goal selection and wipe slider, and text contrast that stays readable over bright studio surfaces and the dark image stage.

## 11. Anti-Patterns to Avoid

- Decorative grid, line, or glow backgrounds.
- Calibration marks used as wallpaper rather than functional overlay.
- Placeholder, demo, MVP, or coursework copy in production UI.
- Parameter-heavy panels before the user selects a goal.
- Export actions that force a single format when multiple browser-supported formats are practical.

## 12. Implementation Notes for Future UI Tasks

- Keep the React + Vite + Tailwind CSS + DaisyUI stack.
- Preserve the comparison wipe as the signature interaction.
- Preserve explicit PNG, JPEG, and WebP export choices unless browser capability checks prove a narrower set is required.
- Update design-intent.json and this document in the same change when the UI shifts.
