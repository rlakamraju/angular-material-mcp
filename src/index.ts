#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { createExtractionService } from './cache/extraction-service.js';
import {
  ModuleResolutionError,
  resolveAngularCdk,
  resolveAngularMaterial,
} from './extractors/module-resolver.js';
import type { ResolvedAngularCdk, ResolvedAngularMaterial } from './extractors/module-resolver.js';
import { createServer } from './server.js';
import { loadConfig } from './types/config.js';
import type { ServerConfig } from './types/config.js';
import { logger } from './utils/logger.js';
import { readOwnPackageJson } from './utils/package-info.js';

/** Resolves @angular/material or exits(1) with a fix-instruction message — no fallback data. */
function resolveOrExit(config: Pick<ServerConfig, 'angularProjectPath'>): ResolvedAngularMaterial {
  try {
    return resolveAngularMaterial(config);
  } catch (error) {
    if (error instanceof ModuleResolutionError) {
      logger.error(error.message);
    } else {
      logger.error('Unexpected error while resolving @angular/material', error);
    }
    return process.exit(1);
  }
}

/**
 * Single consolidated startup banner (own package version, detected Material/CDK versions,
 * resolved project path, active `IMPORT_STYLE`) — logged via `logger.info`, so it's only visible
 * when `LOG_LEVEL` is `debug` or `info`; `warn`/`error` suppress it like any other info-level log.
 */
function logStartupBanner(
  material: ResolvedAngularMaterial,
  cdk: ResolvedAngularCdk | undefined,
  config: ServerConfig,
): void {
  const ownVersion = readOwnPackageJson().version ?? '0.0.0';
  logger.info(
    [
      `angular-material-mcp v${ownVersion} starting`,
      `  @angular/material: ${material.version} (resolved via ${material.source})`,
      `  @angular/cdk: ${cdk ? `${cdk.version} (resolved via ${cdk.source})` : 'not installed — cdk/* lookups unavailable'}`,
      `  project path: ${material.projectPath}`,
      `  import style: ${config.importStyle}`,
    ].join('\n'),
  );
}

async function main(): Promise<void> {
  const config = loadConfig();
  const resolved = resolveOrExit(config);

  // @angular/cdk is an optional second root (Phase 13) — its absence never fails startup, since
  // plenty of Material projects never touch CDK primitives directly.
  const resolvedCdk = resolveAngularCdk(config);
  logStartupBanner(resolved, resolvedCdk, config);

  const service = createExtractionService(
    resolvedCdk ? { material: resolved, cdk: resolvedCdk } : { material: resolved },
  );
  const server = createServer(service);
  const transport = new StdioServerTransport();

  function shutdown(signal: NodeJS.Signals): void {
    logger.info(`Received ${signal}, shutting down`);
    void server
      .close()
      .catch((error: unknown) => {
        logger.error('Error while closing server', error);
      })
      .finally(() => {
        service.clearCache();
        logger.info('angular-material-mcp: server stopped');
        process.exit(0);
      });
  }

  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });

  await server.connect(transport);
  logger.info('angular-material-mcp: server connected via stdio, ready for requests');
}

main().catch((error: unknown) => {
  logger.error('Fatal error starting angular-material-mcp', error);
  process.exit(1);
});
