import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIST_ENTRY = path.resolve(REPO_ROOT, 'dist', 'index.js');
const FIXTURE_PROJECT_PATH = path.resolve(REPO_ROOT, 'tests', 'fixtures', 'mock-project');
const FIXTURE_PROJECT_WITH_CDK_PATH = path.resolve(
  REPO_ROOT,
  'tests',
  'fixtures',
  'mock-project-with-cdk',
);

const EXPECTED_TOOL_NAMES = [
  'list_components',
  'get_component_api',
  'get_composition_pattern',
  'get_theming_guide',
  'get_schematics_usage',
  'search_components',
].sort();

function textOf(result: CallToolResult): string {
  const first = result.content[0];
  if (!first || first.type !== 'text') {
    throw new Error('expected a single text content block');
  }
  return first.text;
}

function parseJson(result: CallToolResult): unknown {
  return JSON.parse(textOf(result));
}

/**
 * Full JSON-RPC end-to-end coverage: spawns the actually-built server (not an in-process
 * `createServer()` call) so the stdio transport wiring in `src/index.ts` — argv, env, signal
 * handlers — is exercised too, not just the tool handlers.
 */
describe('MCP server integration (JSON-RPC over stdio)', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    transport = new StdioClientTransport({
      command: process.execPath,
      args: [DIST_ENTRY],
      env: {
        ANGULAR_PROJECT_PATH: FIXTURE_PROJECT_PATH,
        LOG_LEVEL: 'error',
      },
    });
    client = new Client({ name: 'angular-material-mcp-integration-test', version: '0.0.0' });
    await client.connect(transport);
  }, 20_000);

  afterAll(async () => {
    await client.close();
  }, 10_000);

  it('lists exactly the 6 registered tools', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual(EXPECTED_TOOL_NAMES);
  }, 10_000);

  it(
    'list_components returns fixture components, proving material-only tool calls still work ' +
      'when @angular/cdk is absent (this fixture project has no @angular/cdk installed)',
    async () => {
      const result = await client.callTool({ name: 'list_components', arguments: {} });
      expect(result.isError).not.toBe(true);
      const parsed = parseJson(result as CallToolResult) as { components: { name: string }[] };
      expect(parsed.components.map((c) => c.name).sort()).toEqual(['paginator', 'sort', 'table']);
    },
    10_000,
  );

  it('get_component_api returns full metadata for a known component', async () => {
    const result = await client.callTool({
      name: 'get_component_api',
      arguments: { componentName: 'table' },
    });
    expect(result.isError).not.toBe(true);
    const parsed = parseJson(result as CallToolResult) as { name: string; className: string };
    expect(parsed.name).toBe('table');
    expect(parsed.className).toBe('MatTable');
  }, 10_000);

  it('get_component_api returns isError:true for a nonexistent component', async () => {
    const result = await client.callTool({
      name: 'get_component_api',
      arguments: { componentName: 'nonexistent' },
    });
    expect(result.isError).toBe(true);
    expect(textOf(result as CallToolResult)).toContain('nonexistent');
  }, 10_000);

  it('get_composition_pattern returns the seeded pattern', async () => {
    const result = await client.callTool({
      name: 'get_composition_pattern',
      arguments: { patternName: 'table-sort-paginator' },
    });
    expect(result.isError).not.toBe(true);
    const parsed = parseJson(result as CallToolResult) as { name: string };
    expect(parsed.name).toBe('table-sort-paginator');
  }, 10_000);

  it('get_theming_guide returns the seeded topic', async () => {
    const result = await client.callTool({
      name: 'get_theming_guide',
      arguments: { topic: 'initial-setup' },
    });
    expect(result.isError).not.toBe(true);
    const parsed = parseJson(result as CallToolResult) as { topic: string };
    expect(parsed.topic).toBe('initial-setup');
  }, 10_000);

  it('get_schematics_usage returns the seeded schematic', async () => {
    const result = await client.callTool({
      name: 'get_schematics_usage',
      arguments: { schematicName: 'ng-add' },
    });
    expect(result.isError).not.toBe(true);
    const parsed = parseJson(result as CallToolResult) as { name: string };
    expect(parsed.name).toBe('ng-add');
  }, 10_000);

  it('search_components ranks fixture components by relevance', async () => {
    const result = await client.callTool({
      name: 'search_components',
      arguments: { query: 'sortable paginated data table' },
    });
    expect(result.isError).not.toBe(true);
    const parsed = parseJson(result as CallToolResult) as {
      results: { name: string; relevanceScore: number }[];
    };
    expect(parsed.results.length).toBeGreaterThan(0);
  }, 10_000);

  it('invalid tool input surfaces as isError:true without crashing the server', async () => {
    const invalid = await client.callTool({
      name: 'get_component_api',
      arguments: {},
    });
    expect(invalid.isError).toBe(true);

    // The server process must still be alive and responsive after a validation failure.
    const followUp = await client.callTool({
      name: 'list_components',
      arguments: {},
    });
    expect(followUp.isError).not.toBe(true);
  }, 10_000);
});

/**
 * Separate server instance pointed at a fixture project with @angular/cdk installed alongside
 * @angular/material (Phase 13), proving `cdk/*`-namespaced lookups resolve end-to-end through the
 * real JSON-RPC transport, not just in-process unit tests.
 */
describe('MCP server integration with @angular/cdk installed', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    transport = new StdioClientTransport({
      command: process.execPath,
      args: [DIST_ENTRY],
      env: {
        ANGULAR_PROJECT_PATH: FIXTURE_PROJECT_WITH_CDK_PATH,
        LOG_LEVEL: 'error',
      },
    });
    client = new Client({ name: 'angular-material-mcp-integration-test-cdk', version: '0.0.0' });
    await client.connect(transport);
  }, 20_000);

  afterAll(async () => {
    await client.close();
  }, 10_000);

  it('list_components includes both material and cdk/-namespaced components', async () => {
    const result = await client.callTool({ name: 'list_components', arguments: {} });
    expect(result.isError).not.toBe(true);
    const parsed = parseJson(result as CallToolResult) as { components: { name: string }[] };
    expect(parsed.components.map((c) => c.name).sort()).toEqual([
      'cdk/drag-drop',
      'paginator',
      'sort',
      'table',
    ]);
  }, 10_000);

  it('get_component_api("cdk/drag-drop") resolves the CDK-namespaced directive', async () => {
    const result = await client.callTool({
      name: 'get_component_api',
      arguments: { componentName: 'cdk/drag-drop' },
    });
    expect(result.isError).not.toBe(true);
    const parsed = parseJson(result as CallToolResult) as { name: string; className: string };
    expect(parsed.name).toBe('cdk/drag-drop');
    expect(parsed.className).toBe('CdkDropList');
  }, 10_000);
});
