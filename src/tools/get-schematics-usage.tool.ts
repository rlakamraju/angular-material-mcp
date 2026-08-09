import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { readCuratedData } from '../data/data-loader.js';
import { schematicInfoSchema } from '../data/schemas.js';
import type { GetSchematicsUsageResponse, ToolErrorResponse } from '../types/tool-responses.js';
import { toCallToolResult } from '../utils/mcp-response.js';

export const getSchematicsUsageInputShape = {
  schematicName: z.string().min(1).describe('Schematic key, e.g. "ng-add".'),
};

/**
 * Pure lookup by exact schematic key. Returns a `ToolErrorResponse` rather than throwing when the
 * schematic isn't found, matching the convention used by get_component_api.
 */
export function getSchematicsUsage(input: {
  schematicName: string;
}): GetSchematicsUsageResponse | ToolErrorResponse {
  const schematic = readCuratedData<GetSchematicsUsageResponse>(
    'schematics',
    input.schematicName,
    schematicInfoSchema,
  );
  if (!schematic) {
    return {
      isError: true,
      message: `No schematic named "${input.schematicName}" was found.`,
    };
  }
  return schematic;
}

export function registerGetSchematicsUsageTool(server: McpServer): void {
  server.registerTool(
    'get_schematics_usage',
    {
      title: 'Get Angular Material schematic usage',
      description:
        'Returns curated usage info (command, options, generated files, example invocation) for ' +
        'an Angular Material CLI schematic such as ng add.',
      inputSchema: getSchematicsUsageInputShape,
    },
    (input) => toCallToolResult(getSchematicsUsage(input)),
  );
}
