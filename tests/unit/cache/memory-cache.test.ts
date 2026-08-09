import { describe, expect, it } from 'vitest';

import { MemoryCache } from '../../../src/cache/memory-cache.js';

describe('MemoryCache', () => {
  it('stores and retrieves a value', () => {
    const cache = new MemoryCache<string, number>();

    cache.set('a', 1);

    expect(cache.get('a')).toBe(1);
    expect(cache.has('a')).toBe(true);
    expect(cache.size).toBe(1);
  });

  it('returns undefined for a missing key', () => {
    const cache = new MemoryCache<string, number>();

    expect(cache.get('missing')).toBeUndefined();
    expect(cache.has('missing')).toBe(false);
  });

  it('overwrites an existing key without growing size', () => {
    const cache = new MemoryCache<string, number>({ maxEntries: 10 });

    cache.set('a', 1);
    cache.set('a', 2);

    expect(cache.get('a')).toBe(2);
    expect(cache.size).toBe(1);
  });

  it('defaults maxEntries to 100', () => {
    const cache = new MemoryCache<string, number>();

    for (let i = 0; i < 100; i += 1) {
      cache.set(`key-${i}`, i);
    }
    expect(cache.size).toBe(100);

    cache.set('key-100', 100);

    expect(cache.size).toBe(100);
    expect(cache.has('key-0')).toBe(false);
    expect(cache.has('key-100')).toBe(true);
  });

  it('evicts the least-recently-used entry once maxEntries is exceeded', () => {
    const cache = new MemoryCache<string, number>({ maxEntries: 2 });

    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    expect(cache.has('a')).toBe(false);
    expect(cache.has('b')).toBe(true);
    expect(cache.has('c')).toBe(true);
    expect(cache.size).toBe(2);
  });

  it('treats a get() as a recency refresh, protecting it from eviction', () => {
    const cache = new MemoryCache<string, number>({ maxEntries: 2 });

    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // 'a' is now more recently used than 'b'
    cache.set('c', 3); // should evict 'b', not 'a'

    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
    expect(cache.has('c')).toBe(true);
  });

  it('clear() empties the cache', () => {
    const cache = new MemoryCache<string, number>();

    cache.set('a', 1);
    cache.clear();

    expect(cache.size).toBe(0);
    expect(cache.has('a')).toBe(false);
  });
});
