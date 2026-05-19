# DermaScope Design Contract

## 1. Design Intent and Product Personality

DermaScope should feel like a brutal topographic survey plate for one face image. The product reads visible skin signals as terrain-like evidence: contour bands, station rows, zone sectors, and measured scores. It must not read as a beauty app, clinical device clone, conservation condition map, coursework demo, or generic dashboard.

Motion/Palette Decision: Anchor `USGS 7.5-minute topographic quadrangle marginalia`; motion traces contour bands across the face result and snaps score rows into survey stations; palette uses survey paper, hard black ink, safety orange, cyan waterline, magenta control marks, and olive terrain bands with tabular station typography.

## 2. Audience and Use-Context Signals

Primary users need a trustworthy single-photo skin signal report without accounts, stored photos, diagnosis, routine advice, or product matching. The highest-frequency path is upload or camera capture, analyze, then inspect the overlay, Skin Health Score, category scores, and zone breakdown.

### Product Reading

| Field | Reading |
| --- | --- |
| Product type and core verb | DermaScope is a browser-first facial skin signal mapping app; the user submits one face photo and inspects mapped visible signals. |
| Highest-stakes moment 1 | Intake must make file limits, privacy, camera permission, and face-photo requirements clear before the user shares an image. |
| Highest-stakes moment 2 | Processing must show service readiness and a non-diagnostic status while the backend analyzes the photo. |
| Highest-stakes moment 3 | Results must connect overlay marks, category scores, and zones so users understand what the algorithm measured. |
| Dominant data shape | The screen is dominated by one spatial image, five condition categories, and five face zones. |
| Latency profile | Analysis is soft real-time: a single request returns a PNG overlay and metadata after processing. |
| Failure modes | The UI must absorb offline backend, invalid image, oversized image, camera permission failure, processing failure, fallback face detection, stale result risk, and missing or malformed analysis metadata. |
| Context of use | The app is a sustained single-task inspection flow, not a feed, stored history product, or admin monitor. |
| Known constraints | React + Vite + Tailwind CSS + DaisyUI are present; WCAG 2.2 AA, no persistent image storage, safe errors, and no medical diagnosis are hard constraints. |

## 3. Visual Direction and Distinctive Moves

Conceptual anchor: USGS 7.5-minute topographic quadrangle marginalia and contour map logic. The design borrows contour-as-measurement, map marginalia, station labels, legend discipline, and scale/sector readings. It does not borrow USGS branding, literal map wallpaper, terrain illustrations, or decorative grid backgrounds.

Distinctive moves:

- The face image is treated as the mapped terrain surface, with condition data attached as survey stations.
- The first viewport uses a hard, brutal survey layout: large type, strong black borders, compact station rows, and a clear source/acquire panel.
- Contour language appears only as functional overlays, meters, station rows, or result transitions, never as page wallpaper.
- Category colors act like cartographic symbol layers: acne as safety orange, dark spots as brown elevation ink, wrinkles as cyan contour traces, redness as magenta control marks, and pores as olive point marks.
- Results are read from image to score to zones, not from dashboard cards to chart summaries.
- The first viewport shows three product-specific signals: face acquisition route, five-condition symbol legend, and service readiness.

Authored visual bet: DermaScope should look like a measuring instrument for a face surface, with enough visual force to avoid wellness softness and enough restraint to avoid diagnostic overclaim.

## 4. Color, Typography, Spacing, and Density Decisions

Palette logic: survey paper and black ink carry structure; safety orange, cyan, magenta, brown, and olive carry condition layers. This palette would not transfer cleanly to a routine builder or ecommerce skincare app because its color roles are map-symbol roles, not mood or brand tones.

Typography:

- Display: `Archivo Black` for the blunt survey-title role.
- Body: `Inter` for readable Indonesian UI copy.
- Numeric evidence: `IBM Plex Mono` with tabular numbers for score, coverage, count, file size, timing, and station labels.

Spacing and density: the system uses a 12px survey-station base. It allows dense measurement rows but keeps action targets at accessible sizes. Repeated rows may be panel-like; page sections should remain strong layout surfaces, not nested cards.

## 5. Token Architecture and Alias Strategy

Use DaisyUI semantic variables plus project aliases. Name tokens by role before hue:

- `surface-sheet`
- `surface-field`
- `ink-black`
- `ink-muted`
- `signal-acne`
- `signal-spot`
- `signal-wrinkle`
- `signal-redness`
- `signal-pore`
- `survey-cyan`
- `survey-orange`
- `survey-magenta`
- `focus-ring`

Token derivation:

- Color derives from topographic and nautical symbol separation, not skincare pastels or conservation-map inks.
- Spacing derives from map marginalia, station rows, and measured sectors.
- Typography derives from map titles, marginal labels, and numeric station readings.
- Motion derives from contour tracing and station snapping, not raking-light conservation sweeps.

## 6. Responsive Recomposition Plan

Mobile:

- Promote service state, source selection, and one upload/camera action first.
- Show the face/result surface before the score register after an image exists.
- Merge file metadata and timing into one station strip.
- Keep condition rows full-width with touch-safe targets.
- Forbid shrunken desktop sidebars.

Tablet:

- Keep the face stage wide.
- Place score and condition register in a two-column band below the image.
- Render zones as a compact station strip.
- Keep the legend near the intake action.

Desktop:

- Use a two-column survey sheet: mapped face surface left, evidence stations right.
- Keep zone sectors below the face so they remain attached to spatial evidence.
- Expose intake, service readiness, privacy, and legend without admin navigation.

## 7. Motion, Interaction, and Feedback Rules

Signature motion: a 420ms contour trace passes across the face result when overlay metadata arrives, followed by a 120ms station snap for category rows and zone sectors. Reduced-motion users get immediate overlay replacement and static station rows.

Interaction rules:

- Keep upload, drag/drop, source switch, camera start, capture, analyze, reset, and dismiss keyboard-operable.
- Use `aria-live` status for processing, success, and recoverable errors.
- Disable analysis while the backend is offline or processing, and show the reason in the service station.
- Focus states must use a high-contrast outline and cannot rely on color alone.
- Ignore stale or superseded process responses so a slower request cannot overwrite a newer image.

## 8. Component Language, States, and Morphology

Components:

- Survey masthead: product identity, service readiness, privacy stance, and mode.
- Source station: upload/camera source switch, file rules, and capture controls.
- Map surface: image, overlay, contour trace, file metadata, and action controls.
- Evidence stations: Skin Health Score, category rows, legend, and processing pipeline.
- Zone sectors: forehead, cheeks, nose, and chin as measured region rows.

States: default, hover, focus-visible, active, disabled, checking, processing, ready, mapped, empty, error, warning, stale, malformed metadata, and reduced-motion.

## 9. Source Boundaries and Context Hygiene

Valid sources: repo evidence, user request, current project docs, current frontend and backend code, official React/Vite/Tailwind/DaisyUI docs, public references for skin-analysis mechanics, and official cartographic references for contour/symbol mechanics.

Borrowed mechanics:

- Glō and similar current skin-analysis apps prove the category norm of skin score, face zones, metrics, routines, and progress tracking. Their beauty tone, streaks, product matching, and landing-page rhythm are rejected.
- The Scientific Reports skin imaging study proves objective, regional, and full-face assessment language, and names common aspects such as spots, wrinkles, pores, and red areas. Clinical validation claims are not borrowed.
- USGS topographic map references prove contour lines as a shape-reading mechanism and symbol sheets as legend discipline. USGS branding and literal terrain maps are not borrowed.
- NOAA nautical chart references prove soundings, depth contours, and symbol legends as compact measurement vocabulary. Maritime styling and navigation-brand posture are not borrowed.

Invalid sources: the previous conservation condition-map direction, clinical contact sheets, beauty gradients, routine/product language, generic dashboards, decorative grids, placeholder copy, coursework copy, and unrelated project memory.

## 10. Accessibility Non-Negotiables

WCAG 2.2 AA is the hard floor. Maintain visible focus, readable contrast, non-color-only condition labels, large touch targets, keyboard paths, reduced-motion behavior, and inline recoverable errors. The overlay may use color, but every condition must also have text labels and distinct marker morphology.

## 11. Anti-Patterns to Avoid

- AI skincare app default: pastel/purple selfie hero, circular score, app-store badges, streak chips, and routine/product cards. Reject because DermaScope reports image-processing evidence.
- Clinical skin-analysis default: white clinic shell, mint/coral accents, contact sheets, and medical-chart calm. Reject because it overstates clinical authority and repeats category tropes.
- Conservation condition-map default: archival paper, graphite/blue registers, raking-light sweep, and artifact report language. Reject because it is the blocked previous direction.
- Student image-processing default: algorithm dropdowns, before/after lab canvas, export tools, and demo language. Reject because the product must be production-facing.
- SaaS admin default: left nav, KPI cards, neutral table rows, and status dots. Reject because the product revolves around one face image.
- Decorative grids, contour wallpaper, scanlines, glows, calibration marks, and abstract backgrounds without product function.

## 12. Research Dossier

### Reference Intake

| Source | Borrowed | Not Borrowed |
| --- | --- | --- |
| https://gloapp.nl/ | Face zones, metric grouping, and category-code evidence for score/routine defaults. | Beauty tone, streaks, product recommendations, pricing rhythm, and app-store landing posture. |
| https://www.nature.com/articles/s41598-024-63274-7 | Objective image-assessment framing, full-face/regional analysis distinction, and common measured aspects. | Clinical validation claims, diagnostic language, and controlled-device authority. |
| https://www.usgs.gov/faqs/what-a-topographic-map | Contour lines as a shape-reading mechanism for a surface. | USGS brand, literal terrain imagery, and map-as-wallpaper. |
| https://www.usgs.gov/media/files/topographic-map-symbols | Symbol-sheet discipline, line/area/point differentiation, and marginalia logic. | Government visual identity and literal map reproduction. |
| https://oceanservice.noaa.gov/facts/sounding.html | Numeric soundings as compact measurements attached to a surface. | Maritime route planning, vessel safety language, and nautical palette as brand. |
| https://www.nauticalcharts.noaa.gov/publications/us-chart-1.html | Chart legend discipline for symbols, abbreviations, and terms. | Nautical chart layout rhythm and electronic chart UI conventions. |

### Category Codes

Typography clusters:

1. `beauty-app default typography: rounded geometric sans for friendly headlines, soft medium-weight body copy, and oversized circular-score numerals.` I will not ship this because it turns evidence into lifestyle coaching.
2. `clinical-device default typography: restrained neo-grotesk labels, small grey metadata, and medical chart numerals in calm panels.` I will not ship this because it suggests diagnosis and repeats dermatology-device tropes.
3. `image-processing coursework typography: monospace-heavy controls, algorithm names as headings, and tiny parameter labels.` I will not ship this because it foregrounds implementation instead of user evidence.

Palette clusters:

1. `AI skincare pastel palette: lavender/pink glow, mint secondary, cream cards, and coral concern badges.` I will not ship this because it reads as routine/product recommendation.
2. `clinical skin-analysis palette: white shell, mint/coral status, pale blue overlay, and low-contrast grey copy.` I will not ship this because it borrows medical-device authority.
3. `conservation-map palette: archival paper, graphite ink, oxidized green, vermilion, ochre, lapis, and carmine.` I will not ship this because it is the previous blocked direction.

Layout clusters:

1. `beauty scan layout: selfie hero, circular score above routine cards, progress history, and product modules below.` I will not ship this because DermaScope has no history or routine engine.
2. `clinical contact-sheet layout: before/after face panels, side metric list, small legend, and device-like header.` I will not ship this because it overstates clinical authority.
3. `SaaS dashboard layout: top bar, three KPI cards, neutral table, and side navigation.` I will not ship this because a single face image is the primary evidence object.

Motion clusters:

1. `beauty coaching motion: soft fades, sparkle reveals, and score count-up celebration.` I will not ship this because it implies improvement coaching.
2. `clinical scanner motion: slow blue sweep, contact-sheet swap, and device-console loading bar.` I will not ship this because it is too close to medical-device theater.
3. `conservation raking-light motion: luminous sweep over artifact and register rows.` I will not ship this because it repeats the old redesign.

Imagery clusters:

1. `AI skincare imagery: polished selfie mockups, glowing skin overlays, and product shelf shots.` I will not ship this because it points toward ecommerce.
2. `dermatology-device imagery: clinical face capture rigs, examination-room context, and medical chart screenshots.` I will not ship this because it implies a validated device.
3. `student demo imagery: generic before/after canvas, sample image placeholders, and algorithm screenshots.` I will not ship this because it fails production posture.

### Morphological Exploration

| Dimension | A | B | C | D | E |
| --- | --- | --- | --- | --- | --- |
| Hierarchy | Mapped face surface first | Score-first report | Intake-first field form | Zone-sector atlas | Algorithm audit trail |
| Density | Brutal station rows | Spacious health brochure | Dense technical ledger | Minimal coaching cards | Split legend ribbons |
| Type role contrast | Black survey title + mono station readings | Friendly rounded headline + soft metrics | Mono-only technical console | Humanist report + small data | Narrow condensed labels + big score |
| Motion language | Contour trace and station snap | Soft wellness fade | Device scan shutter | Region stitch-in | Static report print |
| State vocabulary | Unmapped, acquiring, tracing, mapped, fallback, exception | Ready, glow, improve, routine | Pending, running, passed, failed | Captured, archived, released | Empty, loading, success, error |
| Composition rhythm | Survey sheet with marginal stations | Marketing hero then cards | Split before/after bench | Radial score orbit | Long report document |

Selected combination: Mapped face surface first + brutal station rows + black survey title with mono station readings + contour trace/station snap + unmapped/acquiring/tracing/mapped/fallback/exception vocabulary + survey sheet with marginal stations.

Uncomfortable combination: Algorithm audit trail + dense technical ledger + mono-only technical console + static report print + pending/running/passed/failed vocabulary + long report document. It feels wrong because the user should not have to read implementation internals to trust the result. It is arguable only for a regulated operator console where reproducibility and audit review matter more than a public upload flow.

### Anchor Candidates

1. Anchor: `USGS 7.5-minute topographic quadrangle marginalia`.
   Conceptual family: measured surface mapping.
   Job fit: Converts one face photo into a mapped surface with condition symbols, contour-like signal bands, and station rows.
   Rename test: incoherent for subscription billing, music discovery, and recipe planning. Verdict: STRONG PASS.
2. Anchor: `NOAA U.S. Chart No. 1 sounding and depth-contour chart`.
   Conceptual family: compact measurement and symbol legend.
   Job fit: Strong for attaching numeric readings to a surface and separating condition layers. It risks too much maritime flavor if rendered literally.
   Rename test: incoherent for fitness streaks and classroom quiz app, coherent for fleet routing. Verdict: PASS.
3. Anchor: `geologic field notebook strike-and-dip station log`.
   Conceptual family: field survey station record.
   Job fit: Good for numbered observations and zone rows, but less visually tied to one image overlay.
   Rename test: incoherent for ecommerce catalog, meditation app, and ticket booking. Verdict: STRONG PASS.
4. Anchor: `meteorological synoptic surface analysis chart`.
   Conceptual family: isobar and front analysis.
   Job fit: Good for layered signal fronts such as redness and texture, but weather-front metaphors can feel dramatic for skin.
   Rename test: incoherent for banking dashboard and recipe planner, coherent for logistics monitoring. Verdict: PASS.
5. Anchor: `seismic intensity shake map with station readings`.
   Conceptual family: intensity field and station reporting.
   Job fit: Good for severity bands and uncertainty, but the disaster association is too severe for a personal face analysis surface.
   Rename test: incoherent for skincare ecommerce and music library, coherent for emergency operations. Verdict: PASS with caution.

Selected anchor: `USGS 7.5-minute topographic quadrangle marginalia`.

## 13. Implementation Notes for Future UI Tasks

- Keep React + Vite + Tailwind CSS + DaisyUI.
- Do not add a new UI or motion library for this redesign; native CSS is enough for contour tracing, station snapping, and responsive recomposition.
- Keep Indonesian production copy concise and avoid homework, demo, MVP, treatment, diagnosis, and product-recommendation language.
- Keep contour/grid/line language functional. It may mark the face surface, rows, or meters, but must not become decorative page wallpaper.
- Update `docs/design-intent.json` whenever the visual anchor, motion signature, palette behavior, or responsive hierarchy changes.
