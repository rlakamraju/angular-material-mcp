import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createExtractionService } from '../../../src/cache/extraction-service.js';
import * as tsParser from '../../../src/extractors/ts-parser.js';

const FIXTURE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/mock-angular-material',
);

const RESOLVED = { packageRoot: FIXTURE_ROOT, version: '17.3.0' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('extraction-service', () => {
  it('getAllComponents() returns table, paginator, and sort', () => {
    const service = createExtractionService(RESOLVED);
    const names = service.getAllComponents().map((component) => component.name);

    expect(names).toEqual(expect.arrayContaining(['table', 'paginator', 'sort']));
  });

  it('getComponent("table") returns the extracted MatTable metadata', () => {
    const service = createExtractionService(RESOLVED);
    const table = service.getComponent('table');

    expect(table?.className).toBe('MatTable');
  });

  it('getComponent() returns undefined for an unknown name', () => {
    const service = createExtractionService(RESOLVED);

    expect(service.getComponent('nonexistent')).toBeUndefined();
  });

  it('runs the extractor once and serves a second getComponent("table") call from cache', () => {
    const parseSpy = vi.spyOn(tsParser, 'parsePackage');
    const service = createExtractionService(RESOLVED);

    service.getComponent('table');
    service.getComponent('table');

    expect(parseSpy).toHaveBeenCalledTimes(1);
  });

  it('runs the extractor once for getAllComponents() and serves a second call from cache', () => {
    const parseSpy = vi.spyOn(tsParser, 'parsePackage');
    const service = createExtractionService(RESOLVED);

    service.getAllComponents();
    service.getAllComponents();

    expect(parseSpy).toHaveBeenCalledTimes(1);
  });

  it('evicts the LRU component cache entry past maxEntries, forcing re-extraction', () => {
    const service = createExtractionService(RESOLVED, { maxEntries: 2 });

    service.getComponent('table');
    service.getComponent('paginator');
    service.getComponent('sort'); // evicts 'table', the least-recently-used entry

    const parseSpy = vi.spyOn(tsParser, 'parsePackage');

    service.getComponent('paginator'); // still cached
    service.getComponent('sort'); // still cached
    expect(parseSpy).not.toHaveBeenCalled();

    service.getComponent('table'); // evicted -> forces re-extraction
    expect(parseSpy).toHaveBeenCalledTimes(1);
  });
});
