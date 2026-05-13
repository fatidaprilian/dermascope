# DermaScope Design Contract

## 1. Design Intent and Product Personality

DermaScope should feel like a dermatology contact sheet for visible skin signals: careful, human, and analytical without pretending to be a medical device. The interface must prioritize one decisive path: Upload Face Photo -> Analyze Skin -> Read Overlay -> Review Scores by Condition and Zone.

## 2. Audience and Use-Context Signals

Primary users are students, instructors, and image-processing learners who want a concrete computer-vision workflow for human facial skin analysis. The UI must make the analysis easy to inspect, avoid diagnosis language, and keep the result framed as image-processing evidence from a normal photo.

## 3. Visual Direction and Distinctive Moves

Conceptual anchor: a dermatology contact sheet with translucent acetate annotations, clinical paper labels, condition-color marks, and zone strips around one face image.

Distinctive moves:
- One face image becomes the central evidence frame.
- The overlay uses condition-specific translucent marks, not decorative background effects.
- Each condition uses a distinct marker shape and short label on the image.
- Skin Health Score is the first numeric signal after analysis.
- Category scores use the same color language as the overlay.
- Zone breakdown reads like a contact sheet margin, attached to forehead, cheeks, nose, and chin.

Authored visual bet: the first viewport reads as a single-face analysis table, with upload and score context wrapped around the image rather than a generic dashboard grid.

## 4. Color, Typography, Spacing, and Density Decisions

Palette logic: clinical porcelain surfaces, soft mint analysis accents, coral acne/redness marks, amber dark-spot marks, violet wrinkle marks, and teal pore marks. The page shell stays light so the face and overlay remain the evidence. Overlay colors must carry condition meaning and never become wallpaper.

Typography:
- Display: Space Grotesk for compact score and section headings.
- Body: IBM Plex Sans for calm explanatory UI copy.
- Numeric metadata: JetBrains Mono for score values, counts, and percentages.

Spacing and density: compact clinical-review spacing with one dominant image stage and dense side evidence. Avoid card-heavy admin dashboards and decorative hero layouts.

## 5. Token Architecture and Alias Strategy

Use Tailwind utilities with DaisyUI semantic tokens. Alias palette tokens to condition meaning: skin surface, clinical ink, acne coral, spot amber, wrinkle violet, redness rose, pore teal, and score mint. Keep shared visual behavior in `frontend/src/index.css`.

## 6. Responsive Recomposition Plan

Mobile:
- Prioritize upload or the analyzed face first.
- Show the overall score directly below the image after analysis.
- Collapse zone breakdown into stacked strips.

Tablet:
- Stage and condition scores split into two columns.
- Zone breakdown moves below the stage as a horizontal strip set.

Desktop:
- Stage dominates the center-left.
- Score stack and condition details stay on the right.
- Zone breakdown remains visible below the stage without becoming admin chrome.

## 7. Motion, Interaction, and Feedback Rules

Motion signature: the overlay settles onto the face in a short acetate-laydown transition after analysis. Reduced-motion users see an immediate overlay swap with no sweeping motion.

Interaction rules:
- Primary transitions stay under 200ms except the overlay laydown.
- Processing state shows both a spinner and a clear status message.
- The analyze action is disabled while the backend is offline or processing.
- Errors remain inline and dismissible.

## 8. Component Language, States, and Morphology

Components:
- Source switch: upload file or camera capture.
- Dropzone: clinical intake pad with clear file limits.
- Camera preview: same intake flow with browser permission and capture controls.
- Face stage: one image frame with overlay, fallback warning, and analysis state.
- Score stack: overall score plus five condition meters.
- Zone strips: forehead, left cheek, right cheek, nose, and chin summaries.
- Legend: condition colors mapped to overlay meaning.

States: default, hover, focus-visible, active, disabled, loading, empty, error, success.

## 9. Source Boundaries and Context Hygiene

Valid sources: repo evidence, this design contract, user-provided skin analysis concept, and official docs for the existing stack. Do not copy unrelated product UI.

Invalid sources: dashboard templates, decorative grid wallpapers, soft glow backdrops, generic abstract backgrounds, and coursework/demo copy.

## 10. Accessibility Non-Negotiables

Meet WCAG 2.2 AA. Maintain visible focus rings, keyboard access for upload/analyze/reset, readable score text, and non-color-only labels for overlay meanings.

## 11. Anti-Patterns to Avoid

- Decorative grid, line, or glow backgrounds.
- Diagnosis or treatment recommendations.
- Placeholder, demo, MVP, or coursework copy in production UI.
- Generic image editor controls from the old workbench.
- Color-only condition meaning without text labels.

## 12. Implementation Notes for Future UI Tasks

- Keep the React + Vite + Tailwind CSS + DaisyUI stack.
- Treat the backend overlay and `X-DermaScope-Analysis` metadata as the primary product contract.
- Keep medical-disclaimer copy visible but concise.
- Update design-intent.json and this document in the same change when the UI shifts.
