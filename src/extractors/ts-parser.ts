import type { Dirent } from 'node:fs';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

import * as ts from 'typescript';

/**
 * Compiler options for parsing a Material/CDK package's shipped `.d.ts` files directly, with no
 * `tsconfig.json` from the host project involved. `experimentalDecorators` is required because
 * the packages ship decorator metadata (`@Component`, `@Directive`) on ambient class
 * declarations; everything else mirrors what `tsc` would infer for a modern Angular package.
 */
export const PACKAGE_COMPILER_OPTIONS: ts.CompilerOptions = {
  noEmit: true,
  experimentalDecorators: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  skipLibCheck: true,
  // Without an explicit `lib`, TS pulls in the full default lib for the target (which drags in
  // DOM typings) and re-parses it on every ts.createProgram call — pin it to just ES2022 so
  // repeated extraction stays fast.
  lib: ['lib.es2022.d.ts'],
};

/** One resolved subpackage entry point, e.g. `@angular/material/table`. */
export interface PackageEntryFile {
  /** Subpackage segment used in tool calls and import paths, e.g. "table". */
  subpackage: string;
  /** Absolute path to that subpackage's `.d.ts` entry point. */
  filePath: string;
}

export interface ParsedPackage {
  program: ts.Program;
  checker: ts.TypeChecker;
  entries: readonly PackageEntryFile[];
}

/**
 * Finds every immediate subdirectory of `packageRoot` that ships an `index.d.ts` entry point —
 * this is how `@angular/material`/`@angular/cdk` lay out their subpackages (`table/index.d.ts`,
 * `paginator/index.d.ts`, ...). Returned in sorted order for deterministic output.
 */
export function discoverEntryFiles(packageRoot: string): PackageEntryFile[] {
  const entries: PackageEntryFile[] = [];

  let dirents: Dirent[];
  try {
    dirents = readdirSync(packageRoot, { withFileTypes: true });
  } catch {
    return entries;
  }

  for (const dirent of dirents) {
    if (!dirent.isDirectory()) {
      continue;
    }
    const subpackage = dirent.name;
    const filePath = path.resolve(packageRoot, subpackage, 'index.d.ts');
    if (existsSync(filePath)) {
      entries.push({ subpackage, filePath });
    }
  }

  entries.sort((a, b) => a.subpackage.localeCompare(b.subpackage));
  return entries;
}

/**
 * Parses every discovered subpackage entry point under `packageRoot` into a single
 * `ts.Program`, with no `tsconfig.json` required. Read-only: never emits, never writes to disk.
 */
export function parsePackage(packageRoot: string): ParsedPackage {
  const entries = discoverEntryFiles(packageRoot);
  const program = ts.createProgram(
    entries.map((entry) => entry.filePath),
    PACKAGE_COMPILER_OPTIONS,
  );

  return {
    program,
    checker: program.getTypeChecker(),
    entries,
  };
}
