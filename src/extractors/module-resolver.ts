import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { ServerConfig } from '../types/config.js';

/** Which step of the resolution chain found the package — for logging/diagnostics only. */
export type ResolutionSource = 'env' | 'cwd' | 'parent-walk';

export interface ResolvedPackage {
  /** Absolute path to the package directory (contains package.json). */
  packageRoot: string;
  /** Absolute path to the project root whose node_modules contains the package. */
  projectPath: string;
  /** Version read from the package's package.json. */
  version: string;
  source: ResolutionSource;
}

/** Kept as a named alias since @angular/material is the primary, required root. */
export type ResolvedAngularMaterial = ResolvedPackage;

/** @angular/cdk is resolved the same way, but is an optional second root (see resolveAngularCdk). */
export type ResolvedAngularCdk = ResolvedPackage;

/** Bounds the parent-directory walk so a misconfigured cwd can't loop toward the filesystem root forever. */
const MAX_PARENT_WALK_DEPTH = 20;

/** node_modules path segments identifying a scoped package, e.g. ['@angular', 'material']. */
type PackageSegments = readonly [scope: string, name: string];

const MATERIAL_SEGMENTS: PackageSegments = ['@angular', 'material'];
const CDK_SEGMENTS: PackageSegments = ['@angular', 'cdk'];

function packageDisplayName(segments: PackageSegments): string {
  return segments.join('/');
}

/** Thrown when no candidate directory in the resolution chain has the required package installed. */
export class ModuleResolutionError extends Error {
  readonly packageName: string;
  readonly attemptedPaths: readonly string[];

  constructor(packageName: string, attemptedPaths: readonly string[]) {
    super(
      [
        `${packageName} was not found in any of the following locations:`,
        ...attemptedPaths.map((attempted) => `  - ${attempted}`),
        '',
        'Fix: run `npm install` inside your Angular project so the package is present in',
        'node_modules, or set ANGULAR_PROJECT_PATH to the root of that project, e.g.:',
        '  ANGULAR_PROJECT_PATH=/path/to/your/angular/project npx angular-material-mcp',
      ].join('\n'),
    );
    this.name = 'ModuleResolutionError';
    this.packageName = packageName;
    this.attemptedPaths = attemptedPaths;
  }
}

interface MinimalPackageJson {
  version?: string;
}

/** Looks for a valid package install directly under `projectPath/node_modules/<segments>`. */
function readPackageAt(
  projectPath: string,
  segments: PackageSegments,
): Omit<ResolvedPackage, 'source'> | undefined {
  const packageRoot = path.resolve(projectPath, 'node_modules', ...segments);
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

interface ResolutionAttempt {
  found?: ResolvedPackage;
  attempted: string[];
}

/**
 * Shared resolution chain: ANGULAR_PROJECT_PATH -> process.cwd() -> walk up parent directories.
 * Returns the first match along with every path attempted; callers decide whether a miss is
 * fatal (required @angular/material) or not (optional @angular/cdk).
 */
function resolvePackageChain(
  segments: PackageSegments,
  config: Pick<ServerConfig, 'angularProjectPath'>,
  cwd: string,
): ResolutionAttempt {
  const attempted: string[] = [];

  if (config.angularProjectPath !== undefined) {
    const candidate = path.resolve(config.angularProjectPath);
    attempted.push(candidate);
    const found = readPackageAt(candidate, segments);
    if (found) {
      return { found: { ...found, source: 'env' }, attempted };
    }
  }

  const resolvedCwd = path.resolve(cwd);
  attempted.push(resolvedCwd);
  const cwdFound = readPackageAt(resolvedCwd, segments);
  if (cwdFound) {
    return { found: { ...cwdFound, source: 'cwd' }, attempted };
  }

  let current = resolvedCwd;
  for (let depth = 0; depth < MAX_PARENT_WALK_DEPTH; depth += 1) {
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
    attempted.push(current);
    const found = readPackageAt(current, segments);
    if (found) {
      return { found: { ...found, source: 'parent-walk' }, attempted };
    }
  }

  return { attempted };
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
  const { found, attempted } = resolvePackageChain(MATERIAL_SEGMENTS, config, cwd);
  if (!found) {
    throw new ModuleResolutionError(packageDisplayName(MATERIAL_SEGMENTS), attempted);
  }
  return found;
}

/**
 * Same resolution chain as `resolveAngularMaterial`, but @angular/cdk is an optional second root:
 * a project without it installed is a valid, common configuration (not every Material project
 * uses CDK primitives directly), so a miss returns `undefined` instead of throwing. Callers that
 * need CDK data (e.g. `cdk/*` component lookups) are responsible for surfacing a clear error at
 * the point of use.
 */
export function resolveAngularCdk(
  config: Pick<ServerConfig, 'angularProjectPath'>,
  cwd: string = process.cwd(),
): ResolvedAngularCdk | undefined {
  const { found } = resolvePackageChain(CDK_SEGMENTS, config, cwd);
  return found;
}
