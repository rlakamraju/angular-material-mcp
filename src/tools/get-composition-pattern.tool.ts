import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { readCuratedData } from '../data/data-loader.js';
import { compositionPatternSchema } from '../data/schemas.js';
import type { GetCompositionPatternResponse, ToolErrorResponse } from '../types/tool-responses.js';
import { safeToolResult } from '../utils/mcp-response.js';

export const getCompositionPatternInputShape = {
  patternName: z.string().min(1).describe('Composition pattern key, e.g. "table-sort-paginator".'),
};

/**
 * Pure lookup by exact pattern key. Returns a `ToolErrorResponse` rather than throwing when the
 * key isn't found, matching the convention used by get_component_api.
 */
export function getCompositionPattern(input: {
  patternName: string;
}): GetCompositionPatternResponse | ToolErrorResponse {
  const pattern = readCuratedData<GetCompositionPatternResponse>(
    'compositions',
    input.patternName,
    compositionPatternSchema,
  );
  if (!pattern) {
    return {
      isError: true,
      message: `No composition pattern named "${input.patternName}" was found.`,
    };
  }
  return pattern;
}

export function registerGetCompositionPatternTool(server: McpServer): void {
  server.registerTool(
    'get_composition_pattern',
    {
      title: 'Get Angular Material composition pattern',
      description:
        'Returns a curated multi-component wiring pattern (e.g. table + sort + paginator) with ' +
        'ready-to-use template and component code.',
      inputSchema: getCompositionPatternInputShape,
    },
    (input) => safeToolResult(() => getCompositionPattern(input)),
  );
}
