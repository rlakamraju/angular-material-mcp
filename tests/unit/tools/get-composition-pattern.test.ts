import { describe, expect, it } from 'vitest';

import { getCompositionPattern } from '../../../src/tools/get-composition-pattern.tool.js';

describe('get-composition-pattern tool', () => {
  it('returns the full curated pattern for a known key', () => {
    const result = getCompositionPattern({ patternName: 'table-sort-paginator' });

    if ('isError' in result) {
      throw new Error('expected a CompositionPattern');
    }
    expect(result.name).toBe('table-sort-paginator');
    expect(result.components).toEqual(expect.arrayContaining(['table', 'sort', 'paginator']));
  });

  it('returns a ToolErrorResponse for an unknown pattern key', () => {
    const result = getCompositionPattern({ patternName: 'nonexistent' });

    if (!('isError' in result)) {
      throw new Error('expected a ToolErrorResponse');
    }
    expect(result.isError).toBe(true);
    expect(result.message).toContain('nonexistent');
  });

  it('returns a ToolErrorResponse for a path-traversal attempt instead of throwing', () => {
    const result = getCompositionPattern({ patternName: '../../package' });

    if (!('isError' in result)) {
      throw new Error('expected a ToolErrorResponse');
    }
    expect(result.isError).toBe(true);
  });
});
