import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import type { ToolErrorResponse } from '../types/tool-responses.js';

function isToolErrorResponse(value: unknown): value is ToolErrorResponse {
  return typeof value === 'object' && value !== null && 'isError' in value && value.isError === true;
}

/**
 * Converts a tool handler's typed result into the MCP `CallToolResult` shape. A
 * `ToolErrorResponse` becomes `isError: true` content instead of a thrown exception, per the
 * project convention that tool failures never crash the server process.
 */
export function toCallToolResult(result: unknown): CallToolResult {
  if (isToolErrorResponse(result)) {
    return {
      isError: true,
      content: [{ type: 'text', text: result.message }],
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };
}
