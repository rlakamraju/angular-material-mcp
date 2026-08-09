import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { z } from 'zod';

import { logger } from '../utils/logger.js';

const DATA_ROOT = path.dirname(fileURLToPath(import.meta.url));

/** Lookup keys come straight from tool input, so only allow a plain filename-safe token. */
const SAFE_KEY_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

/**
 * Reads and validates `src/data/<category>/<key>.json`. Mirrors `ExtractionService.getComponent`'s
 * `| undefined` convention: a missing file, an unsafe key, or data that fails schema validation
 * are all "not found" from the caller's perspective — tool handlers turn that into a
 * `ToolErrorResponse` rather than throwing. Malformed data (which `validate-data` should already
 * have caught in CI) is logged so it doesn't fail silently.
 */
export function readCuratedData<T>(
  category: string,
  key: string,
  schema: z.ZodTypeAny,
): T | undefined {
  if (!SAFE_KEY_PATTERN.test(key)) {
    return undefined;
  }

  const categoryRoot = path.resolve(DATA_ROOT, category);
  const filePath = path.resolve(categoryRoot, `${key}.json`);
  if (filePath !== path.resolve(categoryRoot, path.basename(filePath))) {
    return undefined;
  }

  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch {
    return undefined;
  }

  const parsed: unknown = JSON.parse(raw);
  const result = schema.safeParse(parsed);
  if (!result.success) {
    logger.warn(
      `Curated data file for "${category}/${key}" failed schema validation`,
      result.error,
    );
    return undefined;
  }
  return result.data as T;
}
