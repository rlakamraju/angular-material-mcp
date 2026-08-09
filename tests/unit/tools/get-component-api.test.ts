import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { createExtractionService } from '../../../src/cache/extraction-service.js';
import { getComponentApi } from '../../../src/tools/get-component-api.tool.js';

const FIXTURE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/mock-angular-material',
);

const RESOLVED = { packageRoot: FIXTURE_ROOT, version: '17.3.0' };

describe('get-component-api tool', () => {
  it('returns the full extracted metadata for a known component', () => {
    const service = createExtractionService(RESOLVED);

    const result = getComponentApi(service, { componentName: 'table' });

    expect('isError' in result).toBe(false);
    expect(result).toMatchObject({
      name: 'table',
      className: 'MatTable',
      gotchas: [],
      composedWith: [],
    });
    expect((result as { inputs: unknown[] }).inputs.length).toBeGreaterThan(0);
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
