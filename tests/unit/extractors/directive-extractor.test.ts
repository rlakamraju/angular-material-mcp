import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { extractDirectives } from '../../../src/extractors/directive-extractor.js';
import { parsePackage } from '../../../src/extractors/ts-parser.js';
import type { ComponentMetadata } from '../../../src/types/component-metadata.js';
import { logger } from '../../../src/utils/logger.js';

const FIXTURE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/mock-angular-material',
);

function extractFixtureDirectives(): ComponentMetadata[] {
  const parsed = parsePackage(FIXTURE_ROOT);
  return extractDirectives(parsed, { packageName: '@angular/material', version: '17.3.0' });
}

function findSort(directives: ComponentMetadata[]): ComponentMetadata {
  const found = directives.find((directive) => directive.className === 'MatSort');
  if (!found) {
    throw new Error('expected to find extracted directive "MatSort"');
  }
  return found;
}

describe('directive-extractor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs a per-entry-file debug timing line for each subpackage processed', () => {
    const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => undefined);

    extractFixtureDirectives();

    expect(debugSpy).toHaveBeenCalled();
    const lines = debugSpy.mock.calls.map((call) => call[0]);
    expect(lines.some((line) => line.includes('[extract:directive]') && line.includes('sort'))).toBe(
      true,
    );
    expect(lines.every((line) => /\d+(\.\d+)?ms/.test(line))).toBe(true);
  });

  it('extracts MatSort with selector "[matSort]"', () => {
    const sort = findSort(extractFixtureDirectives());

    expect(sort.selector).toBe('[matSort]');
  });

  it('MatSort.inputs contains active, direction, disableClear, disabled', () => {
    const sort = findSort(extractFixtureDirectives());
    const inputNames = sort.inputs.map((input) => input.name);

    expect(inputNames).toEqual(
      expect.arrayContaining(['active', 'direction', 'disableClear', 'disabled']),
    );
  });

  it("resolves @Input aliases (e.g. @Input('matSortActive')) to their bound input name", () => {
    const sort = findSort(extractFixtureDirectives());
    const inputNames = sort.inputs.map((input) => input.name);

    // The property is aliased to "matSortActive" in the decorator, but the extractor reports
    // the property's own name — not the alias string — since that's what every other tool
    // (get_component_api, search) keys on.
    expect(inputNames).toContain('active');
    expect(inputNames).not.toContain('matSortActive');
  });

  it('MatSort.outputs contains sortChange with eventPayloadType Sort', () => {
    const sort = findSort(extractFixtureDirectives());
    const sortChange = sort.outputs.find((output) => output.name === 'sortChange');

    expect(sortChange).toBeDefined();
    expect(sortChange?.eventPayloadType).toBe('Sort');
  });

  it('MatSort.publicMethods contains sort, getNextSortDirection', () => {
    const sort = findSort(extractFixtureDirectives());
    const methodNames = sort.publicMethods.map((method) => method.name);

    expect(methodNames).toEqual(expect.arrayContaining(['sort', 'getNextSortDirection']));
  });

  it('does not extract MatTable or MatPaginator as directives (they are @Component classes)', () => {
    const directives = extractFixtureDirectives();
    const classNames = directives.map((directive) => directive.className);

    expect(classNames).not.toContain('MatTable');
    expect(classNames).not.toContain('MatPaginator');
  });

  it('prefixes the extracted name with namePrefix when provided (e.g. for a second root like cdk)', () => {
    const parsed = parsePackage(FIXTURE_ROOT);
    const directives = extractDirectives(parsed, {
      packageName: '@angular/material',
      version: '17.3.0',
      namePrefix: 'cdk',
    });
    const sort = directives.find((directive) => directive.className === 'MatSort');

    expect(sort?.name).toBe('cdk/sort');
  });
});
