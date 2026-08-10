import { spawn } from 'node:child_process';
import type { ChildProcessByStdio } from 'node:child_process';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

type SpawnedServer = ChildProcessByStdio<null, null, Readable>;

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIST_ENTRY = path.resolve(REPO_ROOT, 'dist', 'index.js');
const FIXTURE_PROJECT_PATH = path.resolve(REPO_ROOT, 'tests', 'fixtures', 'mock-project');

function waitFor(predicate: () => boolean, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = (): void => {
      if (predicate()) {
        resolve();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('timed out waiting for condition'));
        return;
      }
      setTimeout(check, 50);
    };
    check();
  });
}

function spawnServer(logLevel: string): { child: SpawnedServer; getStderr: () => string } {
  const child = spawn(process.execPath, [DIST_ENTRY], {
    env: { ...process.env, ANGULAR_PROJECT_PATH: FIXTURE_PROJECT_PATH, LOG_LEVEL: logLevel },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString();
  });
  return { child, getStderr: () => stderr };
}

describe('startup banner (stderr, LOG_LEVEL-gated)', () => {
  let activeChild: SpawnedServer | undefined;

  afterEach(() => {
    activeChild?.kill();
    activeChild = undefined;
  });

  it(
    'prints package version, @angular/material version, project path, and import style at LOG_LEVEL=info',
    async () => {
      const { child, getStderr } = spawnServer('info');
      activeChild = child;

      await waitFor(() => getStderr().includes('server connected via stdio'));
      const stderr = getStderr();

      expect(stderr).toMatch(/angular-material-mcp v\d+\.\d+\.\d+ starting/);
      expect(stderr).toContain('@angular/material:');
      expect(stderr).toContain(FIXTURE_PROJECT_PATH);
      expect(stderr).toContain('import style: standalone');
    },
    10_000,
  );

  it(
    'suppresses the startup banner at LOG_LEVEL=error',
    async () => {
      const { child, getStderr } = spawnServer('error');
      activeChild = child;

      // No info-level "ready" line to wait on at this threshold, so give startup a fixed window.
      await new Promise((resolve) => setTimeout(resolve, 1500));

      expect(getStderr()).not.toContain('angular-material-mcp v');
    },
    10_000,
  );
});

describe('graceful shutdown (SIGTERM/SIGINT)', () => {
  let activeChild: SpawnedServer | undefined;

  afterEach(() => {
    activeChild?.kill();
    activeChild = undefined;
  });

  /**
   * Windows does not deliver POSIX signals to child processes the way `child.kill('SIGTERM')`
   * implies — it terminates the process immediately without invoking its `process.on('SIGTERM')`
   * handler (verified empirically while building this test). This assertion is only meaningful on
   * POSIX platforms, so it runs on CI (`ubuntu-latest`) and is skipped in local Windows dev.
   */
  it.skipIf(process.platform === 'win32')(
    'clears the cache, logs "server stopped", and exits 0 on SIGTERM',
    async () => {
      const { child, getStderr } = spawnServer('info');
      activeChild = child;

      await waitFor(() => getStderr().includes('server connected via stdio'));

      const exitPromise = new Promise<number | null>((resolve) => {
        child.once('exit', (code) => resolve(code));
      });
      child.kill('SIGTERM');
      const exitCode = await exitPromise;

      expect(exitCode).toBe(0);
      const stderr = getStderr();
      expect(stderr).toContain('Received SIGTERM, shutting down');
      expect(stderr).toContain('angular-material-mcp: server stopped');
    },
    10_000,
  );

  it.skipIf(process.platform === 'win32')(
    'exits 0 on SIGINT too',
    async () => {
      const { child, getStderr } = spawnServer('info');
      activeChild = child;

      await waitFor(() => getStderr().includes('server connected via stdio'));

      const exitPromise = new Promise<number | null>((resolve) => {
        child.once('exit', (code) => resolve(code));
      });
      child.kill('SIGINT');
      const exitCode = await exitPromise;

      expect(exitCode).toBe(0);
      expect(getStderr()).toContain('Received SIGINT, shutting down');
    },
    10_000,
  );
});
