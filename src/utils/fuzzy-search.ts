/**
 * Lightweight token-overlap relevance scorer for free-text component search — deliberately not a
 * dependency, following this project's precedent (see version-utils.ts) of hand-rolling small
 * ranking algorithms instead of reaching for a fuzzy-search package.
 */

const WORD_PATTERN = /[a-z0-9]+/g;

function tokenize(text: string): string[] {
  return text.toLowerCase().match(WORD_PATTERN) ?? [];
}

/**
 * Scores how relevant `text` is to `query` on a 0..1 scale: the fraction of the query's
 * (deduplicated) tokens that also appear as whole tokens in `text`, plus a small bonus when
 * `text` contains the full query as a substring — so an exact name/selector match outranks
 * loose token overlap of the same size.
 */
export function scoreRelevance(query: string, text: string): number {
  const queryTokens = [...new Set(tokenize(query))];
  if (queryTokens.length === 0) {
    return 0;
  }

  const textTokens = new Set(tokenize(text));
  const matched = queryTokens.filter((token) => textTokens.has(token)).length;
  const overlapScore = matched / queryTokens.length;

  const substringBonus = text.toLowerCase().includes(query.trim().toLowerCase()) ? 0.15 : 0;

  return Math.min(1, overlapScore + substringBonus);
}

/** Fields a component/directive must expose to be ranked by `rankByRelevance`. */
export interface RankableComponent {
  name: string;
  className: string;
  category: string;
  description: string;
  composedWith: string[];
}

/**
 * Ranks `components` against `query` by relevance and drops zero-score results. Each component's
 * search text is its name/className/category/description/composedWith joined, so a match against
 * any of those fields counts toward the query's token overlap.
 */
export function rankByRelevance<T extends RankableComponent>(
  query: string,
  components: T[],
): Array<T & { relevanceScore: number }> {
  return components
    .map((component) => ({
      ...component,
      relevanceScore: scoreRelevance(
        query,
        [
          component.name,
          component.className,
          component.category,
          component.description,
          ...component.composedWith,
        ].join(' '),
      ),
    }))
    .filter((component) => component.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}
