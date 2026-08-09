import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { ServerConfig } from '../types/config.js';

/** Which step of the resolution chain found @angular/material — for logging/diagnostics only. */
export type ResolutionSource = 'env' | 'cwd' | 'parent-walk';

export interface ResolvedAngularMaterial {
  /** Absolute path to the @angular/material package directory (contains package.json). */
  packageRoot: string;
  /** Absolute path to the project root whose node_modules contains @angular/material. */
  projectPath: string;
  /** Version read from @angular/material/package.json. */
  version: string;
  source: ResolutionSource;
}

/** Bounds the parent-directory walk so a misconfigured cwd can't loop toward the filesystem root forever. */
const MAX_PARENT_WALK_DEPTH = 20;

/** Thrown when no candidate directory in the resolution chain has @angular/material installed. */
export class ModuleResolutionError extends Error {
  readonly attemptedPaths: readonly string[];

  constructor(attemptedPaths: readonly string[]) {
    super(
      [
        '@angular/material was not found in any of the following locations:',
        ...attemptedPaths.map((attempted) => `  - ${attempted}`),
        '',
        'Fix: run `npm install` inside your Angular project so @angular/material is present in',
        'node_modules, or set ANGULAR_PROJECT_PATH to the root of that project, e.g.:',
        '  ANGULAR_PROJECT_PATH=/path/to/your/angular/project npx angular-material-mcp',
      ].join('\n'),
    );
    this.name = 'ModuleResolutionError';
    this.attemptedPaths = attemptedPaths;
  }
}

interface MinimalPackageJson {
  version?: string;
}

/** Looks for a valid @angular/material install directly under `projectPath/node_modules`. */
function readAngularMaterialAt(
  projectPath: string,
): Omit<ResolvedAngularMaterial, 'source'> | undefined {
  const packageRoot = path.resolve(projectPath, 'node_modules', '@angular', 'material');
  const packageJsonPath = path.resolve(packageRoot, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return undefined;
  }

  let pkg: MinimalPackageJson;
  try {
    pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as MinimalPackageJson;
  } catch {
    return undefined;
  }

  if (typeof pkg.version !== 'string' || pkg.version.length === 0) {
    return undefined;
  }

  return {
    packageRoot,
    projectPath: path.resolve(projectPath),
    version: pkg.version,
  };
}

/**
 * Resolution chain: ANGULAR_PROJECT_PATH -> process.cwd() -> walk up parent directories -> fail.
 * Each step is only tried if the previous one didn't have a valid @angular/material install —
 * an ANGULAR_PROJECT_PATH that turns out to be wrong does not abort the chain early. Fail-fast,
 * no fallback: if nothing is found, throws ModuleResolutionError rather than returning stale
 * or baseline data.
 */
export function resolveAngularMaterial(
  config: Pick<ServerConfig, 'angularProjectPath'>,
  cwd: string = process.cwd(),
): ResolvedAngularMaterial {
  const attempted: string[] = [];

  if (config.angularProjectPath !== undefined) {
    const candidate = path.resolve(config.angularProjectPath);
    attempted.push(candidate);
    const found = readAngularMaterialAt(candidate);
    if (found) {
      return { ...found, source: 'env' };
    }
  }

  const resolvedCwd = path.resolve(cwd);
  attempted.push(resolvedCwd);
  const cwdFound = readAngularMaterialAt(resolvedCwd);
  if (cwdFound) {
    return { ...cwdFound, source: 'cwd' };
  }

  let current = resolvedCwd;
  for (let depth = 0; depth < MAX_PARENT_WALK_DEPTH; depth += 1) {
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
    attempted.push(current);
    const found = readAngularMaterialAt(current);
    if (found) {
      return { ...found, source: 'parent-walk' };
    }
  }

  throw new ModuleResolutionError(attempted);
}
