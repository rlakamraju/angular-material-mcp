import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { createExtractionService } from '../../../src/cache/extraction-service.js';
import { listComponents } from '../../../src/tools/list-components.tool.js';

const FIXTURE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/mock-angular-material',
);

const RESOLVED = { material: { packageRoot: FIXTURE_ROOT, version: '17.3.0' } };

describe('list-components tool', () => {
  it('lists every extracted component with the resolved version', () => {
    const service = createExtractionService(RESOLVED);

    const result = listComponents(service, {});

    expect(result.version).toBe('17.3.0');
    expect(result.components.map((c) => c.name)).toEqual(
      expect.arrayContaining(['table', 'paginator', 'sort']),
    );
  });

  it('projects only the summary fields, including composedWith', () => {
    const service = createExtractionService(RESOLVED);

    const result = listComponents(service, {});
    const table = result.components.find((c) => c.name === 'table');

    expect(table?.description).toEqual(expect.any(String));
    expect(table).toMatchObject({
      name: 'table',
      className: 'MatTable',
      category: 'data-table',
      composedWith: [],
    });
  });

  it('filters by category', () => {
    const service = createExtractionService(RESOLVED);

    const matches = listComponents(service, { category: 'data-table' });
    const nonMatches = listComponents(service, { category: 'nonexistent-category' });

    expect(matches.components.length).toBeGreaterThan(0);
    expect(matches.components.every((c) => c.category === 'data-table')).toBe(true);
    expect(nonMatches.components).toEqual([]);
  });
});
