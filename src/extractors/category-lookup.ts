/**
 * Maps a subpackage name (`table`, `paginator`, ...) to the category used for
 * `list_components`/`search_components` filtering. Filled in incrementally as curated content
 * rolls out (Phases 11-13) — an unmapped subpackage falls back to `DEFAULT_CATEGORY` rather than
 * failing extraction.
 *
 * Keyed by the bare subpackage name as it appears under `node_modules/@angular/*` — the same key
 * is used regardless of whether it's ultimately reported under a "cdk/" name prefix (Phase 13),
 * since `getCategoryForSubpackage` is always called with `entry.subpackage` before prefixing.
 */
const CATEGORY_BY_SUBPACKAGE: Readonly<Record<string, string>> = {
  table: 'data-table',
  paginator: 'data-table',
  sort: 'data-table',
  'drag-drop': 'cdk',
  scrolling: 'cdk',
  overlay: 'cdk',
  clipboard: 'cdk',
  a11y: 'cdk',
};

export const DEFAULT_CATEGORY = 'uncategorized';

export function getCategoryForSubpackage(subpackage: string): string {
  return CATEGORY_BY_SUBPACKAGE[subpackage] ?? DEFAULT_CATEGORY;
}
