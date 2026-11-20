import test from "node:test";
import assert from "node:assert/strict";
import { TerrainDraft } from "../src/terrain-draft.js";
import { maps } from "../src/maps.js";
import { makeDailyMap } from "../src/daily-map.js";

function memoryStorage() {
  const entries = new Map();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  };
}

test("undo and redo restore the terrain and both endpoints, including across a reset", () => {
  const draft = new TerrainDraft(maps[0], memoryStorage());
  const edited = draft.open();
  Object.assign(edited, { start: 0, goal: 1 });
  edited.cells[2] = "~";
  draft.record(edited);
  draft.record(edited);
  assert.deepEqual(draft.undo(), maps[0]);
  assert.equal(draft.canUndo, false);
  assert.deepEqual(draft.redo(), edited);
  assert.deepEqual(draft.reset(), maps[0]);
  assert.deepEqual(draft.undo(), edited);
  const fork = draft.map();
  fork.cells[2] = ":";
  draft.record(fork);
  assert.equal(draft.canRedo, false);
  assert.equal(maps[0].cells[2], ".");
});

test("a fresh editor opens only the latest saved layout for its own region and calendar day", () => {
  const storage = memoryStorage();
  for (const map of [maps[0], makeDailyMap("2026-11-20")]) {
    const first = new TerrainDraft(map, storage);
    const edited = first.open();
    edited.cells[0] = edited.cells[0] === "#" ? ":" : "#";
    first.record(edited);
    const fresh = new TerrainDraft(map, storage);
    assert.deepEqual(fresh.open(), edited);
    assert.equal(fresh.canUndo, false);
  }
  for (const map of [maps[1], makeDailyMap("2026-11-21")]) {
    assert.deepEqual(new TerrainDraft(map, storage).open(), map);
  }
  const fresh = new TerrainDraft(maps[0], storage);
  fresh.open();
  fresh.reset();
  assert.deepEqual(new TerrainDraft(maps[0], storage).open(), maps[0]);
});

test("a corrupt or outdated draft falls back to the official terrain", () => {
  const storage = memoryStorage();
  for (const invalid of ["broken", "null", "{}", "unknown", "markers", "terrain"]) {
    const draft = new TerrainDraft(maps[0], storage);
    const payload = {
      unknown: { base: "old", layout: draft.base },
      markers: { base: draft.base, layout: draft.base.replace("S", "G") },
      terrain: { base: draft.base, layout: draft.base.replace(".", "X") },
    }[invalid];
    storage.setItem(draft.key, payload ? JSON.stringify(payload) : invalid);
    assert.deepEqual(draft.open(), maps[0]);
    assert.equal(draft.status, "invalid");
  }
});

test("editing, undo and redo still work when storage cannot be read or written", () => {
  const draft = new TerrainDraft(maps[0], undefined);
  const edited = draft.open();
  edited.cells[0] = ":";
  draft.record(edited);
  assert.equal(draft.status, "session");
  assert.deepEqual(draft.undo(), maps[0]);
  assert.deepEqual(draft.redo(), edited);
});
