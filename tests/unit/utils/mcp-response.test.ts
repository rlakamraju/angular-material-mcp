import { afterEach, describe, expect, it, vi } from 'vitest';

import { safeToolResult, toCallToolResult } from '../../../src/utils/mcp-response.js';
import * as logger from '../../../src/utils/logger.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('toCallToolResult', () => {
  it('wraps a non-error result as JSON content', () => {
    const result = toCallToolResult({ foo: 'bar' });

    expect(result.isError).toBeUndefined();
    expect(result.content).toEqual([{ type: 'text', text: JSON.stringify({ foo: 'bar' }, null, 2) }]);
  });

  it('sanitizes an absolute path inside a ToolErrorResponse message', () => {
    const result = toCallToolResult({
      isError: true,
      message: 'Failed to read /home/alice/project/node_modules/@angular/material',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).not.toContain('/home/alice');
    expect(text).toContain('<path>');
  });
});

describe('safeToolResult', () => {
  it('returns the wrapped result when fn succeeds', () => {
    const result = safeToolResult(() => ({ ok: true }));

    expect(result.isError).toBeUndefined();
  });

  it('catches a thrown error, sanitizes the message, and logs the raw error to stderr', () => {
    const errorSpy = vi.spyOn(logger.logger, 'error').mockImplementation(() => {});
    const rawPath = '/home/alice/project/node_modules/@angular/material';

    const result = safeToolResult(() => {
      throw new Error(`Package root "${rawPath}" has too many entry files`);
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).not.toContain(rawPath);
    expect(text).toContain('too many entry files');

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const loggedError = errorSpy.mock.calls[0]?.[1];
    expect(loggedError).toBeInstanceOf(Error);
    expect((loggedError as Error).message).toContain(rawPath);
  });

  it('handles a non-Error throw without crashing', () => {
    const errorSpy = vi.spyOn(logger.logger, 'error').mockImplementation(() => {});

    const result = safeToolResult(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw 'plain string failure';
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toBe('plain string failure');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
