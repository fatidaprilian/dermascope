# DermaScope Flow Overview

## Current Scope

The active flow is facial skin signal mapping, not a general image-processing workbench. The primary journey is: upload or capture one face photo, run analysis, view an overlay, read condition scores, and review zone-by-zone breakdowns.

## Facial Skin Analysis Flow

1. User chooses upload mode or camera mode.
2. User uploads one PNG, JPEG, or WebP face photo, or captures one browser camera frame.
3. Frontend validates file type and size.
4. Frontend sends the image to `POST /api/preprocess`.
5. Backend detects the face, crops a padded face region, normalizes lighting, and returns a preprocessed face preview.
6. Frontend replaces the original preview with the preprocessed face crop and enables analysis when the backend is ready.
7. User starts skin analysis.
8. Frontend sends `file`, `goal_id=skin-health-analysis`, and `parameters={}` to `POST /api/process`.
9. Backend validates multipart input, JSON parameter shape, content type, file size, and goal ID.
10. Backend decodes the image with OpenCV-Python.
11. Backend detects and crops the face region, normalizes lighting, estimates a skin mask, splits the face into forehead, cheeks, nose, and chin, and measures acne, dark spots, wrinkles, redness, and pores.
12. Backend returns a cropped face overlay PNG plus `X-DermaScope-Analysis` and processing metadata headers.
13. Frontend ignores stale responses, parses metadata safely, and displays the overlay, Skin Health Score, condition rows, and zone sectors.

## Frontend State Flow

| State | Trigger | UI Behavior |
| --- | --- | --- |
| Empty | No image selected. | Show source station, camera/upload controls, file limits, privacy note, and condition legend. |
| Checking service | Initial page load. | Query `/api/health` and show service status. |
| Service offline | Health request fails. | Disable analysis and keep upload/camera available. |
| Image ready | Valid file or camera capture accepted. | Show face map surface, file metadata, reset, and analysis action. |
| Preprocessed | `/api/preprocess` returns a PNG. | Replace original preview with cropped, lighting-normalized face preview. |
| Processing | User starts analysis. | Disable analysis, keep current image visible, announce tracing state. |
| Mapped | PNG and metadata return. | Show overlay, score, categories, zones, warnings, and processing time. |
| Error | Validation, camera, network, process, or metadata parsing fails. | Show inline recoverable error and keep current usable state. |

## Backend Flow

1. `GET /api/health` returns liveness/readiness-lite status for the database-free service.
2. `GET /api/goals` returns the single `skin-health-analysis` goal.
3. `POST /api/preprocess` returns a cropped preprocessed face preview.
4. `POST /api/process` validates and processes one image in memory.
5. API errors return safe `{ code, message }` JSON.
6. The backend does not persist uploads, derived overlays, or analysis metadata.

## Error and Recovery Flow

| Error | User Message | Recovery |
| --- | --- | --- |
| Unsupported file type | Format tidak didukung. Gunakan PNG, JPEG, atau WebP. | Reject the file and let the user choose another. |
| File too large | File terlalu besar. Batas maksimal 10 MB. | Reject the file and keep prior state. |
| Camera unsupported | Kamera tidak didukung oleh browser ini. | Use upload mode. |
| Camera permission denied | Kamera tidak bisa dibuka. Cek izin kamera atau gunakan upload file. | Retry permission or use upload mode. |
| Backend offline | Layanan offline. | Disable analysis and keep source controls available. |
| Preprocessing failed | Pra-pemrosesan wajah gagal. Foto asli tetap digunakan. | Keep original photo preview and allow analysis retry. |
| Processing failed | Layanan analisis tidak dapat memproses gambar ini. | Keep current image and allow retry/reset. |
| Malformed metadata | Metadata analisis rusak. Coba proses ulang foto. | Keep current image and allow retry. |
| Face fallback | Backend returns a warning. | Show warning while still displaying mapped result. |

## Security and Privacy Flow

- Upload only the selected or captured image required for analysis.
- Validate all uploaded files at frontend and backend boundaries.
- Keep image processing in memory.
- Do not store user accounts, image history, overlays, or analysis records.
- Revoke browser object URLs when images are replaced or reset.
- Return safe errors without stack traces or internal exception messages.

## Testing Flow

1. Test the frontend operation registry exposes only `skin-health-analysis`.
2. Test backend preprocessing returns cropped PNG output for a valid sample image.
3. Test backend processing returns cropped PNG overlay and metadata for a valid sample image.
4. Test backend rejects unknown goals, wrong file types, empty files, oversized files, and invalid parameter JSON.
5. Test frontend build and lint.
6. Manually test upload, camera capture, service-offline state, preprocessing preview, successful analysis, fallback warning, reset, and mobile recomposition with real face photos.

## Next Validation Action

Run automated checks, then manually test the redesigned frontend with real face photos across upload, camera capture, offline backend, successful analysis, fallback warning, and mobile viewport states.
