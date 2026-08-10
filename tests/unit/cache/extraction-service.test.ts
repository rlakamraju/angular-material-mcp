import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createExtractionService } from '../../../src/cache/extraction-service.js';
import * as tsParser from '../../../src/extractors/ts-parser.js';

const MATERIAL_FIXTURE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/mock-angular-material',
);
const CDK_FIXTURE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/mock-angular-cdk',
);

const MATERIAL_ROOT = { packageRoot: MATERIAL_FIXTURE_ROOT, version: '17.3.0' };
const CDK_ROOT = { packageRoot: CDK_FIXTURE_ROOT, version: '17.3.0' };
const RESOLVED = { material: MATERIAL_ROOT };
const RESOLVED_WITH_CDK = { material: MATERIAL_ROOT, cdk: CDK_ROOT };

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

describe('extraction-service with @angular/cdk as a second root', () => {
  it('getComponent("cdk/drag-drop") resolves the CDK-namespaced directive', () => {
    const service = createExtractionService(RESOLVED_WITH_CDK);
    const dragDrop = service.getComponent('cdk/drag-drop');

    expect(dragDrop?.className).toBe('CdkDropList');
    expect(dragDrop?.importPath).toBe('@angular/cdk/drag-drop');
  });

  it('getAllComponents() includes both material and cdk-namespaced names side by side', () => {
    const service = createExtractionService(RESOLVED_WITH_CDK);
    const names = service.getAllComponents().map((component) => component.name);

    expect(names).toEqual(
      expect.arrayContaining(['table', 'paginator', 'sort', 'cdk/drag-drop']),
    );
  });

  it('material-only tool calls still work when @angular/cdk is absent (no cdk root passed)', () => {
    const service = createExtractionService(RESOLVED);

    expect(service.getComponent('cdk/drag-drop')).toBeUndefined();
    expect(service.getAllComponents().map((c) => c.name)).not.toContain('cdk/drag-drop');
  });
});
