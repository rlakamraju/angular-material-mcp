import { describe, expect, it } from 'vitest';

import { getSchematicsUsage } from '../../../src/tools/get-schematics-usage.tool.js';

describe('get-schematics-usage tool', () => {
  it('returns the full curated schematic info for a known name', () => {
    const result = getSchematicsUsage({ schematicName: 'ng-add' });

    expect('isError' in result).toBe(false);
    expect(result).toMatchObject({
      name: 'ng-add',
      command: 'ng add @angular/material',
    });
    expect((result as { options: unknown[] }).options.length).toBeGreaterThan(0);
  });

  it('returns a ToolErrorResponse for an unknown schematic name', () => {
    const result = getSchematicsUsage({ schematicName: 'nonexistent' });

    if (!('isError' in result)) {
      throw new Error('expected a ToolErrorResponse');
    }
    expect(result.isError).toBe(true);
    expect(result.message).toContain('nonexistent');
  });
});
