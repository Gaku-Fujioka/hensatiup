// Both queues keep one candidate per cell. A better score retains its original tie order.
// Count pairwise ordering decisions, including comparisons while repairing the heap.
export class LinearFrontier {
  nodes = new Map();
  comparisons = 0;

  get size() { return this.nodes.size; }
  cells() { return this.nodes.keys(); }

  offer(node) {
    const old = this.nodes.get(node.cell);
    if (old && old.score <= node.score) return false;
    this.nodes.set(node.cell, node);
    return true;
  }

  take() {
    let best;
    for (const node of this.nodes.values()) {
      if (best) this.comparisons++;
      if (!best || node.score < best.score) best = node;
    }
    if (best) this.nodes.delete(best.cell);
    return best;
  }
}

export class HeapFrontier {
  heap = [];
  positions = new Map();
  nextOrder = 0;
  comparisons = 0;

  get size() { return this.heap.length; }
  cells() { return this.positions.keys(); }

  precedes(a, b) {
    this.comparisons++;
    return a.score === b.score ? a.order < b.order : a.score < b.score;
  }

  place(index, node) {
    this.heap[index] = node;
    this.positions.set(node.cell, index);
  }

  offer(node) {
    let index = this.positions.get(node.cell) ?? this.size;
    const old = this.heap[index];
    if (old && old.score <= node.score) return false;
    const entry = { ...node, order: old?.order ?? this.nextOrder++ };
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (!this.precedes(entry, this.heap[parent])) break;
      this.place(index, this.heap[parent]);
      index = parent;
    }
    this.place(index, entry);
    return true;
  }

  take() {
    const first = this.heap[0];
    if (!first) return undefined;
    this.positions.delete(first.cell);
    const last = this.heap.pop();
    if (this.size === 0) return first;
    let index = 0;
    while (2 * index + 1 < this.size) {
      let child = 2 * index + 1;
      const right = child + 1;
      if (right < this.size && this.precedes(this.heap[right], this.heap[child])) child = right;
      if (!this.precedes(this.heap[child], last)) break;
      this.place(index, this.heap[child]);
      index = child;
    }
    this.place(index, last);
    return first;
  }
}
