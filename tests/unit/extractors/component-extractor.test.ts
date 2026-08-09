import { describe, it } from 'vitest';

// Phase 5 implements src/extractors/component-extractor.ts. These placeholders document the
// expected value-level output against tests/fixtures/mock-angular-material/{table,paginator}
// so extraction can be built test-first (per IMPLEMENTATION_PLAN.md Phase 5).
describe('component-extractor', () => {
  it.todo('extracts MatTable with selector "mat-table, table[mat-table]"');
  it.todo('MatTable.inputs contains dataSource, trackBy, multiTemplateDataRows, fixedLayout');
  it.todo(
    'MatTable.publicMethods contains renderRows, updateStickyHeaderRowStyles, ' +
      'updateStickyFooterRowStyles, updateStickyColumnStyles',
  );
  it.todo('MatTable.outputs is empty (MatTable has no @Output members)');

  it.todo('extracts MatPaginator with selector "mat-paginator"');
  it.todo(
    'MatPaginator.inputs contains pageIndex, length, pageSize, pageSizeOptions, hidePageSize, ' +
      'showFirstLastButtons, disabled',
  );
  it.todo('MatPaginator.outputs contains page with eventPayloadType PageEvent');
  it.todo(
    'MatPaginator.publicMethods contains nextPage, previousPage, firstPage, lastPage, ' +
      'hasPreviousPage, hasNextPage',
  );

  it.todo('preserves JSDoc descriptions on the class, inputs, outputs, and methods');
  it.todo('assigns each extracted component the category from the category lookup table');
  it.todo('does not extract MatSort as a component (it is a @Directive, not a @Component)');
});
