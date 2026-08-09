import { describe, it } from 'vitest';

// Phase 5 implements src/extractors/ts-parser.ts. These placeholders document the expected
// behavior against tests/fixtures/mock-angular-material so extraction can be built test-first.
describe('ts-parser', () => {
  it.todo('creates a ts.Program from the mock-angular-material fixture root with no tsconfig.json');
  it.todo('resolves table/index.d.ts, paginator/index.d.ts, and sort/index.d.ts as source files');
  it.todo('parses the full fixture set in well under 500ms');
  it.todo('does not use eval or dynamic require anywhere in the parsing path');
});
