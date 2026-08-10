import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { extractDirectives } from '../../../src/extractors/directive-extractor.js';
import { parsePackage } from '../../../src/extractors/ts-parser.js';

const CDK_FIXTURE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/mock-angular-cdk',
);

/**
 * Proves extraction works unmodified against a second package root (@angular/cdk), not just
 * @angular/material — the `namePrefix` option (exercised elsewhere) is the only thing that
 * changes when extracting a second root; the AST-walking logic itself is package-agnostic.
 */
describe('directive-extractor against the @angular/cdk fixture', () => {
  it('extracts CdkDropList with selector "[cdkDropList], cdk-drop-list"', () => {
    const parsed = parsePackage(CDK_FIXTURE_ROOT);
    const directives = extractDirectives(parsed, { packageName: '@angular/cdk', version: '17.3.0' });
    const dropList = directives.find((directive) => directive.className === 'CdkDropList');

    expect(dropList).toBeDefined();
    expect(dropList?.selector).toBe('[cdkDropList], cdk-drop-list');
  });

  it('CdkDropList.inputs contains data, disabled, orientation', () => {
    const parsed = parsePackage(CDK_FIXTURE_ROOT);
    const directives = extractDirectives(parsed, { packageName: '@angular/cdk', version: '17.3.0' });
    const dropList = directives.find((directive) => directive.className === 'CdkDropList');
    const inputNames = dropList?.inputs.map((input) => input.name) ?? [];

    expect(inputNames).toEqual(expect.arrayContaining(['data', 'disabled', 'orientation']));
  });

  it('CdkDropList.outputs contains dropped with eventPayloadType CdkDragDrop<T>', () => {
    const parsed = parsePackage(CDK_FIXTURE_ROOT);
    const directives = extractDirectives(parsed, { packageName: '@angular/cdk', version: '17.3.0' });
    const dropList = directives.find((directive) => directive.className === 'CdkDropList');
    const dropped = dropList?.outputs.find((output) => output.name === 'dropped');

    expect(dropped).toBeDefined();
    expect(dropped?.eventPayloadType).toBe('CdkDragDrop<T>');
  });

  it('applying the "cdk" namePrefix produces the namespaced name "cdk/drag-drop"', () => {
    const parsed = parsePackage(CDK_FIXTURE_ROOT);
    const directives = extractDirectives(parsed, {
      packageName: '@angular/cdk',
      version: '17.3.0',
      namePrefix: 'cdk',
    });
    const dropList = directives.find((directive) => directive.className === 'CdkDropList');

    expect(dropList?.name).toBe('cdk/drag-drop');
    expect(dropList?.importPath).toBe('@angular/cdk/drag-drop');
    expect(dropList?.category).toBe('cdk');
  });
});
