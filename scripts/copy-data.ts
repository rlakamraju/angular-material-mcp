import { cpSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * `tsc` compiles `src/data/*.ts` (the schemas/loader) into `dist/data/*.js` but has no reason to
 * know about the `.json` files living alongside them, since they're read dynamically by filename
 * at runtime rather than imported. Without this, the built server resolves every curated-data
 * tool to "not found".
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'src', 'data');
const destination = path.join(root, 'dist', 'data');

cpSync(source, destination, {
  recursive: true,
  filter: (candidate) => statSync(candidate).isDirectory() || candidate.endsWith('.json'),
});
