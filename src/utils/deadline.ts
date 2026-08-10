/** Thrown when a `Deadline` budget has elapsed before the guarded work finished. */
export class ExtractionTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExtractionTimeoutError';
  }
}

/**
 * A cooperative wall-clock budget for synchronous, unpreemptible work (e.g. `readdirSync` loops,
 * `ts.createProgram`). Node has no way to interrupt a running synchronous call, so this can only
 * bound total elapsed time by being checked between discrete steps of a larger operation — callers
 * must call `check()` at every loop iteration/phase boundary they control for the budget to be
 * meaningful. Combined with the resource caps in `resource-limits.ts` (which keep any single
 * iteration cheap), this is enough to reject a degenerate input within budget instead of hanging.
 */
export class Deadline {
  private readonly startedAt = Date.now();

  constructor(private readonly budgetMs: number) {}

  elapsedMs(): number {
    return Date.now() - this.startedAt;
  }

  /** Throws `ExtractionTimeoutError` if the budget has already elapsed. */
  check(context: string): void {
    const elapsed = this.elapsedMs();
    if (elapsed > this.budgetMs) {
      throw new ExtractionTimeoutError(
        `${context} exceeded its ${this.budgetMs}ms extraction budget (${elapsed}ms elapsed)`,
      );
    }
  }
}
