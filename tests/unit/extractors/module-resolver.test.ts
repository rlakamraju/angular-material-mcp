import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  ModuleResolutionError,
  resolveAngularMaterial,
} from '../../../src/extractors/module-resolver.js';

const FIXTURES_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures',
);
const MOCK_PROJECT = path.join(FIXTURES_ROOT, 'mock-project');
const MOCK_PROJECT_NESTED_CWD = path.join(MOCK_PROJECT, 'src', 'app');

describe('resolveAngularMaterial', () => {
  it('resolves via ANGULAR_PROJECT_PATH (env) even when cwd points elsewhere', () => {
    const elsewhere = mkdtempSync(path.join(tmpdir(), 'am-mcp-env-'));

    const result = resolveAngularMaterial({ angularProjectPath: MOCK_PROJECT }, elsewhere);

    expect(result.source).toBe('env');
    expect(result.version).toBe('17.3.0');
    expect(result.projectPath).toBe(path.resolve(MOCK_PROJECT));
  });

  it('resolves via process.cwd() when no env var is set', () => {
    const result = resolveAngularMaterial({}, MOCK_PROJECT);

    expect(result.source).toBe('cwd');
    expect(result.version).toBe('17.3.0');
  });

  it('walks up parent directories to find node_modules when cwd is nested inside the project', () => {
    const result = resolveAngularMaterial({}, MOCK_PROJECT_NESTED_CWD);

    expect(result.source).toBe('parent-walk');
    expect(result.version).toBe('17.3.0');
    expect(result.projectPath).toBe(path.resolve(MOCK_PROJECT));
  });

  it('falls through to cwd when ANGULAR_PROJECT_PATH does not contain @angular/material', () => {
    const badEnvPath = mkdtempSync(path.join(tmpdir(), 'am-mcp-bad-env-'));

    const result = resolveAngularMaterial({ angularProjectPath: badEnvPath }, MOCK_PROJECT);

    expect(result.source).toBe('cwd');
  });

  it('throws ModuleResolutionError listing every attempted path when nothing is found', () => {
    const empty = mkdtempSync(path.join(tmpdir(), 'am-mcp-empty-'));

    expect(() => resolveAngularMaterial({}, empty)).toThrow(ModuleResolutionError);

    try {
      resolveAngularMaterial({}, empty);
      expect.fail('expected resolveAngularMaterial to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ModuleResolutionError);
      const resolutionError = error as ModuleResolutionError;
      expect(resolutionError.attemptedPaths[0]).toBe(path.resolve(empty));
      expect(resolutionError.message).toContain('npm install');
      expect(resolutionError.message).toContain('ANGULAR_PROJECT_PATH');
    }
  });
});
