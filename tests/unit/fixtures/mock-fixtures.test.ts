import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

const FIXTURE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/mock-angular-material',
);

const MOCK_PROJECT_MATERIAL_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/mock-project/node_modules/@angular/material',
);

const COMPONENT_FILES = ['table/index.d.ts', 'paginator/index.d.ts', 'sort/index.d.ts'];

/** Fixture `.d.ts` files declare decorators locally, so they only need this one extra flag. */
const COMPILER_OPTIONS: ts.CompilerOptions = {
  noEmit: true,
  experimentalDecorators: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
};

function typeCheck(filePath: string): readonly ts.Diagnostic[] {
  const program = ts.createProgram([filePath], COMPILER_OPTIONS);
  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) {
    throw new Error(`TypeScript program did not load ${filePath}`);
  }
  return ts.getPreEmitDiagnostics(program, sourceFile);
}

describe('mock-angular-material fixtures', () => {
  it('package.json declares version 17.3.0', () => {
    const pkg = JSON.parse(readFileSync(path.join(FIXTURE_ROOT, 'package.json'), 'utf8')) as {
      name: string;
      version: string;
    };
    expect(pkg.name).toBe('@angular/material');
    expect(pkg.version).toBe('17.3.0');
  });

  it.each(COMPONENT_FILES)('%s is independently valid TypeScript', (relativePath) => {
    const diagnostics = typeCheck(path.join(FIXTURE_ROOT, relativePath));
    expect(diagnostics).toHaveLength(0);
  });
});

describe('mock-project node_modules/@angular/material layout', () => {
  it('mirrors the mock-angular-material package.json', () => {
    const pkg = JSON.parse(
      readFileSync(path.join(MOCK_PROJECT_MATERIAL_ROOT, 'package.json'), 'utf8'),
    ) as { name: string; version: string };
    expect(pkg.name).toBe('@angular/material');
    expect(pkg.version).toBe('17.3.0');
  });

  it.each(COMPONENT_FILES)('%s is independently valid TypeScript', (relativePath) => {
    const diagnostics = typeCheck(path.join(MOCK_PROJECT_MATERIAL_ROOT, relativePath));
    expect(diagnostics).toHaveLength(0);
  });
});
