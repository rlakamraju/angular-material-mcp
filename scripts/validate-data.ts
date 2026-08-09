import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { z } from 'zod';

import {
  compositionPatternSchema,
  schematicInfoSchema,
  themingGuideSchema,
} from '../src/data/schemas.js';

const SCHEMAS_BY_CATEGORY: Record<string, z.ZodTypeAny> = {
  compositions: compositionPatternSchema,
  theming: themingGuideSchema,
  schematics: schematicInfoSchema,
};

export interface ValidationFailure {
  file: string;
  errors: string[];
}

function listJsonFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listJsonFiles(fullPath));
    } else if (entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Validates every `<dataRoot>/<category>/**\/*.json` file against the schema registered for its
 * top-level category directory. Pure and side-effect free so it can be exercised directly in
 * tests, independent of the CLI wrapper below.
 */
export function validateDataDirectory(dataRoot: string): ValidationFailure[] {
  const failures: ValidationFailure[] = [];

  for (const entry of readdirSync(dataRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const category = entry.name;
    const schema = SCHEMAS_BY_CATEGORY[category];
    if (!schema) {
      failures.push({
        file: path.join(dataRoot, category),
        errors: [
          `Unknown data category "${category}" — no schema registered for it in scripts/validate-data.ts.`,
        ],
      });
      continue;
    }

    for (const file of listJsonFiles(path.join(dataRoot, category))) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(readFileSync(file, 'utf8'));
      } catch (error) {
        failures.push({ file, errors: [`Invalid JSON: ${(error as Error).message}`] });
        continue;
      }

      const result = schema.safeParse(parsed);
      if (!result.success) {
        failures.push({
          file,
          errors: result.error.issues.map(
            (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
          ),
        });
      }
    }
  }

  return failures;
}

function main(): void {
  const dataRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
  const failures = validateDataDirectory(dataRoot);

  if (failures.length === 0) {
    process.stdout.write('validate-data: OK\n');
    return;
  }

  for (const failure of failures) {
    process.stderr.write(`${failure.file}\n`);
    for (const error of failure.errors) {
      process.stderr.write(`  - ${error}\n`);
    }
  }
  process.stderr.write(`\nvalidate-data: ${failures.length} file(s) failed validation\n`);
  process.exitCode = 1;
}

const isMainModule =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  main();
}
