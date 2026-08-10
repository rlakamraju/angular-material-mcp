/**
 * Caps on how much a single package root can make extraction do, so a pathological or hostile
 * `node_modules` install (huge file count, huge single file) fails fast with a clear error
 * instead of feeding an unbounded amount of work to `ts.createProgram`. Real @angular/material
 * and @angular/cdk installs have well under 100 subpackage entry points, each a few KB to low
 * hundreds of KB — both limits leave generous headroom above that.
 */
export const MAX_ENTRY_FILES = 300;
export const MAX_ENTRY_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Default wall-clock budget (ms) for a full extraction pass across every resolved root. */
export const DEFAULT_EXTRACTION_TIMEOUT_MS = 5000;

/** Thrown when a package root exceeds one of the caps above. */
export class ResourceLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceLimitError';
  }
}
