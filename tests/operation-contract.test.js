"use strict";

const assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");

(async function run() {
  const moduleUrl = pathToFileURL(`${process.cwd()}/frontend/src/utils/operations.js`);
  const { DermaScopeOperations: registry } = await import(moduleUrl.href);

  assert.deepEqual(
    registry.operations.map((operation) => operation.id),
    ["facial-skin-analysis"],
    "DermaScope must expose one active skin analysis operation."
  );

  assert.equal(registry.goals.length, 1, "DermaScope UI must expose one primary analysis goal.");
  assert.equal(registry.goals[0].id, "skin-health-analysis");
  assert.equal(registry.goals[0].operationId, "facial-skin-analysis");

  for (const goal of registry.goals) {
    assert.ok(goal.label, `${goal.id} must have a label.`);
    assert.ok(goal.summary, `${goal.id} must explain the image purpose.`);
    assert.ok(registry.byId(goal.operationId), `${goal.id} must point to a real operation.`);
  }

  for (const operation of registry.operations) {
    assert.equal(operation.outputMode, "overlay", `${operation.id} must return an overlay.`);
    assert.equal(operation.parameters.length, 0, `${operation.id} must not expose legacy tuning controls.`);
    assert.ok(operation.label, `${operation.id} must have a label.`);
    assert.ok(operation.description, `${operation.id} must have a description.`);
    assert.ok(
      registry.categories.some((category) => category.id === operation.category),
      `${operation.id} must use a known category.`
    );
    assert.deepEqual(registry.defaultsFor(operation), {}, `${operation.id} defaults must be empty.`);
  }

  console.log("DermaScope operation contract OK");
})();
