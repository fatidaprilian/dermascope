# ImgLab Flow Overview

## Primary User Flow

1. User opens ImgLab.
2. User uploads a local image.
3. App validates file type, file size, and decode success.
4. App shows the original image in the workspace.
5. User chooses the image goal, such as reduce noise, sharpen detail, improve contrast, enlarge, or detect edges.
6. App maps that goal to a real implemented method.
7. App shows small tuning controls with safe defaults.
8. User changes parameters only when needed.
9. App runs the processing request.
10. App shows the processed image beside or over the original.
11. User compares the result with a slider or split view.
12. User chooses PNG, JPEG, or WebP.
13. User downloads the processed image.

## Processing Flow

1. Decode the uploaded file into an image bitmap or canvas.
2. Convert the canvas pixels to an OpenCV.js `cv.Mat`.
3. Normalize image channels for the selected method.
4. Apply the selected operation with validated parameters.
5. Convert the result back to a display canvas.
6. Release OpenCV.js memory objects after each operation.
7. Store only the latest result in browser memory unless the user later approves history.

The current implementation keeps the processing path in `src/image-processing.js` and the operation registry in `src/operations.js`.
The UI uses goal definitions from `src/operations.js` so users choose the desired result rather than a raw method list.

## Backend Flow (Default)

1. App converts the original canvas to PNG bytes.
2. App sends `file`, `goal_id`, and `parameters` to `POST /api/process`.
3. Backend validates content type, file size, goal ID, and JSON parameters.
4. Backend decodes the image with OpenCV-Python.
5. Backend applies the mapped operation.
6. Backend returns PNG bytes and processing metadata headers.
7. App draws the returned PNG into the processed canvas.

## Docker Flow

Development:

1. Compose starts the frontend Vite dev server on port `5173`.
2. Compose starts the FastAPI backend on port `8000`.
3. The frontend uses `/api` via Vite proxy to reach the backend service during development.

Production:

1. Compose starts Nginx on host port `8080`.
2. Compose starts the backend inside the Compose network only.
3. Nginx serves static frontend assets and proxies `/api/` to the backend service.
4. The frontend backend URL field may stay empty; production uses same-origin API calls.

## Operation Categories

### Restoration

- Gaussian blur: smooths mild noise.
- Median filter: removes isolated bright or dark specks.
- Bilateral filter: smooths while keeping more edge detail.

### Enhancement

- Grayscale conversion: creates a luminance-focused image.
- Histogram equalization: improves global contrast.
- Brightness and contrast adjustment: gives direct tonal control.
- Gamma correction: adjusts midtone response.
- Sharpening: increases local contrast around details.

### Edge and Segmentation

- Canny edge detection: shows strong image boundaries.
- Otsu thresholding: creates a binary image from an automatic threshold.
- Adaptive thresholding: handles uneven lighting better than one global threshold.

### Upscaling

- Bilinear resize: fast baseline interpolation.
- Bicubic resize: smoother interpolation.
- Lanczos resize: sharper interpolation with more compute cost.

### Morphology

- Dilation: expands bright foreground regions.
- Erosion: shrinks bright foreground regions.
- Opening: erosion followed by dilation, useful for small noise.
- Closing: dilation followed by erosion, useful for small gaps.

## Export Flow

1. App keeps the latest processed result as an object URL.
2. User chooses an output format from PNG, JPEG, or WebP.
3. App draws the processed result onto an export canvas.
4. App requests a blob with the selected MIME type and quality where relevant.
5. App downloads the file using `imglab-{goalId}-{yyyyMMdd-HHmmss}.{extension}`.
6. If the browser cannot create the selected format, the app shows an export error and keeps the processed result visible.

## UI States

- Empty: no image uploaded.
- Loading engine: OpenCV.js is not ready yet.
- Image loading: image file is being decoded.
- Ready: image and engine are ready.
- Processing: operation is running.
- Success: processed image is visible.
- Error: validation or processing failed.
- Exporting: canvas output is being prepared for the selected format.

## Error and Recovery Flow

| Error | User Message | Recovery |
| --- | --- | --- |
| Unsupported file type | Choose a PNG, JPEG, or WebP image. | Reject the file and keep the workspace empty. |
| Image too large | This image is too large for the browser preview limit. | Offer a preview downscale or ask for a smaller file. |
| Decode failed | The image could not be read. | Let the user choose another file. |
| Engine not ready | Image tools are still loading. | Disable processing controls until OpenCV.js is ready. |
| Processing failed | This method could not process the current image. | Keep the original image and reset the failed result. |
| Export failed | The selected output could not be prepared. | Keep the processed image visible and let the user choose another format. |

## Security and Privacy Flow

- Do not upload images in MVP.
- Do not store image files in a database.
- Do not log file names if logs are later added.
- Revoke object URLs after use.
- Validate every parameter before processing.

## Testing Flow

1. Unit test parameter validation for each operation.
2. Unit test operation registry metadata.
3. Integration test one upload-to-preview path.
4. Integration test one operation from each category.
5. Accessibility test keyboard access, focus states, status messages, and control labels.

## Next Validation Action

Test the implemented upload, original preview, operation processing, comparison slider, reset, and PNG/JPEG/WebP export flow with real sample images.
