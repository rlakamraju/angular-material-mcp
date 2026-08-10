import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { ExtractionService } from '../cache/extraction-service.js';
import type { ComponentSummary, ListComponentsResponse } from '../types/tool-responses.js';
import { safeToolResult } from '../utils/mcp-response.js';

export const listComponentsInputShape = {
  category: z.string().optional().describe('Filter results to this category, e.g. "data-table".'),
};

/**
 * Pure lookup: all extracted components, optionally filtered by category, projected down to the
 * summary shape. Never fails — an unknown/unmatched category simply yields an empty list, since
 * "no components in this category" isn't an error condition.
 */
export function listComponents(
  service: Pick<ExtractionService, 'getAllComponents'>,
  input: { category?: string | undefined },
): ListComponentsResponse {
  const all = service.getAllComponents();
  const filtered =
    input.category !== undefined
      ? all.filter((component) => component.category === input.category)
      : all;

  const components: ComponentSummary[] = filtered.map((component) => ({
    name: component.name,
    className: component.className,
    category: component.category,
    description: component.description,
    composedWith: component.composedWith,
  }));

  return {
    version: all[0]?.version ?? '',
    components,
  };
}

export function registerListComponentsTool(
  server: McpServer,
  service: Pick<ExtractionService, 'getAllComponents'>,
): void {
  server.registerTool(
    'list_components',
    {
      title: 'List Angular Material components',
      description:
        'Lists all Angular Material components/directives extracted from the installed ' +
        '@angular/material version, optionally filtered by category.',
      inputSchema: listComponentsInputShape,
    },
    (input) => safeToolResult(() => listComponents(service, input)),
  );
}
