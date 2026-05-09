"use strict";

const assert = require("node:assert/strict");
const registry = require("../src/operations.js");

const expectedIds = [
  "gaussian-blur",
  "median-filter",
  "bilateral-filter",
  "grayscale",
  "histogram-equalization",
  "brightness-contrast",
  "gamma-correction",
  "sharpen",
  "canny-edge",
  "otsu-threshold",
  "adaptive-threshold",
  "resize-bilinear",
  "resize-bicubic",
  "resize-lanczos",
  "dilation",
  "erosion",
  "opening",
  "closing"
];

assert.deepEqual(
  registry.operations.map((operation) => operation.id),
  expectedIds,
  "MVP operation IDs must match the documented public contract order."
);

assert.ok(registry.goals.length >= 8, "Goal-based UI must expose practical user goals.");

for (const goal of registry.goals) {
  assert.ok(goal.label, `${goal.id} must have a label.`);
  assert.ok(goal.summary, `${goal.id} must explain the image purpose.`);
  assert.ok(registry.byId(goal.operationId), `${goal.id} must point to a real operation.`);
}

for (const operation of registry.operations) {
  assert.ok(operation.label, `${operation.id} must have a label.`);
  assert.ok(operation.description, `${operation.id} must have a description.`);
  assert.ok(registry.categories.some((category) => category.id === operation.category), `${operation.id} must use a known category.`);

  const defaults = registry.defaultsFor(operation);
  const result = registry.validateParameters(operation, defaults);

  for (const parameter of operation.parameters) {
    assert.ok(Object.prototype.hasOwnProperty.call(result.values, parameter.id), `${operation.id}.${parameter.id} must be validated.`);
    if (parameter.type === "number") {
      assert.equal(typeof result.values[parameter.id], "number", `${operation.id}.${parameter.id} must normalize to a number.`);
      if (parameter.odd) {
        assert.equal(result.values[parameter.id] % 2, 1, `${operation.id}.${parameter.id} must stay odd.`);
      }
    }
  }
}

const clamped = registry.validateParameters(registry.byId("gaussian-blur"), {
  kernelSize: 30,
  sigma: 99
});

assert.equal(clamped.values.kernelSize, 31, "Odd kernel values should move to the nearest valid odd number.");
assert.equal(clamped.values.sigma, 10, "Numeric parameters should clamp to max.");

console.log("Operation contract OK");
