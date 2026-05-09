# ImgLab Public Contract

## Scope

ImgLab does not expose an HTTP API in the MVP. This document defines the public web application contracts that future implementation must honor: user goals, operation IDs, parameter shapes, result shapes, errors, and UI command behavior.

The UI should expose image goals first. Operation IDs remain the internal toolkit contract.

The backend is present as an optional FastAPI service. Browser processing remains available as the default local mode.

## File Input Contract

Accepted image types:

- `image/png`
- `image/jpeg`
- `image/webp`

Recommended MVP limits:

- Maximum upload size: 10 MB.
- Maximum full-resolution processing dimension: 4096 pixels on the longest side.
- Larger images may be downscaled for preview before processing.

## Operation Definition Contract

Each image operation must be registered with this shape:

```ts
type OperationDefinition = {
  id: string;
  category: "restoration" | "enhancement" | "edge-segmentation" | "upscaling" | "morphology";
  label: string;
  description: string;
  parameters: ParameterDefinition[];
  defaultParameters: Record<string, number | string | boolean>;
  outputMode: "color" | "grayscale" | "binary" | "edge-map";
};
```

Parameter definitions must use bounded values:

```ts
type ParameterDefinition = {
  id: string;
  label: string;
  type: "number" | "select" | "boolean";
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  defaultValue: number | string | boolean;
};
```

## Goal Definition Contract

Each user-facing goal must map to one real implemented operation:

```ts
type GoalDefinition = {
  id: string;
  label: string;
  summary: string;
  operationId: string;
  intent: string;
};
```

Rules:

- A goal must point to a registered operation.
- A goal label must describe what the user wants to do to the image.
- Raw algorithm names may appear as implementation detail, but they should not be the main choice.

## Processing Request Contract

```ts
type ProcessingRequest = {
  requestId: string;
  sourceImageId: string;
  operationId: string;
  parameters: Record<string, number | string | boolean>;
  previewMode: "full" | "downscaled";
};
```

Rules:

- `requestId` must be unique for the current browser session.
- `operationId` must match a registered operation.
- Parameters must be validated before image processing starts.
- The app must ignore stale results when a newer request has already started.

## Processing Result Contract

```ts
type ProcessingResult = {
  requestId: string;
  operationId: string;
  width: number;
  height: number;
  outputMode: "color" | "grayscale" | "binary" | "edge-map";
  processingTimeMs: number;
  warnings: ProcessingWarning[];
};
```

The processed pixels may be held as a canvas, bitmap, or transferable image data. The implementation must not expose raw OpenCV.js `cv.Mat` objects outside the processing layer.

## Warning Contract

```ts
type ProcessingWarning = {
  code: "PREVIEW_DOWNSCALED" | "PARAMETER_CLAMPED" | "OUTPUT_GRAYSCALE" | "HIGH_MEMORY_RISK";
  message: string;
};
```

Warnings must be safe for users to read. They must not include internal stack traces.

## Error Contract

```ts
type ProcessingError = {
  code:
    | "UNSUPPORTED_FILE_TYPE"
    | "FILE_TOO_LARGE"
    | "IMAGE_DECODE_FAILED"
    | "ENGINE_NOT_READY"
    | "UNKNOWN_OPERATION"
    | "INVALID_PARAMETER"
    | "PROCESSING_FAILED"
    | "EXPORT_FAILED";
  message: string;
  recoveryAction?: string;
};
```

## MVP Operation IDs

| ID | Category | Required Parameters |
| --- | --- | --- |
| `gaussian-blur` | restoration | `kernelSize`, `sigma` |
| `median-filter` | restoration | `kernelSize` |
| `bilateral-filter` | restoration | `diameter`, `sigmaColor`, `sigmaSpace` |
| `grayscale` | enhancement | none |
| `histogram-equalization` | enhancement | none |
| `brightness-contrast` | enhancement | `brightness`, `contrast` |
| `gamma-correction` | enhancement | `gamma` |
| `sharpen` | enhancement | `amount`, `radius` |
| `canny-edge` | edge-segmentation | `threshold1`, `threshold2`, `apertureSize` |
| `otsu-threshold` | edge-segmentation | `invert` |
| `adaptive-threshold` | edge-segmentation | `blockSize`, `constant`, `method` |
| `resize-bilinear` | upscaling | `scale` |
| `resize-bicubic` | upscaling | `scale` |
| `resize-lanczos` | upscaling | `scale` |
| `dilation` | morphology | `kernelSize`, `iterations` |
| `erosion` | morphology | `kernelSize`, `iterations` |
| `opening` | morphology | `kernelSize`, `iterations` |
| `closing` | morphology | `kernelSize`, `iterations` |

## Export Contract

Supported export types for MVP:

- PNG for lossless processed output.
- JPEG for smaller files if the original workflow needs it.

Export file names should use this pattern:

```text
imglab-{operationId}-{yyyyMMdd-HHmmss}.{extension}
```

## HTTP API Contract

In Docker production, the public frontend serves the API through same-origin `/api/` via Nginx. In local development, the backend is available at `http://localhost:8000`.

### `GET /api/health`

Returns backend readiness.

```json
{
  "status": "ok",
  "engine": "opencv-python"
}
```

### `GET /api/goals`

Returns user-facing goals that map to implemented operations.

```json
{
  "goals": [
    {
      "id": "clean-noise",
      "label": "Kurangi noise",
      "summary": "Untuk foto yang kasar atau berbintik.",
      "operationId": "bilateral-filter",
      "intent": "Restorasi"
    }
  ]
}
```

### `POST /api/process`

Request type: `multipart/form-data`

Fields:

- `file`: required image file. Accepted types: PNG, JPEG, WebP.
- `goal_id`: required goal ID.
- `parameters`: optional JSON object string. Defaults to `{}`.

Success response:

- Status: `200`
- Body: processed PNG bytes
- Headers:
  - `X-ImgLab-Operation`
  - `X-ImgLab-Output-Mode`
  - `X-ImgLab-Width`
  - `X-ImgLab-Height`
  - `X-ImgLab-Warnings`

Error response:

```json
{
  "code": "UNSUPPORTED_FILE_TYPE",
  "message": "Choose a PNG, JPEG, or WebP image."
}
```

## Next Validation Action

Keep `src/operations.js` synchronized with this contract. If a TypeScript or framework migration happens later, convert the same operation registry into typed runtime validation schemas.
