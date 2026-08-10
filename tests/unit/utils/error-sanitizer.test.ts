import { describe, expect, it } from 'vitest';

import { sanitizeErrorMessage } from '../../../src/utils/error-sanitizer.js';

describe('sanitizeErrorMessage', () => {
  it('strips an absolute POSIX path embedded in a message', () => {
    const message =
      "ENOENT: no such file or directory, open '/home/alice/project/node_modules/@angular/material/table/index.d.ts'";

    const sanitized = sanitizeErrorMessage(message);

    expect(sanitized).not.toContain('/home/alice');
    expect(sanitized).toContain('<path>');
    expect(sanitized).toContain('ENOENT');
  });

  it('strips an absolute Windows path embedded in a message', () => {
    const message =
      'Package root "C:\\Users\\alice\\project\\node_modules\\@angular\\material" has too many entry files';

    const sanitized = sanitizeErrorMessage(message);

    expect(sanitized).not.toContain('C:\\Users\\alice');
    expect(sanitized).toContain('<path>');
    expect(sanitized).toContain('too many entry files');
  });

  it('leaves component-style names containing a slash untouched', () => {
    const message = 'No component named "cdk/drag-drop" was found.';

    expect(sanitizeErrorMessage(message)).toBe(message);
  });

  it('leaves a message with no path-like content untouched', () => {
    const message = 'An internal error occurred while processing this request.';

    expect(sanitizeErrorMessage(message)).toBe(message);
  });
});
