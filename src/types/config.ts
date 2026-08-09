export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type ImportStyle = 'standalone' | 'ngmodule';

/** Server configuration, resolved from environment variables at startup. */
export interface ServerConfig {
  /**
   * Path to the Angular project root to resolve `node_modules` from.
   * Undefined means the resolver should fall back to `process.cwd()` / parent walk.
   */
  angularProjectPath?: string;

  /** Minimum severity written to stderr. */
  logLevel: LogLevel;

  /** Default import style used when generating examples/snippets. */
  importStyle: ImportStyle;
}

const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'];
const IMPORT_STYLES: readonly ImportStyle[] = ['standalone', 'ngmodule'];

export const DEFAULT_LOG_LEVEL: LogLevel = 'info';
export const DEFAULT_IMPORT_STYLE: ImportStyle = 'standalone';

function isLogLevel(value: string): value is LogLevel {
  return (LOG_LEVELS as readonly string[]).includes(value);
}

function isImportStyle(value: string): value is ImportStyle {
  return (IMPORT_STYLES as readonly string[]).includes(value);
}

/**
 * Reads `ANGULAR_PROJECT_PATH`, `LOG_LEVEL`, and `IMPORT_STYLE` from the given environment.
 * Unrecognized `LOG_LEVEL`/`IMPORT_STYLE` values silently fall back to their defaults rather
 * than throwing, since config loading happens before the logger exists.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const rawLogLevel = env.LOG_LEVEL;
  const logLevel =
    rawLogLevel !== undefined && isLogLevel(rawLogLevel) ? rawLogLevel : DEFAULT_LOG_LEVEL;

  const rawImportStyle = env.IMPORT_STYLE;
  const importStyle =
    rawImportStyle !== undefined && isImportStyle(rawImportStyle)
      ? rawImportStyle
      : DEFAULT_IMPORT_STYLE;

  const angularProjectPath = env.ANGULAR_PROJECT_PATH;

  return angularProjectPath !== undefined && angularProjectPath !== ''
    ? { angularProjectPath, logLevel, importStyle }
    : { logLevel, importStyle };
}
