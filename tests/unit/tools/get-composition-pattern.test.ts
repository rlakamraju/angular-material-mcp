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

  it('returns the full curated pattern for the extended-component stepper composition', () => {
    const result = getCompositionPattern({ patternName: 'stepper-with-forms' });

    if ('isError' in result) {
      throw new Error('expected a CompositionPattern');
    }
    expect(result.name).toBe('stepper-with-forms');
    expect(result.components).toEqual(expect.arrayContaining(['stepper']));
  });

  it('returns the full curated pattern for the extended-component tree composition', () => {
    const result = getCompositionPattern({ patternName: 'tree-with-lazy-loading' });

    if ('isError' in result) {
      throw new Error('expected a CompositionPattern');
    }
    expect(result.name).toBe('tree-with-lazy-loading');
    expect(result.components).toEqual(expect.arrayContaining(['tree']));
  });

  it.each([
    'cdk-drag-drop',
    'cdk-virtual-scrolling',
    'cdk-overlay',
    'cdk-clipboard',
    'cdk-a11y',
  ])('returns the full curated pattern for the CDK composition "%s"', (patternName) => {
    const result = getCompositionPattern({ patternName });

    if ('isError' in result) {
      throw new Error('expected a CompositionPattern');
    }
    expect(result.name).toBe(patternName);
    expect(result.components.length).toBeGreaterThan(0);
    expect(result.templateCode.length).toBeGreaterThan(0);
    expect(result.componentCode.length).toBeGreaterThan(0);
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
