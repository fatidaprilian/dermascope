# DermaScope Data Model

## Current Scope Reset

DermaScope remains database-free. Uploaded face photos, overlay object URLs, and analysis metadata live only in browser memory for the current session. No image pixels, file names, or skin-analysis history should be stored without explicit user approval.

## Decision

DermaScope does not need a database for the current production scope.

Uploaded images, overlay object URLs, and analysis metadata should live in browser memory during the session.

## Rationale

The current product is a single-photo analysis flow, not an account-based service. A database would add privacy risk and retention obligations without helping the core inspection workflow.

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

### AnalysisState

```ts
type AnalysisState = {
  goalId: "skin-health-analysis";
  operationId: "facial-skin-analysis";
  lastRequestId: string | null;
};
```

### ResultState

```ts
type ResultState = {
  originalImageId: string | null;
  overlayObjectUrl: string | null;
  overallScore: number | null;
  categories: Array<{
    id: "acne" | "dark_spots" | "wrinkles" | "redness" | "pores";
    score: number;
    coverage: number;
    count?: number;
  }>;
  zones: Array<{
    id: "forehead" | "left_cheek" | "right_cheek" | "nose" | "chin";
    score: number;
    dominantConcern: string;
  }>;
};
```

## Optional Browser Storage

Future versions may store non-sensitive UI preferences in browser storage:

- preferred input mode
- reduced-motion preference mirror
- last dismissed non-sensitive UI notice

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

Keep the implementation database-free unless the user explicitly approves saved projects, accounts, or retained scan history.
