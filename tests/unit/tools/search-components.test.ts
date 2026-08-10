import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { createExtractionService } from '../../../src/cache/extraction-service.js';
import { searchComponents } from '../../../src/tools/search-components.tool.js';
import type { ComponentMetadata } from '../../../src/types/component-metadata.js';

const FIXTURE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/mock-angular-material',
);

const RESOLVED = { material: { packageRoot: FIXTURE_ROOT, version: '17.3.0' } };

function makeComponent(overrides: Partial<ComponentMetadata>): ComponentMetadata {
  return {
    name: 'stub',
    className: 'MatStub',
    importPath: '@angular/material/stub',
    selector: 'mat-stub',
    category: 'form',
    description: '',
    standaloneImports: [],
    ngModule: 'MatStubModule',
    inputs: [],
    outputs: [],
    publicMethods: [],
    cssCustomProperties: [],
    composedWith: [],
    gotchas: [],
    minimalExample: '',
    version: '17.3.0',
    ...overrides,
  };
}

describe('search-components tool', () => {
  it('echoes the query and ranks matching fixture components', () => {
    const service = createExtractionService(RESOLVED);

    const result = searchComponents(service, { query: 'sort a table by column' });

    expect(result.query).toBe('sort a table by column');
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.every((r) => r.relevanceScore > 0)).toBe(true);
  });

  it('returns an empty results list for a query matching nothing', () => {
    const service = createExtractionService(RESOLVED);

    const result = searchComponents(service, { query: 'quantum flux capacitor' });

    expect(result.results).toEqual([]);
  });

  it('ranks a dropdown-that-filters-as-you-type query toward autocomplete over select', () => {
    const service = {
      getAllComponents: () => [
        makeComponent({
          name: 'autocomplete',
          className: 'MatAutocomplete',
          description: 'A text input with a panel of suggested options that filters as you type.',
          composedWith: ['input'],
        }),
        makeComponent({
          name: 'select',
          className: 'MatSelect',
          description:
            'A form control styled as a native dropdown for choosing one option from a list.',
          composedWith: ['option'],
        }),
      ],
    };

    const result = searchComponents(service, { query: 'dropdown that filters as you type' });

    const autocompleteScore = result.results.find((r) => r.name === 'autocomplete')
      ?.relevanceScore;
    const selectScore = result.results.find((r) => r.name === 'select')?.relevanceScore;

    expect(autocompleteScore).toBeDefined();
    expect(selectScore).toBeDefined();
    expect(autocompleteScore ?? 0).toBeGreaterThan(selectScore ?? 0);
  });
});
