import { describe, expect, it } from 'vitest';

import { getThemingGuide } from '../../../src/tools/get-theming-guide.tool.js';

describe('get-theming-guide tool', () => {
  it('returns the full curated guide for a known topic', () => {
    const result = getThemingGuide({ topic: 'initial-setup' });

    expect('isError' in result).toBe(false);
    expect(result).toMatchObject({
      topic: 'initial-setup',
    });
    expect((result as { gotchas: unknown[] }).gotchas.length).toBeGreaterThan(0);
  });

  it('returns a ToolErrorResponse for an unknown topic', () => {
    const result = getThemingGuide({ topic: 'nonexistent' });

    if (!('isError' in result)) {
      throw new Error('expected a ToolErrorResponse');
    }
    expect(result.isError).toBe(true);
    expect(result.message).toContain('nonexistent');
  });
});
