import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { discoverEntryFiles, parsePackage } from '../../../src/extractors/ts-parser.js';
import { Deadline, ExtractionTimeoutError } from '../../../src/utils/deadline.js';
import {
  MAX_ENTRY_FILES,
  MAX_ENTRY_FILE_SIZE_BYTES,
  ResourceLimitError,
} from '../../../src/utils/resource-limits.js';

/** Builds a package root with `count` subpackages, each a trivial valid `index.d.ts`. */
function buildPackageRootWithManyEntries(count: number): string {
  const root = mkdtempSync(path.join(tmpdir(), 'am-mcp-many-entries-'));
  for (let i = 0; i < count; i += 1) {
    const subpackageDir = path.join(root, `sub-${i}`);
    mkdirSync(subpackageDir);
    writeFileSync(path.join(subpackageDir, 'index.d.ts'), 'export declare const x: number;\n');
  }
  return root;
}

/** Builds a package root with a single subpackage whose `index.d.ts` is oversized. */
function buildPackageRootWithOversizedEntry(sizeBytes: number): string {
  const root = mkdtempSync(path.join(tmpdir(), 'am-mcp-oversized-entry-'));
  const subpackageDir = path.join(root, 'huge');
  mkdirSync(subpackageDir);
  writeFileSync(path.join(subpackageDir, 'index.d.ts'), '/*'.padEnd(sizeBytes, 'x') + '*/\n');
  return root;
}

describe('ts-parser resource limits', () => {
  it('rejects a package root with more than MAX_ENTRY_FILES entries, quickly and without hanging', () => {
    const root = buildPackageRootWithManyEntries(MAX_ENTRY_FILES + 50);

    const start = performance.now();
    expect(() => discoverEntryFiles(root)).toThrow(ResourceLimitError);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
  });

  it('rejects a single entry file larger than MAX_ENTRY_FILE_SIZE_BYTES', () => {
    const root = buildPackageRootWithOversizedEntry(MAX_ENTRY_FILE_SIZE_BYTES + 1024);

    expect(() => discoverEntryFiles(root)).toThrow(ResourceLimitError);
  });

  it('parsePackage() also rejects a degenerate root within budget instead of feeding it to ts.createProgram', () => {
    const root = buildPackageRootWithManyEntries(MAX_ENTRY_FILES + 50);

    const start = performance.now();
    expect(() => parsePackage(root)).toThrow(ResourceLimitError);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
  });

  it('accepts a package root with exactly MAX_ENTRY_FILES entries (at the cap, not over it)', () => {
    const root = buildPackageRootWithManyEntries(MAX_ENTRY_FILES);

    expect(() => discoverEntryFiles(root)).not.toThrow();
  });

  it('an already-expired deadline aborts discovery even on a well-formed root', () => {
    const root = buildPackageRootWithManyEntries(5);
    const deadline = new Deadline(-1); // already elapsed

    expect(() => discoverEntryFiles(root, deadline)).toThrow(ExtractionTimeoutError);
  });
});
