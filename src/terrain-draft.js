import { recordKey } from "./expedition.js";

// S and G always occupy plain ground, so one character stores the entire state of a cell.
function layoutOf(map) {
  const cells = [...map.cells];
  cells[map.start] = "S";
  cells[map.goal] = "G";
  return cells.join("");
}

function validLayout(layout, length) {
  if (typeof layout !== "string" || layout.length !== length || /[^.:#~SG]/.test(layout)) return false;
  return ["S", "G"].every((marker) => layout.includes(marker) && layout.indexOf(marker) === layout.lastIndexOf(marker));
}

export class TerrainDraft {
  constructor(original, storage) {
    this.original = original;
    this.storage = storage;
    this.key = "routelab.editor.v1." + recordKey(original);
    this.base = layoutOf(original);
    this.history = [this.base];
    this.index = 0;
    this.opened = false;
    this.status = "ready";
  }

  open() {
    if (!this.opened) {
      this.opened = true;
      try {
        const raw = this.storage.getItem(this.key);
        if (raw !== null) {
          const saved = JSON.parse(raw);
          if (saved?.base === this.base && validLayout(saved.layout, this.base.length)) {
            this.history = [saved.layout];
            this.status = "restored";
          } else this.status = "invalid";
        }
      } catch (error) {
        this.status = error instanceof SyntaxError ? "invalid" : "session";
      }
    }
    return this.map();
  }

  get layout() { return this.history[this.index]; }
  get canUndo() { return this.index > 0; }
  get canRedo() { return this.index + 1 < this.history.length; }

  map() {
    const start = this.layout.indexOf("S");
    const goal = this.layout.indexOf("G");
    const cells = [...this.layout];
    cells[start] = cells[goal] = ".";
    return { ...this.original, start, goal, cells };
  }

  record(map) {
    const layout = layoutOf(map);
    if (layout === this.layout) return;
    this.history.splice(this.index + 1, Infinity, layout);
    this.index++;
    this.save();
  }

  reset() {
    this.record(this.original);
    return this.map();
  }

  undo() {
    if (this.canUndo) {
      this.index--;
      this.save();
    }
    return this.map();
  }

  redo() {
    if (this.canRedo) {
      this.index++;
      this.save();
    }
    return this.map();
  }

  save() {
    try {
      if (this.layout === this.base) this.storage.removeItem(this.key);
      else this.storage.setItem(this.key, JSON.stringify({ base: this.base, layout: this.layout }));
      this.status = this.layout === this.base ? "original" : "saved";
    } catch {
      this.status = "session";
    }
  }
}
