import { extractComponents } from '../extractors/component-extractor.js';
import { extractDirectives } from '../extractors/directive-extractor.js';
import { parsePackage } from '../extractors/ts-parser.js';
import type { ResolvedAngularMaterial } from '../extractors/module-resolver.js';
import type { ComponentMetadata } from '../types/component-metadata.js';
import { MemoryCache } from './memory-cache.js';

/** The only package this service extracts from until Phase 13 adds @angular/cdk as a second root. */
const ANGULAR_MATERIAL_PACKAGE_NAME = '@angular/material';

export interface ExtractionServiceOptions {
  /** Max entries retained in the per-component LRU cache. Passed through to `MemoryCache`. */
  maxEntries?: number;
}

export interface ExtractionService {
  /** All components and directives extracted from the resolved package, cached by version. */
  getAllComponents(): ComponentMetadata[];
  /** A single component/directive by its `name` (e.g. "table"), cached by version + name. */
  getComponent(name: string): ComponentMetadata | undefined;
}

/**
 * Composes resolver output -> parser -> extractors -> cache into the two read APIs the MCP
 * tools need. Cache keys are namespaced by `resolved.version` so a stale entry can never be
 * served after the underlying package version changes.
 *
 * Every cache miss re-parses and re-extracts the *entire* package — extraction only reads
 * `.d.ts` files already on disk and is cheap enough (see ts-parser's own timing budget) that
 * recomputing it per miss is simpler than partial re-extraction, while still making repeated
 * lookups of the same component/full list free.
 */
export function createExtractionService(
  resolved: Pick<ResolvedAngularMaterial, 'packageRoot' | 'version'>,
  options: ExtractionServiceOptions = {},
): ExtractionService {
  const componentCache = new MemoryCache<string, ComponentMetadata>(options);
  const allComponentsCache = new MemoryCache<string, ComponentMetadata[]>({ maxEntries: 1 });

  function extractAll(): ComponentMetadata[] {
    const parsed = parsePackage(resolved.packageRoot);
    const extractOptions = {
      packageName: ANGULAR_MATERIAL_PACKAGE_NAME,
      version: resolved.version,
    };
    return [
      ...extractComponents(parsed, extractOptions),
      ...extractDirectives(parsed, extractOptions),
    ];
  }

  return {
    getAllComponents(): ComponentMetadata[] {
      const cached = allComponentsCache.get(resolved.version);
      if (cached) {
        return cached;
      }
      const all = extractAll();
      allComponentsCache.set(resolved.version, all);
      return all;
    },

    getComponent(name: string): ComponentMetadata | undefined {
      const cacheKey = `${resolved.version}:${name}`;
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
  };
}
