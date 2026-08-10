import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { readCuratedData } from '../data/data-loader.js';
import { themingGuideSchema } from '../data/schemas.js';
import type { GetThemingGuideResponse, ToolErrorResponse } from '../types/tool-responses.js';
import { safeToolResult } from '../utils/mcp-response.js';

export const getThemingGuideInputShape = {
  topic: z.string().min(1).describe('Theming topic key, e.g. "initial-setup".'),
};

/**
 * Pure lookup by exact topic key. Returns a `ToolErrorResponse` rather than throwing when the
 * topic isn't found, matching the convention used by get_component_api.
 */
export function getThemingGuide(input: {
  topic: string;
}): GetThemingGuideResponse | ToolErrorResponse {
  const guide = readCuratedData<GetThemingGuideResponse>(
    'theming',
    input.topic,
    themingGuideSchema,
  );
  if (!guide) {
    return {
      isError: true,
      message: `No theming guide for topic "${input.topic}" was found.`,
    };
  }
  return guide;
}

export function registerGetThemingGuideTool(server: McpServer): void {
  server.registerTool(
    'get_theming_guide',
    {
      title: 'Get Angular Material theming guide',
      description:
        'Returns a curated theming guide (setup code, explanation, gotchas) for a specific ' +
        'theming topic such as initial setup, custom themes, typography, or dark mode.',
      inputSchema: getThemingGuideInputShape,
    },
    (input) => safeToolResult(() => getThemingGuide(input)),
  );
}
