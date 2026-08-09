/**
 * Maps a subpackage name (`table`, `paginator`, ...) to the category used for
 * `list_components`/`search_components` filtering. Filled in incrementally as curated content
 * rolls out (Phases 11-13) — an unmapped subpackage falls back to `DEFAULT_CATEGORY` rather than
 * failing extraction.
 */
const CATEGORY_BY_SUBPACKAGE: Readonly<Record<string, string>> = {
  table: 'data-table',
  paginator: 'data-table',
  sort: 'data-table',
};

export const DEFAULT_CATEGORY = 'uncategorized';

export function getCategoryForSubpackage(subpackage: string): string {
  return CATEGORY_BY_SUBPACKAGE[subpackage] ?? DEFAULT_CATEGORY;
}
