import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { createExtractionService } from '../../../src/cache/extraction-service.js';
import { getComponentApi } from '../../../src/tools/get-component-api.tool.js';

const FIXTURE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/mock-angular-material',
);

const RESOLVED = { material: { packageRoot: FIXTURE_ROOT, version: '17.3.0' } };

describe('get-component-api tool', () => {
  it('returns the full extracted metadata for a known component', () => {
    const service = createExtractionService(RESOLVED);

    const result = getComponentApi(service, { componentName: 'table' });

    expect('isError' in result).toBe(false);
    expect(result).toMatchObject({
      name: 'table',
      className: 'MatTable',
    });
    expect((result as { inputs: unknown[] }).inputs.length).toBeGreaterThan(0);
  });

  it('overlays curated gotchas/minimalExample from src/data/components onto the extracted metadata', () => {
    const service = createExtractionService(RESOLVED);

    const result = getComponentApi(service, { componentName: 'table' });

    if ('isError' in result) {
      throw new Error('expected a ComponentMetadata');
    }
    expect(result.gotchas.length).toBeGreaterThan(0);
    expect(result.minimalExample.length).toBeGreaterThan(0);
    expect(result.composedWith).toEqual(expect.arrayContaining(['sort', 'paginator']));
    expect(result.standaloneImports).toEqual(['MatTableModule']);
  });

  it('returns extracted metadata unchanged when no curated overlay file exists for the component', () => {
    const service = {
      getComponent: () => ({
        name: 'no-overlay-for-this-name',
        className: 'MatNoOverlay',
        importPath: '@angular/material/no-overlay-for-this-name',
        selector: 'mat-no-overlay',
        category: 'uncategorized',
        description: '',
        standaloneImports: [],
        ngModule: '',
        inputs: [],
        outputs: [],
        publicMethods: [],
        cssCustomProperties: [],
        composedWith: [],
        gotchas: [],
        minimalExample: '',
        version: '17.3.0',
      }),
    };

    const result = getComponentApi(service, { componentName: 'no-overlay-for-this-name' });

    if ('isError' in result) {
      throw new Error('expected a ComponentMetadata');
    }
    expect(result.gotchas).toEqual([]);
    expect(result.minimalExample).toBe('');
  });

  it.each([
    'stepper',
    'expansion',
    'card',
    'list',
    'grid-list',
    'tree',
    'bottom-sheet',
    'badge',
    'slider',
  ])('overlays non-placeholder Phase 12 curated content for extended component "%s"', (name) => {
    const service = {
      getComponent: () => ({
        name,
        className: 'Placeholder',
        importPath: `@angular/material/${name}`,
        selector: 'placeholder',
        category: 'uncategorized',
        description: '',
        standaloneImports: [],
        ngModule: '',
        inputs: [],
        outputs: [],
        publicMethods: [],
        cssCustomProperties: [],
        composedWith: [],
        gotchas: [],
        minimalExample: '',
        version: '17.3.0',
      }),
    };

    const result = getComponentApi(service, { componentName: name });

    if ('isError' in result) {
      throw new Error(`expected a ComponentMetadata overlay for "${name}"`);
    }
    expect(result.gotchas.length).toBeGreaterThan(0);
    expect(result.minimalExample.length).toBeGreaterThan(0);
    expect(result.ngModule.length).toBeGreaterThan(0);
  });

  it('returns a ToolErrorResponse for an unknown component name', () => {
    const service = createExtractionService(RESOLVED);

    const result = getComponentApi(service, { componentName: 'nonexistent' });

    if (!('isError' in result)) {
      throw new Error('expected a ToolErrorResponse');
    }
    expect(result.isError).toBe(true);
    expect(result.message).toContain('nonexistent');
  });
});
