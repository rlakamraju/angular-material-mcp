import { describe, expect, it } from 'vitest';

import { Deadline, ExtractionTimeoutError } from '../../../src/utils/deadline.js';

describe('Deadline', () => {
  it('does not throw while comfortably inside the budget', () => {
    const deadline = new Deadline(5000);

    expect(() => deadline.check('within-budget')).not.toThrow();
  });

  it('throws ExtractionTimeoutError once the budget has elapsed', async () => {
    const deadline = new Deadline(1);
    await new Promise((resolve) => setTimeout(resolve, 15));

    expect(() => deadline.check('slow-step')).toThrow(ExtractionTimeoutError);
  });

  it('includes the caller-supplied context and the budget in the error message', async () => {
    const deadline = new Deadline(1);
    await new Promise((resolve) => setTimeout(resolve, 15));

    try {
      deadline.check('discoverEntryFiles');
      expect.fail('expected deadline.check to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ExtractionTimeoutError);
      expect((error as Error).message).toContain('discoverEntryFiles');
      expect((error as Error).message).toContain('1ms');
    }
  });
});
