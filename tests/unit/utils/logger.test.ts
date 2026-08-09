import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLogger } from '../../../src/utils/logger.js';

describe('createLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('never writes to stdout, regardless of level or threshold', () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    const logger = createLogger('debug');
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(stdoutSpy).not.toHaveBeenCalled();
    expect(stderrSpy).toHaveBeenCalledTimes(4);
  });

  it('drops messages below the configured threshold', () => {
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    const logger = createLogger('warn');
    logger.debug('should be dropped');
    logger.info('should be dropped');
    logger.warn('should be logged');
    logger.error('should be logged');

    expect(stderrSpy).toHaveBeenCalledTimes(2);
    expect(stderrSpy.mock.calls[0]?.[0]).toContain('should be logged');
  });

  it('includes the level and message text in the written line', () => {
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    const logger = createLogger('info');
    logger.info('hello world');

    const line = stderrSpy.mock.calls[0]?.[0];
    expect(line).toContain('[INFO]');
    expect(line).toContain('hello world');
  });

  it('serializes extra arguments, including Error stacks', () => {
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    const logger = createLogger('error');
    logger.error('failed', new Error('boom'), { code: 42 });

    const line = stderrSpy.mock.calls[0]?.[0] as string;
    expect(line).toContain('boom');
    expect(line).toContain('"code":42');
  });
});
