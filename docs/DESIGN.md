# DermaScope human-readable visual direction

## 1. Product Personality and Design Intent

DermaScope is styled like a high-end tactile printmaker's press bed for compiling skin-signal color-separation sheets from one face image. The interface represents a precise, high-art manual print workshop where separate ink-plates are aligned using margin marks, ink density bars, and alignment crosshairs. The product avoids commercial wellness pastel gradients, cold clinical charts, neobrutalist cartoon yellow sheets, and generic SaaS card boxes. It establishes an authentic, crafted, and objective measuring atmosphere.

The visual system uses warm tactile press-paper as its foundation, structured by high-density carbon-black press lines, and accented with true printmaker ink colors: Vermilion, Umber, Cobalt, Rhodamine, and Veridian.

## 2. Audience and Use-Context Signals

Users need a quick, highly professional, non-diagnostic visual survey of visible skin signals without credentials, stored images, or diagnostic claims. The primary journey is submitting one photo (via upload or camera capture), compiling the color-separation print layers, and inspecting the resulting overlay compilation alongside detailed density scores and zone readings.

### Product Requirements

| Requirement | Visual Solution |
| --- | --- |
| Single-photo focus | The central press bed holds one primary sheet (the face photo) as the focal point. |
| Strict privacy posture | Explicit margin labels explain that no image is archived or retained after the print run. |
| Non-diagnostic nature | Copy is strictly descriptive ("terpetakan", "sinyal visual", "tumpukan tinta") rather than clinical. |
| Input and device safety | Intake accommodates camera permission handling and file limits with clear press-bed alerts. |
| Offline service readiness | The press bed header shows immediate service connection state before the print run begins. |

## 3. Visual System and Distinctive Features

The visual strategy mimics a manual flatbed printing press compiling colored ink-plates onto a single sheet:

- **The key base plate**: The face photo behaves like a base key print sheet, held inside a clean, high-density carbon-black metal plate holder with crop guides in the margins.
- **Tactile ink margins**: The edges of the layout host registration crosshairs, ink-density bars, scale rulers, and plate indicators. These elements are highly functional, serving as toggle controls and visual guides.
- **Separation color-bars**: The five skin signals act like individual color-separation ink plates: Acne as Vermilion Ink, Dark Spots as Umber Ink, Wrinkles as Cobalt Ink, Redness as Rhodamine Ink, and Pores as Veridian Ink.
- **No generic card stacks**: Layout structures are flat plates separated by thin, solid ink lines. Surfaces have no rounded corners or soft blurs, maintaining the flat-bed paper print character.

## 4. Color, Typography, Spacing, and Density Decisions

### Color Palette

The system is built on authentic manual printing materials, using high contrast and color-bars to organize information:

- **Sheet Base**: Natural warm ivory paper (`#FDFBF7`) for structural backdrops.
- **Press Fields**: Tinted ink stone gray (`#EFECE6`) for input fields and non-interactive blocks.
- **Ink Black**: Dense carbon black (`#0A0B0B`) for boundaries, structural frames, and primary text.
- **Ink Muted**: Muted graphite gray (`#555959`) for scale markings and supplementary metrics.
- **Focus Ring**: Intense Vermilion Ink (`#E0462D`) for keyboard navigation outlines.
- **Separation Ink Plates**:
  - Acne (Vermilion Ink): `#E0462D`
  - Dark Spots (Umber Ink): `#785942`
  - Wrinkles (Cobalt Ink): `#2B5CB5`
  - Redness (Rhodamine Ink): `#C92464`
  - Pores (Veridian Ink): `#18785A`

This palette is strictly tied to printmaking, ensuring it does not resemble generic e-commerce or beauty coaching screens.

### Typography

Type behaves like an editorial manual:

- **Press Headings**: `Lora` (weights 700 and 900) provides an elegant, ink-rich editorial serif display.
- **System Copy**: `Outfit` (weights 300, 400, and 600) offers a modern, readable geometric sans-serif for Indonesian product instructions.
- **Calibration Metrics**: `IBM Plex Mono` (weights 400 and 600) provides clean monospaced tabular numerals for alignment offsets, scores, file sizes, and timing calculations.

### Spacing and Density

Layout blocks use a 16px structural base unit for margin alignment and borders. Spacing is tight and structured, resembling a dense calibration sheet, while action targets preserve accessible sizes (minimum 44px) for touch safety.

## 5. Token Mappings and Variable Structure

Visual styles utilize Tailwind utility classes alongside custom CSS variables. Custom variables are named by role and material function rather than color:

- `--surface-sheet`: `#FDFBF7` (Natural paper)
- `--surface-field`: `#EFECE6` (Ink stone)
- `--ink-black`: `#0A0B0B` (Carbon text)
- `--ink-muted`: `#555959` (Graphite metadata)
- `--line-hard`: `#0A0B0B` (Metal plate boundaries)
- `--line-soft`: `#CCCCCC` (Thin guide markings)
- `--focus-ring`: `#E0462D` (Vermilion focus outline)
- `--signal-acne`: `#E0462D` (Vermilion ink plate)
- `--signal-spot`: `#785942` (Umber ink plate)
- `--signal-wrinkle`: `#2B5CB5` (Cobalt ink plate)
- `--signal-redness`: `#C92464` (Rhodamine ink plate)
- `--signal-pore`: `#18785A` (Veridian ink plate)

Spacing coordinates are strictly aligned to multiples of the 16px base unit.

## 6. Responsive Layout Plan

### Mobile Viewport
- **Decisive action first**: Promote the camera or file intake station and the press readiness status to the top of the viewport.
- **Sheet priority**: Display the key face photo print sheet immediately below the intake, positioning the score register and ink plates below the image.
- **Compact metrics**: Combine file details, image dimensions, and compile times into a single thin horizontal metric strip.
- **Tactile targets**: Keep ink plate rows full-width with large touch targets. Do not compress layout columns.

### Tablet Viewport
- **Wide print stage**: Keep the main print stage centered and wide.
- **Double details**: Group the score register and ink plate checklist into a two-column detail board below the image.
- **Horizontal sectors**: Render face zone readings as a clean horizontal plate list below the main stage.

### Desktop Viewport
- **Press bed compilation**: Arrange the screen as a side-by-side print bed. The left side hosts the key print stage (face image, overlay, margin guides), and the right side holds the calibration metrics, score registers, and interactive ink plate controls.
- **Integrated controls**: Keep intake, privacy policies, color-bars, and service status visible simultaneously on the main screen without hidden drawers.

## 7. Motion, Transitions, and User Feedback

### Plate Registration Motion
- **Mechanical slide**: When analysis results arrive, the color-separation overlays do not fade in. They behave like separate color plates sliding in from slightly offset coordinates (e.g., translation offsets) and snapping into place.
- **Crosshair alignment lock**: The plates snap into place at 300ms, followed by a brief 50ms registration micro-vibration that settles the final compiled image.
- **Sequential ink stagger**: The aside checklist rows stagger in from bottom-to-top at 40ms intervals, mimicking plates locking into position on the press bed.

### Reduced-Motion Alternative
- **Instant compilation**: For users with reduced-motion preferences, all overlay layers render instantly on the print stage, and indicator rows load statically without translation or stagger transitions.

### Interaction Rules
- Keyboard users can access all input fields, source switches, print alignment toggles, and resets.
- High-contrast vermilion focus outlines ensure clear interactive state tracking.
- Status changes (such as "mendaftarkan plat", "piringan warna terkunci", "gagal mengompilasi") are announced using accessible status regions (`aria-live`).

## 8. Components, States, and Details

- **Press Bed Header**: Identifies the product, contains the connection status indicator, and lists the privacy policy.
- **Intake Station**: Houses the file upload drag-and-drop drop-zone and camera capture console.
- **Key Print Stage**: Holds the base photo sheet, handles alignment crosshairs in the margins, and renders the compiled overlay plates.
- **Margin Density Ledger**: Displays the overall compiled score (Skin Health Score) as a primary calibration coordinate.
- **Separation Ink Plates**: Lists the interactive checkboxes to toggle Vermilion (acne), Umber (spots), Cobalt (wrinkles), Rhodamine (redness), and Veridian (pores) layers.
- **Zone Calibration Blocks**: Measures individual face sectors (forehead, nose, cheeks, chin) as calibrated coordinate readouts.

## 9. Boundaries and Context Safety

The visual system draws strictly from manual art-press printmaking and color-separation mechanics:

- **Approved elements**: Tactile paper textures, thin alignment crosshairs, density strips, color-bars, mechanical plate indicators, and manual toggle switches.
- **Tainted elements**: Avoid neobrutalist thick drop shadows, yellow cardboards, clinical medical scans, glowing pastel filters, generic admin navigation columns, and decorative abstract backgrounds without calibration purpose.

## 10. Accessibility Benchmarks

- **WCAG 2.2 AA floor**: Contrast is strictly verified for all text-on-background combinations.
- **Non-color-only indicators**: The overlay and checklist use distinct marker shapes in addition to color to represent each signal (e.g., solid circles for Acne, solid squares for Spots, diagonal lines for Wrinkles, crosshairs for Redness, and hollow rings for Pores).
- **Operability**: Large, clear touch targets with high-contrast keyboard focus outlines.

## 11. Cliches to Avoid

- **Wellness beauty apps**: Discard soft glowing skin graphics, pastel backgrounds, skincare routing copy, and subscription popups.
- **Clinical scanner simulators**: Discard medical grid lines, calibration scopes, mock diagnostic charts, and neon green lasers.
- **Topographic neobrutalism**: Discard thick cartoon shadows, highlighter yellow containers, topographic elevation contour backgrounds, and rugged outdoor aesthetics.
- **Coursework demos**: Discard raw code snippets, generic before-and-after panels, and placeholder content.

## 12. Future UI Development Guidelines

- Keep React + Vite + Tailwind CSS + DaisyUI.
- Do not introduce additional animation packages; use native CSS logical transitions and logical logical properties for direction-agnostic positioning.
- Ensure all Indonesian copy is precise and avoids clinical diagnosis or cosmetic brand terms.
- Keep calibration grids and margin marks functional. They must only appear on the print stage and toggle buttons, never as general background wallpaper.
- Update `docs/design-intent.json` first whenever visual rules, ink colors, typography, or interaction systems change.
