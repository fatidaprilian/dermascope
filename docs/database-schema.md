# ImgLab Data Model

## Decision

ImgLab does not need a database for MVP.

All images, processed previews, and operation parameters should live in browser memory during the session. The user can export the processed image as a local file.

## Rationale

The first version is a local image processing toolkit, not an account-based service. A database would add privacy risk and implementation work without helping the core coursework goal.

## In-Memory Entities

### WorkspaceImage

```ts
type WorkspaceImage = {
  id: string;
  fileName: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  width: number;
  height: number;
  objectUrl?: string;
};
```

### OperationState

```ts
type OperationState = {
  activeOperationId: string | null;
  parameters: Record<string, number | string | boolean>;
  lastRequestId: string | null;
};
```

### PreviewState

```ts
type PreviewState = {
  originalImageId: string | null;
  processedRequestId: string | null;
  compareMode: "split" | "side-by-side";
  zoom: number;
};
```

## Optional Browser Storage

Future versions may store non-sensitive UI preferences in browser storage:

- last selected category
- compare mode
- preferred export format

Do not store image pixels, file names, or processing history without user approval.

## Future Persistent Data

Add a database only if the product grows into one of these modes:

- saved projects
- accounts
- server-side batch jobs
- shared galleries
- cloud model processing

If that happens, create a new ADR and update this document with tables, ownership rules, retention rules, and deletion behavior.

## Next Validation Action

Keep MVP implementation database-free unless the user explicitly approves saved projects or server-side processing.
