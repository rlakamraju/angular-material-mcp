#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { createExtractionService } from './cache/extraction-service.js';
import {
  ModuleResolutionError,
  resolveAngularCdk,
  resolveAngularMaterial,
} from './extractors/module-resolver.js';
import type { ResolvedAngularMaterial } from './extractors/module-resolver.js';
import { createServer } from './server.js';
import { loadConfig } from './types/config.js';
import type { ServerConfig } from './types/config.js';
import { logger } from './utils/logger.js';

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

async function main(): Promise<void> {
  const config = loadConfig();
  const resolved = resolveOrExit(config);
  logger.info(
    `Resolved @angular/material ${resolved.version} at ${resolved.packageRoot} (via ${resolved.source})`,
  );

  // @angular/cdk is an optional second root (Phase 13) — its absence never fails startup, since
  // plenty of Material projects never touch CDK primitives directly.
  const resolvedCdk = resolveAngularCdk(config);
  if (resolvedCdk) {
    logger.info(
      `Resolved @angular/cdk ${resolvedCdk.version} at ${resolvedCdk.packageRoot} (via ${resolvedCdk.source})`,
    );
  } else {
    logger.info('@angular/cdk not found — cdk/* component lookups will be unavailable');
  }

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
