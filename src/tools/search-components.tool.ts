import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { ExtractionService } from '../cache/extraction-service.js';
import type { SearchComponentsResponse, SearchResult } from '../types/tool-responses.js';
import { rankByRelevance } from '../utils/fuzzy-search.js';
import { toCallToolResult } from '../utils/mcp-response.js';

export const searchComponentsInputShape = {
  query: z
    .string()
    .min(1)
    .describe(
      'Natural-language description of the desired UI behavior, e.g. "dropdown that filters as you type".',
    ),
};

/**
 * Ranks every extracted component against a free-text query using lightweight token-overlap
 * scoring (see utils/fuzzy-search.ts). Never fails — a query that matches nothing simply returns
 * an empty `results` array, matching list_components' "no match isn't an error" convention.
 */
export function searchComponents(
  service: Pick<ExtractionService, 'getAllComponents'>,
  input: { query: string },
): SearchComponentsResponse {
  const all = service.getAllComponents();
  const results: SearchResult[] = rankByRelevance(
    input.query,
    all.map((component) => ({
      name: component.name,
      className: component.className,
      category: component.category,
      description: component.description,
      composedWith: component.composedWith,
    })),
  );

  return { query: input.query, results };
}

export function registerSearchComponentsTool(
  server: McpServer,
  service: Pick<ExtractionService, 'getAllComponents'>,
): void {
  server.registerTool(
    'search_components',
    {
      title: 'Search Angular Material components',
      description:
        'Finds Angular Material components/directives matching a natural-language description ' +
        'of the desired UI behavior, ranked by relevance.',
      inputSchema: searchComponentsInputShape,
    },
    (input) => toCallToolResult(searchComponents(service, input)),
  );
}
