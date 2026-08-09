import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { extractComponents } from '../../../src/extractors/component-extractor.js';
import { parsePackage } from '../../../src/extractors/ts-parser.js';
import type { ComponentMetadata } from '../../../src/types/component-metadata.js';

const FIXTURE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/mock-angular-material',
);

function extractFixtureComponents(): ComponentMetadata[] {
  const parsed = parsePackage(FIXTURE_ROOT);
  return extractComponents(parsed, { packageName: '@angular/material', version: '17.3.0' });
}

function findByName(components: ComponentMetadata[], name: string): ComponentMetadata {
  const found = components.find((component) => component.name === name);
  if (!found) {
    throw new Error(`expected to find extracted component "${name}"`);
  }
  return found;
}

describe('component-extractor', () => {
  it('extracts MatTable with selector "mat-table, table[mat-table]"', () => {
    const table = findByName(extractFixtureComponents(), 'table');

    expect(table.className).toBe('MatTable');
    expect(table.selector).toBe('mat-table, table[mat-table]');
  });

  it('MatTable.inputs contains dataSource, trackBy, multiTemplateDataRows, fixedLayout', () => {
    const table = findByName(extractFixtureComponents(), 'table');
    const inputNames = table.inputs.map((input) => input.name);

    expect(inputNames).toEqual(
      expect.arrayContaining(['dataSource', 'trackBy', 'multiTemplateDataRows', 'fixedLayout']),
    );
  });

  it(
    'MatTable.publicMethods contains renderRows, updateStickyHeaderRowStyles, ' +
      'updateStickyFooterRowStyles, updateStickyColumnStyles',
    () => {
      const table = findByName(extractFixtureComponents(), 'table');
      const methodNames = table.publicMethods.map((method) => method.name);

      expect(methodNames).toEqual(
        expect.arrayContaining([
          'renderRows',
          'updateStickyHeaderRowStyles',
          'updateStickyFooterRowStyles',
          'updateStickyColumnStyles',
        ]),
      );
    },
  );

  it('MatTable.outputs is empty (MatTable has no @Output members)', () => {
    const table = findByName(extractFixtureComponents(), 'table');

    expect(table.outputs).toEqual([]);
  });

  it('extracts MatPaginator with selector "mat-paginator"', () => {
    const paginator = findByName(extractFixtureComponents(), 'paginator');

    expect(paginator.className).toBe('MatPaginator');
    expect(paginator.selector).toBe('mat-paginator');
  });

  it(
    'MatPaginator.inputs contains pageIndex, length, pageSize, pageSizeOptions, hidePageSize, ' +
      'showFirstLastButtons, disabled',
    () => {
      const paginator = findByName(extractFixtureComponents(), 'paginator');
      const inputNames = paginator.inputs.map((input) => input.name);

      expect(inputNames).toEqual(
        expect.arrayContaining([
          'pageIndex',
          'length',
          'pageSize',
          'pageSizeOptions',
          'hidePageSize',
          'showFirstLastButtons',
          'disabled',
        ]),
      );
    },
  );

  it('MatPaginator.outputs contains page with eventPayloadType PageEvent', () => {
    const paginator = findByName(extractFixtureComponents(), 'paginator');
    const page = paginator.outputs.find((output) => output.name === 'page');

    expect(page).toBeDefined();
    expect(page?.eventPayloadType).toBe('PageEvent');
  });

  it(
    'MatPaginator.publicMethods contains nextPage, previousPage, firstPage, lastPage, ' +
      'hasPreviousPage, hasNextPage',
    () => {
      const paginator = findByName(extractFixtureComponents(), 'paginator');
      const methodNames = paginator.publicMethods.map((method) => method.name);

      expect(methodNames).toEqual(
        expect.arrayContaining([
          'nextPage',
          'previousPage',
          'firstPage',
          'lastPage',
          'hasPreviousPage',
          'hasNextPage',
        ]),
      );
    },
  );

  it('preserves JSDoc descriptions on the class, inputs, outputs, and methods', () => {
    const paginator = findByName(extractFixtureComponents(), 'paginator');

    expect(paginator.description).toContain('navigation between paged information');
    expect(paginator.inputs.find((input) => input.name === 'pageIndex')?.description).toContain(
      'zero-based page index',
    );
    expect(paginator.outputs.find((output) => output.name === 'page')?.description).toContain(
      'Event emitted',
    );
    expect(
      paginator.publicMethods.find((method) => method.name === 'nextPage')?.description,
    ).toContain('Advances to the next page');
  });

  it('assigns each extracted component the category from the category lookup table', () => {
    const components = extractFixtureComponents();

    expect(findByName(components, 'table').category).toBe('data-table');
    expect(findByName(components, 'paginator').category).toBe('data-table');
  });

  it('does not extract MatSort as a component (it is a @Directive, not a @Component)', () => {
    const components = extractFixtureComponents();

    expect(components.some((component) => component.className === 'MatSort')).toBe(false);
  });
});
