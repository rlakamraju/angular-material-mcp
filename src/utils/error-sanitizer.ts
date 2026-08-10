/**
 * Matches an absolute filesystem path (POSIX `/...` or Windows `C:\...` / `C:/...`) that starts
 * at a word boundary (string start, whitespace, or an opening quote/paren) so it doesn't also
 * match unrelated slash-separated tokens like a `cdk/drag-drop` component name.
 */
const ABSOLUTE_PATH_PATTERN = /(^|[\s"'(])((?:\/|[A-Za-z]:[\\/])[^\s"')]*)/g;

/**
 * Strips absolute host filesystem paths out of an error message before it's returned to an MCP
 * client — the client needs to know what went wrong, not the host's directory layout. Callers
 * are expected to log the original, unsanitized message/error to stderr separately.
 */
export function sanitizeErrorMessage(message: string): string {
  return message.replace(ABSOLUTE_PATH_PATTERN, '$1<path>');
}
