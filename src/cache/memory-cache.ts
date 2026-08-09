/** Default cap on the number of entries an unconfigured `MemoryCache` will hold. */
const DEFAULT_MAX_ENTRIES = 100;

export interface MemoryCacheOptions {
  /** Maximum number of entries to retain before evicting the least-recently-used one. */
  maxEntries?: number;
}

/**
 * A small LRU cache backed by a `Map`, which preserves insertion order — recency is tracked by
 * deleting and re-inserting a key on every read/write, so the least-recently-used entry is
 * always the first one `Map#keys()` yields.
 */
export class MemoryCache<K, V> {
  private readonly maxEntries: number;
  private readonly store = new Map<K, V>();

  constructor(options: MemoryCacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  }

  get size(): number {
    return this.store.size;
  }

  has(key: K): boolean {
    return this.store.has(key);
  }

  get(key: K): V | undefined {
    const value = this.store.get(key);
    if (value === undefined) {
      return undefined;
    }
    // Refresh recency: delete + re-insert moves this key to the most-recently-used end.
    this.store.delete(key);
    this.store.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      const lruKey = this.store.keys().next().value;
      if (lruKey !== undefined) {
        this.store.delete(lruKey);
      }
    }
    this.store.set(key, value);
  }

  clear(): void {
    this.store.clear();
  }
}
