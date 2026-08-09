import { loadConfig } from '../types/config.js';
import type { LogLevel } from '../types/config.js';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

function formatArg(arg: unknown): string {
  if (arg instanceof Error) {
    return arg.stack ?? arg.message;
  }
  if (typeof arg === 'string') {
    return arg;
  }
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

function write(level: LogLevel, threshold: LogLevel, message: string, args: unknown[]): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[threshold]) {
    return;
  }
  const suffix = args.length > 0 ? ` ${args.map(formatArg).join(' ')}` : '';
  // stdout is reserved for the MCP JSON-RPC transport — every log line must go to stderr.
  process.stderr.write(
    `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}${suffix}\n`,
  );
}

/** Builds a logger gated by `threshold`; anything below it is dropped. Always writes to stderr. */
export function createLogger(threshold: LogLevel): Logger {
  return {
    debug: (message, ...args) => {
      write('debug', threshold, message, args);
    },
    info: (message, ...args) => {
      write('info', threshold, message, args);
    },
    warn: (message, ...args) => {
      write('warn', threshold, message, args);
    },
    error: (message, ...args) => {
      write('error', threshold, message, args);
    },
  };
}

/** Process-wide logger, gated by the `LOG_LEVEL` environment variable. */
export const logger: Logger = createLogger(loadConfig().logLevel);
