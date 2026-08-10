import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface OwnPackageJson {
  name?: string;
  version?: string;
}

/**
 * Reads this package's own `package.json`. Resolved relative to this file rather than
 * `process.cwd()` so it works the same whether running from `src/utils/` (via tsx) or
 * `dist/utils/` (built) — both sit two directories below the package root.
 */
export function readOwnPackageJson(): OwnPackageJson {
  const packageJsonPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    'package.json',
  );
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')) as OwnPackageJson;
}
