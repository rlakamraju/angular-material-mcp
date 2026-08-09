import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { validateDataDirectory } from '../../../scripts/validate-data.js';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

describe('validate-data script', () => {
  it('passes on the real seed data in src/data', () => {
    const failures = validateDataDirectory(path.resolve(REPO_ROOT, 'src/data'));

    expect(failures).toEqual([]);
  });

  it('reports failures for a deliberately malformed fixture', () => {
    const failures = validateDataDirectory(
      path.resolve(REPO_ROOT, 'tests/fixtures/malformed-data'),
    );

    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.file).toContain('broken.json');
    expect(failures[0]?.errors.length).toBeGreaterThan(0);
  });
});
