# DermaScope Public Contract

## Scope

DermaScope exposes one focused HTTP-backed analysis contract for one face photo. The frontend validates a local upload or one browser camera capture, submits it as a multipart image file, and receives a PNG overlay plus structured analysis metadata.

The app must frame the result as image-processing evidence, not diagnosis, treatment advice, routine advice, or product recommendation.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Return backend liveness and engine metadata. |
| `GET` | `/api/goals` | Return the single public analysis goal. |
| `POST` | `/api/preprocess` | Return a preprocessed face crop preview PNG. |
| `POST` | `/api/process` | Analyze one face photo and return an overlay PNG plus metadata headers. |

## Health Contract

`GET /api/health` returns:

```ts
type HealthResponse = {
  status: "ok";
  engine: "opencv-python";
};
```

The current endpoint is a liveness/readiness-lite signal for this database-free service. If future critical dependencies are added, readiness must check them before returning `ok`.

## Goal Contract

`GET /api/goals` returns:

```ts
type GoalsResponse = {
  goals: Array<{
    id: "skin-health-analysis";
    label: string;
    summary: string;
    operationId: "facial-skin-analysis";
    intent: string;
  }>;
};
```

Only one user-facing goal is active:

```ts
type SkinAnalysisGoal = {
  id: "skin-health-analysis";
  label: "Analisis kondisi kulit";
  operationId: "facial-skin-analysis";
};
```

## Preprocess Request

`POST /api/preprocess` accepts `multipart/form-data`.

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `file` | file | yes | PNG, JPEG, or WebP image up to 10 MB. |

The endpoint returns an `image/png` body containing a cropped and lighting-normalized face preview. If no face is detected, the backend uses a centered fallback region and returns a warning in `X-DermaScope-Warnings`.

Response headers match the `X-DermaScope-*` pattern used by `/api/process`. `X-DermaScope-Analysis` includes:

```ts
type PreprocessResult = {
  faceDetected: boolean;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};
```

## Process Request

`POST /api/process` accepts `multipart/form-data`.

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `file` | file | yes | PNG, JPEG, or WebP image up to 10 MB. |
| `goal_id` | string | yes | Must be `skin-health-analysis`. |
| `parameters` | JSON object string | no | Defaults to `{}`. Unknown values are ignored because the current operation has no user-tunable parameters. |

Server limits:

- Accepted media types: `image/png`, `image/jpeg`, `image/webp`.
- Maximum upload size: 10 MB.
- Maximum processing dimension: 4096 pixels on the longest side. Larger decoded images are downscaled in memory before analysis.
- Images are processed in memory and are not persisted.

Duplicate-submit behavior:

- The endpoint is stateless and does not persist idempotency records.
- Duplicate submissions may run duplicate analysis but do not create stored server resources.
- The frontend must ignore stale responses from superseded requests.

## Process Response

`POST /api/process` returns an `image/png` body.

Response headers:

| Header | Meaning |
| --- | --- |
| `X-DermaScope-Operation` | Internal operation ID, currently `facial-skin-analysis`. |
| `X-DermaScope-Output-Mode` | Output mode, currently `overlay`. |
| `X-DermaScope-Width` | Overlay width in pixels. |
| `X-DermaScope-Height` | Overlay height in pixels. |
| `X-DermaScope-Warnings` | JSON array of safe warning strings. |
| `X-DermaScope-Analysis` | JSON analysis metadata. |
| `X-DermaScope-Processing-Time` | Processing time in milliseconds. |
| `Content-Disposition` | Attachment filename for the generated PNG. |

Legacy `X-ImgLab-*` headers are not part of the active public contract.

## Analysis Metadata

`X-DermaScope-Analysis` contains:

```ts
type SkinAnalysisResult = {
  overallScore: number;
  faceDetected: boolean;
  warning?: string | null;
  categories: Array<{
    id: "acne" | "dark_spots" | "wrinkles" | "redness" | "pores";
    label: string;
    score: number;
    severity: "low" | "moderate" | "high";
    count: number;
    coverage: number;
  }>;
  zones: Array<{
    id: "forehead" | "left_cheek" | "right_cheek" | "nose" | "chin";
    label: string;
    score: number;
    dominantConcern: string;
    skinPixels: number;
  }>;
  textureFeatures: Array<{
    id: "forehead" | "left_cheek" | "right_cheek" | "nose" | "chin";
    label: string;
    contrast: number;
    energy: number;
    homogeneity: number;
    correlation: number;
  }>;
  legend: Array<{
    id: "acne" | "dark_spots" | "wrinkles" | "redness" | "pores";
    label: string;
    color: string;
  }>;
};
```

## Error Contract

Errors return a safe JSON shape:

```ts
type ApiErrorResponse = {
  code: string;
  message: string;
};
```

Known error codes:

| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `UNSUPPORTED_FILE_TYPE` | `415` | File media type is not PNG, JPEG, or WebP. |
| `EMPTY_FILE` | `400` | Uploaded file has no bytes. |
| `FILE_TOO_LARGE` | `413` | Uploaded file exceeds 10 MB. |
| `IMAGE_DECODE_FAILED` | `400` | OpenCV could not decode the image. |
| `UNKNOWN_GOAL` | `400` | `goal_id` is not `skin-health-analysis`. |
| `INVALID_PARAMETERS` | `400` | `parameters` is not a JSON object string. |
| `EXPORT_FAILED` | `500` | The overlay PNG could not be encoded. |
| `INTERNAL_ERROR` | `500` | Unexpected processing failure. |
| `FRONTEND_NOT_BUILT` | `500` | The built React frontend is missing in production serving mode. |

Errors must not include stack traces, file paths, raw upload data, or internal exception messages.

## Frontend Operation Registry

The frontend exposes one operation through `frontend/src/utils/operations.js`:

```ts
type DermaScopeOperation = {
  id: "facial-skin-analysis";
  category: "skin-analysis";
  label: string;
  description: string;
  outputMode: "overlay";
  parameters: [];
};
```

The registry is a UI contract for the current app, not a general image-processing toolkit registry.

## Validation

Contract validation must cover:

1. The frontend registry exposes only `facial-skin-analysis`.
2. `skin-health-analysis` maps to `facial-skin-analysis`.
3. Backend preprocessing returns a cropped PNG for a valid image.
4. Backend processing returns a PNG plus analysis metadata, including texture features, for a valid image.
5. Backend rejects unknown goals, wrong file types, empty uploads, and oversized uploads.
6. Frontend handles offline backend, malformed metadata, and stale responses without replacing newer state.
