#!/usr/bin/env node

import { ModuleResolutionError, resolveAngularMaterial } from './extractors/module-resolver.js';
import { loadConfig } from './types/config.js';
import { logger } from './utils/logger.js';

function main(): void {
  const config = loadConfig();

  try {
    const resolved = resolveAngularMaterial(config);
    logger.info(
      `Resolved @angular/material ${resolved.version} at ${resolved.packageRoot} (via ${resolved.source})`,
    );
  } catch (error) {
    if (error instanceof ModuleResolutionError) {
      logger.error(error.message);
    } else {
      logger.error('Unexpected error while resolving @angular/material', error);
    }
    process.exit(1);
  }

  logger.info('angular-material-mcp: scaffolding placeholder — server not yet implemented');
  process.exit(0);
}

main();
