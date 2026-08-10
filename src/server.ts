import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { ExtractionService } from './cache/extraction-service.js';
import { registerGetComponentApiTool } from './tools/get-component-api.tool.js';
import { registerGetCompositionPatternTool } from './tools/get-composition-pattern.tool.js';
import { registerGetSchematicsUsageTool } from './tools/get-schematics-usage.tool.js';
import { registerGetThemingGuideTool } from './tools/get-theming-guide.tool.js';
import { registerListComponentsTool } from './tools/list-components.tool.js';
import { registerSearchComponentsTool } from './tools/search-components.tool.js';
import { readOwnPackageJson } from './utils/package-info.js';

/** Builds the McpServer instance with every tool registered, ready to `connect()` to a transport. */
export function createServer(service: ExtractionService): McpServer {
  const pkg = readOwnPackageJson();
  const server = new McpServer({
    name: pkg.name ?? 'angular-material-mcp',
    version: pkg.version ?? '0.0.0',
  });

  registerListComponentsTool(server, service);
  registerGetComponentApiTool(server, service);
  registerGetCompositionPatternTool(server);
  registerGetThemingGuideTool(server);
  registerGetSchematicsUsageTool(server);
  registerSearchComponentsTool(server, service);

  return server;
}
