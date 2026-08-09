import { describe, expect, it } from 'vitest';

import { rankByRelevance, scoreRelevance } from '../../../src/utils/fuzzy-search.js';

describe('scoreRelevance', () => {
  it('scores an exact substring match highest', () => {
    expect(scoreRelevance('table', 'table a data table component')).toBeGreaterThan(0.9);
  });

  it('scores partial token overlap between 0 and 1', () => {
    const score = scoreRelevance('sortable table columns', 'a table that can be sorted');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it('scores no overlap as 0', () => {
    expect(scoreRelevance('drag and drop', 'a form control for entering dates')).toBe(0);
  });

  it('is case-insensitive', () => {
    expect(scoreRelevance('Table', 'A TABLE component')).toBeGreaterThan(0.9);
  });
});

describe('rankByRelevance', () => {
  const AUTOCOMPLETE = {
    name: 'autocomplete',
    className: 'MatAutocomplete',
    category: 'form',
    description: 'A text input with a panel of suggested options that filters as you type.',
    composedWith: ['input'],
  };

  const SELECT = {
    name: 'select',
    className: 'MatSelect',
    category: 'form',
    description: 'A form control styled as a native dropdown for choosing one option from a list.',
    composedWith: ['option'],
  };

  it('ranks the component whose description matches more query tokens first', () => {
    const results = rankByRelevance('dropdown that filters as you type', [AUTOCOMPLETE, SELECT]);

    const autocompleteResult = results.find((r) => r.name === 'autocomplete');
    const selectResult = results.find((r) => r.name === 'select');

    expect(autocompleteResult).toBeDefined();
    expect(selectResult).toBeDefined();
    expect(autocompleteResult?.relevanceScore).toBeGreaterThan(selectResult?.relevanceScore ?? 0);
  });

  it('drops zero-score results and sorts the rest descending', () => {
    const unrelated = {
      name: 'divider',
      className: 'MatDivider',
      category: 'layout',
      description: 'A thin line used to separate content.',
      composedWith: [],
    };

    const results = rankByRelevance('dropdown that filters as you type', [
      SELECT,
      AUTOCOMPLETE,
      unrelated,
    ]);

    expect(results.map((r) => r.name)).not.toContain('divider');
    expect(results[0]?.name).toBe('autocomplete');
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.relevanceScore).toBeGreaterThanOrEqual(results[i]!.relevanceScore);
    }
  });
});
