import { afterEach, beforeEach, expect } from 'vitest';

/**
 * Global regression guard for the most important invariant in this codebase (see CLAUDE.md):
 * stdout is reserved for the MCP JSON-RPC transport. Wraps every unit/integration test so a
 * stray `console.log` or direct `process.stdout.write` anywhere in `src/` fails the suite
 * immediately, instead of silently corrupting the JSON-RPC stream in production.
 *
 * Deliberately monkey-patches `process.stdout.write` directly rather than using `vi.spyOn` — a
 * handful of test files call `vi.restoreAllMocks()` in their own `afterEach`, which would
 * silently reset (and clear the call history of) a spy-based guard registered here. A plain
 * function swap is invisible to vitest's mock registry, so it can't be undone by unrelated
 * cleanup elsewhere in the suite.
 */
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
let stdoutWriteCallCount = 0;

beforeEach(() => {
  stdoutWriteCallCount = 0;
  process.stdout.write = ((..._args: Parameters<typeof process.stdout.write>) => {
    stdoutWriteCallCount += 1;
    return true;
  }) as typeof process.stdout.write;
});

afterEach(() => {
  process.stdout.write = originalStdoutWrite;
  expect(stdoutWriteCallCount).toBe(0);
});
