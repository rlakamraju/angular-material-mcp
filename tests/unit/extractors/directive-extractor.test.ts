import { describe, it } from 'vitest';

// Phase 5 implements src/extractors/directive-extractor.ts. These placeholders document the
// expected value-level output against tests/fixtures/mock-angular-material/sort — the one
// fixture that is a @Directive rather than a @Component, needed for CDK support in Phase 13.
describe('directive-extractor', () => {
  it.todo('extracts MatSort with selector "[matSort]"');
  it.todo('MatSort.inputs contains active, direction, disableClear, disabled');
  it.todo("resolves @Input aliases (e.g. @Input('matSortActive')) to their bound input name");
  it.todo('MatSort.outputs contains sortChange with eventPayloadType Sort');
  it.todo('MatSort.publicMethods contains sort, getNextSortDirection');
  it.todo('does not extract MatTable or MatPaginator as directives (they are @Component classes)');
});
