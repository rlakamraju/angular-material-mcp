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

const CDK_FIXTURE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/mock-angular-cdk',
);

const MOCK_PROJECT_WITH_CDK_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/mock-project-with-cdk/node_modules/@angular',
);

const COMPONENT_FILES = ['table/index.d.ts', 'paginator/index.d.ts', 'sort/index.d.ts'];
const CDK_COMPONENT_FILES = ['drag-drop/index.d.ts'];

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

describe('mock-angular-cdk fixtures', () => {
  it('package.json declares @angular/cdk version 17.3.0', () => {
    const pkg = JSON.parse(readFileSync(path.join(CDK_FIXTURE_ROOT, 'package.json'), 'utf8')) as {
      name: string;
      version: string;
    };
    expect(pkg.name).toBe('@angular/cdk');
    expect(pkg.version).toBe('17.3.0');
  });

  it.each(CDK_COMPONENT_FILES)('%s is independently valid TypeScript', (relativePath) => {
    const diagnostics = typeCheck(path.join(CDK_FIXTURE_ROOT, relativePath));
    expect(diagnostics).toHaveLength(0);
  });
});

describe('mock-project-with-cdk node_modules/@angular layout', () => {
  it('has both @angular/material and @angular/cdk installed', () => {
    const materialPkg = JSON.parse(
      readFileSync(path.join(MOCK_PROJECT_WITH_CDK_ROOT, 'material', 'package.json'), 'utf8'),
    ) as { name: string; version: string };
    const cdkPkg = JSON.parse(
      readFileSync(path.join(MOCK_PROJECT_WITH_CDK_ROOT, 'cdk', 'package.json'), 'utf8'),
    ) as { name: string; version: string };

    expect(materialPkg.name).toBe('@angular/material');
    expect(cdkPkg.name).toBe('@angular/cdk');
  });

  it.each(CDK_COMPONENT_FILES)('cdk/%s is independently valid TypeScript', (relativePath) => {
    const diagnostics = typeCheck(path.join(MOCK_PROJECT_WITH_CDK_ROOT, 'cdk', relativePath));
    expect(diagnostics).toHaveLength(0);
  });
});
