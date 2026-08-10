import { extractComponents } from '../extractors/component-extractor.js';
import { extractDirectives } from '../extractors/directive-extractor.js';
import { parsePackage } from '../extractors/ts-parser.js';
import type { ResolvedAngularCdk, ResolvedAngularMaterial } from '../extractors/module-resolver.js';
import type { ComponentMetadata } from '../types/component-metadata.js';
import { Deadline } from '../utils/deadline.js';
import { DEFAULT_EXTRACTION_TIMEOUT_MS } from '../utils/resource-limits.js';
import { MemoryCache } from './memory-cache.js';

const ANGULAR_MATERIAL_PACKAGE_NAME = '@angular/material';
const ANGULAR_CDK_PACKAGE_NAME = '@angular/cdk';

/**
 * CDK-derived components/directives are named `cdk/<subpackage>` (e.g. "cdk/drag-drop") so they
 * can never collide with an @angular/material subpackage of the same name in `getComponent`
 * lookups or `list_components` output.
 */
const CDK_NAME_PREFIX = 'cdk';

type RootPackage = Pick<ResolvedAngularMaterial, 'packageRoot' | 'version'>;

export interface ExtractionServiceRoots {
  /** Required root — startup already fails before this service is constructed if missing. */
  material: RootPackage;
  /** Optional second root (Phase 13) — absent when @angular/cdk isn't installed in the project. */
  cdk?: Pick<ResolvedAngularCdk, 'packageRoot' | 'version'>;
}

export interface ExtractionServiceOptions {
  /** Max entries retained in the per-component LRU cache. Passed through to `MemoryCache`. */
  maxEntries?: number;
  /** Wall-clock budget (ms) for a full extraction pass across every resolved root. Defaults to 5s. */
  extractionTimeoutMs?: number;
}

export interface ExtractionService {
  /** All components and directives extracted from every resolved root, cached by version. */
  getAllComponents(): ComponentMetadata[];
  /** A single component/directive by its `name` (e.g. "table", "cdk/drag-drop"), cached by version + name. */
  getComponent(name: string): ComponentMetadata | undefined;
  /** Drops every cached entry — called on graceful shutdown so nothing extracted is retained. */
  clearCache(): void;
}

function extractRoot(
  root: RootPackage,
  packageName: string,
  deadline: Deadline,
  namePrefix?: string,
): ComponentMetadata[] {
  const parsed = parsePackage(root.packageRoot, deadline);
  // Built conditionally rather than `{ ..., namePrefix }` because `namePrefix` is an optional
  // property (`exactOptionalPropertyTypes`) — it must be omitted entirely, not set to `undefined`.
  const options =
    namePrefix !== undefined
      ? { packageName, version: root.version, namePrefix }
      : { packageName, version: root.version };
  return [...extractComponents(parsed, options), ...extractDirectives(parsed, options)];
}

/**
 * Composes resolver output -> parser -> extractors -> cache into the two read APIs the MCP
 * tools need. Cache keys are namespaced by both roots' versions so a stale entry can never be
 * served after either underlying package version changes.
 *
 * Every cache miss re-parses and re-extracts every resolved root — extraction only reads
 * `.d.ts` files already on disk and is cheap enough (see ts-parser's own timing budget) that
 * recomputing it per miss is simpler than partial re-extraction, while still making repeated
 * lookups of the same component/full list free.
 */
export function createExtractionService(
  roots: ExtractionServiceRoots,
  options: ExtractionServiceOptions = {},
): ExtractionService {
  const cacheVersionKey = `${roots.material.version}|${roots.cdk?.version ?? ''}`;
  const extractionTimeoutMs = options.extractionTimeoutMs ?? DEFAULT_EXTRACTION_TIMEOUT_MS;

  const componentCache = new MemoryCache<string, ComponentMetadata>(options);
  const allComponentsCache = new MemoryCache<string, ComponentMetadata[]>({ maxEntries: 1 });

  // One shared deadline per extraction pass: the budget covers both roots combined, not each
  // independently, so a slow material root can't leave the cdk root a fresh full budget of its own.
  function extractAll(): ComponentMetadata[] {
    const deadline = new Deadline(extractionTimeoutMs);
    const materialResults = extractRoot(roots.material, ANGULAR_MATERIAL_PACKAGE_NAME, deadline);
    if (!roots.cdk) {
      return materialResults;
    }
    const cdkResults = extractRoot(
      roots.cdk,
      ANGULAR_CDK_PACKAGE_NAME,
      deadline,
      CDK_NAME_PREFIX,
    );
    return [...materialResults, ...cdkResults];
  }

  return {
    getAllComponents(): ComponentMetadata[] {
      const cached = allComponentsCache.get(cacheVersionKey);
      if (cached) {
        return cached;
      }
      const all = extractAll();
      allComponentsCache.set(cacheVersionKey, all);
      return all;
    },

    getComponent(name: string): ComponentMetadata | undefined {
      const cacheKey = `${cacheVersionKey}:${name}`;
      const cached = componentCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const found = extractAll().find((component) => component.name === name);
      if (found) {
        componentCache.set(cacheKey, found);
      }
      return found;
    },

    clearCache(): void {
      componentCache.clear();
      allComponentsCache.clear();
    },
  };
}
