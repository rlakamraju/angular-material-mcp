import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { discoverEntryFiles, parsePackage } from '../../../src/extractors/ts-parser.js';

const FIXTURE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/mock-angular-material',
);

describe('ts-parser', () => {
  it('creates a ts.Program from the mock-angular-material fixture root with no tsconfig.json', () => {
    const parsed = parsePackage(FIXTURE_ROOT);

    expect(parsed.program).toBeDefined();
    expect(parsed.checker).toBeDefined();
  });

  it('resolves table/index.d.ts, paginator/index.d.ts, and sort/index.d.ts as source files', () => {
    const entries = discoverEntryFiles(FIXTURE_ROOT);
    const subpackages = entries.map((entry) => entry.subpackage).sort();

    expect(subpackages).toEqual(['paginator', 'sort', 'table']);

    const parsed = parsePackage(FIXTURE_ROOT);
    for (const entry of entries) {
      expect(parsed.program.getSourceFile(entry.filePath)).toBeDefined();
    }
  });

  it('parses the full fixture set well within budget', () => {
    // The first few calls pay for TypeScript loading and JIT-warming its default lib .d.ts
    // handling once per process — that one-time cost isn't what this budget is meant to guard
    // against, so warm up first and then measure a steady-state call. The threshold is generous
    // (rather than the ~350ms steady-state seen on a quiet machine) because vitest runs test
    // files in parallel worker threads, and this test's timing is sensitive to CPU contention
    // from its siblings; it's still tight enough to catch a real regression (e.g. an accidental
    // O(n^2) walk or a hang).
    for (let i = 0; i < 3; i += 1) {
      parsePackage(FIXTURE_ROOT);
    }

    const start = performance.now();
    parsePackage(FIXTURE_ROOT);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
  });

  it('does not use eval or dynamic require anywhere in the parsing path', () => {
    const source = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        '../../../src/extractors/ts-parser.ts',
      ),
      'utf8',
    );

    expect(source).not.toMatch(/\beval\s*\(/);
    expect(source).not.toMatch(/\brequire\s*\(/);
  });
});
