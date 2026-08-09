import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { ExtractionService } from '../cache/extraction-service.js';
import type { GetComponentApiResponse, ToolErrorResponse } from '../types/tool-responses.js';
import { toCallToolResult } from '../utils/mcp-response.js';

export const getComponentApiInputShape = {
  componentName: z.string().min(1).describe('Component name as used in tool calls, e.g. "table".'),
  importStyle: z
    .enum(['standalone', 'ngmodule'])
    .optional()
    .describe('Import style to prefer in generated examples. Defaults to the server config.'),
};

/**
 * Pure lookup by exact component name. Returns a `ToolErrorResponse` rather than throwing when
 * the name isn't found, so the MCP tool handler never needs to catch an exception to report it.
 */
export function getComponentApi(
  service: Pick<ExtractionService, 'getComponent'>,
  input: { componentName: string },
): GetComponentApiResponse | ToolErrorResponse {
  const component = service.getComponent(input.componentName);
  if (!component) {
    return {
      isError: true,
      message: `No component named "${input.componentName}" was found. Use list_components or search_components to find valid names.`,
    };
  }
  return component;
}

export function registerGetComponentApiTool(
  server: McpServer,
  service: Pick<ExtractionService, 'getComponent'>,
): void {
  server.registerTool(
    'get_component_api',
    {
      title: 'Get Angular Material component API',
      description:
        'Returns the full extracted API (selector, inputs, outputs, methods) plus curated ' +
        'gotchas/examples for a single Angular Material component or directive.',
      inputSchema: getComponentApiInputShape,
    },
    (input) => toCallToolResult(getComponentApi(service, input)),
  );
}
