import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import type { ToolErrorResponse } from '../types/tool-responses.js';
import { sanitizeErrorMessage } from './error-sanitizer.js';
import { logger } from './logger.js';

function isToolErrorResponse(value: unknown): value is ToolErrorResponse {
  return typeof value === 'object' && value !== null && 'isError' in value && value.isError === true;
}

/**
 * Converts a tool handler's typed result into the MCP `CallToolResult` shape. A
 * `ToolErrorResponse` becomes `isError: true` content instead of a thrown exception, per the
 * project convention that tool failures never crash the server process. Error messages are
 * sanitized (absolute host paths stripped) since they flow straight to the MCP client.
 */
export function toCallToolResult(result: unknown): CallToolResult {
  if (isToolErrorResponse(result)) {
    return {
      isError: true,
      content: [{ type: 'text', text: sanitizeErrorMessage(result.message) }],
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };
}

/**
 * Runs a tool's pure lookup function and converts its result to a `CallToolResult`, catching any
 * thrown exception (e.g. `ResourceLimitError`/`ExtractionTimeoutError` from a degenerate
 * extraction, or an unexpected fs error) so it surfaces as sanitized `isError` content instead of
 * propagating out of the MCP handler. The raw error — which may contain absolute host paths or a
 * stack trace — is logged to stderr in full; only the sanitized message reaches the client.
 */
export function safeToolResult<T>(fn: () => T): CallToolResult {
  try {
    return toCallToolResult(fn());
  } catch (error) {
    logger.error('Tool handler threw an unhandled error', error);
    const rawMessage = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: 'text', text: sanitizeErrorMessage(rawMessage) }],
    };
  }
}
